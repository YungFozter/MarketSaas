-- ==============================================================================
-- SISTEMA DE RECUPERACIÓN DIRECTA DE CONTRASEÑA POR CORREO + TELÉFONO / WHATSAPP
-- Ubicación: Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Ejecutar ("Run")
-- 
-- Este script es seguro e idempotente:
-- 1. Habilita la extensión pgcrypto para cifrado bcrypt compatible con Supabase Auth.
-- 2. Crea la tabla de control de intentos para mitigar ataques de fuerza bruta.
-- 3. Crea la función verify_user_phone para comprobar la correspondencia del teléfono.
-- 4. Crea la función reset_password_with_phone para aplicar la nueva contraseña en auth.users.
-- 5. Concede permisos de ejecución a los roles anon y authenticated.
-- ==============================================================================

-- 1. Habilitar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Tabla de auditoría y limitación de tasa de intentos (Brute Force Protection)
CREATE TABLE IF NOT EXISTS public.recovery_attempts (
  email TEXT PRIMARY KEY,
  failed_attempts INT DEFAULT 0,
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  locked_until TIMESTAMPTZ DEFAULT NULL
);

-- Asegurar políticas RLS para recovery_attempts (solo administrable por funciones SECURITY DEFINER)
ALTER TABLE public.recovery_attempts ENABLE ROW LEVEL SECURITY;

-- 3. Función: Verificar correspondencia de Teléfono con el Correo
CREATE OR REPLACE FUNCTION public.verify_user_phone(
  lookup_email TEXT,
  lookup_phone TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_clean_email TEXT;
  v_clean_phone TEXT;
  v_db_phone TEXT;
  v_matched BOOLEAN := FALSE;
  v_attempt_record RECORD;
  v_store_record RECORD;
BEGIN
  -- 1. Limpieza y normalización de entradas
  v_clean_email := LOWER(TRIM(lookup_email));
  v_clean_phone := REGEXP_REPLACE(TRIM(lookup_phone), '\D', '', 'g');

  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'El correo electrónico es requerido.');
  END IF;

  IF v_clean_phone IS NULL OR LENGTH(v_clean_phone) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ingresa un número de teléfono o WhatsApp válido (mínimo 6 dígitos).');
  END IF;

  -- 2. Verificar si la cuenta está bloqueada por intentos fallidos
  SELECT failed_attempts, locked_until INTO v_attempt_record
  FROM public.recovery_attempts
  WHERE email = v_clean_email;

  IF FOUND THEN
    IF v_attempt_record.locked_until IS NOT NULL AND v_attempt_record.locked_until > NOW() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'Demasiados intentos fallidos. Por tu seguridad, esta cuenta está bloqueada temporalmente. Intenta nuevamente en 15 minutos.'
      );
    END IF;
  END IF;

  -- 3. Localizar al usuario en auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = v_clean_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No existe ninguna cuenta registrada con este correo electrónico.');
  END IF;

  -- 4. Comprobar teléfono en auth.users (campo nativo phone o metadata)
  SELECT 
    COALESCE(
      REGEXP_REPLACE(phone, '\D', '', 'g'),
      REGEXP_REPLACE(raw_user_meta_data->>'phone', '\D', '', 'g'),
      REGEXP_REPLACE(raw_user_meta_data->>'whatsapp', '\D', '', 'g'),
      ''
    )
  INTO v_db_phone
  FROM auth.users
  WHERE id = v_user_id;

  IF v_db_phone <> '' AND (
    v_db_phone = v_clean_phone 
    OR v_clean_phone LIKE '%' || v_db_phone 
    OR v_db_phone LIKE '%' || v_clean_phone
    OR RIGHT(v_db_phone, 8) = RIGHT(v_clean_phone, 8)
  ) THEN
    v_matched := TRUE;
  END IF;

  -- 5. Si no coincide aún, comprobar en store_config vinculada al dueño (owner_id)
  IF NOT v_matched THEN
    FOR v_store_record IN 
      SELECT 
        REGEXP_REPLACE(COALESCE(config->>'phone', ''), '\D', '', 'g') AS cfg_phone,
        REGEXP_REPLACE(COALESCE(config->>'whatsapp', ''), '\D', '', 'g') AS cfg_whatsapp
      FROM public.store_config
      WHERE owner_id = v_user_id
    LOOP
      IF (v_store_record.cfg_phone <> '' AND (
            v_store_record.cfg_phone = v_clean_phone 
            OR v_clean_phone LIKE '%' || v_store_record.cfg_phone 
            OR v_store_record.cfg_phone LIKE '%' || v_clean_phone
            OR RIGHT(v_store_record.cfg_phone, 8) = RIGHT(v_clean_phone, 8)
          ))
         OR 
         (v_store_record.cfg_whatsapp <> '' AND (
            v_store_record.cfg_whatsapp = v_clean_phone 
            OR v_clean_phone LIKE '%' || v_store_record.cfg_whatsapp 
            OR v_store_record.cfg_whatsapp LIKE '%' || v_clean_phone
            OR RIGHT(v_store_record.cfg_whatsapp, 8) = RIGHT(v_clean_phone, 8)
          ))
      THEN
        v_matched := TRUE;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- 6. Manejar resultado del intento
  IF NOT v_matched THEN
    -- Incrementar contador de intentos fallidos
    INSERT INTO public.recovery_attempts (email, failed_attempts, last_attempt, locked_until)
    VALUES (
      v_clean_email, 
      1, 
      NOW(), 
      NULL
    )
    ON CONFLICT (email) DO UPDATE SET 
      failed_attempts = public.recovery_attempts.failed_attempts + 1,
      last_attempt = NOW(),
      locked_until = CASE 
        WHEN public.recovery_attempts.failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
        ELSE NULL
      END;

    RETURN jsonb_build_object(
      'success', false, 
      'error', 'El número de teléfono o WhatsApp no coincide con el registrado en esta cuenta.'
    );
  END IF;

  -- Coincidencia confirmada
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Identidad confirmada exitosamente.'
  );
