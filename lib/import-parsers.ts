/**
 * Parse various file formats for product import
 */

export interface ParsedProduct {
  name: string
  category_id?: number
  category?: string
  price: number
  cost?: number
  stock_quantity?: number
  sku?: string
  barcode?: string
  is_labgrown?: boolean
  gold_weight?: number
  diamond_carat?: number
  gold_type?: string
  custom_text?: string
  [key: string]: any
}

/**
 * Parse CSV content with proper quoted value handling
 * Enhanced CSV parser to handle quoted values and jewelry product columns
 */
export function parseCSV(content: string): ParsedProduct[] {
  const lines = content.trim().split("\n")
  if (lines.length < 2) return []

  // Parse header with proper quote handling
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase())

  const products: ParsedProduct[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const product: Record<string, any> = {}

    headers.forEach((header, index) => {
      let value: any = values[index] || ""

      if (!header || header === "") return // Skip empty headers

      // Type conversion
      if (["price", "cost", "gold_weight", "diamond_carat"].includes(header)) {
        value = value ? Number.parseFloat(value) : 0
      } else if (["category_id", "warehouse_id", "supplier_id"].includes(header)) {
        value = value ? Number.parseInt(value) : null
      } else if (header === "is_labgrown") {
        value = value && value.toLowerCase() === "true"
      }

      product[header] = value
    })

    // Only require name and price; category_id is optional
    if (product.name && product.price) {
      products.push(product as ParsedProduct)
    }
  }

  return products
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      insideQuotes = !insideQuotes
    } else if (char === "," && !insideQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Parse Excel file (requires xlsx library)
 */
export async function parseExcel(arrayBuffer: ArrayBuffer): Promise<ParsedProduct[]> {
  // Dynamic import to keep bundle size small
  const XLSX = await import("xlsx")

  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(worksheet)

  return data.map((row: any) => ({
    name: row.name || row.Name || "",
    category_id: row.category_id || row.category || null,
    price: Number.parseFloat(row.price || row.Price || 0),
    cost: Number.parseFloat(row.cost || row.Cost || 0),
    stock_quantity: Number.parseInt(row.stock_quantity || row.Stock || 0),
    sku: row.sku || row.SKU || "",
    barcode: row.barcode || row.Barcode || "",
    is_labgrown: (row.is_labgrown || row.is_labgrown_lab || "").toString().toLowerCase() === "true",
    gold_weight: Number.parseFloat(row.gold_weight || row.weight || 0),
    diamond_carat: Number.parseFloat(row.diamond_carat || row.Carat || 0),
    gold_type: row.gold_type || row.gold_type_metal || "",
    custom_text: row.custom_text || row.description || "",
  }))
}

/**
 * Parse SQL INSERT statements
 */
export function parseSQL(content: string): ParsedProduct[] {
  const products: ParsedProduct[] = []

  // Match INSERT INTO products (...) VALUES (...)
  const insertRegex = /INSERT\s+INTO\s+products\s*$$(.*?)$$\s*VALUES\s*$$(.*?)$$/gi

  let match
  while ((match = insertRegex.exec(content)) !== null) {
    const columns = match[1].split(",").map((c) => c.trim().toLowerCase())
    const values = match[2].split(",").map((v) => {
      v = v.trim()
      // Remove quotes and handle NULL
      if (v === "NULL" || v === "null") return null
      return v.replace(/^['"]|['"]$/g, "")
    })

    const product: Record<string, any> = {}
    columns.forEach((col, index) => {
      let value: any = values[index]

      // Type conversion
      if (["price", "cost", "gold_weight", "diamond_carat"].includes(col)) {
        value = value ? Number.parseFloat(value) : 0
      } else if (["category_id", "warehouse_id", "supplier_id"].includes(col)) {
        value = value ? Number.parseInt(value) : null
      } else if (col === "is_labgrown") {
        value = value && value.toString().toLowerCase() === "true"
      }

      product[col] = value
    })

    if (product.name && product.price !== undefined) {
      products.push(product as ParsedProduct)
    }
  }

  return products
}

/**
 * Parse HTML table
 */
export function parseHTML(content: string): ParsedProduct[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, "text/html")

  const products: ParsedProduct[] = []
  const table = doc.querySelector("table")

  if (!table) return []

  // Get header row
  const headerRow = table.querySelector("thead tr") || table.querySelector("tbody tr")
  if (!headerRow) return []

  const headers = Array.from(headerRow.querySelectorAll("th, td")).map(
    (cell) => cell.textContent?.trim().toLowerCase() || "",
  )

  // Get data rows
  const bodyRows = table.querySelectorAll("tbody tr")
  bodyRows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"))
    const product: Record<string, any> = {}

    headers.forEach((header, index) => {
      let value: any = cells[index]?.textContent?.trim() || ""

      // Type conversion
      if (["price", "cost", "gold_weight", "diamond_carat"].includes(header)) {
        value = value ? Number.parseFloat(value) : 0
      } else if (["category_id", "warehouse_id", "supplier_id"].includes(header)) {
        value = value ? Number.parseInt(value) : null
      } else if (header === "is_labgrown") {
        value = value && value.toString().toLowerCase() === "true"
      }

      product[header] = value
    })

    if (product.name && product.price !== undefined) {
      products.push(product as ParsedProduct)
    }
  })

  return products
}
