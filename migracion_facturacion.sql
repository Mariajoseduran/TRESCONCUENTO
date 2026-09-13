-- Migración: agrega precio de confección, entregas y facturación con firma.
-- Cómo usarlo: Supabase -> SQL Editor -> pega todo esto -> Run.
-- Es seguro correrlo aunque ya tengas datos: solo agrega columnas y tablas nuevas.

-- Precio de confección por prenda (lo que se le paga al taller por unidad)
alter table prendas add column if not exists precio_confeccion numeric default 0;

-- Datos de cobro y entrega en cada movimiento de producción
alter table movimientos add column if not exists unidades numeric;
alter table movimientos add column if not exists precio_unitario numeric;
alter table movimientos add column if not exists monto numeric;
alter table movimientos add column if not exists entregado boolean default false;
alter table movimientos add column if not exists entregado_at timestamptz;

-- Facturas: agrupan producciones entregadas de un taller para cobrar de una vez
create table if not exists facturas (
  id uuid primary key default gen_random_uuid(),
  taller_id uuid references talleres(id) on delete cascade,
  fecha timestamptz default now(),
  total numeric default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagada')),
  firma_dibujo text,
  confirmado_nombre text,
  pagada_at timestamptz
);

alter table movimientos add column if not exists factura_id uuid references facturas(id) on delete set null;

-- Seguridad
alter table facturas enable row level security;

create policy "ver_facturas" on facturas for select
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "crear_facturas" on facturas for insert
  with check (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "actualizar_facturas" on facturas for update
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());

-- Antes no existía una política para ACTUALIZAR movimientos (solo ver y crear).
-- La necesitamos para poder marcar "entregado" y vincular la factura.
create policy "actualizar_movimientos" on movimientos for update
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());

