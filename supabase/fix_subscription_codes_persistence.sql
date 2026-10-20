-- ==============================================================================
-- SCRIPT: fix_subscription_codes_persistence.sql
-- OBJETIVO: Garantizar persistencia permanente y uso único de códigos de suscripción
-- ==============================================================================

-- 1. ASEGURAR ESTRUCTURA COMPLETA DE LA TABLA subscription_codes
CREATE TABLE IF NOT EXISTS public.subscription_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  duration_days INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 0,
  plan_name TEXT NOT NULL DEFAULT 'Plan Básico',
  plan_type TEXT NOT NULL DEFAULT 'basic',
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_email TEXT,
  redeemed_by_store_id TEXT,
  redeemed_by_store_name TEXT,
  notes TEXT
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS duration_days INT NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS plan_name TEXT NOT NULL DEFAULT 'Plan Básico';
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'basic';
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_by_email TEXT;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_by_store_id TEXT;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_by_store_name TEXT;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS notes TEXT;

-- Restricción de unicidad estricta en el código para evitar duplicados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_codes_code_unique'
  ) THEN
    ALTER TABLE public.subscription_codes ADD CONSTRAINT subscription_codes_code_unique UNIQUE (code);
  END IF;
END $$;

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_subscription_codes_code ON public.subscription_codes(code);
CREATE INDEX IF NOT EXISTS idx_subscription_codes_status ON public.subscription_codes(status);
CREATE INDEX IF NOT EXISTS idx_subscription_codes_plan_type ON public.subscription_codes(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_codes_created ON public.subscription_codes(created_at DESC);

-- 2. POLÍTICAS DE SEGURIDAD RLS
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_codes_select" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_insert" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_update" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_delete" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_select_superadmin_only" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_insert_superadmin_only" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_update_superadmin_only" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_delete_superadmin_only" ON public.subscription_codes;

-- Política de lectura para SuperAdmin
CREATE POLICY "subscription_codes_select_superadmin_only"
ON public.subscription_codes
FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Política de inserción para SuperAdmin
CREATE POLICY "subscription_codes_insert_superadmin_only"
ON public.subscription_codes
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Política de actualización para SuperAdmin
CREATE POLICY "subscription_codes_update_superadmin_only"
ON public.subscription_codes
FOR UPDATE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Política de eliminación para SuperAdmin
CREATE POLICY "subscription_codes_delete_superadmin_only"
ON public.subscription_codes
FOR DELETE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- 3. FUNCIÓN RPC ATÓMICA DE CANJE CON BLOQUEO FOR UPDATE (ESTRICTAMENTE DE USO ÚNICO)
CREATE OR REPLACE FUNCTION public.redeem_subscription_license(
  p_code TEXT,
  p_store_id TEXT,
  p_store_name TEXT DEFAULT '',
  p_email TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
  v_clean_code TEXT;
  v_duration_mins INT;
  v_plan_type TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  v_clean_code := UPPER(TRIM(p_code));
  
  IF v_clean_code IS NULL OR v_clean_code = '' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Por favor ingresa un código de activación válido.'
    );
  END IF;

  -- 1. Bloqueo de fila para evitar condiciones de carrera (Race Condition)
  -- Si dos personas intentan canjear el mismo código al mismo tiempo, una de las dos esperará el bloqueo
  SELECT * INTO v_code_record
  FROM public.subscription_codes
  WHERE UPPER(TRIM(code)) = v_clean_code
  FOR UPDATE;

  -- 2. Validar existencia
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'El código de activación no existe o es incorrecto.'
    );
  END IF;

  -- 3. VALIDACIÓN ESTRICTA DE USO ÚNICO:
  -- Si ya fue canjeado, se rechaza inmediatamente sin importar quién lo intente
  IF v_code_record.status = 'redeemed' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Este código ya fue canjeado anteriormente el ' || 
                 TO_CHAR(v_code_record.redeemed_at AT TIME ZONE 'America/La_Paz', 'DD/MM/YYYY HH24:MI') || 
                 ' por la tienda "' || COALESCE(v_code_record.redeemed_by_store_name, v_code_record.redeemed_by_store_id, 'otra tienda') || '". No se puede reutilizar.'
    );
  END IF;

  -- 4. Validar estado revocado
  IF v_code_record.status = 'revoked' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Este código de activación ha sido revocado o deshabilitado.'
    );
  END IF;

  -- 5. Determinar tipo de plan
  v_plan_type := COALESCE(v_code_record.plan_type, 
    CASE 
      WHEN LOWER(COALESCE(v_code_record.plan_name, '')) LIKE '%pro%' THEN 'pro' 
      ELSE 'basic' 
    END
  );

  -- 6. Calcular minutos de vigencia
  v_duration_mins := (COALESCE(v_code_record.duration_days, 0) * 1440) + COALESCE(v_code_record.duration_minutes, 0);
  IF v_duration_mins <= 0 THEN
    v_duration_mins := 43200; -- 30 días por defecto
  END IF;

  -- 7. Marcar atómicamente como CANJEADO
  UPDATE public.subscription_codes
  SET status = 'redeemed',
      redeemed_at = v_now,
      redeemed_by_store_id = p_store_id,
      redeemed_by_store_name = p_store_name,
      redeemed_by_email = p_email
  WHERE id = v_code_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'plan_name', v_code_record.plan_name,
    'plan_type', v_plan_type,
    'duration_minutes', v_duration_mins,
    'duration_days', v_code_record.duration_days,
    'redeemed_at', v_now
  );
END;
$$;

-- Permisos públicos para que un cliente autenticado o anónimo pueda invocar el canje
GRANT EXECUTE ON FUNCTION public.redeem_subscription_license(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Publicación realtime para actualización instantánea en el SuperAdmin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscription_codes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_codes;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignorar si la publicación no existe o no tiene permisos
END $$;
