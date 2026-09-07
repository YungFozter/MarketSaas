-- ==============================================================================
-- MarketSaaS: BLINDAJE INTEGRAL DE SEGURIDAD Y AISLAMIENTO MULTI-TENANT (RLS)
-- Ubicación: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- 
-- OBJETIVO DEL BLINDAJE:
-- 1. Cerrar definitivamente la fuga de datos personales de clientes (PII) en 'orders'.
-- 2. Impedir que usuarios anónimos o atacantes puedan modificar o borrar productos ('products').
-- 3. Proteger la configuración de tiendas ('store_config') para que solo el dueño autenticado pueda editarla.
-- 4. Blindar las funciones RPC (KPIs financieros, control de stock y cambio de etapas).
-- 5. Compatibilidad total de tipos (Casting universal ::text para evitar 'operator does not exist: uuid = text').
-- ==============================================================================

-- 0. GARANTIZAR COLUMNAS CLAVE MULTI-TENANT (Evita fallos por columnas ausentes)
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.product_requests ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS DEL SISTEMA
ALTER TABLE IF EXISTS public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_profile ENABLE ROW LEVEL SECURITY;

-- Limpieza de posibles registros residuales de auditoría/pruebas
DELETE FROM public.orders WHERE id::text LIKE 'TEST-%';
DELETE FROM public.products WHERE id::text LIKE 'fake-%';

-- 2. PURGA TOTAL DE POLÍTICAS PREVIAS (Elimina políticas obsoletas o demasiado permisivas)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('store_config', 'products', 'orders', 'product_requests', 'customer_profile')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 3. TABLA: STORE_CONFIG (Configuración de Tiendas & Marca Blanca)
-- A) Lectura Pública: Clientes y vecinos necesitan ver nombre, logo, ubicación y catálogo.
CREATE POLICY "store_config_public_read" 
ON public.store_config 
FOR SELECT 
USING (true);

-- B) Registro de Tienda: Solo usuarios autenticados sellando su propio owner_id
CREATE POLICY "store_config_owner_insert" 
ON public.store_config 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (owner_id::text = auth.uid()::text OR owner_id IS NULL)
);

-- C) Modificación de Tienda: Estrictamente el dueño legítimo (auth.uid() = owner_id)
CREATE POLICY "store_config_owner_update" 
ON public.store_config 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
) 
WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
);

-- D) Eliminación de Tienda: Estrictamente el dueño legítimo
CREATE POLICY "store_config_owner_delete" 
ON public.store_config 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
);


-- 4. TABLA: PRODUCTS (Inventario & Catálogo)
-- A) Lectura Pública: Cualquier vecino puede consultar los productos y precios
CREATE POLICY "products_public_read" 
ON public.products 
FOR SELECT 
USING (true);

-- B) Inserción: Solo el dueño de la tienda a la que pertenece el producto
CREATE POLICY "products_owner_insert" 
ON public.products 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
);

-- C) Modificación: Solo el dueño de la tienda a la que pertenece el producto
CREATE POLICY "products_owner_update" 
ON public.products 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
)
WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
);

-- D) Eliminación: Solo el dueño de la tienda a la que pertenece el producto
CREATE POLICY "products_owner_delete" 
ON public.products 
FOR DELETE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = products.tenant_id::text OR sc.tenant_id::text = products.tenant_id::text
  )
);


-- 5. TABLA: ORDERS (Pedidos & Ventas - Máxima Protección de Privacidad)
-- A) Inserción: Cualquier vecino/cliente puede emitir una orden de compra
CREATE POLICY "orders_customer_insert" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- B) Lectura Privada:
--    1. El dueño autenticado puede ver TODAS las órdenes de su tienda.
--    2. Un cliente anónimo SOLO puede ver su pedido en curso si pasa su ID exacto vía header x-order-id.
--    3. BLOQUEO TOTAL para consultas masivas select * anónimas.
CREATE POLICY "orders_owner_and_tracking_select" 
ON public.orders 
FOR SELECT 
USING (
  (
    auth.role() = 'authenticated' 
    AND (
      auth.uid()::text = owner_id::text 
      OR auth.uid()::text IN (
        SELECT sc.owner_id::text 
        FROM public.store_config sc 
        WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
      )
    )
  )
  OR
  (
    auth.role() = 'anon' 
    AND id::text = (COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::json->>'x-order-id')::text
  )
);

-- C) Modificación de Estados: Estrictamente el dueño de la tienda
CREATE POLICY "orders_owner_update" 
ON public.orders 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' 
  AND (
    auth.uid()::text = owner_id::text 
    OR auth.uid()::text IN (
      SELECT sc.owner_id::text 
      FROM public.store_config sc 
      WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
    )
  )
) 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (
    auth.uid()::text = owner_id::text 
    OR auth.uid()::text IN (
      SELECT sc.owner_id::text 
      FROM public.store_config sc 
      WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
    )
  )
);

