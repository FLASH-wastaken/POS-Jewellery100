/*
  =============================================================================
  ARCHITECTURE DOCUMENTATION
  =============================================================================
  
  Technical architecture overview, data flow diagrams, and design decisions
  for the Jewelry POS System.
  
  =============================================================================
*/

# System Architecture

## High-Level Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                       │
│  React 19 | TypeScript | Tailwind CSS | shadcn/ui Components   │
│  ├─ Dashboard                                                     │
│  ├─ POS Interface                                                │
│  ├─ Product Management                                           │
│  ├─ Customer Management                                          │
│  └─ Reports & Analytics                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                        (HTTP/REST)
┌─────────────────────────────────────────────────────────────────┐
│                   API LAYER (Next.js Routes)                     │
│  ├─ /api/auth/*      (JWT Authentication)                        │
│  ├─ /api/products/*  (Product CRUD)                              │
│  ├─ /api/customers/* (Customer CRUD)                             │
│  ├─ /api/sales/*     (Sales Management)                          │
│  └─ /api/reports/*   (Reporting)                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                      (TypeScript/Node.js)
┌─────────────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER (lib/ & hooks/)                │
│  ├─ Authentication (JWT, Token Management)                       │
│  ├─ Authorization (Role-based Access)                            │
│  ├─ Validation (Input Sanitization)                              │
│  ├─ Data Parsing (CSV, Excel, HTML)                              │
│  └─ Utilities (SKU Generation, Notifications)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓↑
                      (SQL Queries)
┌─────────────────────────────────────────────────────────────────┐
│          DATA LAYER (Supabase/PostgreSQL)                        │
│  ├─ Users & Authentication                                       │
│  ├─ Products & Inventory                                         │
│  ├─ Customers                                                    │
│  ├─ Sales & Transactions                                         │
│  ├─ Inventory Logs                                               │
│  └─ Notifications                                                │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## Data Flow Diagrams

### 1. Authentication Flow

\`\`\`
User Login Form
    ↓
POST /api/auth/login (email, password)
    ↓
[Server Validation]
- Hash password with bcrypt
- Verify against Supabase Auth
    ↓
[Token Generation]
- Generate JWT access token (15 min expiry)
- Generate refresh token (7 day expiry)
    ↓
[Response]
- Set HTTP-only cookies
- Return user data + tokens
    ↓
Frontend Store (React State)
    ↓
All subsequent API requests include JWT in headers
\`\`\`

### 2. Product Import Flow

\`\`\`
CSV File Upload
    ↓
parseCSV() [lib/import-parsers.ts]
- Parse CSV content
- Auto-detect columns
- Extract data rows
    ↓
Preview Step [Component]
- Show detected columns
- Show sample data (first 3 rows)
- Allow column mapping
    ↓
User Confirms Import
    ↓
POST /api/products/bulk-import
    ↓
[Server Processing]
- Validate JWT token
- Parse request body
- For each product:
  ├─ Validate required fields
  ├─ Generate SKU (lib/sku-barcode-generator.ts)
  ├─ Generate barcode
  ├─ Extract diamond grade from custom_text
  └─ Insert into database
    ↓
[Response]
- Return success count
- List any errors
- Show failed products
    ↓
Frontend Toast Notification
    ↓
Products available in system
\`\`\`

### 3. POS Sales Flow

\`\`\`
Add Product to Cart
    ↓
[Client-side cart updates]
- Calculate subtotal
- Calculate taxes
- Apply discounts
    ↓
Customer Selection
├─ Existing customer (name lookup)
├─ Walk-in (no customer)
└─ New customer (quick add)
    ↓
Select Payment Method
├─ Cash
├─ Card
├─ Check
└─ Other
    ↓
Finalize Sale
    ↓
POST /api/sales (cart, customer, payment)
    ↓
[Server Processing]
[Transaction Start]
- Create sales record
- Add sale_items
- Update inventory (decrease stock)
- Create inventory_log entries
- Create notification
[Transaction Commit]
    ↓
[Response]
- Return sale record with ID
- Return invoice data
    ↓
Frontend
├─ Show success message
├─ Display invoice preview
├─ Offer print/email/SMS/WhatsApp
└─ Clear cart for next transaction
\`\`\`

## Database Schema

### Entity Relationships

\`\`\`
┌──────────────┐         ┌──────────────┐
│    users     │         │  customers   │
├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ email (UQ)   │         │ full_name    │
│ password     │         │ email        │
│ full_name    │         │ phone        │
│ role         │         │ address      │
└──────────────┘         └──────────────┘
                               ↑
                               │ FK
                               │
                         ┌──────────────┐
                         │    sales     │
                         ├──────────────┤
                         │ id (PK)      │
                         │ customer_id  │
                         │ user_id      │
                         │ total        │
                         │ status       │
                         │ created_at   │
                         └──────────────┘
                               ↓
                        ┌─────────────────┐
                        │  sale_items     │
                        ├─────────────────┤
                        │ id (PK)         │
                        │ sale_id (FK)    │
                        │ product_id (FK) │
                        │ quantity        │
                        │ unit_price      │
                        └─────────────────┘
                               ↓
┌──────────────┐         ┌──────────────┐
│  products    │         │ categories   │
├──────────────┤         ├──────────────┤
│ id (PK)      │         │ id (PK)      │
│ name         │         │ name         │
│ sku (UQ)     │         │ description  │
│ barcode (UQ) │         └──────────────┘
│ category_id  │────────FK
│ price        │
│ cost         │
│ stock        │
└──────────────┘
     ↑
     │ FK
┌──────────────────┐
│ inventory_logs   │
├──────────────────┤
│ id (PK)          │
│ product_id (FK)  │
│ quantity_change  │
│ reason           │
│ created_at       │
└──────────────────┘
\`\`\`

## Key Design Patterns

### 1. API Request Pattern

\`\`\`typescript
// Client Component
const { data, loading, error } = useApi(
  '/api/products?category=rings&limit=10'
);

// Hook Implementation (hooks/use-api.ts)
- Makes GET/POST/PUT/DELETE requests
- Handles JWT token from cookies
- Implements automatic token refresh on 401
- Manages loading/error states
- Caches results

// API Route (app/api/products/route.ts)
- Extracts and validates JWT token
- Authorizes request (checks user role)
- Executes business logic
- Returns JSON response
- Logs errors for debugging
\`\`\`

### 2. Component Architecture

\`\`\`
Server Components (Default)
├─ Page components (app/*/page.tsx)
├─ Fetch data from Supabase
├─ Pass data as props to client components
└─ Better SEO & performance