END;
$$;

-- 4. Función: Actualizar Contraseña en Base de Datos tras Verificación
CREATE OR REPLACE FUNCTION public.reset_password_with_phone(
  lookup_email TEXT,
  lookup_phone TEXT,
  new_password TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_clean_email TEXT;
  v_clean_phone TEXT;
  v_db_phone TEXT;
  v_matched BOOLEAN := FALSE;
  v_store_record RECORD;
BEGIN
  -- 1. Limpieza y validaciones iniciales
  v_clean_email := LOWER(TRIM(lookup_email));
  v_clean_phone := REGEXP_REPLACE(TRIM(lookup_phone), '\D', '', 'g');

  IF v_clean_email IS NULL OR v_clean_email = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'El correo electrónico es requerido.');
  END IF;

  IF v_clean_phone IS NULL OR LENGTH(v_clean_phone) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El número de teléfono debe tener al menos 6 dígitos.');
  END IF;

  IF new_password IS NULL OR LENGTH(new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La nueva contraseña debe tener al menos 6 caracteres.');
  END IF;

  -- 2. Localizar al usuario en auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = v_clean_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No existe ninguna cuenta registrada con este correo electrónico.');
  END IF;

  -- 3. Comprobar teléfono en auth.users
  SELECT 
    COALESCE(
      REGEXP_REPLACE(phone, '\D', '', 'g'),
      REGEXP_REPLACE(raw_user_meta_data->>'phone', '\D', '', 'g'),
      REGEXP_REPLACE(raw_user_meta_data->>'whatsapp', '\D', '', 'g'),
      ''
    )
  INTO v_db_phone
  FROM auth.users
  WHERE id = v_user_id;

  IF v_db_phone <> '' AND (
    v_db_phone = v_clean_phone 
    OR v_clean_phone LIKE '%' || v_db_phone 
    OR v_db_phone LIKE '%' || v_clean_phone
    OR RIGHT(v_db_phone, 8) = RIGHT(v_clean_phone, 8)
  ) THEN
    v_matched := TRUE;
  END IF;

  -- 4. Comprobar en store_config vinculada al dueño (owner_id)
  IF NOT v_matched THEN
    FOR v_store_record IN 
      SELECT 
        REGEXP_REPLACE(COALESCE(config->>'phone', ''), '\D', '', 'g') AS cfg_phone,
        REGEXP_REPLACE(COALESCE(config->>'whatsapp', ''), '\D', '', 'g') AS cfg_whatsapp
      FROM public.store_config
      WHERE owner_id = v_user_id
    LOOP
      IF (v_store_record.cfg_phone <> '' AND (
            v_store_record.cfg_phone = v_clean_phone 
            OR v_clean_phone LIKE '%' || v_store_record.cfg_phone 
            OR v_store_record.cfg_phone LIKE '%' || v_clean_phone
            OR RIGHT(v_store_record.cfg_phone, 8) = RIGHT(v_clean_phone, 8)
          ))
         OR 
         (v_store_record.cfg_whatsapp <> '' AND (
            v_store_record.cfg_whatsapp = v_clean_phone 
            OR v_clean_phone LIKE '%' || v_store_record.cfg_whatsapp 
            OR v_store_record.cfg_whatsapp LIKE '%' || v_clean_phone
            OR RIGHT(v_store_record.cfg_whatsapp, 8) = RIGHT(v_clean_phone, 8)
          ))
      THEN
        v_matched := TRUE;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  -- 5. Si no coincide, rechazar
  IF NOT v_matched THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Validación de seguridad fallida. El número de teléfono no coincide con esta cuenta.'
    );
  END IF;

  -- 6. Actualizar la contraseña en auth.users con hash bcrypt (pgcrypto)
  UPDATE auth.users
  SET 
    encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- 7. Limpiar intentos fallidos acumulados
  DELETE FROM public.recovery_attempts WHERE email = v_clean_email;

  RETURN jsonb_build_object(
    'success', true, 
    'message', '¡Contraseña actualizada con éxito!'
  );
END;
$$;

-- 5. Otorgar permisos de ejecución a los roles anon y authenticated
GRANT EXECUTE ON FUNCTION public.verify_user_phone(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_password_with_phone(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Comentarios explicativos
COMMENT ON FUNCTION public.verify_user_phone(TEXT, TEXT) IS 
'Verifica si el teléfono o WhatsApp proporcionado coincide con el registrado en auth.users o store_config.';

COMMENT ON FUNCTION public.reset_password_with_phone(TEXT, TEXT, TEXT) IS 
'Valida atómicamente la correspondencia correo + teléfono y actualiza el hash de la contraseña en auth.users sin enviar correos ni SMS.';
