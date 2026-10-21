-- ==============================================================================
-- MIGRACIÓN SUPABASE: SOPORTE PARA MÉTODO DE PAGO COMBINADO (SPLIT PAYMENT)
-- MarketSaaS - Plataforma Multi-Tenant para Minimarkets y Comercio de Barrio
-- ==============================================================================

-- 1. ASEGURAR COLUMNA split_payment EN LA TABLA public.orders
-- Permite almacenar el desglose estructurado { cash, qr, card, cashGiven, change }
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS split_payment JSONB DEFAULT NULL;

-- 2. ASEGURAR COMENTARIO EXPLICATIVO
COMMENT ON COLUMN public.orders.split_payment IS 
'Desglose estructurado de montos cuando payment_method = combined (ej: {"cash": 30.00, "qr": 20.00, "card": 0.00, "cashGiven": 50.00, "change": 20.00})';

-- 3. ÍNDICE DE CONSULTA Y FILTRADO POR MÉTODO DE PAGO
CREATE INDEX IF NOT EXISTS idx_orders_payment_method 
ON public.orders (tenant_id, payment_method);

-- 4. VERIFICACIÓN Y AUDITORÍA
DO $$
BEGIN
  RAISE NOTICE 'Soporte para Pago Combinado (split_payment JSONB) habilitado con éxito en public.orders.';
END $$;
