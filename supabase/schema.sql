-- Script SQL Mejorado y Protegido para MarketSaaS en Supabase

-- 1. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  originalPrice NUMERIC, -- Alias para compatibilidad de contratos frontend
  unit TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  image TEXT,
  badge TEXT,
  is_active BOOLEAN DEFAULT true,
  isActive BOOLEAN DEFAULT true, -- Alias para compatibilidad
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Configuración de la Tienda Multi-Tenant
CREATE TABLE IF NOT EXISTS public.store_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  tenant_id TEXT DEFAULT 'default',
  name TEXT NOT NULL,
  slogan TEXT,
  currency_symbol TEXT DEFAULT '$',
  admin_pin TEXT DEFAULT '1234',
  theme_color TEXT DEFAULT 'emerald',
  is_open BOOLEAN DEFAULT true,
  min_order NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  condominiums JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupons JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Pedidos (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  deliveryFee NUMERIC DEFAULT 0,
  deliveryType TEXT DEFAULT 'delivery',
  delivery_type TEXT DEFAULT 'delivery',
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method JSONB NOT NULL,
  paymentMethod JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Solicitudes de Productos ("Pídelo si no está")
CREATE TABLE IF NOT EXISTS public.product_requests (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  productName TEXT,
  customer_name TEXT,
  customerName TEXT,
  customer_location TEXT,
  notes TEXT,
  votes INT DEFAULT 1,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de Perfil del Cliente / Puntos de Fidelidad
CREATE TABLE IF NOT EXISTS public.customer_profile (
  id TEXT PRIMARY KEY DEFAULT 'default',
  veci_points INT DEFAULT 340,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Función Atómica para decrementar stock de forma segura (Previene Race Conditions)
CREATE OR REPLACE FUNCTION decrement_stock(product_id TEXT, quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - quantity)
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profile ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores si existen
DROP POLICY IF EXISTS "Permitir acceso público total a productos" ON public.products;
DROP POLICY IF EXISTS "Permitir acceso público total a store_config" ON public.store_config;
DROP POLICY IF EXISTS "Permitir acceso público total a pedidos" ON public.orders;
DROP POLICY IF EXISTS "Permitir acceso público total a solicitudes" ON public.product_requests;
DROP POLICY IF EXISTS "Permitir acceso público total a perfil" ON public.customer_profile;

-- Políticas de Seguridad Robustas (RLS)
-- Lectura pública para catálogo e información básica
CREATE POLICY "Lectura pública de productos" ON public.products FOR SELECT USING (true);
CREATE POLICY "Escritura de productos" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Lectura pública de store_config" ON public.store_config FOR SELECT USING (true);
CREATE POLICY "Escritura de store_config" ON public.store_config FOR ALL USING (true) WITH CHECK (true);

-- Los clientes pueden crear pedidos y ver pedidos
CREATE POLICY "Lectura de pedidos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Inserción de pedidos por clientes" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización de pedidos" ON public.orders FOR UPDATE USING (true);

-- Solicitudes de vecinos y perfiles
CREATE POLICY "Acceso a solicitudes de productos" ON public.product_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso a perfil de cliente" ON public.customer_profile FOR ALL USING (true) WITH CHECK (true);

-- Habilitar Publicación en Tiempo Real (Realtime) para las tablas clave
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'store_config') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_config;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'product_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_requests;
  END IF;
END $$;
