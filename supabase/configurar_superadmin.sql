-- ==============================================================================
-- SCRIPT DE SEGURIDAD Y CONFIGURACIÓN DEL SUPERADMIN (MARKETSAAS)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- ==============================================================================

-- 1. ASIGNACIÓN DEL ROL SUPERADMIN A TU CUENTA DE SUPABASE AUTH
-- Reemplaza 'superadmin@marketsaas.com' por el correo de tu cuenta de SuperAdmin creada en Supabase
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "superadmin"}'::jsonb
WHERE email = 'superadmin@marketsaas.com';

-- 2. BLINDAJE DE POLÍTICAS RLS EN LA TABLA DE CÓDIGOS DE SUSCRIPCIÓN
-- Asegura que solo usuarios autenticados con rol SuperAdmin puedan insertar o eliminar licencias
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;

-- Lectura: los comerciantes pueden consultar códigos para validarlos al momento de canjear
DROP POLICY IF EXISTS "subscription_codes_select" ON public.subscription_codes;
CREATE POLICY "subscription_codes_select"
ON public.subscription_codes
FOR SELECT
USING (true);

-- Inserción: Estrictamente restringida a usuarios con rol 'superadmin' en el token JWT
DROP POLICY IF EXISTS "subscription_codes_insert" ON public.subscription_codes;
CREATE POLICY "subscription_codes_insert"
ON public.subscription_codes
FOR INSERT
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Actualización: Permitida al canjear un código de activación
DROP POLICY IF EXISTS "subscription_codes_update" ON public.subscription_codes;
CREATE POLICY "subscription_codes_update"
ON public.subscription_codes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Eliminación: Estrictamente restringida a usuarios con rol 'superadmin'
DROP POLICY IF EXISTS "subscription_codes_delete" ON public.subscription_codes;
CREATE POLICY "subscription_codes_delete"
ON public.subscription_codes
FOR DELETE
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR
  (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
);

-- Verificación: comprobar qué usuarios tienen el rol asignado
SELECT id, email, raw_app_meta_data ->> 'role' AS rol_asignado, created_at
FROM auth.users
WHERE (raw_app_meta_data ->> 'role') = 'superadmin' 
   OR email IN ('superadmin@marketsaas.com', 'admin@marketsaas.com');
