/*
# Navigation Structure & Feature Guide

## Overview
The Jewellery100 POS system is organized into distinct modules, each handling a specific business workflow.
This guide explains what each navigation item does and how they work together.

## Navigation Items Explained

### 1. Dashboard
**Purpose:** Business overview and key metrics
**What You See:**
- Total revenue
- Recent transactions
- Customer statistics
- Inventory alerts
**When to Use:** Check daily performance and business health at a glance

---

### 2. Products
**Purpose:** Manage jewelry inventory
**Features:**
- Add new products (individual or bulk CSV import)
- Edit product details (name, price, cost, weight, carats, gold type)
- View stock levels
- Generate product labels for display
**When to Use:** Maintain inventory, add new items, update prices/stock

---

### 3. Customers
**Purpose:** Maintain customer database
**Features:**
- Add new customers
- View customer details and purchase history
- Edit contact information
- Track customer preferences
**When to Use:** Build and manage your customer relationship database

---

### 4. Invoicing (formerly "POS")
**Purpose:** Create invoices for immediate sales
**What Happens:**
1. Add products to cart
2. Select customer
3. Choose payment method (cash, check, card, bank transfer)
4. Generate invoice immediately
5. Print, email, SMS, or WhatsApp to customer
**Invoice Type:** For paid/immediate transactions
**When to Use:** Sales where payment is received immediately

---

### 5. Memos
**Purpose:** Track pending sales and to-be-confirmed orders
**What Happens:**
1. Create memo (same as invoice but for pending sales)
2. Set memo validity (e.g., 15 days)
3. Customer approves or rejects
4. Convert approved memo to invoice
**Memo Type:** For sales awaiting customer approval/confirmation
**When to Use:** When customer wants to think about purchase or needs approval from someone else

---

### 6. Sales History
**Purpose:** View and manage all completed transactions
**Features:**
- View all invoices and converted memos
- Filter by date, customer, payment method
- Reprint/resend invoices
- View transaction details and payment status
**When to Use:** Track past sales, check transaction history, handle disputes

---

### 7. Reports
**Purpose:** Business analytics and insights
**Analytics Included:**
- Sales trends (14-day chart)
- Payment method distribution
- Top 10 selling products
- Revenue by product
- Low stock alerts
- Inventory status
**When to Use:** Analyze business performance, identify trends, plan inventory

---

### 8. Labels
**Purpose:** Print product labels for store display
**Features:**
- Design custom labels with product info
- Add barcodes
- Drag and drop text/barcode positioning
- Print on label printers
**When to Use:** Create labels for store display or for product identification

---

### 9. Settings
**Purpose:** System configuration and bulk operations
**Features:**
- Bulk import products from CSV, Excel, HTML, or SQL
- System settings and preferences
**When to Use:** Initial setup, mass import of products

---

## Workflow Examples

### Example 1: Customer Wants to Buy Immediately
1. Go to **Invoicing**
2. Search and add customer
3. Add products to cart
4. Select payment method (cash/card/check/bank transfer)
5. Complete transaction → Invoice is created
6. Print/send invoice to customer

### Example 2: Customer Wants to Think About Purchase
1. Go to **Memos**
2. Search and add customer
3. Add products to cart
4. Create memo with validity (e.g., 7 days)
5. Memo sent to customer for approval
6. When customer approves: **Memos** → Convert to Invoice
7. Invoice is created and payment is collected

### Example 3: Analyze Monthly Sales
1. Go to **Reports**
2. View Sales Trend chart for pattern analysis
3. Check Top Products to see best sellers
4. Review Low Stock alerts for inventory planning

### Example 4: Import 100 Products at Once
1. Go to **Settings** → Bulk Import
2. Upload CSV file with product details
3. System auto-detects columns and maps data
4. Products are imported to inventory
5. See them in **Products** dashboard

---

## Key Differences

| Feature | Invoicing | Memos | Sales History |
|---------|-----------|-------|---------------|
| **Purpose** | Immediate sales | Pending sales | View all transactions |
| **Payment** | Required now | Pending | Shows both |
| **Validity** | Immediate | Time-limited (7-15 days) | Historical |
| **Action** | Print/send invoice | Send for approval | View/reprint/resend |
| **Status** | Completed | Pending/Converted | Completed/Pending |

---

## Quick Tips

✓ Use **Invoicing** for walk-in sales and cash transactions
✓ Use **Memos** when customers need approval from family/business partners
✓ Check **Sales History** to verify all transactions
✓ Review **Reports** weekly for business insights
✓ Keep **Inventory** updated through **Products** or **Settings** bulk import
✓ Use **Labels** to display products in your store
✓ Check **Dashboard** each morning for alerts and metrics

*/
