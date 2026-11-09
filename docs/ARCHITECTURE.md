# Architecture

Modular monolith. React storefront + React admin (Vercel) -> Django REST API (Render) -> PostgreSQL + pgvector (Supabase). Optional: Redis (Upstash), Gemini API, Razorpay, Cloudinary.

```mermaid
flowchart LR
  UI[Storefront] -->|JWT REST /api/v1| API[Django + DRF]
  ADM[Admin dashboard] -->|JWT REST| API
  API --> DB[(PostgreSQL + pgvector)]
  API --> RZP[Razorpay]
  API --> LLM[Gemini, optional]
  API --> IMG[Cloudinary, optional]
  API -.-> REDIS[(Redis / Celery, optional)]
  RZP -->|signed webhook| API
```

## RAG pipeline
```mermaid
flowchart TD
  U[Admin uploads txt/md/pdf] --> V[validate type + size] --> X[extract + clean] --> C[chunk] --> E[embed, reusing unchanged chunks]
  E --> S[(chunks: JSON + vector(256) HNSW + GIN full-text)]
  Q[Customer question] --> R{intent router}
  R -->|order| T1[get_order_status: own orders only]
  R -->|product / age / budget| T2[search_products, recommend]
  R -->|compare| T3[compare_products]
  R -->|stock| T4[check_inventory]
  R -->|specs| T5[get_product_details]
  R -->|policy / other| H[hybrid retrieval: pgvector top-N + full-text top-N, rerank semantic+keyword]
  S --> H --> G[answer + citations; optional Gemini phrasing, timeout + fallback]
```
Prices, stock and order status are always read from the database. Retrieved text is treated as untrusted. If nothing relevant is found, the bot says so.

## ER diagram
```mermaid
erDiagram
  USER ||--o{ ADDRESS : has
  USER ||--o| CART : owns
  CART ||--o{ CART_ITEM : contains
  USER ||--o{ WISHLIST_ITEM : saves
  USER ||--o{ NOTIFICATION : receives
  USER ||--o{ AUDIT_LOG : performs
  CATEGORY ||--o{ PRODUCT : groups
  PRODUCT ||--o{ PRODUCT_IMAGE : has
  PRODUCT ||--o{ PRODUCT_VARIANT : has
  PRODUCT ||--|| INVENTORY : tracks
  PRODUCT ||--o{ INVENTORY_MOVEMENT : logs
  PRODUCT ||--o{ REVIEW : receives
  PRODUCT ||--o{ CART_ITEM : in
  USER ||--o{ REVIEW : writes
  USER ||--o{ ORDER : places
  COUPON ||--o{ ORDER : discounts
  ORDER ||--o{ ORDER_ITEM : contains
  ORDER ||--o{ PAYMENT : paid_by
  KNOWLEDGE_DOCUMENT ||--o{ DOCUMENT_CHUNK : split_into
  USER ||--o{ CONVERSATION : has
  CONVERSATION ||--o{ CHAT_MESSAGE : contains
  CHAT_MESSAGE ||--o{ CHATBOT_FEEDBACK : rated_by
```

## Key rules
- Paid only after server-side HMAC verification (checkout signature or webhook); `mark_paid` is idempotent; `payment.failed` never downgrades a paid payment.
- Checkout is one transaction with row locks on inventory in a fixed order (no overselling, no deadlocks); cancel restocks; unpaid orders expire via `expire_pending_orders`.
- Refunds go through the gateway and are audit-logged; no gateway keys means a 503, never a fake success.
- Soft-deleting products keeps order history intact.
