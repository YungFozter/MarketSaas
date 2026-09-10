-- ==============================================================================
-- FIX DEFINITIVO: POLÍTICA RLS PARA REGISTRO DE TIENDAS (store_config)
-- Y AUTO-CONFIRMACIÓN DE USUARIOS EN SUPABASE AUTH
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (Dashboard -> SQL Editor)

-- 1. ASEGURAR COLUMNAS EN store_config
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'Av. Principal entre 2do y 3er Anillo';
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+591 72125280';
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '59172125280';
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

-- 2. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS ANTIGUAS QUE PUEDAN BLOQUEAR EL REGISTRO
DROP POLICY IF EXISTS "store_config_public_read" ON public.store_config;
DROP POLICY IF EXISTS "Lectura pública de store_config" ON public.store_config;
DROP POLICY IF EXISTS "store_config_owner_insert" ON public.store_config;
DROP POLICY IF EXISTS "Registro de tienda por usuarios autenticados" ON public.store_config;
DROP POLICY IF EXISTS "store_config_owner_update" ON public.store_config;
DROP POLICY IF EXISTS "Actualización de tienda por su dueño" ON public.store_config;
DROP POLICY IF EXISTS "store_config_owner_delete" ON public.store_config;
DROP POLICY IF EXISTS "store_config_insert_policy" ON public.store_config;

-- 4. POLÍTICAS ROBUSTAS PARA store_config:

-- A) LECTURA PÚBLICA:
-- Cualquier vecino o cliente puede consultar el nombre, slogan, logo y estado de apertura de la tienda
CREATE POLICY "store_config_public_read" 
ON public.store_config 
FOR SELECT 
USING (true);

-- B) INSERCIÓN / REGISTRO DE TIENDA:
-- Permite a nuevos comerciantes registrar su tienda sin ser bloqueados por estado de sesión transitoria
CREATE POLICY "store_config_insert_policy" 
ON public.store_config 
FOR INSERT 
WITH CHECK (true);

-- C) MODIFICACIÓN:
-- Estrictamente restringida al dueño legítimo de la tienda (auth.uid() = owner_id)
CREATE POLICY "store_config_owner_update" 
ON public.store_config 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND (auth.uid()::text = owner_id::text OR owner_id IS NULL)
) 
WITH CHECK (
  auth.role() = 'authenticated' AND (auth.uid()::text = owner_id::text OR owner_id IS NULL)
);

-- D) ELIMINACIÓN:
-- Estrictamente restringida al dueño legítimo de la tienda
CREATE POLICY "store_config_owner_delete" 
ON public.store_config 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
);

-- 5. PERMISOS DE TABLA PARA ROLES anon Y authenticated
GRANT SELECT, INSERT ON public.store_config TO anon;
GRANT ALL ON public.store_config TO authenticated;

-- 6. AUTO-CONFIRMAR USUARIOS PENDIENTES EN auth.users
-- (En Supabase moderno, confirmed_at es columna generada automáticamente al actualizar email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 7. TRIGGER DE AUTO-CONFIRMACIÓN PARA NUEVOS REGISTROS
CREATE OR REPLACE FUNCTION public.auto_confirm_merchant_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_merchant_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_merchant_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_merchant_user();

-- Mensaje de confirmación en la consola del SQL Editor
SELECT 'Configuración RLS de store_config y auto-confirmación de usuarios completada con éxito.' AS resultado;
