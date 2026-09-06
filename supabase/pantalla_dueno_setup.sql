-- ==============================================================================
-- MarketSaaS: Script Maestro para la Pantalla Dueño (Panel MiniMarket)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA: CONFIGURACIÓN DE TIENDA (store_config)
CREATE TABLE IF NOT EXISTS public.store_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  tenant_id TEXT DEFAULT 'default',
  name TEXT NOT NULL DEFAULT 'Minimarket Saas',
  slogan TEXT DEFAULT 'Tu tienda de confianza a pasos de tu puerta',
  address TEXT DEFAULT 'Av. Principal entre 2do y 3er Anillo',
  phone TEXT DEFAULT '+591 72125280',
  whatsapp TEXT DEFAULT '59172125280',
  theme_color TEXT DEFAULT 'emerald',
  currency_symbol TEXT DEFAULT 'Bs.',
  is_open BOOLEAN DEFAULT true,
  min_order NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  free_delivery_threshold NUMERIC DEFAULT 80,
  enable_delivery BOOLEAN DEFAULT true,
  enable_points BOOLEAN DEFAULT true,
  points_ratio NUMERIC DEFAULT 10,
  admin_pin TEXT DEFAULT '1234',
  qr_image_url TEXT,
  logo_url TEXT,
  banner_url TEXT DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  condominiums JSONB NOT NULL DEFAULT '[
    {"id": "c1", "name": "Condominio Las Palmas", "towers": ["Torre A", "Torre B", "Torre C", "Casas 1-50"], "deliveryFee": 5.00, "estTime": "10-15 min"},
    {"id": "c2", "name": "Condominio Altos del Valle", "towers": ["Torre 1", "Torre 2", "Torre 3"], "deliveryFee": 5.00, "estTime": "12-18 min"},
    {"id": "c3", "name": "Edificio Vista Sol", "towers": ["Piso 1-12"], "deliveryFee": 0.00, "estTime": "8-12 min"}
  ]'::jsonb,
  categories JSONB NOT NULL DEFAULT '[
    "Lácteos & Huevos", "Panadería & Desayuno", "Abarrotes", "Frutas & Verduras", "Bebidas & Licores", "Snacks & Golosinas", "Limpieza & Hogar"
  ]'::jsonb,
  coupons JSONB NOT NULL DEFAULT '[
    {"id": "coup-1", "code": "VECINO10", "discount": 10.00, "minSubtotal": 50.00, "description": "Descuento 10 Bs. para vecinos en compras mayores a 50 Bs."}
  ]'::jsonb,
  payment_methods JSONB NOT NULL DEFAULT '[
    {"id": "cash", "name": "Efectivo contra entrega", "desc": "Indica con cuánto pagarás para tu vuelto", "enabled": true},
    {"id": "qr", "name": "Transferencia / QR Digital", "desc": "Simple QR Banco de Preferencia", "enabled": true},
    {"id": "card", "name": "Tarjeta (POS Móvil)", "desc": "Lector inalámbrico en mostrador o puerta", "enabled": true}
  ]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'Av. Principal entre 2do y 3er Anillo';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+591 72125280';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '59172125280';
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC DEFAULT 80;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS enable_delivery BOOLEAN DEFAULT true;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS enable_points BOOLEAN DEFAULT true;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS points_ratio NUMERIC DEFAULT 10;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS qr_image_url TEXT;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.store_config ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- 3. TABLA: PRODUCTOS E INVENTARIO (products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  originalPrice NUMERIC,
  cost_price NUMERIC DEFAULT 0,
  costPrice NUMERIC DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Unidad',
  stock INT NOT NULL DEFAULT 0,
  min_stock INT DEFAULT 5,
  minStock INT DEFAULT 5,
  image TEXT,
  badge TEXT,
  code TEXT,
  is_popular BOOLEAN DEFAULT false,
  isPopular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS costPrice NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock INT DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS minStock INT DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS isPopular BOOLEAN DEFAULT false;

-- 4. TABLA: PEDIDOS EN VIVO (orders - Tablero Kanban)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  deliveryFee NUMERIC DEFAULT 0,
  delivery_type TEXT DEFAULT 'delivery',
  deliveryType TEXT DEFAULT 'delivery',
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled'
  payment_method JSONB,
  paymentMethod JSONB,
  points_earned INT DEFAULT 0,
  cash_change_for NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  createdAt TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS points_earned INT DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cash_change_for NUMERIC;

-- 5. TABLA: PETICIONES DE VECINOS (product_requests - Buzón de Vecinos)
CREATE TABLE IF NOT EXISTS public.product_requests (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  product_name TEXT NOT NULL,
  productName TEXT,
  customer_name TEXT,
  customerName TEXT,
  customer_location TEXT,
  notes TEXT,
  votes INT DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'stocked' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_requests ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

-- ==============================================================================
-- 6. ENDPOINTS DE BASE DE DATOS (FUNCIONES RPC DE ALTO RENDIMIENTO)
-- ==============================================================================

-- RPC 1: Actualización de estado del pedido (Kanban en 1 tap)
CREATE OR REPLACE FUNCTION update_order_stage(p_order_id TEXT, p_new_status TEXT)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  UPDATE public.orders
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: Decremento atómico de stock (Cobro POS y Despacho sin Race Conditions)
CREATE OR REPLACE FUNCTION decrement_stock(product_id TEXT, quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - quantity),
      updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: Incremento rápido de stock (Atajo Inventario Exprés)
CREATE OR REPLACE FUNCTION quick_adjust_stock(product_id TEXT, delta INT)
RETURNS INT AS $$
DECLARE
  new_stock INT;
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock + delta),
      updated_at = NOW()
  WHERE id = product_id
  RETURNING stock INTO new_stock;

  RETURN new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 4: Cálculo de KPIs del Día para el Cockpit del Dueño
CREATE OR REPLACE FUNCTION get_merchant_cockpit_kpis(p_tenant_id TEXT DEFAULT 'default')
RETURNS JSONB AS $$
DECLARE
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW());
  v_total_sales NUMERIC := 0;
  v_order_count INT := 0;
  v_active_count INT := 0;
  v_pending_count INT := 0;
  v_preparing_count INT := 0;
  v_shipping_count INT := 0;
  v_low_stock_count INT := 0;
