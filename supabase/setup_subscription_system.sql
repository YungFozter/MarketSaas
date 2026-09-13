-- ==============================================================================
-- SCRIPT: SISTEMA DE SUSCRIPCIONES Y CONTROL DE ACCESO
-- MarketSaaS - Supabase Schema & Row-Level Security (RLS)
-- ==============================================================================

-- 1. TABLA: subscription_codes (Códigos de Activación y Licencias de Tiendas)
CREATE TABLE IF NOT EXISTS public.subscription_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  duration_days INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL DEFAULT 0,
  plan_name TEXT NOT NULL DEFAULT 'Premium',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'redeemed', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_email TEXT,
  redeemed_by_store_id TEXT,
  redeemed_by_store_name TEXT,
  notes TEXT
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS duration_days INT NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS duration_minutes INT NOT NULL DEFAULT 0;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS plan_name TEXT NOT NULL DEFAULT 'Premium';
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_by_email TEXT;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_by_store_id TEXT;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS redeemed_by_store_name TEXT;
ALTER TABLE public.subscription_codes ADD COLUMN IF NOT EXISTS notes TEXT;

-- Índices de alto rendimiento para búsquedas y canjes
CREATE INDEX IF NOT EXISTS idx_subscription_codes_code ON public.subscription_codes(code);
CREATE INDEX IF NOT EXISTS idx_subscription_codes_status ON public.subscription_codes(status);
CREATE INDEX IF NOT EXISTS idx_subscription_codes_store ON public.subscription_codes(redeemed_by_store_id);
CREATE INDEX IF NOT EXISTS idx_subscription_codes_created ON public.subscription_codes(created_at DESC);

-- 2. HABILITAR SEGURIDAD POR FILA (RLS)
ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas anteriores para evitar duplicaciones
DROP POLICY IF EXISTS "Permitir lectura publica de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir insercion de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir actualizacion de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "Permitir eliminacion de codigos" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_select" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_insert" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_update" ON public.subscription_codes;
DROP POLICY IF EXISTS "subscription_codes_delete" ON public.subscription_codes;

-- Política 1: Lectura completa (necesaria para validar códigos al canjear y para el panel SuperAdmin)
CREATE POLICY "subscription_codes_select"
ON public.subscription_codes
FOR SELECT
USING (true);

-- Política 2: Inserción de códigos (SuperAdmin y generación de licencias)
CREATE POLICY "subscription_codes_insert"
ON public.subscription_codes
FOR INSERT
WITH CHECK (true);

-- Política 3: Actualización de códigos (al ser canjeados por una tienda)
CREATE POLICY "subscription_codes_update"
ON public.subscription_codes
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política 4: Eliminación de códigos (SuperAdmin para códigos generados por error)
CREATE POLICY "subscription_codes_delete"
ON public.subscription_codes
FOR DELETE
USING (true);

-- Comentario informativo
COMMENT ON TABLE public.subscription_codes IS 'Tabla de control de licencias, códigos de activación y auditoría de suscripciones para tiendas MarketSaaS';
