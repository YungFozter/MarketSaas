-- ==============================================================================
-- MarketSaaS: Script SQL de Aislamiento Multi-Tenant y Seguridad para Ventas (Orders)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- 
-- OBJETIVO:
-- 1. Garantizar que cada venta se guarde con el tenant_id y owner_id correspondiente.
-- 2. Asegurar que ningún dueño pueda ver, editar o mezclar las ventas de otro dueño.
-- 3. Permitir que clientes de la web puedan registrar pedidos en la tienda correspondiente.
-- 4. Optimizar las consultas del Historial de Ventas con índices compuestos.
-- ==============================================================================

-- 1. ASEGURAR COLUMNAS DE TENANT Y DUEÑO EN LA TABLA ORDERS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS couponCode TEXT;

-- 2. FUNCIÓN Y TRIGGER PARA AUTO-ASIGNAR EL DUEÑO (owner_id) DE LA TIENDA
-- Si entra una venta sin owner_id (ej. pedido web de un cliente o venta offline sincronizada),
-- el trigger busca automáticamente al dueño en store_config y lo sella en la fila.
CREATE OR REPLACE FUNCTION public.fn_assign_order_tenant_owner()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
BEGIN
  -- Garantizar fechas consistentes
  IF NEW.created_at IS NULL THEN
    NEW.created_at := COALESCE(NEW."createdAt", NOW());
  END IF;
  NEW."createdAt" := NEW.created_at;
  NEW.updated_at := NOW();

  -- Si no tiene owner_id, buscarlo en store_config usando el tenant_id
  IF NEW.owner_id IS NULL AND NEW.tenant_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id 
    FROM public.store_config 
    WHERE id = NEW.tenant_id OR tenant_id = NEW.tenant_id
    LIMIT 1;

    IF v_owner_id IS NOT NULL THEN
      NEW.owner_id := v_owner_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asociar el Trigger antes de insertar cada venta
DROP TRIGGER IF EXISTS trg_assign_order_tenant_owner ON public.orders;
CREATE TRIGGER trg_assign_order_tenant_owner
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_assign_order_tenant_owner();

-- 3. REGULARIZAR (BACKFILL) VENTAS HISTÓRICAS EXISTENTES
-- Si existen ventas pasadas sin owner_id, las vinculamos a su tienda correspondiente
UPDATE public.orders o
SET owner_id = sc.owner_id
FROM public.store_config sc
WHERE o.owner_id IS NULL 
  AND (sc.id = o.tenant_id OR sc.tenant_id = o.tenant_id)
  AND sc.owner_id IS NOT NULL;

-- 4. HABILITAR ROW LEVEL SECURITY (RLS) EN LA TABLA ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores de pedidos
DROP POLICY IF EXISTS "Lectura de pedidos por el dueño de la tienda" ON public.orders;
DROP POLICY IF EXISTS "Inserción de pedidos por clientes" ON public.orders;
DROP POLICY IF EXISTS "Actualización de pedidos por el dueño de la tienda" ON public.orders;
DROP POLICY IF EXISTS "Permitir acceso público total a pedidos" ON public.orders;
DROP POLICY IF EXISTS "orders_select_owner_only" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_owner_only" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_owner_only" ON public.orders;

-- 5. POLÍTICAS DE AISLAMIENTO ESTRICTAS (RLS)

-- A) LECTURA: Un dueño autenticado SOLO puede ver las ventas de su propia tienda.
--    Un cliente anónimo solo puede consultar un pedido específico si tiene el ID exacto (para tracking).
CREATE POLICY "orders_select_owner_only" ON public.orders
FOR SELECT
USING (
  -- Caso 1: El usuario autenticado es el dueño directo registrado en la venta
  (auth.role() = 'authenticated' AND auth.uid() = owner_id)
  OR
  -- Caso 2: El usuario autenticado es el dueño de la tienda (según store_config)
  (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id OR store_config.tenant_id = orders.tenant_id
  ))
  OR
  -- Caso 3: Consulta anónima para seguimiento de pedido en curso (Tracking por ID exacto)
  (auth.role() = 'anon' AND id = current_setting('request.headers', true)::json->>'x-order-id')
);

-- B) INSERCIÓN: 
--    - Clientes pueden registrar pedidos en cualquier tienda siempre que especifiquen el tenant_id.
--    - Dueños autenticados pueden registrar ventas POS en su propia tienda.
CREATE POLICY "orders_insert_policy" ON public.orders
FOR INSERT
WITH CHECK (
  -- Venta POS por Dueño autenticado en su tienda
  (auth.role() = 'authenticated' AND (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id OR store_config.tenant_id = orders.tenant_id
    )
  ))
  OR
  -- Pedido web de cliente (anónimo o comprador registrado)
  (tenant_id IS NOT NULL AND tenant_id <> '')
);

-- C) ACTUALIZACIÓN: Solo el dueño de la tienda puede cambiar el estado de sus pedidos/ventas.
CREATE POLICY "orders_update_owner_only" ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = owner_id OR
  auth.uid() IN (
    SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id OR store_config.tenant_id = orders.tenant_id
  )
)
WITH CHECK (
  auth.uid() = owner_id OR
  auth.uid() IN (
    SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id OR store_config.tenant_id = orders.tenant_id
  )
);

-- D) ELIMINACIÓN: Solo el dueño de la tienda puede eliminar ventas/pedidos de su propia tienda.
CREATE POLICY "orders_delete_owner_only" ON public.orders
FOR DELETE
TO authenticated
USING (
  auth.uid() = owner_id OR
  auth.uid() IN (
    SELECT owner_id FROM public.store_config WHERE store_config.id = orders.tenant_id OR store_config.tenant_id = orders.tenant_id
  )
);

-- 6. ÍNDICES DE ALTO RENDIMIENTO PARA CONSULTAS DEL HISTORIAL
-- Aceleran búsquedas por fecha, filtros por tienda y arqueos de caja
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created 
ON public.orders (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_owner_created 
ON public.orders (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status 
ON public.orders (status);

-- 7. REPLICACIÓN EN TIEMPO REAL (Realtime)
-- Permite que las nuevas ventas aparezcan en vivo en el Kanban y en el Historial de Ventas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- Mensaje de confirmación en la consola de Supabase
SELECT 'Aislamiento multi-tenant de ventas y políticas RLS configuradas exitosamente.' AS resultado;
