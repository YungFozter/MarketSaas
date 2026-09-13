-- ==============================================================================
-- MarketSaaS: ESQUEMA MAESTRO Y BLINDAJE DE SEGURIDAD INTEGRAL (RLS)
-- Ubicación: Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Ejecutar ("Run")
-- 
-- Este script es idempotente y seguro de ejecutar en bases de datos nuevas o existentes:
-- 1. Crea y garantiza todas las tablas y columnas necesarias.
-- 2. Añade índices para consultas ultra rápidas por tienda y fecha.
-- 3. Habilita Row Level Security (RLS) en todas las tablas.
-- 4. Establece políticas estrictas que protegen la privacidad de clientes y aíslan tiendas.
-- 5. Define funciones RPC seguras (seguimiento de pedidos anónimos y verificación de emails).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLAS Y COLUMNAS FUNDAMENTALES
-- ------------------------------------------------------------------------------

-- Tabla: store_config (Configuración, ubicación y personalización de tiendas)
CREATE TABLE IF NOT EXISTS public.store_config (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Mi Tienda',
  slogan TEXT DEFAULT 'Comercio de barrio',
  logo_url TEXT,
  banner_url TEXT,
  qr_image_url TEXT,
  address TEXT,
  zone TEXT,
  reference TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas multi-tenant en store_config
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Tabla: products (Catálogo e inventario)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10, 2),
  cost NUMERIC(10, 2) DEFAULT 0,
  stock NUMERIC(10, 2) DEFAULT 0,
  category TEXT DEFAULT 'General',
  barcode TEXT,
  image_url TEXT,
  image TEXT,
  is_popular BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas clave en products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Tabla: orders (Pedidos, ventas mostrador y delivery)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10, 2) DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  delivery_fee NUMERIC(10, 2) DEFAULT 0,
  delivery_type TEXT DEFAULT 'pickup',
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'pending',
  status_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas multi-tenant en orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Tabla: product_requests (Solicitudes de productos de vecinos)
CREATE TABLE IF NOT EXISTS public.product_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  product_name TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

-- ------------------------------------------------------------------------------
-- 2. ÍNDICES DE RENDIMIENTO (Performance Tuning)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_store_config_owner ON public.store_config(owner_id);
CREATE INDEX IF NOT EXISTS idx_store_config_tenant ON public.store_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON public.orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_owner ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_requests_tenant ON public.product_requests(tenant_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. HABILITACIÓN DE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- Purgar políticas antiguas antes de recrear las definitivas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('store_config', 'products', 'orders', 'product_requests')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS RLS: STORE_CONFIG
-- ------------------------------------------------------------------------------
-- Lectura pública: Clientes y vecinos necesitan ver nombre, banner, logo y catálogo de tiendas.
CREATE POLICY "store_config_select_public" 
ON public.store_config FOR SELECT 
USING (true);

-- Creación: Usuarios autenticados pueden registrar su tienda asociando su owner_id.
CREATE POLICY "store_config_insert_owner" 
ON public.store_config FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (owner_id::text = auth.uid()::text OR owner_id IS NULL)
);

-- Modificación: Solo el dueño de la tienda.
CREATE POLICY "store_config_update_owner" 
ON public.store_config FOR UPDATE 
USING (auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text)
WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text);

-- Eliminación: Solo el dueño de la tienda.
CREATE POLICY "store_config_delete_owner" 
ON public.store_config FOR DELETE 
USING (auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text);

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS: PRODUCTS
-- ------------------------------------------------------------------------------
-- Lectura pública: Cualquier vecino puede consultar los productos y precios.
CREATE POLICY "products_select_public" 
ON public.products FOR SELECT 
USING (true);

-- Creación: Solo el dueño autenticado de la tienda correspondiente.
CREATE POLICY "products_insert_owner" 
ON public.products FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
);

-- Modificación: Solo el dueño autenticado de la tienda.
CREATE POLICY "products_update_owner" 
ON public.products FOR UPDATE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
)
WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
);

