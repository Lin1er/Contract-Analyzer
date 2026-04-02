import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import type { ExtractResponse } from '@/types';

export const runtime = 'nodejs';

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse<ExtractResponse>> {
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

    // Extract text from PDF
    const result = await extractTextFromPDF(data);

    return NextResponse.json({
      success: true,
      text: result.text,
      pageCount: result.pageCount,
    });
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('Invalid PDF') || errorMessage.includes('corrupt')) {
      return NextResponse.json(
        { success: false, error: 'The file appears to be corrupted or is not a valid PDF' },
        { status: 400 }
      );
    }

    if (errorMessage.includes('No text content')) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from PDF. The file may be empty or only contain images.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to extract text from PDF. Please try again.' },
      { status: 500 }
    );
  }
}
