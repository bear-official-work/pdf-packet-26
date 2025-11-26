// Product types
export type ProductType = 'structural-floor' | 'underlayment';

// Form data types
export interface ProjectFormData {
  productType: ProductType;
  projectName: string;
  submittedTo: string;
  preparedBy: string;
  projectNumber?: string;
  emailAddress: string;
  phoneNumber: string;
  date: string;
  status: {
    forReview: boolean;
    forApproval: boolean;
    forRecord: boolean;
    forInformationOnly: boolean;
  };
  submittalType: {
    tds: boolean;
    threePartSpecs: boolean;
    testReportIccEsr5194: boolean;
    testReportIccEsr5192: boolean;
    testReportIccEsl1645: boolean;
    fireAssembly: boolean;
    fireAssembly01: boolean;
    fireAssembly02: boolean;
    fireAssembly03: boolean;
    fireAssembly04: boolean;
    fireAssembly05: boolean;
    fireAssembly06: boolean;
    fireAssembly07: boolean;
    fireAssembly08: boolean;
    fireAssembly09: boolean;
    msds: boolean;
    leedGuide: boolean;
    installationGuide: boolean;
    warranty: boolean;
    samples: boolean;
    other: boolean;
    otherText?: string;
  };
  productSize: string;
}

// Document types
export interface Document {
  id: string;
  name: string;
  description: string;
  filename: string;
  url: string; // Legacy support - empty for uploaded files
  size: number;
  type: string;
  required: boolean;
  products: string[];
  productType: ProductType; // Single category: 'structural-floor' or 'underlayment'
  fileData?: string; // Base64 encoded file data (optional, used for worker communication)
}

export interface SelectedDocument {
  id: string;
  document: Document;
  selected: boolean;
  order: number;
}

// App state
export interface AppState {
  currentStep: number;
  formData: Partial<ProjectFormData>;
  selectedDocuments: SelectedDocument[];
  isGenerating: boolean;
  darkMode: boolean;
}

// Document type for filtering
export type DocumentType = 'TDS' | 'ESR' | 'MSDS' | 'LEED' | 'Installation' | 'warranty' | 'Acoustic' | 'PartSpec';
