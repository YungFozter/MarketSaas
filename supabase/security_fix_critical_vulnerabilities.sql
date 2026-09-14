-- ==============================================================================
-- SCRIPT DE BLINDAJE DE SEGURIDAD CONTRA VULNERABILIDADES CRÍTICAS
-- MarketSaaS - Supabase Database Hardening Migration
-- 
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- para parchar inmediatamente las vulnerabilidades detectadas en la auditoría.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BLINDAJE DE LA TABLA DE CÓDIGOS DE SUSCRIPCIÓN (subscription_codes)
-- Evita la filtración masiva de licencias y el escalamiento a SuperAdmin
-- ------------------------------------------------------------------------------
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;

-- Purgar políticas antiguas permisivas
DROP POLICY IF EXISTS "subscription_codes_select" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_insert" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_update" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_delete" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir lectura publica de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir insercion de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir actualizacion de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir eliminacion de codigos" ON public.subscription_codes;

-- Política 1: Lectura EXCLUSIVAMENTE para SuperAdmin legítimo (validado por app_metadata)
CREATE POLICY "subscription_codes_select_superadmin_only"
ON public.subscription_codes
FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Política 2: Inserción EXCLUSIVAMENTE para SuperAdmin
CREATE POLICY "subscription_codes_insert_superadmin_only"
ON public.subscription_codes
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Política 3: Actualización EXCLUSIVAMENTE para SuperAdmin
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

-- Política 4: Eliminación EXCLUSIVAMENTE para SuperAdmin
CREATE POLICY "subscription_codes_delete_superadmin_only"
ON public.subscription_codes
FOR DELETE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- ------------------------------------------------------------------------------
-- 2. FUNCIÓN RPC SEGURA PARA CANJE ATÓMICO DE LICENCIAS
-- Permite que un comerciante canjee un código sin tener que ver la lista de códigos
-- ------------------------------------------------------------------------------
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
  v_now TIMESTAMPTZ := NOW();
BEGIN
  v_clean_code := UPPER(TRIM(p_code));
  
  IF v_clean_code IS NULL OR v_clean_code = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ingresa un código de activación válido.');
  END IF;

  -- Buscar y bloquear fila para evitar condición de carrera (race condition)
  SELECT * INTO v_code_record
  FROM public.subscription_codes
  WHERE code = v_clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'El código de activación no existe o es incorrecto.');
  END IF;

  IF v_code_record.status = 'redeemed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Este código ya fue canjeado anteriormente.');
  END IF;

  IF v_code_record.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Este código ha sido revocado o deshabilitado.');
  END IF;

  -- Calcular duración en minutos
  v_duration_mins := (COALESCE(v_code_record.duration_days, 0) * 1440) + COALESCE(v_code_record.duration_minutes, 0);
  IF v_duration_mins <= 0 THEN
    v_duration_mins := 43200; -- 30 días por defecto
  END IF;

  -- Marcar como canjeado
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
    'duration_minutes', v_duration_mins,
    'duration_days', v_code_record.duration_days,
    'redeemed_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_subscription_license(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. BLINDAJE DE LA FUNCIÓN RPC: decrement_stock (Protección contra sabotaje)
-- Valida que la cantidad sea positiva y razonable (1 a 100 unidades por pedido)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_stock(product_id TEXT, quantity INT)
RETURNS VOID AS $$
BEGIN
  -- Bloquear cantidades negativas (que inflan stock) o absurdas (>100 por ítem)
  IF quantity IS NULL OR quantity <= 0 OR quantity > 100 THEN
    RETURN;
  END IF;

  UPDATE public.products
  SET 
    stock = CASE 
      WHEN stock ~ '^[0-9]+$' THEN GREATEST(0, (stock::int - quantity))::text
      ELSE stock 
    END,
    updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.decrement_stock(TEXT, INT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 4. CONFIRMACIÓN Y AUDITORÍA DE POLÍTICAS APLICADAS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'Blindaje de seguridad RLS y mitigación de vulnerabilidades completado exitosamente.';
END $$;
