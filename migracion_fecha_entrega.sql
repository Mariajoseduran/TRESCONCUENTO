-- Migración: agrega fecha límite de entrega a las producciones.
-- Cómo usarlo: Supabase -> SQL Editor -> pega esto -> Run.
-- Solo agrega una columna nueva; no afecta nada de lo que ya tienes.

alter table movimientos add column if not exists fecha_entrega date;
