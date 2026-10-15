-- ==============================================================================
-- MarketSaaS: SCRIPT MAESTRO DE BLINDAJE DE SEGURIDAD, POLÍTICAS RLS Y AISLAMIENTO
-- ==============================================================================
-- Ubicación: Supabase Dashboard -> SQL Editor -> New Query -> Pegar y Ejecutar ("Run")
--
-- ESTE SCRIPT RESUELVE DEFINITIVAMENTE:
-- 1. Fuga de datos personales (PII) en pedidos (orders): solo el comerciante o el cliente con su ID puede verlos.
-- 2. Edición o eliminación no autorizada de productos (products): solo el dueño legítimo de la tienda puede alterar su catálogo.
-- 3. Secuestro de tiendas (store_config): solo el usuario autenticado titular puede modificar su configuración.
-- 4. Manipulación o espionaje en proveedores (suppliers) y deudores/fiados (credit_customers): elimina accesos residuales por 'default'.
-- 5. Filtración de códigos de suscripción (subscription_codes): acceso restringido exclusivamente a SuperAdmin y canje atómico por RPC segura.
-- 6. Puerta trasera en recuperación de contraseña: se revoca el permiso de anon a funciones que comprometían auth.users con teléfonos comerciales públicos.
-- 7. Funciones RPC críticas blindadas con verificación estricta de pertenencia (auth.uid()).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. GARANTIZAR COLUMNAS Y TIPOS CLAVE MULTI-TENANT
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.store_config ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.product_requests ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.suppliers ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';
ALTER TABLE IF EXISTS public.credit_customers ADD COLUMN IF NOT EXISTS tenant_id TEXT DEFAULT 'default';

-- Limpieza de posibles registros residuales de auditoría o testing
DELETE FROM public.orders WHERE id::text LIKE 'TEST-%';
DELETE FROM public.products WHERE id::text LIKE 'fake-%';

-- ------------------------------------------------------------------------------
-- 1. HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.store_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credit_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscription_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recovery_attempts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. PURGA COMPLETA DE POLÍTICAS ANTERIORES PARA EVITAR COLISIONES
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN (
        'store_config', 'products', 'orders', 'product_requests', 
        'customer_profile', 'customer_points', 'suppliers', 
        'credit_customers', 'subscription_codes', 'recovery_attempts'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS PARA STORE_CONFIG (Configuración de Tienda)
-- ------------------------------------------------------------------------------
-- A) Lectura Pública: Clientes y vecinos necesitan ver datos del catálogo, banner y horarios
CREATE POLICY "store_config_public_read" 
ON public.store_config 
FOR SELECT 
USING (true);

-- B) Creación de Tienda: Solo usuarios autenticados vinculando su propio owner_id
CREATE POLICY "store_config_owner_insert" 
ON public.store_config 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (owner_id::text = auth.uid()::text OR owner_id IS NULL)
);

-- C) Edición de Tienda: Estrictamente el titular autenticado
CREATE POLICY "store_config_owner_update" 
ON public.store_config 
FOR UPDATE 
USING (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
) 
WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
);

-- D) Eliminación de Tienda: Estrictamente el titular autenticado
CREATE POLICY "store_config_owner_delete" 
ON public.store_config 
FOR DELETE 
USING (
  auth.role() = 'authenticated' AND auth.uid()::text = owner_id::text
);

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS PARA PRODUCTS (Catálogo e Inventario)
-- ------------------------------------------------------------------------------
-- A) Lectura Pública: Vecinos y clientes consultan productos
CREATE POLICY "products_public_read" 
ON public.products 
FOR SELECT 
USING (true);

-- B) Inserción: Solo el comerciante titular de la tienda
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

-- C) Edición: Solo el comerciante titular de la tienda
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

-- D) Eliminación: Solo el comerciante titular de la tienda
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

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS PARA ORDERS (Pedidos y Ventas - Máxima Protección de PII)
-- ------------------------------------------------------------------------------
-- A) Creación de pedidos: Clientes y vecinos pueden enviar órdenes libremente
CREATE POLICY "orders_customer_insert" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- B) Lectura Privada:
--    - El dueño de la tienda puede consultar todas las órdenes de su comercio.
--    - El cliente anónimo SOLO puede ver el pedido puntual que está rastreando vía header 'x-order-id'.
--    - Se bloquea completamente el listado masivo no autorizado.
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

-- C) Actualización: Solo el dueño de la tienda
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

