// src/services/pdfService.ts
import type { ProjectFormData, SelectedDocument, Document, ProductType } from '@/types'
import { documentService } from './documentService'

export class PDFService {
  private workerUrl: string

  constructor() {
    this.workerUrl = import.meta.env.VITE_WORKER_URL || 'https://pdf-packet-generator.maxterra-pdf-builder.workers.dev'
    console.log('Using Worker URL:', this.workerUrl)
  }

  async generatePacket(
    formData: Partial<ProjectFormData>,
    selectedDocuments: SelectedDocument[]
  ): Promise<Uint8Array> {
    try {
      const sortedDocs = selectedDocuments
        .filter(doc => doc.selected)
        .sort((a, b) => a.order - b.order)

      if (sortedDocs.length === 0) {
        throw new Error('No documents selected for packet generation')
      }

      // Fetch file data for uploaded documents
      const documentsWithData = await Promise.all(
        sortedDocs.map(async (doc) => {
          try {
            const fileData = await documentService.exportDocumentAsBase64(doc.document.id)
            return {
              id: doc.id,
              name: doc.document.name,
              url: doc.document.url || '',
              type: doc.document.type,
              fileData: fileData || undefined,
            }
          } catch (error) {
            console.error(`Error processing document ${doc.document.name}:`, error)
            throw new Error(`Failed to process document: ${doc.document.name}`)
          }
        })
      )

      const selectedDocumentNames = sortedDocs.map(doc => doc.document.name)
      const productType = formData.productType as ProductType
      const allCategoryDocs = await documentService.getDocumentsByProductType(productType)

      // Prepare request payload
      const payload = {
        projectData: {
          ...formData,
          status: formData.status || {
            forReview: false,
            forApproval: false,
            forRecord: false,
            forInformationOnly: false,
          },
          submittalType: formData.submittalType || {
            tds: false,
            threePartSpecs: false,
            testReportIccEsr5194: false,
            testReportIccEsl1645: false,
            fireAssembly: false,
            fireAssembly01: false,
            fireAssembly02: false,
            fireAssembly03: false,
            msds: false,
            leedGuide: false,
            installationGuide: false,
            warranty: false,
            samples: false,
            other: false,
          },
        },
        documents: documentsWithData,
        selectedDocumentNames,
        allAvailableDocuments: allCategoryDocs.map(doc => doc.name)
      }

      console.log('Sending request to worker:', {
        url: `${this.workerUrl}/generate-packet`,
        payload: {
          ...payload,
          documents: payload.documents.map(d => ({
            ...d,
            fileData: d.fileData ? `${d.fileData.substring(0, 30)}...` : 'No file data'
          }))
        }
      })

      const response = await fetch(`${this.workerUrl}/generate-packet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorMessage = `Worker request failed: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`
        } catch (e) {
          const text = await response.text()
          errorMessage += ` - ${text}`
        }
        throw new Error(errorMessage)
      }

      const pdfBuffer = await response.arrayBuffer()
      if (pdfBuffer.byteLength === 0) {
        throw new Error('Received empty PDF from worker')
      }

      console.log(`PDF generated successfully: ${pdfBuffer.byteLength} bytes`)
      return new Uint8Array(pdfBuffer)

    } catch (error) {
      console.error('Error in generatePacket:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          `Cannot connect to PDF Worker at ${this.workerUrl}. ` +
          `Please check your internet connection and make sure the worker is running.`
        )
      }
      throw error instanceof Error ? error : new Error('Failed to generate PDF packet')
    }
  }

  /**
   * Preview PDF in new tab
   */
  previewPDF(pdfBytes: Uint8Array): void {
    try {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const newWindow = window.open(url, '_blank')
      
      // Revoke the object URL after the window is loaded
      if (newWindow) {
        newWindow.onload = () => URL.revokeObjectURL(url)
      } else {
        // Fallback in case popup is blocked
        window.location.href = url
        setTimeout(() => URL.revokeObjectURL(url), 100)
      }
    } catch (error) {
      console.error('Error previewing PDF:', error)
      throw new Error('Failed to preview PDF. Please try again or download the file instead.')
    }
  }

  /**
   * Download PDF to user's device
   */
  downloadPDF(pdfBytes: Uint8Array, filename: string): void {
    try {
      if (!filename.endsWith('.pdf')) {
        filename += '.pdf'
      }
      
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw new Error('Failed to download PDF. Please try again.')
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService()