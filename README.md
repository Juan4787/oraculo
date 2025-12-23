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

Ejecutá los SQL de:
- `supabase/migrations/2025-12-15_0001_init.sql`
- `supabase/migrations/2025-12-16_0002_allowed_emails.sql`
- `supabase/migrations/2025-12-23_0003_remove_access_codes.sql`

Después:
1. (Opcional) Creá un workspace manual si querés personalizar el nombre. Si no, se crea
automáticamente en el primer login.

```sql
insert into public.workspaces (name)
values ('Mi Oráculo')
returning id;
```

2. En la app:
   - Registrate / logueate y empezás a usarla directamente

## 5) Storage
- Bucket `card_images` (privado) para imágenes de cartas.
- La app sube imágenes en `workspaces/<workspace_id>/cards/<card_id>/...` (esto es importante para RLS de Storage).
