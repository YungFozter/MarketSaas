-- ==============================================================================
-- MarketSaaS: Script SQL de Soporte para Importación Masiva desde Excel
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. ASEGURAR TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Sin definir',
  price NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'Sin definir',
  stock TEXT DEFAULT '0',
  image TEXT DEFAULT '/products/producto-sin-imagen.png',
  badge TEXT DEFAULT '',
  code TEXT DEFAULT '',
  description TEXT DEFAULT 'Sin definir',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ASEGURAR Y CONVERTIR COLUMNAS A TEXT PARA SOPORTAR Sin definir SIN ERRORES DE TIPO
DO $$ 
BEGIN
  -- A. Modificar columna stock a TEXT (elimina restricción NOT NULL si existía)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='stock') THEN
    ALTER TABLE public.products ALTER COLUMN stock TYPE TEXT USING stock::text;
    ALTER TABLE public.products ALTER COLUMN stock DROP NOT NULL;
    ALTER TABLE public.products ALTER COLUMN stock SET DEFAULT '0';
  ELSE
    ALTER TABLE public.products ADD COLUMN stock TEXT DEFAULT '0';
  END IF;

  -- B. Modificar/agregar cost_price y costPrice
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='cost_price') THEN
    ALTER TABLE public.products ALTER COLUMN cost_price TYPE TEXT USING cost_price::text;
  ELSE
    ALTER TABLE public.products ADD COLUMN cost_price TEXT DEFAULT '0';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='costprice') THEN
    ALTER TABLE public.products ALTER COLUMN costprice TYPE TEXT USING costprice::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='costPrice') THEN
    ALTER TABLE public.products ALTER COLUMN costPrice TYPE TEXT USING costPrice::text;
  ELSE
    ALTER TABLE public.products ADD COLUMN costPrice TEXT DEFAULT '0';
  END IF;

  -- C. Modificar/agregar min_stock y minStock
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='min_stock') THEN
    ALTER TABLE public.products ALTER COLUMN min_stock TYPE TEXT USING min_stock::text;
  ELSE
    ALTER TABLE public.products ADD COLUMN min_stock TEXT DEFAULT '5';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='minstock') THEN
    ALTER TABLE public.products ALTER COLUMN minstock TYPE TEXT USING minstock::text;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='minStock') THEN
    ALTER TABLE public.products ALTER COLUMN minStock TYPE TEXT USING minStock::text;
  ELSE
    ALTER TABLE public.products ADD COLUMN minStock TEXT DEFAULT '5';
  END IF;

  -- D. Columnas opcionales de compatibilidad frontend (camelCase y snake_case)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='original_price') THEN
    ALTER TABLE public.products ADD COLUMN original_price NUMERIC;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='originalPrice') THEN
    ALTER TABLE public.products ADD COLUMN originalPrice NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_popular') THEN
    ALTER TABLE public.products ADD COLUMN is_popular BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='isPopular') THEN
    ALTER TABLE public.products ADD COLUMN isPopular BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='is_active') THEN
    ALTER TABLE public.products ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='isActive') THEN
    ALTER TABLE public.products ADD COLUMN isActive BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='code') THEN
    ALTER TABLE public.products ADD COLUMN code TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='description') THEN
    ALTER TABLE public.products ADD COLUMN description TEXT DEFAULT 'Sin definir';
  END IF;
END $$;

-- 3. FUNCIÓN RPC: DESCUENTO DE STOCK SEGURO COMPATIBLE CON VALORES NUMÉRICOS Y Sin definir
CREATE OR REPLACE FUNCTION decrement_stock(product_id TEXT, quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET 
    stock = CASE 
      -- Si el stock contiene solo números, se descuenta de forma segura
      WHEN stock ~ '^[0-9]+$' THEN GREATEST(0, (stock::int - quantity))::text
      -- Si es Sin definir u otro texto, se conserva intacto
      ELSE stock 
    END,
    updated_at = NOW()
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNCIÓN RPC: ACTUALIZACIÓN DE get_merchant_cockpit_kpis PARA STOCK TEXTUAL
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

  -- Conteo seguro de productos en bajo stock (ignora Sin definir)
  SELECT COUNT(*)
  INTO v_low_stock_count
  FROM public.products
  WHERE tenant_id = p_tenant_id
    AND stock ~ '^[0-9]+$'
    AND stock::int <= CASE 
      WHEN min_stock ~ '^[0-9]+$' THEN min_stock::int 
      ELSE 5 
    END;

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

-- 5. POLÍTICAS RLS (Garantiza lectura y guardado masivo en Supabase)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de productos" ON public.products;
DROP POLICY IF EXISTS "Gestión de productos por dueño" ON public.products;
DROP POLICY IF EXISTS "Gestión total de productos" ON public.products;

-- Permitir lectura a todos (clientes y dueños)
CREATE POLICY "Lectura pública de productos" ON public.products 
  FOR SELECT USING (true);

-- Permitir creación, edición y carga masiva
CREATE POLICY "Gestión total de productos" ON public.products 
  FOR ALL USING (true) WITH CHECK (true);

-- 6. REFRESCAR CACHÉ DE ESQUEMA DE SUPABASE POSTGREST
NOTIFY pgrst, 'reload schema';
