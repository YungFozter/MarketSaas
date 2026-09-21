-- ==============================================================================
-- SCRIPT: SETUP Y SINCRONIZACIÓN DE PROVEEDORES Y PEDIDOS DE ABASTECIMIENTO
-- MercadoSaaS - Persistencia multi-tenant, seguridad RLS y Realtime en Supabase
-- ==============================================================================
-- Instrucciones de ejecución:
-- 1. Ve a tu panel de Supabase (https://supabase.com/dashboard)
-- 2. Selecciona tu proyecto MercadoSaaS
-- 3. En el menú lateral izquierdo, haz clic en "SQL Editor"
-- 4. Haz clic en "+ New Query", pega este código y pulsa "Run" (o presiona Ctrl+Enter)
-- ==============================================================================

-- 1. TABLA: suppliers (Directorio de proveedores y lista de compras para el dueño)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  category TEXT DEFAULT 'Otros',
  visit_days JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  order_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente (Idempotencia garantizada)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Otros';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS visit_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices de alto rendimiento para consultas por tienda y categoría
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_suppliers_created ON public.suppliers(created_at DESC);

-- 2. HABILITAR SEGURIDAD POR FILA (Row Level Security - RLS)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores para evitar duplicados o conflictos
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_owner" ON public.suppliers;

-- Política 1: Lectura (El dueño autenticado de la tienda o tenant default)
CREATE POLICY "suppliers_select_owner" 
ON public.suppliers 
FOR SELECT 
USING (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

-- Política 2: Inserción (El dueño autenticado puede agregar proveedores a su tienda)
CREATE POLICY "suppliers_insert_owner" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

-- Política 3: Actualización (El dueño puede modificar sus proveedores y listas de compra)
CREATE POLICY "suppliers_update_owner" 
ON public.suppliers 
FOR UPDATE 
USING (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
)
WITH CHECK (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

-- Política 4: Eliminación (El dueño puede eliminar proveedores de su tienda)
CREATE POLICY "suppliers_delete_owner" 
ON public.suppliers 
FOR DELETE 
USING (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

-- 3. PUBLICACIÓN EN TIEMPO REAL (Supabase Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
  END IF;
END $$;

-- 4. COLUMNAS DE PROVEEDOR EN PRODUCTOS (Para asignar proveedor a productos)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_id TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(tenant_id, supplier_id);