BEGIN
  -- Ventas del día (órdenes no canceladas)
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO v_total_sales, v_order_count
  FROM public.orders
  WHERE tenant_id = p_tenant_id
    AND status != 'cancelled'
    AND created_at >= v_today_start;

  -- Desglose de activas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'preparing'),
    COUNT(*) FILTER (WHERE status = 'on_the_way')
  INTO v_active_count, v_pending_count, v_preparing_count, v_shipping_count
  FROM public.orders
  WHERE tenant_id = p_tenant_id
    AND status IN ('pending', 'preparing', 'on_the_way');

  -- Productos en stock crítico
  SELECT COUNT(*)
  INTO v_low_stock_count
  FROM public.products
  WHERE tenant_id = p_tenant_id
    AND stock <= COALESCE(min_stock, 5);

  RETURN jsonb_build_object(
    'total_sales', v_total_sales,
    'orders_count', v_order_count,
    'average_ticket', CASE WHEN v_order_count > 0 THEN ROUND(v_total_sales / v_order_count, 2) ELSE 0 END,
    'active_orders', v_active_count,
    'pending_orders', v_pending_count,
    'preparing_orders', v_preparing_count,
    'shipping_orders', v_shipping_count,
    'low_stock_products', v_low_stock_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 7. SEGURIDAD Y POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas
DROP POLICY IF EXISTS "Lectura pública de store_config" ON public.store_config;
DROP POLICY IF EXISTS "Registro de tienda por usuarios autenticados" ON public.store_config;
DROP POLICY IF EXISTS "Actualización de tienda por su dueño" ON public.store_config;
DROP POLICY IF EXISTS "Lectura pública de productos" ON public.products;
DROP POLICY IF EXISTS "Gestión de productos por dueño" ON public.products;
DROP POLICY IF EXISTS "Inserción pública de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Lectura de pedidos por dueño" ON public.orders;
DROP POLICY IF EXISTS "Actualización de pedidos por dueño" ON public.orders;
DROP POLICY IF EXISTS "Lectura pública de solicitudes" ON public.product_requests;
DROP POLICY IF EXISTS "Inserción pública de solicitudes" ON public.product_requests;
DROP POLICY IF EXISTS "Gestión de solicitudes por dueño" ON public.product_requests;

-- 7.1. Tiendas: Lectura pública, registro autenticado, edición por dueño
CREATE POLICY "Lectura pública de store_config" ON public.store_config FOR SELECT USING (true);
CREATE POLICY "Registro de tienda por usuarios autenticados" ON public.store_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Actualización de tienda por su dueño" ON public.store_config FOR UPDATE USING (
  auth.uid() = owner_id OR id = 'default'
) WITH CHECK (
  auth.uid() = owner_id OR id = 'default'
);

-- 7.2. Productos: Catálogo público, gestión reservada al dueño
CREATE POLICY "Lectura pública de productos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Gestión de productos por dueño" ON public.products FOR ALL USING (
  tenant_id = 'default' OR
  auth.uid() IN (SELECT owner_id FROM public.store_config WHERE store_config.id = products.tenant_id)
) WITH CHECK (
  tenant_id = 'default' OR
  auth.uid() IN (SELECT owner_id FROM public.store_config WHERE store_config.id = products.tenant_id)
);

-- 7.3. Pedidos: Inserción comunitaria por clientes, gestión por dueño
CREATE POLICY "Inserción pública de pedidos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura de pedidos por dueño" ON public.orders FOR SELECT USING (
  tenant_id = 'default' OR
  auth.uid() IN (SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id)
);
CREATE POLICY "Actualización de pedidos por dueño" ON public.orders FOR UPDATE USING (
  tenant_id = 'default' OR
  auth.uid() IN (SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id)
) WITH CHECK (
  tenant_id = 'default' OR
  auth.uid() IN (SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id)
);

