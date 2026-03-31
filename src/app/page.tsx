'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Shield, FileCheck, Zap, Lock, ArrowRight, History } from 'lucide-react';
import { FileUploadZone } from '@/components/contract/FileUploadZone';
import { ResultsDashboard } from '@/components/contract/ResultsDashboard';
import { LoadingState } from '@/components/contract/LoadingState';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HistoryPanel } from '@/components/HistoryPanel';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { addToHistory } from '@/lib/history';
import { withRetry, fetchWithTimeout, parseError } from '@/lib/errors';
import { trackEvent, trackAnalysisComplete, trackAnalysisError } from '@/lib/analytics';
import type { UploadState, AnalysisResult, ExtractResponse, AnalyzeResponse, HistoryEntry } from '@/types';

export default function HomePage() {
  const { t, language } = useI18n();
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Store current retry count in ref to avoid stale closure
  const retryCountRef = useRef(0);
  
  // Keep ref in sync via effect
  useEffect(() => {
    retryCountRef.current = retryCount;
  }, [retryCount]);

  // Track page view on mount
  useEffect(() => {
    trackEvent('page_view', { path: '/' });
  }, []);

  const handleReset = useCallback(() => {
    setUploadState('idle');
    setAnalysis(null);
    setError(null);
    setFileName(null);
    setRetryCount(0);
  }, []);

  const analyzeText = useCallback(async (text: string, currentFileName: string) => {
    setUploadState('analyzing');
    setError(null);
    setRetryCount(0);
    
    try {
      const result = await withRetry(
        async () => {
          const response = await fetchWithTimeout('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language }),
          }, 90000); // 90 second timeout for analysis

          const data: AnalyzeResponse = await response.json();

          if (!data.success || !data.analysis) {
            const appError = parseError(new Error(data.error || t('analysisFailed')), response.status);
            throw appError;
          }

          return data.analysis;
        },
        { maxRetries: 2, baseDelay: 2000 },
        (attempt) => {
          setRetryCount(attempt);
          toast.info(`${t('retryAttempt')} ${attempt} ${t('of')} 2...`);
        }
      );

      setAnalysis(result);
      setUploadState('complete');
      
      // Save to history
      addToHistory(currentFileName, result, language);
      
      // Track analytics
      trackAnalysisComplete(result.redFlags.length, result.overallRisk, language);
      
      toast.success(t('analysisCompleteToast'), {
        description: `${result.redFlags.length} ${t('potentialIssues')}`,
      });
    } catch (err) {
      const appError = parseError(err);
      // Use translation key if it matches, otherwise use the raw message
      const errorMessage = t(appError.message as Parameters<typeof t>[0]) !== appError.message 
        ? t(appError.message as Parameters<typeof t>[0])
        : appError.message;
      
      // Track error
      trackAnalysisError(appError.code, retryCountRef.current);
      
      setError(errorMessage);
      setUploadState('error');
      toast.error(t('analysisFailedToast'), { description: errorMessage });
    }
  }, [language, t]);

  const handleFileSelect = useCallback(async (file: File) => {
    setUploadState('extracting');
    setError(null);
    setFileName(file.name);
    setRetryCount(0);
    
    // Track file upload
    trackEvent('file_upload_started', { file_size: file.size, file_type: file.type });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const extractedText = await withRetry(
        async () => {
          const response = await fetchWithTimeout('/api/extract', {
            method: 'POST',
            body: formData,
          }, 60000); // 60 second timeout

          const data: ExtractResponse = await response.json();

          if (!data.success || !data.text) {
            const appError = parseError(new Error(data.error || t('extractionFailed')), response.status);
            throw appError;
          }

          toast.success(t('extractSuccess'), {
            description: `${data.pageCount || 1} ${t('pagesProcessed')}`,
          });

          return data.text;
        },
        { maxRetries: 2, baseDelay: 1500 },
        (attempt) => {
          setRetryCount(attempt);
          toast.info(`${t('retryAttempt')} ${attempt} ${t('of')} 2...`);
        }
      );

      // Now analyze the extracted text
      await analyzeText(extractedText, file.name);
    } catch (err) {
      const appError = parseError(err);
      const errorMessage = t(appError.message as Parameters<typeof t>[0]) !== appError.message 
        ? t(appError.message as Parameters<typeof t>[0])
        : appError.message;
      
      setError(errorMessage);
      setUploadState('error');
      toast.error(t('extractionFailedToast'), { description: errorMessage });
    }
  }, [analyzeText, t]);

  const handleTextSubmit = useCallback(async (text: string) => {
    const pastedFileName = language === 'id' ? 'Teks Ditempel' : 'Pasted Text';
    setFileName(pastedFileName);
    trackEvent('text_paste_submitted', { text_length: text.length });
    await analyzeText(text, pastedFileName);
  }, [analyzeText, language]);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setAnalysis(entry.analysis);
    setFileName(entry.fileName);
    setUploadState('complete');
    setHistoryOpen(false);
    trackEvent('history_entry_selected');
    toast.success(t('analysisRestored'));
  }, [t]);

  const isProcessing = uploadState === 'extracting' || uploadState === 'analyzing';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">{t('appName')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
              <Lock className="w-4 h-4" />
              {t('securePrivate')}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-9 h-9"
              onClick={() => setHistoryOpen(true)}
              title={t('recentAnalyses')}
            >
              <History className="w-4 h-4" />
            </Button>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {uploadState === 'complete' && analysis ? (
          /* Results Dashboard */
          <div className="container mx-auto px-4 py-8">
            <ResultsDashboard 
              analysis={analysis} 
              fileName={fileName} 
              onReset={handleReset} 
            />
          </div>
        ) : isProcessing ? (
          /* Loading State */
          <div className="container mx-auto px-4 py-8">
            <LoadingState 
              stage={uploadState as 'extracting' | 'analyzing'} 
              fileName={fileName}
              retryCount={retryCount}
            />
          </div>
        ) : (
          /* Hero Section & Upload */
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="max-w-3xl mx-auto text-center space-y-6 mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Zap className="w-4 h-4" />
                {t('badge')}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                {t('heroTitle')}
                <span className="block text-primary">{t('heroTitleHighlight')}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('heroDescription')}
              </p>
            </div>

            {/* Upload Zone */}
            <FileUploadZone
              onFileSelect={handleFileSelect}
              onTextSubmit={handleTextSubmit}
              isProcessing={isProcessing}
              error={error}
            />

            {/* Features */}
            <div className="mt-16 grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <FeatureCard
                icon={<FileCheck className="w-5 h-5" />}
                title={t('instantAnalysis')}
                description={t('instantAnalysisDesc')}
              />
              <FeatureCard
                icon={<Shield className="w-5 h-5" />}
                title={t('redFlagDetection')}
                description={t('redFlagDetectionDesc')}
              />
              <FeatureCard
                icon={<Lock className="w-5 h-5" />}
                title={t('privacyFirst')}
                description={t('privacyFirstDesc')}
              />
            </div>

            {/* Example Prompt */}
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="rounded-xl border bg-muted/30 p-6">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  {t('whatWeLookFor')}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <ul className="space-y-2">
                    <li>• {t('unreasonablePenalties')}</li>
                    <li>• {t('hiddenFees')}</li>
                    <li>• {t('privacyViolations')}</li>
                  </ul>
                  <ul className="space-y-2">
                    <li>• {t('oneSidedLiability')}</li>
                    <li>• {t('nonCompete')}</li>
                    <li>• {t('waivedRights')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>{t('footerDisclaimer')}</p>
        </div>
      </footer>

      {/* History Panel */}
      <HistoryPanel 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        onSelectEntry={handleHistorySelect}
      />
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