Client Components (When needed)
├─ Interactive UI (forms, buttons, modals)
├─ Real-time updates
├─ State management
└─ Use 'use client' directive at top
\`\`\`

### 3. Error Handling

\`\`\`typescript
// API Route Error Handling
try {
  // Validate
  // Process
  // Return success
} catch (error) {
  console.error('[v0] Error details:', error.message);
  return NextResponse.json(
    { error: 'Friendly error message' },
    { status: 400 }
  );
}

// Client Error Handling
const { data, error } = useApi('/api/endpoint');
if (error) {
  toast.error(error.message);
  return <ErrorBoundary />;
}
\`\`\`

## Security Layers

\`\`\`
Layer 1: Authentication
├─ JWT tokens with expiry
├─ Refresh token rotation
└─ Secure HTTP-only cookies

Layer 2: Authorization
├─ Role-based access control (RBAC)
├─ User-specific data isolation
└─ API route permission checks

Layer 3: Data Validation
├─ Input sanitization
├─ Type checking with TypeScript
└─ Schema validation with Zod

Layer 4: Database Security
├─ Row Level Security (RLS)
├─ Parameterized queries
└─ Foreign key constraints

Layer 5: Transport Security
├─ HTTPS/TLS encryption
├─ Secure headers
└─ CORS configuration
\`\`\`

## Performance Optimization

### Frontend Optimization
- Next.js server-side rendering (SSR)
- Image optimization
- Code splitting
- CSS minification (Tailwind)
- React component memoization

### Database Optimization
- Indexes on frequently queried columns
- Connection pooling
- Query optimization
- Caching with Redis (optional)

### API Optimization
- Response pagination
- Field selection (select specific columns)
- Lazy loading
- Compression (gzip)

## Scaling Considerations

### As User Base Grows

1. **Database**
   - Archive old data
   - Implement partitioning
   - Add read replicas
   - Use connection pooling

2. **Application**
   - Horizontal scaling (multiple instances)
   - Load balancing (Nginx, AWS ALB)
   - Caching layer (Redis)
   - CDN for static assets

3. **API**
   - Rate limiting
   - API versioning
   - Monitoring & alerting
   - Performance profiling

---

**End of Architecture Documentation**
*/
\`\`\`

Now I'll add inline documentation to key files:
