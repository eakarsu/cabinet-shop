# Heritage Cabinet & Stone

A standalone, **database-driven** marketing site for a custom cabinet & stone
countertop business — built with the **same stack as the restaurant app**
(Next.js 14 App Router + TypeScript + Tailwind + Prisma + PostgreSQL + an
OpenRouter-powered AI concierge with tool-calling).

Independent project — does not import from or depend on any other codebase.

## Stack

- **Next.js 14** App Router (`src/app`), TypeScript, `@/*` alias
- **Tailwind CSS** (dark charcoal + gold theme), shadcn-style `Button` + `cn()`
- **Prisma + PostgreSQL** — all content is in the database
- **lucide-react** icons, Playfair Display + Inter via `next/font`
- **AI concierge** chat widget (same design/behavior as the restaurant app)

## Quick start

```bash
cd /Volumes/external/projects/cabinet-shop
cp .env.example .env       # then edit values
./start.sh                 # creates DB, pushes schema, seeds, runs dev server
# → http://localhost:3000
```

`start.sh` mirrors the restaurant app: it checks PostgreSQL, creates
`cabinet_shop_db`, runs `prisma generate` + `db push`, seeds if empty, frees the
port, and starts the server.

Manual equivalent:

```bash
npm install
createdb cabinet_shop_db
npm run db:push
npm run db:seed
npm run dev
```

## Environment (.env — same keys as the restaurant app)

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_URL` | Base URL for server-to-server API calls + OpenRouter referer |
| `NEXTAUTH_SECRET` | Reserved for parity with the restaurant app |
| `OPENROUTER_API_KEY` | Enables the AI concierge (503 if unset; rest of site works) |
| `OPENROUTER_MODEL` | Defaults to `anthropic/claude-3-5-sonnet-20241022` |

## Database (every model seeded with 15+ rows)

| Model | Rows | Used by |
|-------|------|---------|
| `Material` | 16 | Home preview, Materials page, assistant |
| `Project` | 16 | Gallery (filterable), assistant |
| `Service` | 16 | Home "What we do", assistant |
| `Testimonial` | 16 | Home reviews |
| `TeamMember` | 15 | About page |
| `Faq` | 15 | About page, assistant |
| `QuoteRequest` | 17 | Contact form leads, assistant `submit_quote` |
| `Consultation` | 17 | Bookings, assistant `book_consultation` |
| `AiResult` | — | Audit log of assistant interactions |

Reseed any time with `npm run db:seed` (idempotent — it clears then re-inserts).

## Pages & APIs

| Route | Page |
|-------|------|
| `/` | Hero, services, materials, process, reviews, CTA (DB-driven) |
| `/materials` | All materials from the DB with category + price tier |
| `/gallery` | Filterable project gallery from the DB |
| `/about` | Company story, team, stats, FAQ (DB-driven) |
| `/contact` | Estimate form → `POST /api/quotes` |
| `/admin` | Staff dashboard — overview + management of every feature |

### Admin dashboard (`/admin`)

A separate front-end (its own sidebar layout, no marketing chrome) for every
database feature:

| Route | Manage |
|-------|--------|
| `/admin` | Overview — counts + latest estimates/consultations |
| `/admin/quotes` | Estimates — editable status (new→contacted→…→won/lost) |
| `/admin/consultations` | Consultations — editable status |
| `/admin/materials` | Materials catalog |
| `/admin/projects` | Gallery projects |
| `/admin/services` | Services |
| `/admin/testimonials` | Reviews |
| `/admin/team` | Team members |
| `/admin/faqs` | FAQs |

Status dropdowns write through `PUT /api/quotes/:id` and
`PUT /api/consultations/:id`.

### Authentication (NextAuth, like the restaurant app)

Two roles, with **demo credentials pre-filled on `/login`**:

| Role | Login | Lands on |
|------|-------|----------|
| Admin | `admin@heritage.com` / `admin123` | `/admin` (full dashboard) |
| Customer | `avery@example.com` / `customer123` | `/account` (their own data) |

- `/admin/*` requires an **admin** session; customers are redirected to `/account`.
- `/account` requires any session and shows that customer's own estimates +
  consultations (matched by email).
- The login page has Admin/Customer tabs that auto-fill the matching demo
  credentials — just click **Sign in**.
- Accounts live in the `User` table (bcrypt-hashed); seeded by `npm run db:seed`.
- Set a strong `NEXTAUTH_SECRET` in `.env` for production.

REST endpoints the pages **and the AI assistant** call:
`GET /api/materials|projects|services|testimonials|faqs|team`,
`GET|POST /api/quotes`, `GET|POST /api/consultations`,
`PUT|DELETE /api/consultations/:id`, `POST /api/assistant`.

## AI concierge (chat widget)

A floating chat button (bottom-right, on every page) opens an assistant that
works exactly like the restaurant app's:

- **Reads** via tools: `search_materials`, `list_projects`,
  `check_consultation_availability`, plus a generic `query_data` over the read
  endpoint catalog (services, testimonials, FAQs, team, quotes, consultations).
- **Writes** require confirmation: `book_consultation` and `submit_quote` (and a
  generic `perform_action` to reschedule/cancel). The assistant returns a
  `pendingAction`; the user clicks **Confirm**, and the action is committed by
  calling the site's own API routes — same validation path as the web forms.
- Every interaction is logged to the `AiResult` table; requests are rate-limited
  (20/hr/visitor by default).

Set `OPENROUTER_API_KEY` to enable it. Try: *"What white quartz do you have?"*,
*"Book me a consultation next Tuesday afternoon for a kitchen remodel."*

## Customize

- **Content**: edit `prisma/seed.ts` and re-run `npm run db:seed`, or use the
  POST APIs / Prisma Studio (`npm run db:studio`).
- **Company info / nav / stats / steps**: `src/lib/site.ts`.
- **Theme colors**: CSS variables at the top of `src/app/globals.css`.
- **Material/gallery images**: currently CSS-gradient placeholders — swap in
  `next/image` with real slab photos.
