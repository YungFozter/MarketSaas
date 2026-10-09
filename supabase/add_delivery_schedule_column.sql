-- ==============================================================================
-- MIGRACIÓN SUPABASE: COLUMNA DEDICADA delivery_schedule EN store_config
-- ==============================================================================
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Run
--
-- ¿ES OBLIGATORIO EJECUTAR ESTE SCRIPT?
-- No. MarketSaaS ya guarda y lee de forma transparente y resiliente el objeto
-- deliverySchedule dentro de la columna JSONB 'config' y en localStorage.
--
-- ¿PARA QUÉ SIRVE EJECUTARLO?
-- 1. Añade la columna dedicada 'delivery_schedule' (JSONB) en public.store_config.
-- 2. Permite ver y editar los turnos de entrega directamente desde el Table Editor
--    de Supabase sin tener que abrir el JSON general de la tienda.
-- 3. Este script es 100% IDEMPOTENTE (seguro de ejecutar múltiples veces sin borrar datos).
-- ==============================================================================

-- 1. Asegurar columna dedicada delivery_schedule con valor por defecto
ALTER TABLE IF EXISTS public.store_config 
  ADD COLUMN IF NOT EXISTS delivery_schedule JSONB DEFAULT '{
    "enabled": true,
    "mode": "custom",
    "daysText": "Lunes a Sábado",
    "timeText": "11:30 - 14:00 y 18:30 - 22:00",
    "slot1Start": "11:30",
    "slot1End": "14:00",
    "hasSecondSlot": true,
    "slot2Start": "18:30",
    "slot2End": "22:00",
    "note": "Los pedidos fuera de horario se programarán para el siguiente turno de entrega."
  }'::jsonb;

-- 2. Migrar de forma retroactiva el deliverySchedule que ya esté dentro de 'config' si la nueva columna está vacía
UPDATE public.store_config
SET delivery_schedule = config->'deliverySchedule'
WHERE (delivery_schedule IS NULL OR delivery_schedule = '{}'::jsonb)
  AND config IS NOT NULL
  AND config->'deliverySchedule' IS NOT NULL;

-- 3. Recargar la caché del esquema de PostgREST para Supabase API
NOTIFY pgrst, 'reload schema';

-- 4. Verificación de resultado
SELECT 
  id, 
  name, 
  enable_delivery, 
  delivery_schedule->>'daysText' AS dias_envio,
  delivery_schedule->>'timeText' AS horario_envio
FROM public.store_config;
