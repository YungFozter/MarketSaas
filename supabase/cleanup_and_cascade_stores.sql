-- ==============================================================================
-- LIMPIEZA DE TIENDAS HUÉRFANAS Y CASCADA AUTOMÁTICA AL BORRAR DUEÑOS
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (Dashboard -> SQL Editor)

-- 1. LIMPIAR TIENDAS HUÉRFANAS EXISTENTES
-- Borra de store_config cualquier tienda cuyo owner_id ya no exista en auth.users
DELETE FROM public.orders
WHERE tenant_id IN (
  SELECT id FROM public.store_config 
  WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM auth.users)
);

DELETE FROM public.products
WHERE tenant_id IN (
  SELECT id FROM public.store_config 
  WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM auth.users)
);

DELETE FROM public.product_requests
WHERE tenant_id IN (
  SELECT id FROM public.store_config 
  WHERE owner_id IS NOT NULL AND owner_id NOT IN (SELECT id FROM auth.users)
);

DELETE FROM public.store_config
WHERE owner_id IS NOT NULL 
  AND owner_id NOT IN (SELECT id FROM auth.users);

-- 2. FUNCIÓN Y TRIGGER DE CASCADA AUTOMÁTICA
-- Cuando borres un usuario desde Supabase Auth (Dashboard -> Authentication -> Users),
-- se liberarán automáticamente su tienda, nombre y slug, además de sus productos.
CREATE OR REPLACE FUNCTION public.cascade_delete_user_store()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Borrar órdenes de las tiendas del usuario eliminado
  DELETE FROM public.orders
  WHERE tenant_id IN (SELECT id FROM public.store_config WHERE owner_id = OLD.id);

  -- B. Borrar productos de las tiendas del usuario eliminado
  DELETE FROM public.products
  WHERE tenant_id IN (SELECT id FROM public.store_config WHERE owner_id = OLD.id);

  -- C. Borrar peticiones de las tiendas del usuario eliminado
  DELETE FROM public.product_requests
  WHERE tenant_id IN (SELECT id FROM public.store_config WHERE owner_id = OLD.id);

  -- D. Borrar la tienda de store_config (libera el nombre y slug para ser reutilizados)
  DELETE FROM public.store_config
  WHERE owner_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REGISTRAR TRIGGER EN auth.users
DROP TRIGGER IF EXISTS tr_cascade_delete_user_store ON auth.users;
CREATE TRIGGER tr_cascade_delete_user_store
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_delete_user_store();

-- 4. VERIFICACIÓN FINAL: TIENDAS ACTIVAS RESTANTES
SELECT id AS slug, name AS tienda, owner_id 
FROM public.store_config;