-- 7.4. Peticiones de Vecinos
CREATE POLICY "Lectura pública de solicitudes" ON public.product_requests FOR SELECT USING (true);
CREATE POLICY "Inserción pública de solicitudes" ON public.product_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Gestión de solicitudes por dueño" ON public.product_requests FOR UPDATE USING (
  tenant_id = 'default' OR
  auth.uid() IN (SELECT owner_id FROM public.store_config WHERE store_config.id = product_requests.tenant_id)
);

-- ==============================================================================
-- 8. HABILITACIÓN DE REALTIME EN SUPABASE (Notificaciones en Vivo)
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'store_config') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_config;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'product_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_requests;
  END IF;
END $$;

-- ==============================================================================
-- 9. DATOS SEMILLA (Seed inicial para tener la tienda Don Vecino / Amarket lista)
-- ==============================================================================
INSERT INTO public.store_config (id, tenant_id, name, slogan, address, phone, whatsapp, theme_color, is_open)
VALUES (
  'default',
  'default',
  'Minimarket Don Vecino',
  'Tu tienda de confianza a pasos de tu puerta',
  'Condominio Las Palmas, Edificio Central',
  '+591 72125280',
  '59172125280',
  'emerald',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slogan = EXCLUDED.slogan,
  is_open = EXCLUDED.is_open;

-- Inserción de productos de demostración con stock
INSERT INTO public.products (id, tenant_id, name, category, price, cost_price, unit, stock, min_stock, is_popular, is_active, code)
VALUES
  ('prod-1', 'default', 'Leche Entera Selección 1L', 'Lácteos & Huevos', 8.00, 6.20, 'Tetra Pak 1L', 2, 5, true, true, '7801001'),
  ('prod-2', 'default', 'Huevos de Granja Selección 15u', 'Lácteos & Huevos', 18.00, 14.50, 'Bandeja 15u', 1, 4, true, true, '7801002'),
  ('prod-3', 'default', 'Pan Marraqueta Artesanal (1 Kg)', 'Panadería & Desayuno', 14.00, 10.00, 'Bolsa 1 Kg', 1, 5, true, true, '7801003'),
  ('prod-4', 'default', 'Coca-Cola Sabor Original 2L', 'Bebidas & Licores', 13.00, 10.00, 'Botella 2L', 18, 6, true, true, '7801004'),
  ('prod-5', 'default', 'Papas Lays Clásicas 70g', 'Snacks & Golosinas', 5.50, 4.00, 'Bolsa 70g', 24, 6, true, true, '7801005')
ON CONFLICT (id) DO NOTHING;

-- Inserción de pedidos demo iniciales en el Kanban
INSERT INTO public.orders (id, tenant_id, customer, items, subtotal, delivery_fee, total, status, delivery_type, payment_method, cash_change_for)
VALUES
  (
    'ORD-1042',
    'default',
    '{"name": "Camila Rojas", "phone": "+591 71234567", "condominium": "Condominio Las Palmas", "tower": "Torre A", "apartment": "Depto 904"}'::jsonb,
    '[{"id": "prod-1", "name": "Leche Entera Selección 1L", "quantity": 1, "price": 8.00}, {"id": "prod-3", "name": "Pan Marraqueta (1 Kg)", "quantity": 2, "price": 14.00}]'::jsonb,
    36.00,
    0.00,
    36.00,
    'pending',
    'delivery',
    '{"id": "qr", "name": "QR Simple"}'::jsonb,
    NULL
  ),
  (
    'ORD-1040',
    'default',
    '{"name": "Sebastián Pavez", "phone": "+591 76543210", "condominium": "Condominio Las Palmas", "tower": "Torre B", "apartment": "Depto 402"}'::jsonb,
    '[{"id": "prod-4", "name": "Coca-Cola 2L", "quantity": 2, "price": 13.00}, {"id": "prod-5", "name": "Papas Lays", "quantity": 2, "price": 5.50}]'::jsonb,
    37.00,
    5.00,
    42.00,
    'preparing',
    'delivery',
    '{"id": "qr", "name": "QR Simple"}'::jsonb,
    NULL
  ),
  (
    'ORD-1038',
    'default',
    '{"name": "Carlos Mendoza", "phone": "+591 78901234", "condominium": "Condominio Las Palmas", "tower": "Torre A", "apartment": "Depto 603"}'::jsonb,
    '[{"id": "prod-1", "name": "Leche Entera 1L", "quantity": 2, "price": 8.00}]'::jsonb,
    16.00,
    5.00,
    21.00,
    'on_the_way',
    'delivery',
    '{"id": "cash", "name": "Efectivo"}'::jsonb,
    50.00
  )
ON CONFLICT (id) DO NOTHING;
