import { PDFDocument } from 'pdf-lib'

export interface PDFCheckResult {
  filename: string
  isAccessible: boolean
  isEncrypted: boolean
  error?: string
  pageCount?: number
  size: number
}

export class PDFChecker {
  /**
   * Check if a PDF is accessible and get basic info
   */
  static async checkPDF(url: string, filename: string, size: number): Promise<PDFCheckResult> {
    const result: PDFCheckResult = {
      filename,
      isAccessible: false,
      isEncrypted: false,
      size
    }

    try {
      // Fetch the PDF
      const response = await fetch(url)
      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`
        return result
      }

      const pdfBytes = await response.arrayBuffer()

      // Try to load without ignoring encryption
      try {
        const pdf = await PDFDocument.load(pdfBytes)
        result.isAccessible = true
        result.pageCount = pdf.getPageCount()
        return result
      } catch (encryptionError) {
        // Check if it's an encryption error
        const error = encryptionError as Error
        if (error && error.message && error.message.includes('encrypted')) {
          result.isEncrypted = true
          
          // Try with ignoreEncryption to see if we can still read it
          try {
            const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
            result.isAccessible = true
            result.pageCount = pdf.getPageCount()
            result.error = 'PDF is encrypted but can be processed'
          } catch (ignoreError) {
            result.error = 'PDF is encrypted and cannot be processed'
          }
        } else {
          result.error = error.message || 'Unknown PDF error'
        }
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error'
    }

    return result
  }

  /**
   * Check multiple PDFs
   */
  static async checkMultiplePDFs(documents: Array<{ url: string; filename: string; size: number }>): Promise<PDFCheckResult[]> {
    const results = await Promise.all(
      documents.map(doc => this.checkPDF(doc.url, doc.filename, doc.size))
    )
    return results
  }
}
