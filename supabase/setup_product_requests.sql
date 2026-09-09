-- ==============================================================================
-- SCRIPT: SETUP Y CONEXIÓN OFICIAL DE PETICIONES ("PÍDELO SI NO ESTÁ")
-- MercadoSaaS - Sincronización en tiempo real y persistencia en Supabase
-- ==============================================================================

-- 1. TABLA: product_requests (Buzón Oficial de Sugerencias y Peticiones)
CREATE TABLE IF NOT EXISTS public.product_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  product_name TEXT NOT NULL,
  productName TEXT,
  customer_name TEXT DEFAULT 'Vecino',
  customerName TEXT DEFAULT 'Vecino',
  customer_location TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  votes INT DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'stocked' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS productName TEXT;
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Vecino';
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS customerName TEXT DEFAULT 'Vecino';
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS customer_location TEXT DEFAULT '';
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS votes INT DEFAULT 1;
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices de alto rendimiento para consultas por minimarket
CREATE INDEX IF NOT EXISTS idx_product_requests_tenant ON public.product_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_status ON public.product_requests(status);
CREATE INDEX IF NOT EXISTS idx_product_requests_created ON public.product_requests(created_at DESC);

-- 2. HABILITAR SEGURIDAD POR FILA (Row Level Security - RLS)
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores para evitar duplicados o conflictos
DROP POLICY IF EXISTS "Lectura pública de solicitudes" ON public.product_requests;
DROP POLICY IF EXISTS "Inserción pública de solicitudes" ON public.product_requests;
DROP POLICY IF EXISTS "Gestión de solicitudes por dueño" ON public.product_requests;
DROP POLICY IF EXISTS "Eliminación de solicitudes por dueño" ON public.product_requests;
DROP POLICY IF EXISTS "product_requests_select" ON public.product_requests;
DROP POLICY IF EXISTS "product_requests_insert" ON public.product_requests;
DROP POLICY IF EXISTS "product_requests_owner_update" ON public.product_requests;
DROP POLICY IF EXISTS "product_requests_owner_delete" ON public.product_requests;

-- Política 1: Lectura pública (Cualquier vecino o dueño puede ver las sugerencias de la tienda)
CREATE POLICY "product_requests_select" 
ON public.product_requests 
FOR SELECT 
USING (true);

-- Política 2: Inserción pública (Cualquier vecino puede pedir un producto para cualquier tienda)
CREATE POLICY "product_requests_insert" 
ON public.product_requests 
FOR INSERT 
WITH CHECK (true);

-- Política 3: Actualización de estado por el dueño de la tienda
CREATE POLICY "product_requests_owner_update" 
ON public.product_requests 
FOR UPDATE 
USING (
  product_requests.tenant_id = 'default' 
  OR auth.uid() IN (
    SELECT sc.owner_id 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text 
       OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

-- Política 4: Eliminación por el dueño de la tienda
CREATE POLICY "product_requests_owner_delete" 
ON public.product_requests 
FOR DELETE 
USING (
  product_requests.tenant_id = 'default' 
  OR auth.uid() IN (
    SELECT sc.owner_id 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text 
       OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

-- 3. FUNCIÓN RPC PARA VOTACIÓN ATÓMICA DE VECINOS
-- Permite que los vecinos voten ("thumbs up") sin necesidad de cuenta de dueño
CREATE OR REPLACE FUNCTION public.vote_product_request(p_request_id TEXT)
RETURNS INT AS $$
DECLARE
  v_votes INT;
BEGIN
  UPDATE public.product_requests
  SET votes = COALESCE(votes, 0) + 1,
      updated_at = NOW()
  WHERE id = p_request_id
  RETURNING votes INTO v_votes;
  
  RETURN v_votes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución a roles anónimos y autenticados
GRANT EXECUTE ON FUNCTION public.vote_product_request(TEXT) TO anon, authenticated, service_role;

-- 4. PUBLICACIÓN EN TIEMPO REAL (Supabase Realtime)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'product_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_requests;
  END IF;
END $$;
