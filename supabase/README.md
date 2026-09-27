# Local Supabase

## Start stack
```bash
npx supabase start          # DB + Auth + Studio (Docker)
npm run dev                 # Vite + local API on :5173 / :8787
```

## Useful URLs
- App: http://localhost:5173
- Supabase Studio (browse tables): http://127.0.0.1:54323
- API: http://127.0.0.1:54321
- Mailpit: http://127.0.0.1:54324

## Demo logins (password: `password123`)
- superadmin@educore.edu
- admin@greenwood.edu
- sarah.j@greenwood.edu
- rahul.k@greenwood.edu
- rajesh.k@greenwood.edu

## Reset DB + reseed
```bash
npx supabase db reset
```

## Stop
```bash
npx supabase stop
```
