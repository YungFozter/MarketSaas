-- ==============================================================================
-- SCRIPT: SISTEMA OFICIAL DE VECIPUNTOS POR TIENDA Y VECINO (SUPABASE)
-- MercadoSaaS - Fidelización Multi-Tenant por Número de WhatsApp / Teléfono
-- ==============================================================================

-- 1. TABLA: customer_points (Registro de Puntos Oficial de Vecinos)
CREATE TABLE IF NOT EXISTS public.customer_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL DEFAULT 'default',
  customer_phone TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Vecino',
  points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  total_earned INT NOT NULL DEFAULT 0,
  total_spent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT customer_points_tenant_phone_key UNIQUE (tenant_id, customer_phone)
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT 'Vecino';
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS points_balance INT NOT NULL DEFAULT 0;
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS total_earned INT NOT NULL DEFAULT 0;
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS total_spent INT NOT NULL DEFAULT 0;
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.customer_points ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices de alto rendimiento para búsqueda inmediata al abrir el catálogo o canjear
CREATE INDEX IF NOT EXISTS idx_customer_points_lookup ON public.customer_points(tenant_id, customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_points_phone ON public.customer_points(customer_phone);

-- 2. HABILITAR SEGURIDAD POR FILA (Row Level Security - RLS)
ALTER TABLE public.customer_points ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas para evitar conflictos al re-ejecutar el script
DROP POLICY IF EXISTS "customer_points_select_all" ON public.customer_points;
DROP POLICY IF EXISTS "customer_points_insert_all" ON public.customer_points;
DROP POLICY IF EXISTS "customer_points_update_all" ON public.customer_points;

-- Política 1: Lectura (Cualquier vecino o dueño puede consultar el saldo de puntos de su teléfono)
CREATE POLICY "customer_points_select_all" 
ON public.customer_points 
FOR SELECT 
USING (true);

-- Política 2: Inserción (Permite registrar nuevos clientes que acumulan puntos por primera vez)
CREATE POLICY "customer_points_insert_all" 
ON public.customer_points 
FOR INSERT 
WITH CHECK (true);

-- Política 3: Actualización (Permite actualizar saldo tras canje o compra)
CREATE POLICY "customer_points_update_all" 
ON public.customer_points 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- 3. FUNCIÓN ATÓMICA RPC: adjust_customer_points
-- Permite sumar (p_delta > 0) o canjear/restar (p_delta < 0) puntos de forma segura y concurrente.
CREATE OR REPLACE FUNCTION public.adjust_customer_points(
  p_tenant_id TEXT,
  p_customer_phone TEXT,
  p_customer_name TEXT,
  p_delta INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_clean_phone TEXT;
BEGIN
  -- Normalizar teléfono quitando espacios en blanco innecesarios
  v_clean_phone := TRIM(p_customer_phone);
  
  IF v_clean_phone IS NULL OR v_clean_phone = '' THEN
    RAISE EXCEPTION 'El teléfono del cliente es requerido para registrar o canjear puntos.';
  END IF;

  -- Insertar o actualizar atómicamente
  INSERT INTO public.customer_points (
    tenant_id, 
    customer_phone, 
    customer_name, 
    points_balance, 
    total_earned, 
    total_spent,
    updated_at
  )
  VALUES (
    p_tenant_id,
    v_clean_phone,
    COALESCE(NULLIF(TRIM(p_customer_name), ''), 'Vecino'),
    GREATEST(0, p_delta),
    CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END,
    CASE WHEN p_delta < 0 THEN ABS(p_delta) ELSE 0 END,
    NOW()
  )
  ON CONFLICT (tenant_id, customer_phone)
  DO UPDATE SET
    customer_name = CASE 
      WHEN p_customer_name IS NOT NULL AND TRIM(p_customer_name) <> '' AND TRIM(p_customer_name) <> 'Vecino'
      THEN TRIM(p_customer_name)
      ELSE customer_points.customer_name 
    END,
    points_balance = GREATEST(0, customer_points.points_balance + p_delta),
    total_earned = customer_points.total_earned + CASE WHEN p_delta > 0 THEN p_delta ELSE 0 END,
    total_spent = customer_points.total_spent + CASE WHEN p_delta < 0 THEN ABS(p_delta) ELSE 0 END,
    updated_at = NOW()
  RETURNING * INTO v_rec;

  RETURN jsonb_build_object(
    'success', true,
    'tenant_id', v_rec.tenant_id,
    'customer_phone', v_rec.customer_phone,
    'customer_name', v_rec.customer_name,
    'points_balance', v_rec.points_balance,
    'total_earned', v_rec.total_earned,
    'total_spent', v_rec.total_spent
  );
END;
$$;
