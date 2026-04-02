import * as pdfjsLib from 'pdfjs-dist';
import { recognize } from 'tesseract.js';
import { createCanvas } from 'canvas';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Convert PDF to images and extract text using OCR
 * Used as fallback when standard text extraction fails (scanned/image-based PDFs)
 */
export async function extractTextFromScannedPDF(
  pdfBuffer: Uint8Array,
  maxPages: number = 5
): Promise<OCRResult> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
    const pageCount = Math.min(pdf.numPages, maxPages);

    let allText = '';
    let totalConfidence = 0;
    let processedPages = 0;

    // Process each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);

        // Get viewport and render page to canvas
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // Create canvas using node-canvas
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');

        if (!context) {
          console.warn(`Could not get canvas context for page ${pageNum}`);
          continue;
        }

        // Render PDF page to canvas
        await page.render({
          canvasContext: context as any,
          viewport,
        } as any).promise;

        // Run OCR on canvas image
        const result = await recognize(canvas as any, 'eng+ind');

        if (result.data.text) {
          allText += result.data.text + '\n';
          totalConfidence += result.data.confidence;
          processedPages++;
        }
      } catch (pageError) {
        console.warn(`Error processing page ${pageNum}:`, pageError);
        // Continue with next page
      }
    }

    if (processedPages === 0) {
      throw new Error('No text could be extracted from any page using OCR');
    }

    // Calculate average confidence
    const avgConfidence = totalConfidence / processedPages;

    // Clean up extracted text
    const cleanedText = allText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();

    return {
      text: cleanedText,
      confidence: avgConfidence,
    };
  } catch (error) {
    console.error('OCR extraction error:', error);
    throw new Error(
      `Failed to extract text from scanned PDF: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Extract text with automatic fallback to OCR
 * First tries standard pdf-parse, then falls back to tesseract OCR
 */
export async function extractTextWithFallback(
  pdfBuffer: Uint8Array,
  standardText?: string
): Promise<{ text: string; method: 'standard' | 'ocr'; confidence?: number }> {
  // If standard extraction succeeded with reasonable text, use it
  if (standardText && standardText.trim().length > 100) {
    return {
      text: standardText,
      method: 'standard',
    };
  }

  // Otherwise, fall back to OCR
  console.log('Standard text extraction insufficient, falling back to OCR...');
  const ocrResult = await extractTextFromScannedPDF(pdfBuffer);

  return {
    text: ocrResult.text,
    method: 'ocr',
    confidence: ocrResult.confidence,
  };
}
