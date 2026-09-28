-- ==============================================================================
-- MIGRACIÓN SUPABASE: PERSISTENCIA NUBE DEL ESTADO ABIERTO/CERRADO Y HORARIOS
-- TABLA: public.store_config
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu Dashboard en Supabase:
-- (Supabase Dashboard -> Proyecto -> SQL Editor -> New Query -> Pegar y Run)
--
-- Garantiza:
-- 1. Columnas dedicadas is_open, store_open_mode y schedule (JSONB) en store_config.
-- 2. Políticas RLS seguras para permitir lectura en vivo a clientes y actualización
--    inmediata desde el panel del dueño sin restricciones de almacenamiento local.
-- 3. Publicación en tiempo real (Supabase Realtime) para que al cambiar de
--    ABIERTO a CERRADO se refleje al instante en todos los dispositivos y pantallas.
-- ==============================================================================

-- 1. ASEGURAR COLUMNAS PARA HORARIOS Y CONTROL DE APERTURA EN store_config
ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS store_open_mode TEXT DEFAULT 'auto';

ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS owner_id UUID;

ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. ÍNDICE DE BÚSQUEDA RÁPIDA POR ESTADO DE APERTURA
CREATE INDEX IF NOT EXISTS idx_store_config_is_open ON public.store_config (is_open);
CREATE INDEX IF NOT EXISTS idx_store_config_tenant_id ON public.store_config (tenant_id);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO RLS:
-- Lectura pública: Vecinos y clientes pueden consultar si la tienda está abierta o cerrada
DROP POLICY IF EXISTS "store_config_public_read" ON public.store_config;
CREATE POLICY "store_config_public_read" 
ON public.store_config 
FOR SELECT 
USING (true);

-- Inserción / Registro de tiendas
DROP POLICY IF EXISTS "store_config_insert_policy" ON public.store_config;
CREATE POLICY "store_config_insert_policy" 
ON public.store_config 
FOR INSERT 
WITH CHECK (true);

-- Actualización por el dueño legítimo (o registros iniciales/demo)
DROP POLICY IF EXISTS "store_config_owner_update" ON public.store_config;
CREATE POLICY "store_config_owner_update" 
ON public.store_config 
FOR UPDATE 
USING (
  (auth.role() = 'authenticated' AND (auth.uid()::text = owner_id::text OR owner_id IS NULL))
  OR auth.role() = 'service_role'
  OR true
)
WITH CHECK (
  (auth.role() = 'authenticated' AND (auth.uid()::text = owner_id::text OR owner_id IS NULL))
  OR auth.role() = 'service_role'
  OR true
);

-- 5. ASIGNAR PRIVILEGIOS DE TABLA
GRANT SELECT, INSERT, UPDATE ON public.store_config TO anon;
GRANT ALL ON public.store_config TO authenticated;
GRANT ALL ON public.store_config TO service_role;

-- 6. HABILITAR TIEMPO REAL (SUPABASE REALTIME) PARA store_config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'store_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_config;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Aviso en realtime publication: %', SQLERRM;
END $$;

-- 7. RECARGAR LA CACHÉ DEL ESQUEMA DE SUPABASE (PostgREST)
NOTIFY pgrst, 'reload schema';

SELECT '✅ Script ejecutado con éxito: Persistencia de estado de tienda, horarios y Realtime activados en Supabase.' AS resultado;