-- D) Eliminación: Solo el dueño de la tienda
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

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS PARA PRODUCT_REQUESTS (Buzón Vecinal)
-- ------------------------------------------------------------------------------
CREATE POLICY "product_requests_select" ON public.product_requests FOR SELECT USING (true);
CREATE POLICY "product_requests_insert" ON public.product_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "product_requests_owner_update" ON public.product_requests FOR UPDATE USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);
CREATE POLICY "product_requests_owner_delete" ON public.product_requests FOR DELETE USING (
  auth.role() = 'authenticated' 
  AND auth.uid()::text IN (
    SELECT sc.owner_id::text 
    FROM public.store_config sc 
    WHERE sc.id::text = product_requests.tenant_id::text OR sc.tenant_id::text = product_requests.tenant_id::text
  )
);

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS PARA CUSTOMER_PROFILE Y CUSTOMER_POINTS
-- ------------------------------------------------------------------------------
CREATE POLICY "customer_profile_self_manage" 
ON public.customer_profile 
FOR ALL 
USING (auth.role() = 'authenticated' AND auth.uid()::text = id::text) 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid()::text = id::text);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_points') THEN
    EXECUTE '
      CREATE POLICY "customer_points_select" 
      ON public.customer_points 
      FOR SELECT 
      USING (
        auth.role() = ''authenticated'' 
        AND (
          auth.uid()::text = customer_id::text
          OR auth.uid()::text IN (
            SELECT sc.owner_id::text 
            FROM public.store_config sc 
            WHERE sc.id::text = customer_points.tenant_id::text OR sc.tenant_id::text = customer_points.tenant_id::text
          )
        )
      );
      CREATE POLICY "customer_points_owner_manage" 
      ON public.customer_points 
      FOR ALL 
      USING (
        auth.role() = ''authenticated'' 
        AND auth.uid()::text IN (
          SELECT sc.owner_id::text 
          FROM public.store_config sc 
          WHERE sc.id::text = customer_points.tenant_id::text OR sc.tenant_id::text = customer_points.tenant_id::text
        )
      );
    ';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS PARA SUPPLIERS Y CREDIT_CUSTOMERS (Gestión de Proveedores y Fiados)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'suppliers') THEN
    EXECUTE '
      CREATE POLICY "suppliers_owner_manage" 
      ON public.suppliers 
      FOR ALL 
      USING (
        auth.role() = ''authenticated'' 
        AND auth.uid()::text IN (
          SELECT sc.owner_id::text 
          FROM public.store_config sc 
          WHERE sc.id::text = suppliers.tenant_id::text OR sc.tenant_id::text = suppliers.tenant_id::text
        )
      )
      WITH CHECK (
        auth.role() = ''authenticated'' 
        AND auth.uid()::text IN (
          SELECT sc.owner_id::text 
          FROM public.store_config sc 
          WHERE sc.id::text = suppliers.tenant_id::text OR sc.tenant_id::text = suppliers.tenant_id::text
        )
      );
    ';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'credit_customers') THEN
    EXECUTE '
      CREATE POLICY "credit_customers_owner_manage" 
      ON public.credit_customers 
      FOR ALL 
      USING (
        auth.role() = ''authenticated'' 
        AND auth.uid()::text IN (
          SELECT sc.owner_id::text 
          FROM public.store_config sc 
          WHERE sc.id::text = credit_customers.tenant_id::text OR sc.tenant_id::text = credit_customers.tenant_id::text
        )
      )
      WITH CHECK (
        auth.role() = ''authenticated'' 
        AND auth.uid()::text IN (
          SELECT sc.owner_id::text 
          FROM public.store_config sc 
          WHERE sc.id::text = credit_customers.tenant_id::text OR sc.tenant_id::text = credit_customers.tenant_id::text
        )
      );
    ';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 9. POLÍTICAS PARA SUBSCRIPTION_CODES (Blindaje Máximo de Licencias)
-- ------------------------------------------------------------------------------
-- Solo SuperAdmin (vía JWT app_metadata o credencial maestra autenticada) puede consultar o administrar códigos directamente
CREATE POLICY "subscription_codes_superadmin_all" 
ON public.subscription_codes 
FOR ALL 
USING (
  auth.role() = 'authenticated' 
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
    OR (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
  )
)
WITH CHECK (
  auth.role() = 'authenticated' 
  AND (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
    OR (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
  )
);

-- ------------------------------------------------------------------------------
-- 10. RPC SEGURA: CANJE ATÓMICO DE CÓDIGO DE SUSCRIPCIÓN (redeem_subscription_license)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_subscription_license(
  p_code TEXT,
  p_store_id TEXT,
  p_store_name TEXT DEFAULT '',
  p_email TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_code_record public.subscription_codes%ROWTYPE;
  v_is_store_owner BOOLEAN := false;
  v_is_superadmin BOOLEAN := false;
  v_clean_code TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_duration_mins INT;
BEGIN
  -- 1. Validar autenticación
  IF auth.role() != 'authenticated' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Debes iniciar sesión para canjear un código de activación.');
  END IF;

  -- 2. Limpieza de código
  v_clean_code := UPPER(TRIM(p_code));
  IF v_clean_code IS NULL OR v_clean_code = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'El código de activación no puede estar vacío.');
  END IF;

  -- 3. Validar si el usuario es dueño de la tienda o SuperAdmin
  SELECT EXISTS (
    SELECT 1 FROM public.store_config sc 
    WHERE (sc.id::text = p_store_id::text OR sc.tenant_id::text = p_store_id::text)
      AND sc.owner_id::text = auth.uid()::text
  ) INTO v_is_store_owner;

  SELECT (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin'
    OR (auth.jwt() ->> 'email') IN ('superadmin@marketsaas.com', 'admin@marketsaas.com')
  ) INTO v_is_superadmin;

  IF NOT v_is_store_owner AND NOT v_is_superadmin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Acceso denegado: No tienes autorización para gestionar la suscripción de esta tienda.');
  END IF;

  -- 4. Localizar código en tabla subscription_codes con bloqueo de fila para concurrencia
  SELECT * INTO v_code_record
  FROM public.subscription_codes
  WHERE code = v_clean_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'El código ingresado no existe o no es válido.');
  END IF;

  IF v_code_record.status = 'redeemed' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'message', format('Este código ya fue canjeado previamente por la tienda "%s".', COALESCE(v_code_record.redeemed_by_store_name, v_code_record.redeemed_by_store_id))
    );
  END IF;

  IF v_code_record.status = 'revoked' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Este código ha sido revocado o deshabilitado.');
  END IF;

  -- 5. Calcular duración a sumar
  v_duration_mins := (COALESCE(v_code_record.duration_days, 0) * 1440) + COALESCE(v_code_record.duration_minutes, 0);
  IF v_duration_mins <= 0 THEN
    v_duration_mins := 43200; -- 30 días fallback
  END IF;

  -- 6. Marcar código como canjeado atómicamente
  UPDATE public.subscription_codes
  SET status = 'redeemed',
      redeemed_at = v_now,
      redeemed_by_email = COALESCE(NULLIF(p_email, ''), auth.jwt() ->> 'email'),
      redeemed_by_store_id = p_store_id,
      redeemed_by_store_name = p_store_name
  WHERE id = v_code_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'plan_name', v_code_record.plan_name,
    'duration_days', v_code_record.duration_days,
    'duration_minutes', v_duration_mins,
    'message', 'Código canjeado exitosamente.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_subscription_license(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 11. BLINDAJE DE FUNCIONES RPC DEL PANEL COMERCIANTE (Verificación estricta auth.uid())
