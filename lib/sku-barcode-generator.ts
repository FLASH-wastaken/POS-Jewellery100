// Smart SKU and Barcode Generator for Jewelry Products
// Extracts diamond grades and generates standardized codes

let barcodeCounter = 100000

// Extract diamond grade from custom text (e.g., "G-VS-SI" -> "VS", "DEF VVS1" -> "VVS1")
export function extractDiamondGrade(customText?: string): string {
  if (!customText) return "ND" // No Diamond

  const gradePatterns = [
    /\b(VVS1|VVS2|VS1|VS2|SI1|SI2|I1|I2|I3)\b/i,
    /\b([A-Z]{1,3}-(?:VVS1?|VS[12]|SI[12]|I[123]))\b/i,
    /\b(DEF|GHI|JKL|MNO)\s+(VVS|VS|SI)\b/i,
  ]

  for (const pattern of gradePatterns) {
    const match = customText.match(pattern)
    if (match) {
      return match[1].toUpperCase()
    }
  }

  return "ND"
}

// Generate SKU: CATEGORY-GRADE-WEIGHT-SEQUENCE
export function generateSKU(category: string, grade: string, caratWeight?: number, sequence = 1): string {
  const categoryCode = getCategoryCode(category)
  const weight = caratWeight ? `${caratWeight.toFixed(2)}CT` : "0CT"
  const seq = String(sequence).padStart(3, "0")
  return `${categoryCode}-${grade}-${weight}-${seq}`
}

// Generate Barcode: 13-digit format (1 + category + grade + weight + sequence)
export function generateBarcode(): string {
  const barcode = barcodeCounter.toString().padStart(12, "0")
  barcodeCounter++
  return `1${barcode}` // 13-digit barcode
}

// Reset barcode counter (for testing)
export function resetBarcodeCounter() {
  barcodeCounter = 100000
}

function getCategoryCode(category: string): string {
  const codes: Record<string, string> = {
    rings: "RNG",
    earrings: "ERR",
    necklaces: "NCK",
    bracelets: "BRC",
    pendants: "PND",
    bangles: "BNG",
    chains: "CHN",
    other: "OTH",
  }
  return codes[category.toLowerCase()] || "OTH"
}
