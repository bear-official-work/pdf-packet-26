import { motion } from 'framer-motion';
import { pdfService } from '@/services/pdfService';
import type { SelectedDocument, ProjectFormData } from '@/types';
import { cn, formatFileSize } from '@/utils';

interface PacketGenerationProps {
  selectedDocuments: SelectedDocument[];
  onPrevious: () => void;
  onNext: () => void;
  isGenerating: boolean;
  onSetGenerating: (isGenerating: boolean) => void;
  formData: Partial<ProjectFormData>;
}

const PacketGeneration = ({
  selectedDocuments,
  onPrevious,
  onNext,
  isGenerating,
  onSetGenerating,
  formData
}: PacketGenerationProps) => {
  // Calculate total size
  const totalSize = selectedDocuments.filter(doc => doc.selected).reduce((sum, doc) => sum + (doc.document.size || 0), 0);
  const sortedDocs = selectedDocuments.filter(doc => doc.selected).sort((a, b) => a.order - b.order);

  // Helper function to map selected documents to submittalType checkboxes
  const getSubmittalTypeFromDocuments = () => {
    const submittalType = {
      tds: false,
      threePartSpecs: false,
      testReportIccEsr5194: false,
      testReportIccEsr5192: false,
      testReportIccEsl1645: false,
      fireAssembly: false,
      fireAssembly01: false,
      fireAssembly02: false,
      fireAssembly03: false,
      fireAssembly04: false,
      fireAssembly05: false,
      fireAssembly06: false,
      fireAssembly07: false,
      fireAssembly08: false,
      fireAssembly09: false,
      msds: false,
      leedGuide: false,
      installationGuide: false,
      warranty: false,
      samples: false,
      other: false,
    };

    // Populate submittalType based on selected documents
    sortedDocs.forEach(doc => {
      const docName = doc.document.name.toLowerCase();
      const docType = doc.document.type.toLowerCase();
      
      if (docName.includes('technical data sheet') || docType === 'tds') {
        submittalType.tds = true;
      }
      if (docName.includes('3-part spec') || docType === 'partspec') {
        submittalType.threePartSpecs = true;
      }
      if (docName.includes('esr-5194') || docName.includes('esr 5194')) {
        submittalType.testReportIccEsr5194 = true;
      }
      if (docName.includes('esr-5192') || docName.includes('esr 5192')) {
        submittalType.testReportIccEsr5192 = true;
      }
      if (docName.includes('esl-1645') || docName.includes('esl 1645') || docName.includes('acoustical')) {
        submittalType.testReportIccEsl1645 = true;
      }
      if (docName.includes('fire assembly 01')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly01 = true;
      }
      if (docName.includes('fire assembly 02')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly02 = true;
      }
      if (docName.includes('fire assembly 03')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly03 = true;
      }
      if (docName.includes('fire assembly 04')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly04 = true;
      }
      if (docName.includes('fire assembly 05')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly05 = true;
      }
      if (docName.includes('fire assembly 06')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly06 = true;
      }
      if (docName.includes('fire assembly 07')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly07 = true;
      }
      if (docName.includes('fire assembly 08')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly08 = true;
      }
      if (docName.includes('fire assembly 09')) {
        submittalType.fireAssembly = true;
        submittalType.fireAssembly09 = true;
      }
      if (docName.includes('msds') || docName.includes('material safety') || docType === 'msds') {
        submittalType.msds = true;
      }
      if (docName.includes('leed') || docType === 'leed') {
        submittalType.leedGuide = true;
      }
      if (docName.includes('installation') || docType === 'installation') {
        submittalType.installationGuide = true;
      }
      if (docName.includes('warranty') || docType === 'warranty') {
        submittalType.warranty = true;
      }
    });

    return submittalType;
  };

  const handleGenerate = async () => {
    console.log('Generate Packet button clicked');
    if (isGenerating) return;
    onSetGenerating(true);
    try {
      // Ensure all formData fields are provided, using empty strings or defaults
      const preparedFormData = {
        ...formData,
        emailAddress: formData.emailAddress || '',
        phoneNumber: formData.phoneNumber || '',
        productSize: formData.productSize || '3/4-in (20mm)',
        status: formData.status || {
          forReview: false,
          forApproval: false,
          forRecord: false,
          forInformationOnly: false,
        },
        submittalType: getSubmittalTypeFromDocuments(),
        date: formData.date || new Date().toLocaleDateString(),
      };
      console.log('Prepared form data for PDF:', preparedFormData); // Debug output
      const pdfBytes = await pdfService.generatePacket(preparedFormData, sortedDocs);
      pdfService.downloadPDF(pdfBytes, `${formData.projectName || 'Untitled'}_Packet.pdf`);
      onNext();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF packet.');
    } finally {
      onSetGenerating(false);
    }
  };

  const handlePreview = async () => {
    console.log('Preview Packet button clicked');
    if (isGenerating) return;
    onSetGenerating(true);
    try {
      const preparedFormData = {
        ...formData,
        emailAddress: formData.emailAddress || '',
        phoneNumber: formData.phoneNumber || '',
        productSize: formData.productSize || '3/4-in (20mm)',
        status: formData.status || {
          forReview: false,
          forApproval: false,
          forRecord: false,
          forInformationOnly: false,
        },
        submittalType: getSubmittalTypeFromDocuments(),
        date: formData.date || new Date().toLocaleDateString(),
      };
      console.log('Prepared form data for preview:', preparedFormData); // Debug output
      const pdfBytes = await pdfService.generatePacket(preparedFormData, sortedDocs);
      pdfService.previewPDF(pdfBytes);
    } catch (error) {
      console.error('Error generating PDF for preview:', error);
      alert('Failed to generate PDF preview.');
    } finally {
      onSetGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto">
      <div className="card p-8 lg:p-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-display text-gray-900 dark:text-white mb-3">Generate Submittal Packet</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mt-2">Review your selections and generate your submittal packet with cover page and all selected documents.</p>
        </div>

        {/* Statistics Section */}
        <div className="max-w-md mx-auto mb-8">
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 text-center border border-primary-200 dark:border-primary-800">
            <p className="text-primary-700 dark:text-primary-300 font-medium text-2xl">{sortedDocs.length}</p>
            <p className="text-sm text-primary-600 dark:text-primary-400">Documents Selected</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Submittal Packet Summary</h3>
          <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Project Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-gray-700 dark:text-gray-300 mb-6">
              <p><span className="font-medium">Project:</span> {formData.projectName || 'N/A'}</p>
              <p><span className="font-medium">Company:</span> {formData.submittedTo || 'N/A'}</p>
              <p><span className="font-medium">Prepared by:</span> {formData.preparedBy || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {formData.emailAddress || 'N/A'}</p>
              <p><span className="font-medium">Phone:</span> {formData.phoneNumber || 'N/A'}</p>
              <p><span className="font-medium">Project Number:</span> {formData.projectNumber || 'N/A'}</p>
              <p><span className="font-medium">Date:</span> {formData.date || new Date().toLocaleDateString()}</p>
              <p><span className="font-medium">Status:</span> {formData.status ? Object.entries(formData.status).filter(([_, v]) => v).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim()).join(', ') : 'N/A'}</p>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Documents ({sortedDocs.length + 1})</h4>
              <div className="space-y-1">
                <p className="text-gray-700 dark:text-gray-300 font-medium">1. Cover Page</p>
              {sortedDocs.map((doc, index) => {
                  return <p key={doc.id} className="text-gray-700 dark:text-gray-300">{index + 2}. {doc.document.name}</p>;
              })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-8 border-t border-gray-200 dark:border-gray-700 gap-2">
          <motion.button onClick={() => { console.log('Navigating back to arrangement'); onPrevious(); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-outline btn-lg">Back to Arrangement</motion.button>
          <motion.button onClick={handlePreview} disabled={isGenerating || sortedDocs.length === 0} whileHover={!(isGenerating || sortedDocs.length === 0) ? { scale: 1.02 } : {}} whileTap={!(isGenerating || sortedDocs.length === 0) ? { scale: 0.98 } : {}} className={cn('btn btn-outline btn-lg min-w-24', (isGenerating || sortedDocs.length === 0) && 'opacity-50 cursor-not-allowed')}>{isGenerating ? 'Generating...' : 'Preview Packet'}</motion.button>
          <motion.button onClick={handleGenerate} disabled={isGenerating || sortedDocs.length === 0} whileHover={!(isGenerating || sortedDocs.length === 0) ? { scale: 1.02 } : {}} whileTap={!(isGenerating || sortedDocs.length === 0) ? { scale: 0.98 } : {}} className={cn('btn btn-primary btn-lg min-w-24', (isGenerating || sortedDocs.length === 0) && 'opacity-50 cursor-not-allowed')}>{isGenerating ? 'Generating...' : 'Generate Packet'}</motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default PacketGeneration;