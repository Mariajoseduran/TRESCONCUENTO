-- Esquema completo: control de inventario multi-taller con login por
-- empleado, roles, fotos y colecciones.
-- Cómo usarlo: Supabase -> SQL Editor -> pega todo este archivo -> Run.

create extension if not exists pgcrypto;

-- ============ TABLAS PRINCIPALES ============

create table if not exists talleres (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text,
  created_at timestamptz default now()
);

create table if not exists colecciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  temporada text,
  created_at timestamptz default now()
);

create table if not exists insumos (
  id uuid primary key default gen_random_uuid(),
  taller_id uuid references talleres(id) on delete cascade,
  tipo text not null,
  nombre text not null,
  color text,
  cantidad numeric default 0,
  unidad text default 'und',
  stock_minimo numeric default 0,
  foto_url text,
  created_at timestamptz default now()
);

create table if not exists prendas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  coleccion_id uuid references colecciones(id) on delete set null,
  precio_confeccion numeric default 0,
  consumos jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists prendas_stock (
  id uuid primary key default gen_random_uuid(),
  prenda_id uuid references prendas(id) on delete cascade,
  taller_id uuid references talleres(id) on delete cascade,
  talla text not null,
  cantidad numeric default 0,
  unique (prenda_id, taller_id, talla)
);

create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha timestamptz default now(),
  tipo text not null,
  taller_id uuid references talleres(id) on delete set null,
  prenda_id uuid references prendas(id) on delete set null,
  detalle text,
  items jsonb default '[]',
  unidades numeric,
  precio_unitario numeric,
  monto numeric,
  entregado boolean default false,
  entregado_at timestamptz,
  fecha_entrega date,
  factura_id uuid
);

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

alter table movimientos add constraint movimientos_factura_id_fkey
  foreign key (factura_id) references facturas(id) on delete set null;

-- Perfiles: vincula cada usuario que inicia sesión con su rol y su taller.
-- 'gerencia' ve y administra todo. 'taller' solo ve y edita lo de su taller.
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text not null default 'taller' check (rol in ('gerencia', 'taller')),
  taller_id uuid references talleres(id) on delete set null,
  created_at timestamptz default now()
);

-- ============ FUNCIONES AUXILIARES PARA LOS PERMISOS ============

create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid();
$$;

create or replace function public.mi_taller() returns uuid
language sql stable security definer set search_path = public as $$
  select taller_id from perfiles where id = auth.uid();
$$;

-- ============ SEGURIDAD (cada taller solo ve lo suyo) ============

alter table talleres enable row level security;
alter table colecciones enable row level security;
alter table insumos enable row level security;
alter table prendas enable row level security;
alter table prendas_stock enable row level security;
alter table movimientos enable row level security;
alter table perfiles enable row level security;
alter table facturas enable row level security;

-- Perfiles
create policy "ver_perfil_propio_o_gerencia" on perfiles for select
  using (id = auth.uid() or mi_rol() = 'gerencia');
create policy "gerencia_crea_perfiles" on perfiles for insert
  with check (mi_rol() = 'gerencia');
create policy "gerencia_edita_perfiles" on perfiles for update
  using (mi_rol() = 'gerencia');
create policy "gerencia_borra_perfiles" on perfiles for delete
  using (mi_rol() = 'gerencia');

-- Talleres: gerencia ve y administra todos; un taller solo ve el suyo
create policy "ver_talleres" on talleres for select
  using (mi_rol() = 'gerencia' or id = mi_taller());
create policy "gerencia_crea_talleres" on talleres for insert
  with check (mi_rol() = 'gerencia');
create policy "gerencia_edita_talleres" on talleres for update
  using (mi_rol() = 'gerencia');
create policy "gerencia_borra_talleres" on talleres for delete
  using (mi_rol() = 'gerencia');

-- Colecciones y prendas (recetas): visibles para cualquier empleado logueado,
-- pero solo gerencia las crea/edita/borra
create policy "ver_colecciones" on colecciones for select
  using (auth.uid() is not null);
create policy "gerencia_administra_colecciones" on colecciones for all
  using (mi_rol() = 'gerencia') with check (mi_rol() = 'gerencia');

create policy "ver_prendas" on prendas for select
  using (auth.uid() is not null);
create policy "gerencia_administra_prendas" on prendas for all
  using (mi_rol() = 'gerencia') with check (mi_rol() = 'gerencia');

-- Insumos: cada taller solo ve y edita los suyos; gerencia ve y edita todos
create policy "ver_insumos" on insumos for select
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "crear_insumos" on insumos for insert
  with check (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "editar_insumos" on insumos for update
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "borrar_insumos" on insumos for delete
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());

-- Stock de prendas terminadas: igual que insumos, por taller
create policy "ver_stock_prendas" on prendas_stock for select
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "modificar_stock_prendas" on prendas_stock for all
  using (mi_rol() = 'gerencia' or taller_id = mi_taller())
  with check (mi_rol() = 'gerencia' or taller_id = mi_taller());

-- Movimientos: cada taller solo ve y crea los suyos; gerencia ve todos
create policy "ver_movimientos" on movimientos for select
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "crear_movimientos" on movimientos for insert
  with check (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "actualizar_movimientos" on movimientos for update
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());

-- Facturas: agrupan producciones entregadas para cobrar; misma lógica por taller
create policy "ver_facturas" on facturas for select
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "crear_facturas" on facturas for insert
  with check (mi_rol() = 'gerencia' or taller_id = mi_taller());
create policy "actualizar_facturas" on facturas for update
  using (mi_rol() = 'gerencia' or taller_id = mi_taller());

-- ============ FOTOS (Supabase Storage) ============
-- Después de correr este SQL, crea el bucket manualmente:
-- Panel de Supabase -> Storage -> New bucket -> nombre: insumos-fotos
-- Márcalo como "Public bucket" (para poder mostrar las fotos fácilmente).
-- Luego vuelve aquí y corre las 2 políticas de abajo.

create policy "usuarios_suben_fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'insumos-fotos');
create policy "usuarios_actualizan_fotos" on storage.objects for update to authenticated
  using (bucket_id = 'insumos-fotos');
