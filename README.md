# Tresconcuento · Control de inventario multi-taller (v2)

Versión con inicio de sesión por empleado, control real por taller, fotos de
insumos, colecciones y reportes en Excel/PDF. Queda publicada con un link
propio, funciona en iPhone, Android y computador desde el navegador, sin
instalar nada.

No necesitas instalar Node.js ni saber programar. Todo se hace desde las
páginas web de Supabase, GitHub y Vercel (las tres son gratuitas).

---

## Paso 1 — Crear el proyecto en Supabase

1. Entra a https://supabase.com, crea una cuenta gratis y un **New project**
   (elige una región cercana, ej. "South America (São Paulo)"). Guarda la
   contraseña de la base de datos en un lugar seguro.
2. Ve a **SQL Editor**, pega todo el contenido de `supabase_schema.sql` y
   dale **Run**. Esto crea todas las tablas, la seguridad por taller y los
   permisos.
3. Ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**
   Los vas a necesitar en el Paso 3.

## Paso 2 — Activar las fotos (Supabase Storage)

1. En el menú de la izquierda, entra a **Storage**.
2. Clic en **New bucket** → nómbralo exactamente `insumos-fotos` → marca
   **Public bucket** → **Create bucket**.
3. Vuelve a **SQL Editor** y corre estas dos líneas (ya vienen al final de
   `supabase_schema.sql`, pero si el bucket no existía al correr todo el
   archivo, ejecútalas ahora por separado):

```sql
create policy "usuarios_suben_fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'insumos-fotos');
create policy "usuarios_actualizan_fotos" on storage.objects for update to authenticated
  using (bucket_id = 'insumos-fotos');
```

## Paso 3 — Subir el proyecto a GitHub y publicarlo en Vercel

Igual que antes:

1. Crea un repositorio en https://github.com y sube todos los archivos de
   esta carpeta (arrastrando la carpeta completa, incluyendo `src`).
2. Entra a https://vercel.com, conéctalo con GitHub, **Add New → Project**,
   elige el repositorio.
3. Antes de darle a Deploy, en **Environment Variables** agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy**. En 1-2 minutos te da el link real de la app
   (`https://tu-app.vercel.app`).

---

## Paso 4 — Crear los usuarios (gerencia y talleres)

Esto se hace manualmente por seguridad — así ninguna contraseña queda
expuesta en el código de la app. Es rápido:

1. Ve a **Authentication → Users → Add user** en Supabase. Pon el correo y
   contraseña del empleado (ej. `taller.medellin@tresconcuento.com`).
2. Copia el **UID** que se generó para ese usuario.
3. Ve a **Table Editor → talleres** y copia el **id** del taller al que
   pertenece ese empleado (si aún no existe el taller, créalo primero desde
   la app, con un usuario de gerencia).
4. Ve a **Table Editor → perfiles → Insert row** y llena:
   - `id`: el UID del usuario (paso 2)
   - `nombre`: nombre del empleado
   - `rol`: `taller` (o `gerencia` si va a ver y administrar todo)
   - `taller_id`: el id del taller (paso 3) — déjalo vacío si es `gerencia`

Repite esto por cada empleado o taller. El primer usuario que crees debería
ser tuyo, con `rol = gerencia`, para poder administrar todo desde la app
(crear talleres, prendas, colecciones, etc.).

---

## Qué incluye esta versión

- **Inicio de sesión** por correo y contraseña, uno por empleado.
- **Control real por taller**: un usuario con rol `taller` solo puede ver y
  modificar el inventario de su propio taller — esto lo aplica la base de
  datos misma (no solo la interfaz), así que es una restricción real, no
  solo visual.
- **Fotos de insumos**: cada tela/insumo puede tener una foto, tomada desde
  el celular o subida desde el computador.
- **Inventario de prendas por colección**: cada vez que se registra una
  producción, además de descontar insumos, se suma automáticamente al stock
  de prendas terminadas por talla y taller.
- **Dashboard con alertas** de insumos por debajo del mínimo.
- **Historial** de entradas y producciones.
- **Reportes en Excel y PDF** (pestaña "Reportes", solo gerencia): inventario
  completo, historial, prendas por colección y alertas de bajo stock.
- **Funciona en cualquier dispositivo** con navegador (no es una app que se
  instale desde una tienda de aplicaciones, es una página web — pero se
  puede "agregar a la pantalla de inicio" desde Chrome o Safari para que se
  sienta como una app).

## Importante: seguridad

- Las contraseñas y el control de acceso los maneja Supabase Auth — es un
  sistema de login real, no un simulacro.
- La restricción de "cada taller solo ve lo suyo" está en la base de datos
  (Row Level Security), así que aunque alguien intente manipular la app
  desde el navegador, no puede ver datos de otro taller.
- El bucket de fotos es público (cualquiera con el link exacto de una foto
  puede verla), pero solo un usuario con sesión iniciada puede subir o
  reemplazar fotos.
- Crear usuarios nuevos requiere entrar al panel de Supabase — esto es
  intencional, para que solo alguien con acceso a Supabase (gerencia) pueda
  dar de alta empleados.

## Estructura del proyecto

```
tresconcuento-app/
├── supabase_schema.sql      ← Paso 1
├── package.json
├── vite.config.js
├── index.html
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx                ← Toda la lógica de la app
    ├── supabaseClient.js
    └── index.css
```
