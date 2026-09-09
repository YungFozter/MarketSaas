-- ==============================================================================
-- SCRIPT: SINCRONIZACIÓN TOTAL DEL TABLERO KANBAN Y SEGUIMIENTO EN VIVO (ORDERS)
-- MercadoSaaS - Persistencia y Sincronización en Tiempo Real de Pedidos
-- ==============================================================================

-- 1. ASEGURAR TABLA: orders y todas sus columnas (snake_case y camelCase)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  owner_id UUID,
  customer JSONB NOT NULL DEFAULT '{}'::jsonb,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  deliveryFee NUMERIC DEFAULT 0,
  delivery_type TEXT DEFAULT 'pickup',
  deliveryType TEXT DEFAULT 'pickup',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method JSONB DEFAULT '{"method":"cash"}'::jsonb,
  paymentMethod JSONB DEFAULT '{"method":"cash"}'::jsonb,
  cash_change_for NUMERIC,
  cashChangeFor NUMERIC,
  coupon_code TEXT,
  couponCode TEXT,
  points_earned INT DEFAULT 0,
  pointsEarned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía con esquema previo
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deliveryFee NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deliveryType TEXT DEFAULT 'pickup';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method JSONB DEFAULT '{"method":"cash"}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paymentMethod JSONB DEFAULT '{"method":"cash"}'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cash_change_for NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cashChangeFor NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS couponCode TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pointsEarned INT DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT NOW();

-- Índices de alto rendimiento para consultas inmediatas
CREATE INDEX IF NOT EXISTS idx_orders_tenant_status ON public.orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas que bloqueaban lecturas anónimas o cross-device
DROP POLICY IF EXISTS "orders_customer_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_owner_and_tracking_select" ON public.orders;
DROP POLICY IF EXISTS "orders_owner_update" ON public.orders;
DROP POLICY IF EXISTS "orders_owner_delete" ON public.orders;
DROP POLICY IF EXISTS "orders_select_all" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_all" ON public.orders;
DROP POLICY IF EXISTS "orders_update_all" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_all" ON public.orders;

-- Política 1: Lectura (El dueño en su Kanban y el cliente en su Tracking pueden leer pedidos)
CREATE POLICY "orders_select_all" 
ON public.orders 
FOR SELECT 
USING (true);

-- Política 2: Inserción (Cualquier vecino o cliente puede emitir un pedido en cualquier tienda)
CREATE POLICY "orders_insert_all" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Política 3: Actualización (Permite actualizar el estado del pedido: Recibido -> Preparando -> Listo -> Entregado)
CREATE POLICY "orders_update_all" 
ON public.orders 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Política 4: Eliminación (Permite descartar o archivar pedidos)
CREATE POLICY "orders_delete_all" 
ON public.orders 
FOR DELETE 
USING (true);

-- 3. HABILITAR REALTIME EN LA TABLA ORDERS
-- Permite que cuando un cliente compre desde su celular, el Tablero Kanban del dueño suene y se actualice al instante
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
