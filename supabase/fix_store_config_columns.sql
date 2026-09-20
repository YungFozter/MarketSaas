-- ==============================================================================
-- MIGRACIÓN OPCIONAL: COLUMNAS DE NIVEL SUPERIOR EN store_config
-- ==============================================================================
-- Este script agrega opcionalmente las columnas banner_url, logo_url, zone,
-- reference, latitude, longitude a la tabla public.store_config en Supabase
-- para quienes deseen indexar o consultar directamente dichos campos fuera
-- del JSONB config.
--
-- NOTA: El sistema MarketSaaS ya guarda y lee todas estas propiedades de forma
-- resiliente dentro de la columna JSONB config. Ejecutar este script es 100%
-- opcional e idempotente (seguro de ejecutar múltiples veces).
-- ==============================================================================

ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Recargar la caché del esquema de PostgREST para Supabase
NOTIFY pgrst, 'reload schema';

SELECT 'Columnas de store_config verificadas y esquema actualizado exitosamente.' AS resultado;
