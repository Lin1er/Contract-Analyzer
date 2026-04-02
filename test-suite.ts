import PDFDocument from 'pdfkit';
import { spawn } from 'child_process';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

/**
 * Generate a simple test PDF with text
 */
function generateTestPDF(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);

      doc.fontSize(16).text('Test Contract Document', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('This is a test PDF with contract-like content.');
      doc.text('Term 1: This agreement shall commence on the date hereof.');
      doc.text('Term 2: Either party may terminate with 30 days notice.');
      doc.text('Limitation: No liability for indirect damages.');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Wait for server to be ready
 */
async function waitForServer(port: number, timeout: number = 60000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`http://localhost:${port}/`);
      if (response.ok) {
        console.log('✅ Server is ready');
        return true;
      }
    } catch {
      await sleep(1000);
      process.stdout.write('.');
    }
  }
  return false;
}

/**
 * Test PDF extraction
 */
async function testPDFExtraction(): Promise<boolean> {
  console.log('\n📄 Testing PDF Extraction...');
  
  try {
    const pdf = await generateTestPDF();
    console.log('✅ Generated test PDF:', pdf.length, 'bytes');

    const formData = new FormData();
    const uint8Array = new Uint8Array(pdf);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    formData.append('file', blob, 'test.pdf');

    const response = await fetch('http://localhost:3000/api/extract', {
      method: 'POST',
      body: formData,
    });

    interface ExtractResult {
      success?: boolean;
      error?: string;
      text?: string;
      pageCount?: number;
    }
    const result = (await response.json()) as ExtractResult;

    if (!response.ok) {
      console.error('❌ Extract API Error:', result.error);
      return false;
    }

    if (!result.success) {
      console.error('❌ Extraction failed:', result.error);
      return false;
    }

    if (!result.text || result.text.length === 0) {
      console.error('❌ No text extracted');
      return false;
    }

    console.log('✅ Extracted text preview:', result.text.substring(0, 80));
    console.log('✅ Page count:', result.pageCount);
    return true;
  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    return false;
  }
}

/**
 * Test AI analysis endpoint
 */
async function testAIAnalysis(): Promise<boolean> {
  console.log('\n🤖 Testing AI Analysis...');

  try {
    const testText = `EMPLOYMENT AGREEMENT
    1. COMPENSATION: Employee receives $50,000 with no benefits
    2. TERMINATION: Either party may terminate at will without notice
    3. NON-COMPETE: 5 years non-compete clause
    4. LIABILITY WAIVER: Employee waives all rights to sue
    5. UNLIMITED LIABILITY: Company demands unlimited damages`;

    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: testText, language: 'en' }),
    });

    interface AnalysisResult {
      success?: boolean;
      error?: string;
      analysis?: {
        redFlags?: Array<Record<string, unknown>>;
        overallRisk?: string;
      };
    }
    const result = (await response.json()) as AnalysisResult;

    if (!response.ok) {
      console.error('❌ Analyze API Error:', result.error);
      return false;
    }

    if (!result.success) {
      console.error('❌ Analysis failed:', result.error);
      return false;
    }

    console.log('✅ Analysis returned successfully');
    console.log('  - Red flags:', result.analysis?.redFlags?.length || 0);
    console.log('  - Risk level:', result.analysis?.overallRisk);
    return true;
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    return false;
  }
}

/**
 * Test landing page
 */
async function testLandingPage(): Promise<boolean> {
  console.log('\n🌐 Testing Landing Page...');

  try {
    const response = await fetch('http://localhost:3000/');

    if (!response.ok) {
      console.error('❌ Page returned:', response.status);
      return false;
    }

    const html = await response.text();
    if (!html.includes('Contract') && !html.includes('PDF')) {
      console.error('❌ Page content missing');
      return false;
    }

    console.log('✅ Landing page loads successfully');
    return true;
  } catch (error) {
    console.error('❌ Landing page failed:', error);
    return false;
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🚀 Starting Test Suite...\n');

  // Start dev server
  console.log('Starting dev server...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'pipe',
  });

  devServer.stdout?.on('data', () => {
    // Listen for server ready
  });

  // Wait for server
  console.log('Waiting for server to start');
  const ready = await waitForServer(3000);

  if (!ready) {
    console.error('\n❌ Server failed to start');
    devServer.kill();
    process.exit(1);
  }

  // Run tests
  const results: Record<string, boolean> = {};
  results['Landing Page'] = await testLandingPage();
  await sleep(1000);

  results['PDF Extraction'] = await testPDFExtraction();
  await sleep(1000);

  results['AI Analysis'] = await testAIAnalysis();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  Object.entries(results).forEach(([name, success]) => {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}`);
    if (success) passed++;
    else failed++;
  });

  console.log('='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed\n`);

  // Cleanup
  devServer.kill();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
