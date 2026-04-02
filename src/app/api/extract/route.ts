import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import type { ExtractResponse } from '@/types';

export const runtime = 'nodejs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
  let parser: PDFParse | null = null;
  
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = checkRateLimit(`extract:${clientIp}`);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { 
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Parse PDF using the new API
    parser = new PDFParse({ data });
    
    // Get document info for page count
    const info = await parser.getInfo();
    
    // Extract text
    const textResult = await parser.getText();

    if (!textResult.text || textResult.text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from PDF. The file may be scanned/image-based or empty.' },
        { status: 400 }
      );
    }

    // Clean up the extracted text
    const cleanedText = textResult.text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .trim();

    // Clean up parser
    await parser.destroy();

    return NextResponse.json({
      success: true,
      text: cleanedText,
      pageCount: info.total ?? textResult.total,
    });
  } catch (error) {
    // Clean up parser on error
    if (parser) {
      try {
        await parser.destroy();
      } catch {
        // Ignore cleanup errors
      }
    }
    
    console.error('PDF extraction error:', error);
    
    // Handle specific pdf-parse errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupt')) {
      return NextResponse.json(
        { success: false, error: 'The file appears to be corrupted or is not a valid PDF' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to extract text from PDF. Please try again.' },
      { status: 500 }
    );
  }
}
