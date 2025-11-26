import { documentService } from '@/services/documentService';

/**
 * Utility to clear all documents from IndexedDB
 */
export async function clearAllDocuments(): Promise<void> {
  try {
    // Get all documents first
    const db = await documentService['ensureDB']();
    
    // Clear documents store
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['documents', 'files'], 'readwrite');
      
      // Clear documents
      const docsStore = transaction.objectStore('documents');
      const clearDocsRequest = docsStore.clear();
      
      // Clear files
      const filesStore = transaction.objectStore('files');
      const clearFilesRequest = filesStore.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => {
        console.error('Transaction error:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
    
    console.log('Successfully cleared all documents and files from IndexedDB');
    
    // Force reload of the page to update the UI
    window.location.reload();
  } catch (error) {
    console.error('Failed to clear documents:', error);
    throw error;
  }
}

// Export a function that can be called from browser console
if (typeof window !== 'undefined') {
  (window as any).clearAllDocuments = clearAllDocuments;
}
