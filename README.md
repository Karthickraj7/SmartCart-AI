# AI E-commerce Platform

A full-stack e-commerce application with a customer storefront, staff admin dashboard, Django REST API, and an AI-powered product and knowledge assistant.

## Project overview

The repository is organized as a modular monolith with three main applications:

| Application | Directory | Purpose | Local URL |
|---|---|---|---|
| Backend API | `backend/` | Django REST API, authentication, catalogue, cart, orders, payments, inventory, and chatbot | http://localhost:8000 |
| Customer storefront | `frontend/` | React shopping experience for customers | http://localhost:5173 |
| Admin dashboard | `admin/` | React dashboard for staff and store operations | http://localhost:5174 |

Additional directories:
- `e2e/` — Playwright end-to-end tests.
- `docs/` — architecture and technical documentation.
- `.github/workflows/` — CI and scheduled order-expiry workflow.
- `docker-compose.yml` — local multi-service environment.

API documentation is available at `/api/docs/` when the backend is running.

## Key features

### Customer storefront
- Browse, search, filter, and compare products.
- Product detail pages, variants, image galleries, and related products.
- Shopping cart, wishlist, customer accounts, and order history.
- Checkout and online payment through Razorpay.
- Contact form, newsletter, informational pages, and notifications.
- AI shopping assistant for product discovery and store knowledge.

### Admin dashboard
- Dashboard and operational overview.
- Product catalogue, variants, images, and inventory management.
- Order management and refund workflows.
- Customer management and support inbox.
- Coupons and editable site pages.
- AI knowledge-base document management and retrieval testing.
- Assistant settings, chat history, feedback, and low-stock visibility.
- Role-based access control and audit logging.

### AI knowledge assistant
- Ingests supported knowledge documents, extracts text, chunks content, and indexes it.
- Uses hybrid retrieval with PostgreSQL full-text search and pgvector when PostgreSQL is configured.
- Supports a local hashed-vector embedding mode and optional Gemini embeddings.
- Uses controlled application tools for product, inventory, comparison, and order-related questions.
- Grounds answers in retrieved store information and can provide source citations.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, TanStack Query, Tailwind CSS |
| Backend | Python 3.12, Django 5, Django REST Framework |
| Database | PostgreSQL 16, pgvector; SQLite for lightweight local development |
| Background jobs | Celery and Redis |
| Authentication | JWT (Simple JWT) |
| AI | Retrieval-augmented generation (RAG), optional Google Gemini |
| Payments | Razorpay |
| Media | Optional Cloudinary integration |
| Testing | pytest, Vitest, Testing Library, Playwright |
| Deployment | Render, Vercel, Supabase; Docker Compose for local services |

## Prerequisites

For running without Docker:
- Python 3.12
- Node.js 18 or newer and npm
- Git

For the full Docker setup:
- Docker Desktop or Docker Engine with the Compose plugin

PostgreSQL with the pgvector extension and Redis are recommended for production-like local testing. SQLite can be used for basic backend development.

## Getting started

Run the commands from the repository root (the directory containing `backend/`, `frontend/`, and `admin/`).

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd shop
```

### 2. Configure environment variables

Create the root environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update the values in `.env`. At minimum, set a secure `SECRET_KEY` and appropriate local settings. Do not commit `.env` or production secrets.

### 3. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install dependencies and initialize the database:

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py createsuperuser
python manage.py runserver
```

The API will be available at `http://localhost:8000`. API schema/docs: `http://localhost:8000/api/docs/`.

For a simple SQLite development setup, leave `DATABASE_URL` empty unless your local configuration specifies otherwise. For PostgreSQL, configure `DATABASE_URL` with a PostgreSQL connection string before running migrations.

### 4. Start the customer storefront

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_AI_CHAT_ENABLED=true
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5173`.

### 5. Start the admin dashboard

Open a third terminal:

```bash
cd admin
npm install
```

Create `admin/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:5174` and sign in with the Django superuser or an appropriately provisioned staff account.

## Run the complete stack with Docker

From the repository root:

```bash
cp .env.example .env
docker compose up --build
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Seed demo data and create an administrator:

```bash
docker compose exec backend python manage.py seed_demo
docker compose exec backend python manage.py createsuperuser
```

Services:
- Storefront: http://localhost:5173
- Admin: http://localhost:5174
- Backend: http://localhost:8000
- API docs: http://localhost:8000/api/docs/

Stop the services:

```bash
docker compose down
```

To remove the local database volume as well (this permanently deletes local Docker database data):

```bash
docker compose down -v
```

## Environment variables

The repository includes `.env.example`, `frontend/.env.example`, and `admin/.env.example`. The main settings include:

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Django secret key. Use a long, random value in production. |
| `DEBUG` | Django debug mode. Keep `False` in production. |
| `ALLOWED_HOSTS` | Comma-separated backend hostnames. |
| `CORS_ALLOWED_ORIGINS` | Exact browser origins allowed to call the API; no trailing slash. |
| `DATABASE_URL` | PostgreSQL connection URL. Empty may use the configured SQLite development default. |
| `REDIS_URL` | Redis connection URL for caching, throttling, and background work where enabled. |
| `JWT_SECRET_KEY` | Secret used for JWT signing if configured separately. |
| `GEMINI_API_KEY` | Optional key for Gemini chat phrasing and/or neural embeddings. |
| `EMBEDDING_PROVIDER` | `hash` for local embeddings or `gemini` for Gemini embeddings. Re-index after changing providers. |
| `PAYMENT_KEY_ID` | Razorpay key ID. |
| `PAYMENT_KEY_SECRET` | Razorpay API secret. Keep this server-side. |
| `PAYMENT_WEBHOOK_SECRET` | Secret used to verify Razorpay webhooks. |
| `FRONTEND_URL` | Public storefront URL used by backend flows. |
| `CLOUDINARY_CLOUD_NAME` | Optional Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Optional Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Optional Cloudinary API secret. |
| `VITE_API_BASE_URL` | Public API base URL used by each Vite frontend. |
| `VITE_AI_CHAT_ENABLED` | Enables or disables the storefront AI chat UI. |