-- D) Eliminación de Órdenes: Estrictamente el dueño de la tienda
CREATE POLICY "orders_owner_delete" 
ON public.orders 
FOR DELETE 
USING (
  auth.role() = 'authenticated' 
  AND (
    auth.uid()::text = owner_id::text 
    OR auth.uid()::text IN (
      SELECT sc.owner_id::text 
      FROM public.store_config sc 
      WHERE sc.id::text = orders.tenant_id::text OR sc.tenant_id::text = orders.tenant_id::text
    )
  )
);


-- 6. TABLA: PRODUCT_REQUESTS (Buzón de Solicitudes Vecinales)
CREATE POLICY "product_requests_select" 
ON public.product_requests 
FOR SELECT 
USING (true);

CREATE POLICY "product_requests_insert" 
ON public.product_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "product_requests_owner_update" 
ON public.product_requests 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

CREATE POLICY "product_requests_owner_delete" 
ON public.product_requests 
FOR DELETE 
USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);


-- 7. TABLA: CUSTOMER_PROFILE
CREATE POLICY "customer_profile_self_manage" 
ON public.customer_profile 
FOR ALL 
USING (
  auth.role() = 'authenticated' AND auth.uid()::text = id::text
) 
WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid()::text = id::text
);


-- 8. TRIGGER DE INTEGRIDAD: AUTO-VINCULACIÓN DEL DUEÑO EN PEDIDOS
CREATE OR REPLACE FUNCTION public.fn_secure_order_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  NEW.updated_at := NOW();

  -- Auto-asignar el owner_id de la tienda según el tenant_id
  IF NEW.owner_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
    SELECT sc.owner_id INTO v_owner_id 
    FROM public.store_config sc 
    WHERE sc.id::text = NEW.tenant_id::text OR sc.tenant_id::text = NEW.tenant_id::text
    LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
      NEW.owner_id := v_owner_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_secure_order_assignment ON public.orders;
CREATE TRIGGER trg_secure_order_assignment
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_secure_order_assignment();


-- 9. BLINDAJE DE FUNCIONES RPC (Stored Procedures de Supabase)

-- RPC 1: Actualización de estado del pedido (Protegida para que solo el dueño pueda avanzar fases)
CREATE OR REPLACE FUNCTION update_order_stage(p_order_id TEXT, p_new_status TEXT)
RETURNS JSONB AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_is_owner BOOLEAN := false;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id::text = p_order_id::text;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado.';
  END IF;

  -- Comprobar que el usuario autenticado sea el dueño de la tienda
  SELECT EXISTS (
    SELECT 1 FROM public.store_config sc 
    WHERE (sc.id::text = v_order.tenant_id::text OR sc.tenant_id::text = v_order.tenant_id::text)
      AND sc.owner_id::text = auth.uid()::text
  ) INTO v_is_owner;

  IF NOT v_is_owner AND auth.uid()::text != v_order.owner_id::text THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el dueño de la tienda puede cambiar el estado de este pedido.';
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      updated_at = NOW()
  WHERE id::text = p_order_id::text
  RETURNING * INTO v_order;

  RETURN to_jsonb(v_order);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: KPIs del Cockpit del Dueño (Protegida contra espionaje financiero anónimo)
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
  v_is_owner BOOLEAN := false;
BEGIN
  -- Validar autorización
  SELECT EXISTS (
    SELECT 1 FROM public.store_config sc 
    WHERE (sc.id::text = p_tenant_id::text OR sc.tenant_id::text = p_tenant_id::text)
      AND sc.owner_id::text = auth.uid()::text
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el dueño de esta tienda puede consultar sus KPIs y ventas.';
  END IF;

  -- Ventas del día (órdenes completadas o no canceladas)
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO v_total_sales, v_order_count
  FROM public.orders
  WHERE tenant_id::text = p_tenant_id::text
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
  WHERE tenant_id::text = p_tenant_id::text
    AND status IN ('pending', 'preparing', 'on_the_way');

  -- Productos en stock crítico
  SELECT COUNT(*)
  INTO v_low_stock_count
  FROM public.products
  WHERE tenant_id::text = p_tenant_id::text
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

-- RPC 3: Ajuste Rápido de Stock (Protegida contra manipulación de inventario)
CREATE OR REPLACE FUNCTION quick_adjust_stock(product_id TEXT, delta INT)
RETURNS INT AS $$
DECLARE
  v_tenant_id TEXT;
  v_is_owner BOOLEAN := false;
  new_stock INT;
BEGIN
  SELECT tenant_id::text INTO v_tenant_id FROM public.products WHERE id::text = product_id::text;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.store_config sc 
    WHERE (sc.id::text = v_tenant_id::text OR sc.tenant_id::text = v_tenant_id::text)
      AND sc.owner_id::text = auth.uid()::text
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el dueño de la tienda puede alterar el inventario.';
  END IF;

  UPDATE public.products
  SET stock = GREATEST(0, stock + delta),
      updated_at = NOW()
  WHERE id::text = product_id::text
  RETURNING stock INTO new_stock;

  RETURN new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CREACIÓN DE ÍNDICES DE RENDIMIENTO Y CONSULTA AISLADA
CREATE INDEX IF NOT EXISTS idx_orders_tenant_owner ON public.orders(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_config_owner ON public.store_config(owner_id);
