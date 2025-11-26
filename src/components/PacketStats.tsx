import { motion } from 'framer-motion'
import type { SelectedDocument, ProjectFormData } from '@/types'
import { formatFileSize } from '@/utils'

interface PacketStatsProps {
  selectedDocuments: SelectedDocument[]
  formData: Partial<ProjectFormData>
  isGenerating?: boolean
  generatedSize?: number
}

export default function PacketStats({ 
  selectedDocuments, 
  formData, 
  isGenerating = false,
  generatedSize 
}: PacketStatsProps) {
  // Calculate statistics
  const selectedDocs = selectedDocuments.filter(doc => doc.selected)
  const totalDocuments = selectedDocs.length
  const totalSize = selectedDocs.reduce((sum, doc) => sum + (doc.document.size || 0), 0)
  const estimatedFinalSize = totalSize + (totalDocuments * 50000) // Add overhead for cover + dividers
  
  const stats = [
    {
      label: 'Documents Selected',
      value: totalDocuments.toString(),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      label: 'Total Size',
      value: formatFileSize(totalSize),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      label: 'Estimated Final Size',
      value: generatedSize ? formatFileSize(generatedSize) : formatFileSize(estimatedFinalSize),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      label: 'Project Status',
      value: isGenerating ? 'Generating...' : (formData.status || 'Draft'),
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`${stat.bgColor} rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50`}
        >
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Document breakdown component
interface DocumentBreakdownProps {
  selectedDocuments: SelectedDocument[]
}

export function DocumentBreakdown({ selectedDocuments }: DocumentBreakdownProps) {
  const selectedDocs = selectedDocuments.filter(doc => doc.selected)
  
  if (selectedDocs.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Document Breakdown
      </h3>
      <div className="space-y-3">
        {selectedDocs.map((doc, index) => (
          <motion.div
            key={doc.document.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-gray-500 dark:text-gray-400 text-sm w-6 text-center">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{doc.document.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{doc.document.description}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 ml-4">
              {formatFileSize(doc.document.size || 0)}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