-- Eliminación: Solo el dueño autenticado de la tienda.
CREATE POLICY "products_delete_owner" 
ON public.products FOR DELETE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
);

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RLS: ORDERS (Protección Estricta de Datos Personales)
-- ------------------------------------------------------------------------------
-- Creación de pedidos: Cualquier cliente vecino puede emitir pedidos.
CREATE POLICY "orders_insert_customer" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Lectura:
-- 1. El dueño autenticado puede consultar todas las órdenes de su tienda.
-- 2. Un cliente anónimo SOLO puede ver un pedido si pasa su ID exacto en cabecera 'x-order-id'.
-- (Para consultas sin cabecera se utiliza la función RPC segura get_order_tracking).
CREATE POLICY "orders_select_owner_or_tracking" 
ON public.orders FOR SELECT 
USING (
  (
    auth.role() = 'authenticated' 
    AND (
      auth.uid()::text = owner_id::text 
      OR auth.uid()::text IN (
        SELECT sc.owner_id::text 
        FROM public.store_config sc 
        WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
      )
    )
  )
  OR
  (
    auth.role() = 'anon' 
    AND id::text = (COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::json->>'x-order-id')::text
  )
);

-- Modificación de pedidos: Solo el dueño autenticado de la tienda (para cambiar estados, notas, etc.)
CREATE POLICY "orders_update_owner" 
ON public.orders FOR UPDATE 
USING (
  auth.role() = 'authenticated' 
  AND (
    auth.uid()::text = owner_id::text 
    OR auth.uid()::text IN (
      SELECT sc.owner_id::text 
      FROM public.store_config sc 
      WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
    )
  )
)
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (
    auth.uid()::text = owner_id::text 
    OR auth.uid()::text IN (
      SELECT sc.owner_id::text 
      FROM public.store_config sc 
      WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
    )
  )
);

-- Eliminación de pedidos: Solo el dueño autenticado.
CREATE POLICY "orders_delete_owner" 
ON public.orders FOR DELETE 
USING (
  auth.role() = 'authenticated' 
  AND (
    auth.uid()::text = owner_id::text 
    OR auth.uid()::text IN (
      SELECT sc.owner_id::text 
      FROM public.store_config sc 
      WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
    )
  )
);

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS RLS: PRODUCT_REQUESTS
-- ------------------------------------------------------------------------------
-- Creación: Cualquier vecino puede sugerir un producto que no encontró.
CREATE POLICY "requests_insert_public" 
ON public.product_requests FOR INSERT 
WITH CHECK (true);

-- Lectura: Solo el comerciante dueño de la tienda.
CREATE POLICY "requests_select_owner" 
ON public.product_requests FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

-- Modificación: Solo el comerciante dueño.
CREATE POLICY "requests_update_owner" 
ON public.product_requests FOR UPDATE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

-- Eliminación: Solo el comerciante dueño.
CREATE POLICY "requests_delete_owner" 
ON public.product_requests FOR DELETE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

-- ------------------------------------------------------------------------------
-- 8. FUNCIONES RPC SEGURAS (SECURITY DEFINER)
-- ------------------------------------------------------------------------------

-- Función: get_order_tracking
-- Permite a un cliente anónimo consultar con total seguridad el estado de su pedido activo sin exponer pedidos ajenos.
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id TEXT)
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders 
  WHERE id = p_order_id 
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(TEXT) TO anon, authenticated;

-- Función: check_user_email_exists
-- Permite verificar de forma segura si un email existe antes de permitir el flujo de recuperación de contraseña.
CREATE OR REPLACE FUNCTION public.check_user_email_exists(lookup_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_found BOOLEAN;
BEGIN
  IF lookup_email IS NULL OR TRIM(lookup_email) = '' THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(TRIM(lookup_email))
  ) INTO user_found;

  RETURN user_found;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_email_exists(TEXT) TO anon, authenticated;
