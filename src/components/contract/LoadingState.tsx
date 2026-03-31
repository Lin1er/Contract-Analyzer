'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface LoadingStateProps {
  stage: 'extracting' | 'analyzing';
  fileName?: string | null;
  retryCount?: number;
}

export function LoadingState({ stage, fileName, retryCount = 0 }: LoadingStateProps) {
  const { t } = useI18n();
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        {fileName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="w-4 h-4" />
            {fileName}
          </div>
        )}
      </div>

      {/* Status Card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                {stage === 'extracting' 
                  ? t('extractingText')
                  : t('analyzingContract')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stage === 'extracting'
                  ? t('extractingDesc')
                  : t('analyzingDesc')}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Retry indicator */}
            {retryCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-3 py-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t('retryAttempt')} {retryCount} {t('of')} 2...</span>
              </div>
            )}
            
            {/* Progress indicators */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stage === 'extracting' ? 'bg-primary animate-pulse' : 'bg-green-500'}`} />
                <span className={`text-sm ${stage === 'extracting' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t('extractStep')}
                </span>
                {stage !== 'extracting' && (
                  <span className="text-xs text-green-600">{t('done')}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  stage === 'analyzing' ? 'bg-primary animate-pulse' : 'bg-muted'
                }`} />
                <span className={`text-sm ${stage === 'analyzing' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t('analyzeStep')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span className="text-sm text-muted-foreground">{t('generateStep')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skeleton placeholders */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-40" />
        </div>
        
        {/* Skeleton cards for red flags */}
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {t('analysisTime')}
      </p>
    </div>
  );
}
