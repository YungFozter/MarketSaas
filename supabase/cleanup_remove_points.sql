-- ==============================================================================
-- SCRIPT DE LIMPIEZA: ELIMINACIÓN TOTAL DE VECIPUNTOS EN SUPABASE
-- MercadoSaaS - Remueve tablas, funciones y políticas de puntos de fidelidad
-- ==============================================================================

-- 1. Eliminar función RPC si existe
DROP FUNCTION IF EXISTS public.adjust_customer_points(TEXT, TEXT, TEXT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.adjust_customer_points CASCADE;

-- 2. Eliminar tabla de puntos de clientes con sus políticas e índices asociados
DROP TABLE IF EXISTS public.customer_points CASCADE;

-- 3. Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Tabla public.customer_points y función public.adjust_customer_points eliminadas con éxito.';
END $$;
