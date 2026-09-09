-- ==============================================================================
-- MarketSaaS: FIX DE PERMANENCIA Y PERMISOS DE PRODUCTOS POR DUEÑO
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. ASEGURAR COLUMNAS CLAVE EN LA TABLA PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '/products/producto-sin-imagen.png';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price TEXT DEFAULT 'Sin definir';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS costPrice TEXT DEFAULT 'Sin definir';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock TEXT DEFAULT 'Sin definir';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS minStock TEXT DEFAULT 'Sin definir';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Sin definir';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS isPopular BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS OBSOLETAS O RESTRICTIVAS PREVIAS
DROP POLICY IF EXISTS products_owner_update ON public.products;
DROP POLICY IF EXISTS products_owner_insert ON public.products;
DROP POLICY IF EXISTS products_owner_delete ON public.products;
DROP POLICY IF EXISTS products_owner_management ON public.products;
DROP POLICY IF EXISTS "Gestión de productos por dueño" ON public.products;
DROP POLICY IF EXISTS "Gestión total de productos" ON public.products;
DROP POLICY IF EXISTS products_public_read ON public.products;
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.products;

-- 4. POLÍTICA DE LECTURA PÚBLICA (Vecinos, clientes y administradores pueden ver productos)
CREATE POLICY "products_public_read" 
ON public.products 
FOR SELECT 
USING (true);

-- 5. POLÍTICA DE GESTIÓN TOTAL PARA DUEÑOS AUTENTICADOS
-- Permite crear, modificar y eliminar productos si el usuario es el dueño legítimo de la tienda
CREATE POLICY "products_owner_management" 
ON public.products 
FOR ALL 
USING (
  tenant_id = 'default'
  OR (
    auth.role() = 'authenticated' 
    AND (
      -- Es el dueño registrado en store_config
      auth.uid() IN (
        SELECT sc.owner_id 
        FROM public.store_config sc 
        WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
      )
      -- O la tienda aún no tiene owner_id asignado
      OR EXISTS (
        SELECT 1 
        FROM public.store_config sc 
        WHERE (sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text) 
          AND (sc.owner_id IS NULL OR sc.owner_id = auth.uid())
      )
    )
  )
)
WITH CHECK (
  tenant_id = 'default'
  OR (
    auth.role() = 'authenticated' 
    AND (
      auth.uid() IN (
        SELECT sc.owner_id 
        FROM public.store_config sc 
        WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
      )
      OR EXISTS (
        SELECT 1 
        FROM public.store_config sc 
        WHERE (sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text) 
          AND (sc.owner_id IS NULL OR sc.owner_id = auth.uid())
      )
    )
  )
);

-- 6. RPC DE PERSISTENCIA SEGURA (SECURITY DEFINER)
-- Garantiza que cualquier dueño autenticado pueda guardar productos con imágenes sin bloqueos de esquema
CREATE OR REPLACE FUNCTION public.save_product_secure(p_product JSONB)
RETURNS JSONB AS $$
DECLARE
  v_id TEXT := p_product->>'id';
  v_tenant_id TEXT := p_product->>'tenant_id';
  v_owner_id UUID;
  v_caller_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Acceso denegado: Usuario no autenticado en Supabase.';
  END IF;

  SELECT owner_id INTO v_owner_id 
  FROM public.store_config 
  WHERE id::text = v_tenant_id::text OR tenant_id::text = v_tenant_id::text 
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    UPDATE public.store_config 
    SET owner_id = v_caller_id 
    WHERE id::text = v_tenant_id::text OR tenant_id::text = v_tenant_id::text;
    v_owner_id := v_caller_id;
  END IF;

  IF v_owner_id::text <> v_caller_id::text THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el dueño de la tienda puede alterar sus productos.';
  END IF;

  INSERT INTO public.products (
    id, tenant_id, name, category, price, original_price, cost_price,
    unit, stock, min_stock, image, badge, code, description, is_popular, is_active, updated_at
  ) VALUES (
    v_id,
    v_tenant_id,
    p_product->>'name',
    COALESCE(p_product->>'category', 'Sin definir'),
    COALESCE((p_product->>'price')::numeric, 0),
    (p_product->>'original_price')::numeric,
    COALESCE(p_product->>'cost_price', 'Sin definir'),
    COALESCE(p_product->>'unit', 'Sin definir'),
    COALESCE(p_product->>'stock', 'Sin definir'),
    COALESCE(p_product->>'min_stock', 'Sin definir'),
    COALESCE(p_product->>'image', '/products/producto-sin-imagen.png'),
    COALESCE(p_product->>'badge', ''),
    COALESCE(p_product->>'code', ''),
    COALESCE(p_product->>'description', 'Sin definir'),
    COALESCE((p_product->>'is_popular')::boolean, false),
    COALESCE((p_product->>'is_active')::boolean, true),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    cost_price = EXCLUDED.cost_price,
    unit = EXCLUDED.unit,
    stock = EXCLUDED.stock,
    min_stock = EXCLUDED.min_stock,
    image = EXCLUDED.image,
    badge = EXCLUDED.badge,
    code = EXCLUDED.code,
    description = EXCLUDED.description,
    is_popular = EXCLUDED.is_popular,
    is_active = EXCLUDED.is_active,
    updated_at = NOW()
  RETURNING to_jsonb(public.products.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. REFRESCAR CACHÉ DE ESQUEMA DE POSTGREST
NOTIFY pgrst, 'reload schema';
