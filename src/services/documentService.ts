import type { Document, DocumentType, ProductType } from '@/types'
import { supabase } from '@/lib/supabaseClient'

const BUCKET_NAME = 'documents'

class DocumentService {
  /**
   * Get all documents
   */
  async getAllDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      throw error
    }

    return (data || []).map(this.mapDatabaseToDocument)
  }

  /**
   * Get documents by product type
   */
  async getDocumentsByProductType(productType: ProductType): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('product_type', productType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents by product type:', error)
      throw error
    }

    return (data || []).map(this.mapDatabaseToDocument)
  }

  /**
   * Get a single document by ID
   */
  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching document:', error)
      throw error
    }

    return data ? this.mapDatabaseToDocument(data) : null
  }

  /**
   * Validate PDF file
   */
  private async validatePDF(file: File): Promise<{ valid: boolean; error?: string }> {
    if (file.type !== 'application/pdf') {
      return { valid: false, error: 'File must be a PDF document' }
    }

    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return { valid: false, error: 'File size exceeds 50MB limit' }
    }

    if (file.size < 1024) {
      return { valid: false, error: 'File is too small to be a valid PDF' }
    }

    try {
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
    productType: ProductType,
    onProgress?: (progress: number) => void
  ): Promise<Document> {
    const validation = await this.validatePDF(file)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid PDF file')
    }

    try {
      const fileName = `${productType}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`

      if (onProgress) onProgress(25)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file)

      if (uploadError) {
        throw uploadError
      }

      if (onProgress) onProgress(50)

      const { data: publicData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path)

      const type = this.detectDocumentType(file.name)
      const name = this.extractDocumentName(file.name, type)

      const { data: docData, error: insertError } = await supabase
        .from('documents')
        .insert({
          name,
          description: `${type} Document`,
          filename: file.name,
          file_url: publicData.publicUrl,
          size: file.size,
          type,
          product_type: productType,
          required: false,
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      if (onProgress) onProgress(100)

      return this.mapDatabaseToDocument(docData)
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(id: string, updates: Partial<Document>): Promise<void> {
    const existing = await this.getDocument(id)
    if (!existing) {
      throw new Error('Document not found')
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name) updateData.name = updates.name
    if (updates.description) updateData.description = updates.description
    if (updates.required !== undefined) updateData.required = updates.required
    if (updates.type) updateData.type = updates.type

    const { error } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(id: string): Promise<void> {
    const existing = await this.getDocument(id)
    if (!existing) {
      throw new Error('Document not found')
    }

    const fileUrl = existing.url
    const filePath = fileUrl.split('/storage/v1/object/public/documents/')[1]

    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (deleteError) {
        console.error('Error deleting file from storage:', deleteError)
      }
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }
  }

  /**
   * Export document as base64 (for worker communication)
   */
  async exportDocumentAsBase64(id: string): Promise<string | null> {
    const doc = await this.getDocument(id)
    if (!doc || !doc.url) return null

    try {
      const response = await fetch(doc.url)
      const blob = await response.blob()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          const base64Data = base64.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error exporting document:', error)
      return null
    }
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

  /**
   * Map database document to frontend Document type
   */
  private mapDatabaseToDocument(dbDoc: any): Document {
    return {
      id: dbDoc.id,
      name: dbDoc.name,
      description: dbDoc.description || '',
      filename: dbDoc.filename,
      url: dbDoc.file_url,
      size: dbDoc.size || 0,
      type: dbDoc.type,
      required: dbDoc.required || false,
      products: [],
      productType: dbDoc.product_type as ProductType,
    }
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
    if (lower.includes('warranty')) return 'warranty'
    if (lower.includes('acoustic') || lower.includes('esl')) return 'Acoustic'
    if (lower.includes('spec') || lower.includes('3-part')) return 'PartSpec'

    return 'TDS'
  }

  /**
   * Extract a clean document name from filename
   */
  private extractDocumentName(filename: string, type: DocumentType): string {
    let name = filename.replace(/\.pdf$/i, '')

    const typeMap: Record<DocumentType, string> = {
      TDS: 'Technical Data Sheet',
      ESR: 'Evaluation Report',
      MSDS: 'Material Safety Data Sheet',
      LEED: 'LEED Credit Guide',
      Installation: 'Installation Guide',
      warranty: 'Limited Warranty',
      Acoustic: 'Acoustical Performance',
      PartSpec: '3-Part Specifications',
    }

    return typeMap[type] || name
  }
}

export const documentService = new DocumentService()
