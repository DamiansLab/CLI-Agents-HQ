# Product Update Automation Skill (PrestaShop)

This document defines the foundational mandates and workflow for autonomously updating product descriptions, shipping details, SEO, and categorization on the `autocare-gt77.gr` admin panel.

## 🛠 Workflow: Research -> Strategy -> Execution

### 1. Research & Identification
- **Navigation:** Go to `adminpanel/index.php/sell/catalog/products`.
- **Filtering:** Filter by Category (e.g., "Χωρίς Αντιστοίχιση") and Status ("Inactive").
- **Identification:** Extract the Product Title and Reference (SKU) for target products.

### 2. Information Sourcing
- **Web Search:** For each product, search for: `[Title] [SKU] description benefits specifications dimensions weight image EAN-13 MPN`.
- **Validation:** Use official manufacturer sites or reputable detailers/suppliers.
- **Reference Document:** Adhere strictly to the format and style found in `gt77_products_descriptions.txt`.

### 3. Data Entry (Execution)
#### Tab: "Basic Settings" (Βασικές Ρυθμίσεις)
- **Summary (Περίληψη):** Short 1-2 sentence paragraph in Greek, wrapped in `<p>` and `<span>` for keywords.
- **Description (Πλήρη περιγραφή):** Full HTML content including:
    - Detailed introductory paragraphs (`<strong>` for product name).
    - `<hr />` separators.
    - `<h3>✅ Πλεονεκτήματα</h3>` with `<ul>` list.
    - `<h3>⚙️ Προδιαγραφές & Εγκρίσεις</h3>` with `<ul>` list.
    - `<h3>🚗 Κατάλληλο για</h3>` with usage instructions.
    - `<h3>🔧 Τεχνικά Χαρακτηριστικά</h3>` including SKU, EAN-13, and Manufacturer.
- **Implementation:** Use `tinyMCE` via `evaluate_script` to set content.

#### Tab: "Shipping" (Αποστολή)
- **Package Size:** Fill Width, Height, Depth (cm) and Weight (kg) based on research.

#### Tab: "SEO"
- **Meta-title:** Professional Greek title (~60 chars).
- **Meta-description:** Engaging Greek summary (~155 chars).

#### Tab: "Options" (Επιλογές)
- **EAN-13 barcode:** Find and fill the 13-digit code.
- **Manufacturer Code (Κωδ. Κατασκευαστή):** Fill the MPN/Reference from the manufacturer.

### 4. Finalization
- **Status:** Always keep the product **Inactive** (Εκτός σύνδεσης). Activation is handled manually.
- **Save:** Click the "Save" (Αποθήκευση) button (Shortcut: `ALT+SHIFT+S`).
- **Verification:** Ensure the success notification appears.

## ⚠️ Safety & Constraints
- **Formatting:** Never use plain text for descriptions; always use structured HTML.
- **Language:** All customer-facing content MUST be in professional Greek.
- **Sub-agents:** Use the `generalist` sub-agent for batch processing to maintain efficiency.
