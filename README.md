Set-Content README.md @"
# 💍 Dorrah Jewellery

A modern, full-stack e-commerce web application for jewellery and accessories, built with **Django** and **MySQL**[cite: 1]. It features an interactive product catalog, multi-stage checkout with custom gifting options, session-based cart management, dark/light theme switching, full bilingual support (Arabic/English), and secure signed electronic invoices[cite: 1].

---

## ✨ Key Features

- **Interactive Product Catalog:** Advanced search, filtering, sorting, modal detail views, customer reviews, and gallery support[cite: 1].
- **Bilingual & Theming:** Full Arabic and English interface with instant Light/Dark mode switching, preserved in browser storage[cite: 1].
- **Multi-Stage Checkout:** Built-in gift packaging and optional greeting card selections (calculated server-side), automatic cart clearance upon order placement[cite: 1].
- **Signed Invoices:** Cryptographically signed, 90-day time-limited invoice links generated on success pages; print-ready layout with "Save as PDF" browser support[cite: 1].
- **Robust Management:** Full Django Admin integration for inventory, sold-out statuses, reviews, orders, and promotional coupons (e.g., \`DORRA10\`)[cite: 1].
- **Production-Ready Database:** Configured for MySQL with connection pooling via \`dj_db_conn_pool\` (plus SQLite fallback for local development)[cite: 1].

---

## 🛠 Tech Stack

- **Backend:** Python, Django[cite: 1]
- **Database:** MySQL (Production) / SQLite (Local Development)[cite: 1]
- **Connection Pooling:** \`dj_db_conn_pool\`[cite: 1]
- **Frontend:** HTML5, CSS3, JavaScript[cite: 1]

---

## 🚀 Getting Started

### 1. MySQL Setup

Create the database and application user[cite: 1]:

\`\`\`sql
CREATE DATABASE dorra_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dorra_app'@'localhost' IDENTIFIED BY '<strong-password>';
GRANT ALL PRIVILEGES ON dorra_store.* TO 'dorra_app'@'localhost';
\`\`\`

Set up the required environment variables[cite: 1]:

\`\`\`powershell
`$env:MYSQL_DATABASE = "dorra_store"
`$env:MYSQL_USER = "dorra_app"
`$env:MYSQL_PASSWORD = "<strong-password>"
`$env:MYSQL_HOST = "127.0.0.1"
`$env:MYSQL_PORT = "3306"
`$env:MYSQL_POOL_SIZE = "5"
`$env:MYSQL_MAX_OVERFLOW = "5"
`$env:MYSQL_POOL_RECYCLE = "1800"
\`\`\`

> **Note:** \`dj_db_conn_pool\` manages connections per process[cite: 1]. Calculate your MySQL maximum connection limits based on the number of application processes multiplied by \`MYSQL_POOL_SIZE + MYSQL_MAX_OVERFLOW\`[cite: 1]. Set \`DB_ENGINE=sqlite\` for quick local development[cite: 1].
>
> In production, ensure \`DJANGO_DEBUG=false\` and generate a cryptographically strong \`DJANGO_SECRET_KEY\`[cite: 1]. The secret key is critical as it signs invoice verification URLs[cite: 1].

---

### 2. Installation & Migrations

Django migrations establish the complete schema—including \`store_product\`, \`store_productimage\`, \`store_order\`, \`store_orderitem\`, and \`store_review\`[cite: 1]. Do not create application tables manually[cite: 1]:

\`\`\`powershell
# Install dependencies
python -m pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create administrator account
python manage.py createsuperuser

# Start development server
python manage.py runserver
\`\`\`

- **Storefront:** \`http://127.0.0.1:8000\`[cite: 1]
- **Django Admin:** \`http://127.0.0.1:8000/admin/\`[cite: 1]

---

### 3. Data Migration (SQLite to MySQL)

To migrate existing records from SQLite to MySQL[cite: 1]:

\`\`\`powershell
# 1. Backup SQLite database
Copy-Item .\db.sqlite3 .\db.sqlite3.bak

# 2. Export existing data
`$env:DB_ENGINE = "sqlite"
python manage.py dumpdata --natural-foreign --exclude=contenttypes --exclude=auth.permission --indent 2 --output=store-data.json

# 3. Apply schema to MySQL and load data
`$env:DB_ENGINE = "mysql"
python manage.py migrate
python manage.py loaddata store-data.json
\`\`\`

Copy the \`media/\` directory to the target environment and verify records using \`python manage.py check\` before redirecting traffic[cite: 1].

---

## 📦 Features Overview & Management

- **Product Gallery & Localization:** After applying migrations, manage bilingual titles/descriptions and gallery images directly in Django Admin[cite: 1]. The primary image serves as the default card display[cite: 1].
- **Gifting Options:** Gift wrapping and custom cards add 5.00 AED per option at checkout[cite: 1]. Costs are securely calculated server-side against database values[cite: 1].
- **Cart & Order Flow:** Session and browser-stored carts are automatically cleared upon successful order creation[cite: 1].
- **Invoices:** Signed invoice links expire after 90 days[cite: 1]. Invoices can be accessed and printed directly from Django Admin or the order completion page[cite: 1].
"@
