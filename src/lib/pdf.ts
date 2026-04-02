import { extractText } from 'unpdf';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text from PDF using unpdf
 * Lightweight, serverless-friendly library
 */
export async function extractTextFromPDF(
  pdfBuffer: Uint8Array
): Promise<PDFExtractionResult> {
  try {
    const result = await extractText(pdfBuffer);

    const text = typeof result.text === 'string' ? result.text : result.text.join('\n');

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    // Clean up text
    const cleanedText = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();

    return {
      text: cleanedText,
      pageCount: result.totalPages || 1,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(
      `Failed to extract text from PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
