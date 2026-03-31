// Types for ClearContract application

export type Severity = 'high' | 'medium' | 'low';

export interface RedFlag {
  title: string;
  description: string;
  severity: Severity;
  clause?: string; // Optional: the specific clause text that triggered the flag
}

export interface AnalysisResult {
  summary: string;
  overallRisk: Severity;
  redFlags: RedFlag[];
  positivePoints?: string[]; // Optional: good things about the contract
}

export interface ExtractResponse {
  success: boolean;
  text?: string;
  error?: string;
  pageCount?: number;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis?: AnalysisResult;
  error?: string;
}

// Application state types
export type UploadState = 'idle' | 'uploading' | 'extracting' | 'analyzing' | 'complete' | 'error';

export interface AppState {
  uploadState: UploadState;
  extractedText: string | null;
  analysis: AnalysisResult | null;
  error: string | null;
  fileName: string | null;
}

// History types
export interface HistoryEntry {
  id: string;
  fileName: string;
  analysis: AnalysisResult;
  createdAt: number; // timestamp
  language: 'en' | 'id';
}
