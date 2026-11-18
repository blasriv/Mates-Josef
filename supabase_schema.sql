-- Supabase schema for Mates Josef
-- Versión final (ajustes solicitados)
-- Idempotente – puede ejecutarse varias veces sin errores.

--------------------------------------------------------------------
-- 0.  Extensiones y uso de schema
--------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- Permitir que los roles públicos usen el schema «public».
grant usage on schema public to anon, authenticated;

--------------------------------------------------------------------
-- 1.  Tablas de negocio (solo se crean si no existen)
--------------------------------------------------------------------
create table if not exists public.products (
    id          bigserial primary key,
    name        text      not null,
    category    text      not null,
    description text,
    price       numeric   not null,
    stock       integer   not null,
    image       text
);

create table if not exists public.categories (
    name text primary key
);

create table if not exists public.orders (
    id         text primary key,               -- id que envía la app
    data       jsonb not null,                -- cuerpo completo del pedido
    created_at timestamp with time zone default now()
);

--------------------------------------------------------------------
-- 2.  Función RPC para comprobar administrador
--------------------------------------------------------------------
/*  is_admin()
    • security definer → puede leer la tabla auth.users aunque el
      llamador sólo tenga permisos anon/authenticated.
    • search_path restringido a pg_catalog (no incluye schema público) */
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and email = 'blaspeugeot@gmail.com'
  );
$$;

-- Conceder EXECUTE a los roles que utilizan la API (anon y authenticated)
grant execute on function public.is_admin() to anon, authenticated;

--------------------------------------------------------------------
-- 3.  Row‑Level Security (RLS) y políticas
--------------------------------------------------------------------
alter table public.products   enable row level security;
alter table public.categories enable row level security;
alter table public.orders    enable row level security;

--------------------------------------------------------------------
-- 3.1  Políticas para products
--------------------------------------------------------------------
drop policy if exists "public read products"   on public.products;
create policy "public read products"
    on public.products
    for select
    using (true);

drop policy if exists "admin insert products" on public.products;
create policy "admin insert products"
    on public.products
    for insert
    with check (public.is_admin());

drop policy if exists "admin update products" on public.products;
create policy "admin update products"
    on public.products
    for update
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete products" on public.products;
create policy "admin delete products"
    on public.products
    for delete
    using (public.is_admin());

--------------------------------------------------------------------
-- 3.2  Políticas para categories
--------------------------------------------------------------------
drop policy if exists "public read categories"   on public.categories;
create policy "public read categories"
    on public.categories
    for select
    using (true);

drop policy if exists "admin insert categories" on public.categories;
create policy "admin insert categories"
    on public.categories
    for insert
    with check (public.is_admin());

drop policy if exists "admin update categories" on public.categories;
create policy "admin update categories"
    on public.categories
    for update
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete categories" on public.categories;
create policy "admin delete categories"
    on public.categories
    for delete
    using (public.is_admin());

--------------------------------------------------------------------
-- 3.3  Políticas para orders
--------------------------------------------------------------------
drop policy if exists "admin read orders"   on public.orders;
create policy "admin read orders"
    on public.orders
    for select
    using (public.is_admin());

drop policy if exists "admin update orders" on public.orders;
create policy "admin update orders"
    on public.orders
    for update
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "admin delete orders" on public.orders;
create policy "admin delete orders"
    on public.orders
    for delete
    using (public.is_admin());

drop policy if exists "anyone insert orders" on public.orders;
create policy "anyone insert orders"
    on public.orders
    for insert
    with check (true);      -- permite INSERT a cualquier rol (anon o authenticated)

--------------------------------------------------------------------
-- 4.  Índices auxiliares (creación segura)
--------------------------------------------------------------------
create index if not exists idx_products_category
    on public.products (category);
create index if not exists idx_orders_created_at
    on public.orders (created_at);

--------------------------------------------------------------------
-- 5.  Grants sobre tablas, secuencias y columnas
--------------------------------------------------------------------
-- Lectura pública de productos y categorías (ya cubierta por RLS)
grant select on public.products   to anon, authenticated;
grant select on public.categories to anon, authenticated;

-- Inserción de pedidos (cualquier cliente)
grant insert on public.orders to anon, authenticated;

-- Lectura de pedidos requerida para el admin (añadido por solicitud)
grant select on public.orders to authenticated;

-- Permisos de actualización/borrado de pedidos están controlados por RLS;
-- concedemos los privilegios para que la llamada supabase‑js pueda evaluarlos.
grant update, delete on public.orders to authenticated;

-- Permisos de gestión de productos y categorías para usuarios autenticados
-- (RLS sigue limitando a admin)
grant insert, update, delete on public.products   to authenticated;
grant insert, update, delete on public.categories to authenticated;

-- Secuencia de products (solo el rol authenticated necesita usarla)
grant usage, select on sequence public.products_id_seq to authenticated;

--------------------------------------------------------------------
-- 6.  Políticas y grants para Storage (bucket: product‑images)
--------------------------------------------------------------------
-- Habilitar RLS en la tabla interna storage.objects (solo una vez)
alter table storage.objects enable row level security;

-- Lectura pública (cualquier usuario)
drop policy if exists "public read product images" on storage.objects;
create policy "public read product images"
    on storage.objects
    for select
    using (bucket_id = 'product-images');

-- INSERT – sólo admin y solo en el bucket product‑images
drop policy if exists "admin insert product images" on storage.objects;
create policy "admin insert product images"
    on storage.objects
    for insert
    with check (bucket_id = 'product-images' AND public.is_admin());

-- UPDATE – sólo admin y sólo en el bucket product‑images
drop policy if exists "admin update product images" on storage.objects;
create policy "admin update product images"
    on storage.objects
    for update
    using (bucket_id = 'product-images' AND public.is_admin())
    with check (bucket_id = 'product-images' AND public.is_admin());

-- DELETE – sólo admin y sólo en el bucket product‑images
drop policy if exists "admin delete product images" on storage.objects;
create policy "admin delete product images"
    on storage.objects
    for delete
    using (bucket_id = 'product-images' AND public.is_admin());

-- Grants básicos para que la API pueda operar; RLS restringe quién pasa.
grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;   -- el admin será usuario autenticado

--------------------------------------------------------------------
-- 7.  Comentarios descriptivos
--------------------------------------------------------------------
comment on table public.products   is 'Catálogo de productos de Mates Josef';
comment on table public.categories is 'Listado de categorías usadas en el catálogo';
comment on table public.orders    is 'Órdenes de compra registradas por los clientes';

--------------------------------------------------------------------
-- 8.  Notas finales (no ejecutables)
--------------------------------------------------------------------
/*
 * •  El bucket “product‑images” debe crearse manualmente en la UI de Supabase.
 * •  Las credenciales que usará la aplicación son únicamente:
 *       – SUPABASE_URL  → URL del proyecto (p.ej. https://xyz.supabase.co)
 *       – SUPABASE_ANON_KEY → clave “anon public”.  No se usa nunca
 *         la “service_role” en el frontend.
 * •  El flujo `createOrder` de `store.js` inserta una fila en
 *    `public.orders` sin requerir sesión; por eso la política
 *    “anyone insert orders” permite INSERT a cualquier rol.
 * •  Gracias a RLS y a los grants afinados, los visitantes pueden:
 *        – leer productos y categorías,
 *        – crear un pedido,
 *        – ver imágenes públicas del bucket.
 *   Sólo el administrador con el email *blaspeugeot@gmail.com* podrá:
 *        – consultar, actualizar o eliminar pedidos,
 *        – gestionar productos, categorías e imágenes del bucket.
 */