# App de cartas (Oráculo) — SvelteKit + Tailwind + Supabase

MVP multiusuario:
- Roles por workspace: `owner` / `staff` / `client`
- Contenido: mazos, cartas (publicables), tiradas (1 y 3 cartas por defecto)
- Lecturas aleatorias con snapshot + historial (por usuario o por persona)
- Modo profesional: personas (pacientes) + historial por persona
- Exportación PDF: vista “print-friendly” (imprimir/guardar como PDF)

## 1) Requisitos
- Node.js 20+
- Un proyecto Supabase (Auth + Postgres + Storage)

## 2) Variables de entorno
1. Copiá `.env.example` a `.env`
2. Completá con tu Supabase URL y Anon Key:

```bash
PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

## 3) Levantar la app (puerto 5175)

```bash
npm install
npm run dev -- --host 0.0.0.0
```

Luego abrí `http://localhost:5175`.

## 4) Supabase (SQL + buckets + RLS)

Ejecutá el SQL de `supabase/migrations/2025-12-15_0001_init.sql` en el SQL Editor de Supabase.

Después:
1. Creá un workspace (esto auto-crea las tiradas 1/3 cartas):

```sql
insert into public.workspaces (name, slug)
values ('Mi Oráculo', 'mi-oraculo')
returning id;
```

2. Creá códigos de acceso (uno `owner` y uno `client`):

```sql
-- OWNER (1 uso)
insert into public.workspace_access_codes (workspace_id, code_hash, role, max_uses)
values (
  '<WORKSPACE_ID>',
  public.hash_access_code('OWNER-1234'),
  'owner',
  1
);

-- CLIENT (ilimitado)
insert into public.workspace_access_codes (workspace_id, code_hash, role, max_uses)
values (
  '<WORKSPACE_ID>',
  public.hash_access_code('CLIENT-1234'),
  'client',
  null
);
```

3. En la app:
   - Registrate / logueate
   - En `/app/join` ingresá `OWNER-1234` (para la creadora) o `CLIENT-1234` (usuario final)

## 5) Storage
- Bucket `card_images` (privado) para imágenes de cartas.
- La app sube imágenes en `workspaces/<workspace_id>/cards/<card_id>/...` (esto es importante para RLS de Storage).
