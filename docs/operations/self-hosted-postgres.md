# Self-hosted Postgres for Gigxomi

This is the safe migration path when Supabase latency blocks chat speed. The app already uses Prisma with a PostgreSQL datasource, so the deployment switch is an environment change, not an API rewrite.

## Target Shape

- Keep PostgreSQL private on the VPS.
- Point `DATABASE_URL` to the local database from the running app.
- Run Prisma migrations once the database exists.
- Keep the existing API and dummy-platform store behavior unchanged.

## VPS Setup

Run the helper on the VPS as root or a sudo user:

```bash
sudo GIGXOMI_DB_PASSWORD='replace-with-a-strong-password' bash scripts/setup-vps-postgres.sh
```

The script creates:

- Database: `gigxomi`
- User: `gigxomi_app`
- Local-only connection URL: `postgresql://gigxomi_app:<password>@127.0.0.1:5432/gigxomi?schema=public`

## Deployment Environment

Set the app server environment value:

```bash
DATABASE_URL='postgresql://gigxomi_app:<password>@127.0.0.1:5432/gigxomi?schema=public'
```

Then run:

```bash
npx prisma migrate deploy
```

Do not expose Postgres publicly. If a managed database is reintroduced later, only `DATABASE_URL` needs to change.

## Rollback

Keep the old Supabase `DATABASE_URL` available in your server notes. Rollback is switching `DATABASE_URL` back and restarting the app.
