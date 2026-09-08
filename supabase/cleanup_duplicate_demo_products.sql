-- ==============================================================================
-- MarketSaaS: LIMPIEZA DE PRODUCTOS DEMO RESIDUALES EN "MINIMARKET IAN"
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- Eliminar los 14 productos demo sembrados automáticamente al crear la tienda
-- (IDs del tipo 'minimarket-ian-prod-1' hasta 'minimarket-ian-prod-14')
-- conservando los 25 productos importados reales y los creados manualmente por el dueño:
DELETE FROM public.products 
WHERE tenant_id = 'minimarket-ian' 
  AND id ~ '^minimarket-ian-prod-([1-9]|1[0-4])$';

-- Verificar el conteo resultante de productos limpios:
SELECT count(*) AS total_productos_reales 
FROM public.products 
WHERE tenant_id = 'minimarket-ian';
