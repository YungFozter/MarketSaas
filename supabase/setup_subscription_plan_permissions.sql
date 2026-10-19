-- ==============================================================================
-- MIGRACIÓN: SISTEMA DE PERMISOS Y CONTROL DE ACCESO POR PLAN DE SUSCRIPCIÓN
-- MarketSaaS - Supabase Schema, Columnas de Plan y RPC Atómica
-- Plan Básico (Bs. 75/mes) vs Plan PRO (Bs. 129/mes)
-- ==============================================================================

-- 1. TABLA subscription_codes: Asegurar columna plan_type ('basic' | 'pro')
ALTER TABLE public.subscription_codes 
  ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'basic';

-- Garantizar restricción de valores válidos para plan_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscription_codes_plan_type_check'
  ) THEN
    ALTER TABLE public.subscription_codes 
      ADD CONSTRAINT subscription_codes_plan_type_check 
      CHECK (plan_type IN ('basic', 'pro'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Actualizar registros existentes en caso de tener nombres de plan con 'pro'
UPDATE public.subscription_codes
SET plan_type = 'pro'
WHERE LOWER(plan_name) LIKE '%pro%' AND plan_type <> 'pro';

-- Índice para optimizar filtrado en el panel SuperAdmin por tipo de plan
CREATE INDEX IF NOT EXISTS idx_subscription_codes_plan_type 
  ON public.subscription_codes(plan_type);

-- 2. FUNCIÓN RPC SEGURA Y ATÓMICA: redeem_subscription_license
-- Procesa el canje atómico reconociendo el plan_type ('basic' | 'pro') y calculando la vigencia
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
      'message', 'Ingresa un código de activación válido.'
    );
  END IF;

  -- Buscar y bloquear fila para evitar condiciones de carrera (Race Condition)
  SELECT * INTO v_code_record
  FROM public.subscription_codes
  WHERE UPPER(TRIM(code)) = v_clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'El código de activación no existe o es incorrecto.'
    );
  END IF;

  IF v_code_record.status = 'redeemed' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Este código ya fue canjeado anteriormente por la tienda "' || 
                 COALESCE(v_code_record.redeemed_by_store_name, v_code_record.redeemed_by_store_id, 'otra tienda') || '".'
    );
  END IF;

  IF v_code_record.status = 'revoked' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', 'Este código ha sido revocado o deshabilitado.'
    );
  END IF;

  -- Determinar tipo de plan (basic o pro)
  v_plan_type := COALESCE(v_code_record.plan_type, 
    CASE 
      WHEN LOWER(COALESCE(v_code_record.plan_name, '')) LIKE '%pro%' THEN 'pro' 
      ELSE 'basic' 
    END
  );

  -- Calcular duración en minutos
  v_duration_mins := (COALESCE(v_code_record.duration_days, 0) * 1440) + COALESCE(v_code_record.duration_minutes, 0);
  IF v_duration_mins <= 0 THEN
    v_duration_mins := 43200; -- 30 días por defecto
  END IF;

  -- Marcar como canjeado atómicamente
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

-- Conceder permisos de ejecución seguros
GRANT EXECUTE ON FUNCTION public.redeem_subscription_license(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- Comentario explicativo
COMMENT ON COLUMN public.subscription_codes.plan_type IS 'Tipo de plan asignado por el código: "basic" (Bs. 75) o "pro" (Bs. 129)';
