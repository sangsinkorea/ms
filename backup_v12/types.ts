
// Page Length Options
export type PageLength = 5 | 7 | 9 | 12 | 'auto';

// Product Information Input
export interface ProductInfo {
  name: string;
  category: string;
  price: string;
  features: string;
  targetAudience: string; 
  referenceImages: string[]; 
  analysisContext?: string; // User provided context for better analysis
  length: PageLength;
}

// A single segment of the detail page
export interface DetailImageSegment {
  id: string;
  title: string;       // e.g., "Intro (Hook)"
  logicalSections: string; // e.g., "Hook", "Solution"
  keyMessage: string;  // Korean copy
  visualPrompt: string; // Visual description for AI (English)
  visualPromptKo: string; // Korean translation of visualPrompt
  imageUrl?: string;   // Generated Base64 URL
  isGenerating?: boolean;
  errorMessage?: string; // Reason for failure if any
}

// For Thumbnail
export interface ThumbnailOptions {
  style: 'clean' | 'lifestyle' | 'creative';
  includeModel: boolean;
  textOverlay: string;
}