-- ==============================================================================
-- SCRIPT: SETUP Y SINCRONIZACIÓN DE PROVEEDORES Y LIBRETA DE DEUDORES (FIAOS)
-- MercadoSaaS - Persistencia multi-tenant independiente, seguridad RLS y Realtime
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Ve a tu panel de Supabase (https://supabase.com/dashboard)
-- 2. Selecciona tu proyecto
-- 3. En el menú lateral izquierdo, haz clic en "SQL Editor"
-- 4. Haz clic en "+ New Query", pega todo este código y presiona "Run" (Ctrl + Enter)
-- ==============================================================================

-- ==============================================================================
-- PARTE 1: TABLA DE PROVEEDORES (suppliers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  contact_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  category TEXT DEFAULT 'Otros',
  visit_days JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  order_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_name TEXT DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Otros';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS visit_days JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON public.suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_suppliers_created ON public.suppliers(created_at DESC);

-- Habilitar Row Level Security (RLS) en suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "suppliers_select_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete_owner" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;

-- Políticas de aislamiento por tienda para suppliers
CREATE POLICY "suppliers_select_owner" 
ON public.suppliers 
FOR SELECT 
USING (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

CREATE POLICY "suppliers_insert_owner" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

CREATE POLICY "suppliers_update_owner" 
ON public.suppliers 
FOR UPDATE 
USING (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
)
WITH CHECK (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);

CREATE POLICY "suppliers_delete_owner" 
ON public.suppliers 
FOR DELETE 
USING (
  suppliers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = suppliers.tenant_id::text 
         OR sc.tenant_id::text = suppliers.tenant_id::text
    )
  )
);


-- ==============================================================================
-- PARTE 2: TABLA DE DEUDORES / LIBRETA DE CRÉDITOS (credit_customers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.credit_customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  apartment TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  balance NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  transactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS apartment TEXT DEFAULT '';
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS balance NUMERIC(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS transactions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.credit_customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_credit_customers_tenant ON public.credit_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_customers_balance ON public.credit_customers(tenant_id, balance);
CREATE INDEX IF NOT EXISTS idx_credit_customers_created ON public.credit_customers(created_at DESC);

-- Habilitar Row Level Security (RLS) en credit_customers
ALTER TABLE public.credit_customers ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "credit_customers_select_owner" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_insert_owner" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_update_owner" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_delete_owner" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_select" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_insert" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_update" ON public.credit_customers;
DROP POLICY IF EXISTS "credit_customers_delete" ON public.credit_customers;

-- Políticas de aislamiento por tienda para credit_customers
CREATE POLICY "credit_customers_select_owner" 
ON public.credit_customers 
FOR SELECT 
USING (
  credit_customers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = credit_customers.tenant_id::text 
         OR sc.tenant_id::text = credit_customers.tenant_id::text
    )
  )
);

CREATE POLICY "credit_customers_insert_owner" 
ON public.credit_customers 
FOR INSERT 
WITH CHECK (
  credit_customers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = credit_customers.tenant_id::text 
         OR sc.tenant_id::text = credit_customers.tenant_id::text
    )
  )
);

CREATE POLICY "credit_customers_update_owner" 
ON public.credit_customers 
FOR UPDATE 
USING (
  credit_customers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = credit_customers.tenant_id::text 
         OR sc.tenant_id::text = credit_customers.tenant_id::text
    )
  )
)
WITH CHECK (
  credit_customers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = credit_customers.tenant_id::text 
         OR sc.tenant_id::text = credit_customers.tenant_id::text
    )
  )
);

CREATE POLICY "credit_customers_delete_owner" 
ON public.credit_customers 
FOR DELETE 
USING (
  credit_customers.tenant_id = 'default' 
  OR (
    auth.role() = 'authenticated' 
    AND auth.uid() IN (
      SELECT sc.owner_id 
      FROM public.store_config sc 
      WHERE sc.id::text = credit_customers.tenant_id::text 
         OR sc.tenant_id::text = credit_customers.tenant_id::text
    )
  )
);


-- ==============================================================================
-- PARTE 3: PUBLICACIÓN EN TIEMPO REAL (Supabase Realtime)
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'suppliers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'credit_customers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_customers;
  END IF;
END $$;