Never put private API keys, payment secrets, Django secrets, or database credentials in `VITE_` variables. Vite variables are exposed to the browser bundle.

## Useful backend commands

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Create an administrator:

```bash
python manage.py createsuperuser
```

Rebuild the knowledge index after changing the embedding provider:

```bash
python manage.py reindex_all
```

Expire unpaid orders and release reserved stock:

```bash
python manage.py expire_pending_orders
```

Collect static files:

```bash
python manage.py collectstatic --noinput
```

## Testing

Run backend tests:

```bash
cd backend
python -m pytest -q
```

Run storefront tests:

```bash
cd frontend
npm install
npm test
```

Run admin tests:

```bash
cd admin
npm install
npm test
```

Run production builds:

```bash
cd frontend
npm run build

cd ../admin
npm run build
```

Run Playwright end-to-end tests:

```bash
cd e2e
npm install
npx playwright install
npm test
```

PostgreSQL-specific vector and concurrency tests require a PostgreSQL database with pgvector enabled. See `docs/ARCHITECTURE.md` for the data model and RAG flow.

## Deployment overview

The repository contains deployment configuration for Render and frontend hosting.

1. **Database:** Create a PostgreSQL 16 database with the pgvector extension (for example, a Supabase project). Configure `DATABASE_URL`.
2. **Backend:** Deploy the `backend/` directory as a Render web service using `render.yaml` or the included Dockerfile. Configure `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, database credentials, and any integration secrets.
3. **Frontend:** Deploy `frontend/` and `admin/` as separate Vercel projects. Set each project's `VITE_API_BASE_URL` to `https://<your-api-host>/api/v1`.
4. **CORS:** Add the exact storefront and admin production origins to `CORS_ALLOWED_ORIGINS`. Set `ALLOWED_HOSTS` to the backend hostname.
5. **Payments:** Configure Razorpay test keys first. Set the webhook endpoint to `https://<your-api-host>/api/v1/payments/webhook/` and configure the webhook secret and required payment events.
6. **Optional integrations:** Configure Gemini and Cloudinary only if those features are required.
7. **Admin account:** Create the first production superuser using the hosting provider's shell or one-off command.

Do not use test payment keys in production. Verify the hosting providers' current pricing, free-tier limitations, and runtime requirements before deployment. Configure backups, monitoring, HTTPS, and a reliable scheduled job for unpaid-order expiry before going live.

## Security and production checklist

- Set `DEBUG=False` and use unique, strong secrets.
- Restrict `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` to the required domains.
- Keep database, Razorpay, Gemini, and Cloudinary secrets on the server only.
- Use HTTPS for all production traffic.
- Configure database backups and test restoration.
- Verify Razorpay signatures and webhook delivery in test mode before enabling live payments.
- Review editable About, Privacy, Terms, Returns, FAQ, and Contact content before launch.
- Create staff accounts with the minimum role permissions required.
- Test order cancellation, stock restoration, refunds, and unpaid-order expiry.
- Replace template branding, contact details, and placeholder images/content before launch.

## Known limitations and implementation notes

- Razorpay is the supported online payment gateway in this project; other payment methods require additional backend integration.
- Gemini is optional. The local hashed-vector embedding provider works without a Gemini API key but is less capable with semantic paraphrases.
- Changing embedding providers requires re-indexing knowledge documents.
- Product variants share the parent product's inventory.
- SQLite is intended for lightweight development/testing; PostgreSQL with pgvector is recommended for production.
- Template image assets may need to be supplied. See `frontend/public/template/README.md`.
- Review `docs/ARCHITECTURE.md` for architecture diagrams, retrieval design, and key business rules.

## User roles

The application supports role-based access for:
- `super_admin` — full access, including roles and audit log.
- `product_manager` — catalogue, variants, images, inventory, and coupons.
- `order_manager` — order operations, status updates, and refunds.
- `support_agent` — customer support, chat history/feedback, and knowledge base.

## Repository structure

```text
shop/
├── backend/              # Django REST API
├── frontend/             # Customer React storefront
├── admin/                # Staff React dashboard
├── e2e/                  # Playwright end-to-end tests
├── docs/                 # Architecture documentation
├── .github/workflows/    # CI and scheduled tasks
├── docker-compose.yml
├── render.yaml
├── .env.example
└── README.md
```

## Contributing

1. Create a feature branch.
2. Make focused changes and add or update tests.
3. Run the relevant test suites and production builds.
4. Check that no secrets or local environment files are included.
5. Open a pull request with a clear summary and verification notes.

## License

Add the license and copyright information applicable to your project before publishing or distributing it.
