// Export utilities for ClearContract
import type { AnalysisResult, Severity } from '@/types';

// Export analysis as JSON
export function exportAsJson(analysis: AnalysisResult, fileName: string): void {
  const exportData = {
    exportedAt: new Date().toISOString(),
    fileName,
    analysis,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  downloadBlob(blob, `${sanitizeFileName(fileName)}_analysis.json`);
}

// Export analysis as formatted text (for PDF generation)
export function exportAsPdf(
  analysis: AnalysisResult,
  fileName: string,
  translations: {
    title: string;
    summary: string;
    overallRisk: string;
    redFlags: string;
    positiveAspects: string;
    highRisk: string;
    mediumRisk: string;
    lowRisk: string;
    disclaimer: string;
    generatedAt: string;
  }
): void {
  const severityLabels: Record<Severity, string> = {
    high: translations.highRisk,
    medium: translations.mediumRisk,
    low: translations.lowRisk,
  };

  // Create a simple HTML document for printing
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${translations.title} - ${fileName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 24px; margin-bottom: 8px; color: #0f172a; }
    h2 { font-size: 18px; margin: 24px 0 12px; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    h3 { font-size: 14px; margin: 16px 0 8px; color: #475569; }
    p { margin-bottom: 12px; }
    .meta { color: #64748b; font-size: 14px; margin-bottom: 24px; }
    .summary-box { 
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      padding: 16px; 
      margin-bottom: 24px;
    }
    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .risk-high { background: #fef2f2; color: #dc2626; }
    .risk-medium { background: #fffbeb; color: #d97706; }
    .risk-low { background: #eff6ff; color: #2563eb; }
    .flag-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .flag-high { border-left: 4px solid #dc2626; }
    .flag-medium { border-left: 4px solid #d97706; }
    .flag-low { border-left: 4px solid #2563eb; }
    .flag-title { font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .flag-description { color: #475569; font-size: 14px; }
    .clause { 
      background: #f8fafc; 
      border-radius: 4px; 
      padding: 12px; 
      margin-top: 12px;
      font-style: italic;
      font-size: 13px;
      color: #64748b;
    }
    .positive-list { list-style: none; }
    .positive-list li { 
      padding: 8px 0 8px 28px;
      position: relative;
      border-bottom: 1px solid #f1f5f9;
    }
    .positive-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #22c55e;
      font-weight: bold;
    }
    .disclaimer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 20px; }
      .flag-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${translations.title}</h1>
  <p class="meta">${fileName} • ${translations.generatedAt}: ${new Date().toLocaleString()}</p>
  
  <div class="summary-box">
    <div style="margin-bottom: 12px;">
      <span class="risk-badge risk-${analysis.overallRisk}">${translations.overallRisk}: ${severityLabels[analysis.overallRisk]}</span>
    </div>
    <h3>${translations.summary}</h3>
    <p>${analysis.summary}</p>
  </div>

  ${analysis.redFlags.length > 0 ? `
  <h2>${translations.redFlags} (${analysis.redFlags.length})</h2>
  ${analysis.redFlags.map(flag => `
    <div class="flag-card flag-${flag.severity}">
      <div class="flag-title">
        <span class="risk-badge risk-${flag.severity}">${severityLabels[flag.severity]}</span>
        ${flag.title}
      </div>
      <p class="flag-description">${flag.description}</p>
      ${flag.clause ? `<div class="clause">"${flag.clause}"</div>` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${analysis.positivePoints && analysis.positivePoints.length > 0 ? `
  <h2>${translations.positiveAspects}</h2>
  <ul class="positive-list">
    ${analysis.positivePoints.map(point => `<li>${point}</li>`).join('')}
  </ul>
  ` : ''}

  <p class="disclaimer">${translations.disclaimer}</p>
</body>
</html>
  `.trim();

  // Create a new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// Helper to sanitize filename
function sanitizeFileName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars
    .substring(0, 50); // Limit length
}

// Helper to download a blob
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
