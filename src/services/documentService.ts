import type { Document, DocumentType } from '@/types'

// IndexedDB configuration
const DB_NAME = 'PDFPacketDB'
const DB_VERSION = 1
const STORE_NAME = 'documents'
const FILE_STORE_NAME = 'files'

class DocumentService {
  private db: IDBDatabase | null = null

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create documents store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }

        // Create files store (stores actual PDF blobs)
        if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
          db.createObjectStore(FILE_STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * Ensure DB is initialized
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Failed to initialize database')
    }
    return this.db
  }

  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<Document[]> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get documents by product type
   */
  async getDocumentsByProductType(productType: 'structural-floor' | 'underlayment'): Promise<Document[]> {
    const allDocs = await this.getAllDocuments()
    return allDocs.filter(doc => doc.productType === productType)
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get document file blob
   */
  async getDocumentFile(id: string): Promise<Blob | null> {
    const db = await this.ensureDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([FILE_STORE_NAME], 'readonly')
      const store = transaction.objectStore(FILE_STORE_NAME)
      const request = store.get(id)

      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.blob : null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Validate PDF file
   */
  private async validatePDF(file: File): Promise<{ valid: boolean; error?: string }> {
    // Check file type
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF document' }
    }

    // Check file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' }
    }

    // Check file size (min 1KB)
    if (file.size < 1024) {
      return { valid: false, error: 'File is too small to be a valid PDF' }
    }

    try {
      // Read first few bytes to verify PDF signature
      const arrayBuffer = await file.slice(0, 5).arrayBuffer()
      const bytes = new Uint8Array(arrayBuffer)
      const signature = String.fromCharCode(...bytes)
      
      if (!signature.startsWith('%PDF')) {
        return { valid: false, error: 'File does not appear to be a valid PDF' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, error: 'Failed to read file' }
    }
  }

  /**
   * Upload a new document
   */
  async uploadDocument(
    file: File,
    productType: 'structural-floor' | 'underlayment',
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    // Validate file first
    const validation = await this.validatePDF(file)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid PDF file')
    }

    const db = await this.ensureDB()

    // Generate unique ID
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Read file
    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' })

    // Detect document type from filename
    const type = this.detectDocumentType(file.name)

    // Create document metadata
    const document: Document = {
      id,
      name: this.extractDocumentName(file.name, type),
      description: `${type} Document`,
      filename: file.name,
      url: '', // Not needed for local storage
      size: file.size,
      type,
      required: false,
      products: productType === 'structural-floor' 
        ? ['3/4-in (20mm)'] 
        : ['1/2-in (13mm)', '5/8-in (16mm)'],
      productType, // Single category
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, FILE_STORE_NAME], 'readwrite')
      
      // Store metadata
      const docStore = transaction.objectStore(STORE_NAME)
      const docRequest = docStore.add(document)

      // Store file blob
      const fileStore = transaction.objectStore(FILE_STORE_NAME)
      const fileRequest = fileStore.add({ id, blob })

      docRequest.onsuccess = () => {
        if (onProgress) onProgress(50)
      }
      
      fileRequest.onsuccess = () => {
        if (onProgress) onProgress(100)
      }

      transaction.oncomplete = () => resolve(document)
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * Update document metadata
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const db = await this.ensureDB()
    const existing = await this.getDocument(id)
    
    if (!existing) {
      throw new Error('Document not found')
    }

    const updated = { ...existing, ...updates, id } // Preserve ID

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(updated)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, FILE_STORE_NAME], 'readwrite')
      
      // Delete metadata
      const docStore = transaction.objectStore(STORE_NAME)
      docStore.delete(id)

      // Delete file
      const fileStore = transaction.objectStore(FILE_STORE_NAME)
      fileStore.delete(id)

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * Import documents from legacy JSON format
   */
  async importLegacyDocuments(legacyDocs: Document[]): Promise<void> {
    const db = await this.ensureDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      legacyDocs.forEach((doc) => {
        store.put(doc)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * Detect document type from filename
   */
  private detectDocumentType(filename: string): DocumentType {
    const lower = filename.toLowerCase()
    
    if (lower.includes('tds') || lower.includes('technical data')) return 'TDS'
    if (lower.includes('esr') || lower.includes('evaluation report')) return 'ESR'
    if (lower.includes('msds') || lower.includes('safety data')) return 'MSDS'
    if (lower.includes('leed')) return 'LEED'
    if (lower.includes('installation') || lower.includes('install')) return 'Installation'
    if (lower.includes('warranty')) return 'Warranty'
    if (lower.includes('acoustic') || lower.includes('esl')) return 'Acoustic'
    if (lower.includes('spec') || lower.includes('3-part')) return 'PartSpec'
    
    return 'TDS' // Default
  }

  /**
   * Extract a clean document name from filename
   */
  private extractDocumentName(filename: string, type: DocumentType): string {
    // Remove .pdf extension
    let name = filename.replace(/\.pdf$/i, '')
    
    // Try to create a clean name based on type
    const typeMap: Record<DocumentType, string> = {
      TDS: 'Technical Data Sheet',
      ESR: 'Evaluation Report',
      MSDS: 'Material Safety Data Sheet',
      LEED: 'LEED Credit Guide',
      Installation: 'Installation Guide',
      Warranty: 'Limited Warranty',
      Acoustic: 'Acoustical Performance',
      PartSpec: '3-Part Specifications',
    }

    return typeMap[type] || name
  }

  /**
   * Export document as base64 (for worker communication)
   */
  async exportDocumentAsBase64(id: string): Promise<string | null> {
    const blob = await this.getDocumentFile(id)
    if (!blob) return null

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove data URL prefix
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * Get all documents as base64 for worker
   */
  async getAllDocumentsWithData(): Promise<Array<Document & { fileData: string }>> {
    const documents = await this.getAllDocuments()
    const results = []

    for (const doc of documents) {
      const fileData = await this.exportDocumentAsBase64(doc.id)
      if (fileData) {
        results.push({ ...doc, fileData })
      }
    }

    return results
  }
}

// Export singleton instance
export const documentService = new DocumentService()

// Initialize on module load
documentService.init().catch(console.error)