-- ------------------------------------------------------------------------------

-- RPC: update_order_stage (Cambio de estado de orden)
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

-- RPC: get_merchant_cockpit_kpis (KPIs Financieros y de Ventas)
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
  SELECT EXISTS (
    SELECT 1 FROM public.store_config sc 
    WHERE (sc.id::text = p_tenant_id::text OR sc.tenant_id::text = p_tenant_id::text)
      AND sc.owner_id::text = auth.uid()::text
  ) INTO v_is_owner;

  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'Acceso denegado: Solo el comerciante titular puede consultar sus métricas y ventas.';
  END IF;

  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO v_total_sales, v_order_count
  FROM public.orders
  WHERE tenant_id::text = p_tenant_id::text
    AND status != 'cancelled'
    AND created_at >= v_today_start;

  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'preparing'),
    COUNT(*) FILTER (WHERE status = 'on_the_way')
  INTO v_active_count, v_pending_count, v_preparing_count, v_shipping_count
  FROM public.orders
  WHERE tenant_id::text = p_tenant_id::text
    AND status IN ('pending', 'preparing', 'on_the_way');

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

-- RPC: quick_adjust_stock (Ajuste rápido de inventario)
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

-- RPC: get_order_tracking (Rastreo individual seguro para clientes anónimos sin exponer tabla orders)
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF p_order_id IS NULL OR LENGTH(TRIM(p_order_id)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id::text = TRIM(p_order_id);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_order);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_tracking(TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 12. REVOCACIÓN DE SEGURIDAD: RECUPERACIÓN DE CONTRASEÑA NO AUTORIZADA
-- ------------------------------------------------------------------------------
-- Se revoca el permiso de anon sobre la función que permitía alterar contraseñas usando teléfonos de tiendas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reset_password_with_phone') THEN
    REVOKE EXECUTE ON FUNCTION public.reset_password_with_phone(TEXT, TEXT, TEXT) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_user_phone') THEN
    REVOKE EXECUTE ON FUNCTION public.verify_user_phone(TEXT, TEXT) FROM anon;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 13. CONSTRAINTS DE INTEGRIDAD Y PREVENCIÓN DE MANIPULACIÓN DE PRECIOS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- Validar que pedidos no tengan montos negativos
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_positive_total') THEN
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_positive_total CHECK (total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_positive_subtotal') THEN
    ALTER TABLE public.orders ADD CONSTRAINT chk_orders_positive_subtotal CHECK (subtotal >= 0);
  END IF;

  -- Validar que productos no tengan precios negativos
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_positive_price') THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_positive_price CHECK (price >= 0);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 13. ÍNDICES DE ALTO RENDIMIENTO Y AISLAMIENTO MULTI-TENANT
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_tenant_owner ON public.orders(tenant_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_config_owner ON public.store_config(owner_id);

COMMENT ON TABLE public.store_config IS 'Configuración multi-tenant blindada: Solo el dueño autenticado puede modificar su tienda';
COMMENT ON TABLE public.products IS 'Inventario multi-tenant blindado: Solo el comerciante titular puede insertar, modificar o eliminar productos';
COMMENT ON TABLE public.orders IS 'Pedidos multi-tenant con protección estricta de PII: Aislamiento total por dueño y rastreo individual seguro';
