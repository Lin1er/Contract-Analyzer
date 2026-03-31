import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rateLimit';
import type { AnalyzeResponse, AnalysisResult, Severity } from '@/types';

export const runtime = 'nodejs';

// Maximum text length to analyze (roughly 50k characters)
const MAX_TEXT_LENGTH = 50000;

// System instructions for each language
const SYSTEM_INSTRUCTIONS = {
  en: `Act as an expert lawyer. Analyze the following contract. Identify any 'red flags' such as hidden fees, unreasonable termination clauses, or privacy issues. Return the response in a STRICT JSON format containing a 'summary' (string), 'overallRisk' (must be 'high', 'medium', or 'low'), and an array of 'redFlags' (objects with 'title', 'description', 'severity' which must be 'high', 'medium', or 'low', and optionally 'clause' with the relevant contract text). Also include 'positivePoints' as an array of strings if there are good aspects. Explain each red flag in simple, ELI5 language that anyone can understand. Return the explanation and summary entirely in English.`,

  id: `Bertindaklah sebagai pengacara ahli. Analisis kontrak berikut. Identifikasi 'tanda bahaya' seperti biaya tersembunyi, klausul pemutusan yang tidak wajar, atau masalah privasi. Kembalikan respons dalam format JSON KETAT yang berisi 'summary' (string), 'overallRisk' (harus 'high', 'medium', atau 'low'), dan array 'redFlags' (objek dengan 'title', 'description', 'severity' yang harus 'high', 'medium', atau 'low', dan opsional 'clause' dengan teks kontrak yang relevan). Sertakan juga 'positivePoints' sebagai array string jika ada aspek positif. Jelaskan setiap tanda bahaya dalam bahasa sederhana yang mudah dipahami siapa saja. PENTING: Kembalikan penjelasan dan ringkasan sepenuhnya dalam Bahasa Indonesia. Namun, JANGAN terjemahkan kunci JSON (summary, overallRisk, redFlags, title, description, severity, clause, positivePoints) - biarkan dalam bahasa Inggris untuk stabilitas kode.`,
};

const PROMPTS = {
  en: (contractText: string) => `Analyze this contract and return your analysis as JSON:

CONTRACT TEXT:
"""
${contractText}
"""

Remember to return valid JSON with: summary, overallRisk (high/medium/low), redFlags array, and positivePoints array. All explanations must be in English.`,

  id: (contractText: string) => `Analisis kontrak ini dan kembalikan analisis Anda sebagai JSON:

TEKS KONTRAK:
"""
${contractText}
"""

Ingat untuk mengembalikan JSON yang valid dengan: summary, overallRisk (high/medium/low), array redFlags, dan array positivePoints. Semua penjelasan dan deskripsi HARUS dalam Bahasa Indonesia, tetapi kunci JSON tetap dalam bahasa Inggris.`,
};

type Language = 'en' | 'id';

function validateAndParseResponse(content: string): AnalysisResult | null {
  try {
    const parsed = JSON.parse(content);

    // Validate structure
    if (typeof parsed.summary !== 'string') return null;
    if (!['high', 'medium', 'low'].includes(parsed.overallRisk)) {
      // Default to medium if not specified
      parsed.overallRisk = 'medium';
    }
    if (!Array.isArray(parsed.redFlags)) return null;

    // Validate and clean red flags
    const validRedFlags = parsed.redFlags.filter((flag: Record<string, unknown>) =>
      typeof flag.title === 'string' &&
      typeof flag.description === 'string' &&
      ['high', 'medium', 'low'].includes(flag.severity as string)
    ).map((flag: Record<string, unknown>) => ({
      title: flag.title as string,
      description: flag.description as string,
      severity: flag.severity as Severity,
      clause: typeof flag.clause === 'string' ? flag.clause : undefined,
    }));

    return {
      summary: parsed.summary,
      overallRisk: parsed.overallRisk as Severity,
      redFlags: validRedFlags,
      positivePoints: Array.isArray(parsed.positivePoints)
        ? parsed.positivePoints.filter((p: unknown) => typeof p === 'string')
        : undefined,
    };
  } catch (err) {
    console.error('JSON parse error:', err);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    // Rate limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = checkRateLimit(`analyze:${clientIp}`);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // Check for API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, language: requestedLang } = body;

    // Validate and default language
    const language: Language = requestedLang === 'id' ? 'id' : 'en';

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: language === 'id' ? 'Tidak ada teks kontrak yang diberikan' : 'No contract text provided' },
        { status: 400 }
      );
    }

    if (text.trim().length < 100) {
      return NextResponse.json(
        { success: false, error: language === 'id' ? 'Teks kontrak terlalu pendek untuk dianalisis. Mohon berikan lebih banyak konten.' : 'Contract text is too short to analyze. Please provide more content.' },
        { status: 400 }
      );
    }

    // Truncate if too long
    const contractText = text.length > MAX_TEXT_LENGTH
      ? text.substring(0, MAX_TEXT_LENGTH) + (language === 'id' ? '\n\n[Kontrak dipotong untuk analisis...]' : '\n\n[Contract truncated for analysis...]')
      : text;

    // Initialize Gemini with language-specific system instruction
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTIONS[language],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3, // Lower temperature for more consistent analysis
      },
    });

    const prompt = PROMPTS[language](contractText);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const content = response.text();

    if (!content) {
      return NextResponse.json(
        { success: false, error: language === 'id' ? 'Tidak ada respons dari AI. Silakan coba lagi.' : 'No response received from AI. Please try again.' },
        { status: 500 }
      );
    }

    const analysis = validateAndParseResponse(content);

    if (!analysis) {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { success: false, error: language === 'id' ? 'Gagal memproses analisis AI. Silakan coba lagi.' : 'Failed to parse AI analysis. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific Gemini errors
    if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
      return NextResponse.json(
        { success: false, error: 'Invalid Gemini API key. Please check your configuration.' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('quota')) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (errorMessage.includes('SAFETY')) {
      return NextResponse.json(
        { success: false, error: 'The content was flagged by safety filters. Please try with different content.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to analyze contract. Please try again.' },
      { status: 500 }
    );
  }
}
