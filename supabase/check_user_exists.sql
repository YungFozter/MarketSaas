-- ==============================================================================
-- VALIDACION DE CORREO REGISTRADO PARA RECUPERACION DE CONTRASEÑA
-- Ejecuta este script en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Crear funcion segura para comprobar si un correo existe en auth.users
CREATE OR REPLACE FUNCTION public.check_user_exists(lookup_email TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(TRIM(lookup_email))
  );
END;
$$;

-- 2. Otorgar permisos de ejecucion para usuarios anonimos y autenticados
GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO anon, authenticated;

-- Comentario explicativo
COMMENT ON FUNCTION public.check_user_exists(TEXT) IS 
'Verifica de forma segura si un correo electronico existe en auth.users antes de solicitar recuperacion de contraseña.';
