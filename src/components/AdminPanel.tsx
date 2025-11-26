import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, Edit2, Save, X, FileText, Lock, Unlock, Eye, EyeOff, FolderOpen } from 'lucide-react'
import { documentService } from '@/services/documentService'
import type { Document, DocumentType, ProductType } from '@/types'

interface AdminPanelProps {
  onClose?: () => void
}

const ADMIN_PASSWORD = 'admin123'

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<ProductType>('structural-floor')
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Document>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments()
    }
  }, [isAuthenticated])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const docs = await documentService.getAllDocuments()
      setDocuments(docs)
    } catch (err) {
      setError('Failed to load documents')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setError(null)
    } else {
      setError('Invalid password')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setLoading(true)
    setUploadProgress(0)
    setError(null)
    setSuccess(null)

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        try {
          await documentService.uploadDocument(file, selectedCategory, (progress) => {
            setUploadProgress(Math.round((i + progress / 100) / files.length * 100))
          })
          results.successful++
        } catch (fileError) {
          results.failed++
          const errorMsg = fileError instanceof Error ? fileError.message : 'Unknown error'
          results.errors.push(`${file.name}: ${errorMsg}`)
          console.error(`Failed to upload ${file.name}:`, fileError)
        }
      }

      if (results.successful > 0) {
        setSuccess(`Successfully uploaded ${results.successful} document(s) to ${selectedCategory === 'structural-floor' ? 'Structural Floor' : 'Underlayment'}`)
      }
      
      if (results.failed > 0) {
        setError(`Failed to upload ${results.failed} file(s):\n${results.errors.join('\n')}`)
      }

      if (results.successful > 0) {
        await loadDocuments()
      }
      
      e.target.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      console.error(err)
    } finally {
      setLoading(false)
      setUploadProgress(0)
      
      setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 5000)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      setLoading(true)
      await documentService.deleteDocument(docId)
      setSuccess('Document deleted successfully')
      await loadDocuments()
    } catch (err) {
      setError('Failed to delete document')
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleEditDocument = (doc: Document) => {
    setEditingDoc(doc.id)
    setEditForm(doc)
  }

  const handleSaveEdit = async () => {
    if (!editingDoc || !editForm) return

    if (!editForm.name || editForm.name.trim() === '') {
      setError('Document name is required')
      return
    }

    if (!editForm.type) {
      setError('Document type is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await documentService.updateDocument(editingDoc, editForm)
      setSuccess('Document updated successfully')
      setEditingDoc(null)
      setEditForm({})
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document')
      console.error(err)
    } finally {
      setLoading(false)
      setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
    }
  }

  const handleCancelEdit = () => {
    setEditingDoc(null)
    setEditForm({})
  }

  // Filter documents by category
  const structuralFloorDocs = documents.filter(doc => doc.productType === 'structural-floor')
  const underlaymentDocs = documents.filter(doc => doc.productType === 'underlayment')

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card dark:glass-card-dark p-8 max-w-md w-full"
        >
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-12 h-12 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Admin Access
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Unlock className="inline-block w-5 h-5 mr-2" />
              Login
            </button>
          </form>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2"
            >
              Back to App
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Document Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Upload and manage PDF documents by category
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <Lock className="inline-block w-5 h-5 mr-2" />
              Logout
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                <X className="inline-block w-5 h-5 mr-2" />
                Close
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg whitespace-pre-line"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <div className="glass-card dark:glass-card-dark p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Upload Documents
          </h2>
          
          {/* Category Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Select Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductType)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="structural-floor">Structural Floor</option>
              <option value="underlayment">Underlayment</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Documents will be uploaded to the selected category
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload PDF documents
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Will be added to: <strong>{selectedCategory === 'structural-floor' ? 'Structural Floor' : 'Underlayment'}</strong>
                </p>
              </div>
            </label>
          </div>

          {uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Documents by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Structural Floor Documents */}
          <DocumentCategory
            title="Structural Floor Documents"
            icon="🏗️"
            color="green"
            documents={structuralFloorDocs}
            loading={loading}
            editingDoc={editingDoc}
            editForm={editForm}
            onEdit={handleEditDocument}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteDocument}
            onEditFormChange={setEditForm}
          />

          {/* Underlayment Documents */}
          <DocumentCategory
            title="Underlayment Documents"
            icon="📋"
            color="purple"
            documents={underlaymentDocs}
            loading={loading}
            editingDoc={editingDoc}
            editForm={editForm}
            onEdit={handleEditDocument}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteDocument}
            onEditFormChange={setEditForm}
          />
        </div>
      </div>
    </div>
  )
}

// Document Category Component
interface DocumentCategoryProps {
  title: string
  icon: string
  color: 'green' | 'purple'
  documents: Document[]
  loading: boolean
  editingDoc: string | null
  editForm: Partial<Document>
  onEdit: (doc: Document) => void
  onSave: () => void
  onCancel: () => void
  onDelete: (id: string) => void
  onEditFormChange: (form: Partial<Document>) => void
}

function DocumentCategory({
  title,
  icon,
  color,
  documents,
  loading,
  editingDoc,
  editForm,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditFormChange
}: DocumentCategoryProps) {
  const colorClasses = {
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300 dark:border-purple-700'
    }
  }

  const colors = colorClasses[color]

  return (
    <div className="glass-card dark:glass-card-dark p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </p>
          </div>
        </div>
      </div>

      {loading && documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p>No documents in this category yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`border ${colors.border} rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors`}
            >
              {editingDoc === doc.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Document Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => onEditFormChange({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Document Type
                      </label>
                      <select
                        value={editForm.type || ''}
                        onChange={(e) => onEditFormChange({ ...editForm, type: e.target.value as DocumentType })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                      >
                        <option value="TDS">TDS</option>
                        <option value="ESR">ESR</option>
                        <option value="MSDS">MSDS</option>
                        <option value="LEED">LEED</option>
                        <option value="Installation">Installation</option>
                        <option value="Warranty">Warranty</option>
                        <option value="Acoustic">Acoustic</option>
                        <option value="PartSpec">PartSpec</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => onEditFormChange({ ...editForm, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onSave}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Save className="inline-block w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={onCancel}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <X className="inline-block w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <FileText className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {doc.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {doc.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <span className={`px-2 py-1 ${colors.bg} ${colors.text} rounded`}>
                          {doc.type}
                        </span>
                        <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="truncate max-w-xs">{doc.filename}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(doc)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
