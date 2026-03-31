'use client';

import React from 'react';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  FileText,
  ArrowLeft,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileJson,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useI18n } from '@/lib/i18n';
import { exportAsJson, exportAsPdf } from '@/lib/export';
import type { AnalysisResult, Severity, RedFlag } from '@/types';

interface ResultsDashboardProps {
  analysis: AnalysisResult;
  fileName?: string | null;
  onReset: () => void;
}

function RedFlagCard({ flag, index, severityLabel, fromContractLabel }: { 
  flag: RedFlag; 
  index: number;
  severityLabel: string;
  fromContractLabel: string;
}) {
  const severityConfig: Record<Severity, { 
    color: string; 
    bgColor: string;
    borderColor: string;
    icon: React.ElementType;
  }> = {
    high: {
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      icon: AlertTriangle,
    },
    medium: {
      color: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      icon: AlertCircle,
    },
    low: {
      color: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      icon: Info,
    },
  };

  const config = severityConfig[flag.severity];
  const Icon = config.icon;

  return (
    <AccordionItem 
      value={`flag-${index}`}
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        config.borderColor,
        config.bgColor
      )}
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-black/5 dark:hover:bg-white/5">
        <div className="flex items-center gap-3 text-left">
          <div className={cn("p-1.5 rounded-full", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("font-medium", config.color)}>{flag.title}</p>
          </div>
          <Badge 
            variant="outline" 
            className={cn("shrink-0 ml-2", config.color, config.borderColor)}
          >
            {severityLabel}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="pl-10 space-y-3">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {flag.description}
          </p>
          {flag.clause && (
            <div className="bg-background/50 border border-border/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">{fromContractLabel}</p>
              <p className="text-sm italic text-muted-foreground">&ldquo;{flag.clause}&rdquo;</p>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function ResultsDashboard({ analysis, fileName, onReset }: ResultsDashboardProps) {
  const { t } = useI18n();
  
  const handleExportJson = () => {
    exportAsJson(analysis, fileName || 'contract');
    toast.success(t('exportSuccess'), { description: t('downloadStarted') });
  };

  const handleExportPdf = () => {
    exportAsPdf(analysis, fileName || 'contract', {
      title: t('analysisComplete'),
      summary: t('summary'),
      overallRisk: t('summary'),
      redFlags: t('redFlags'),
      positiveAspects: t('positiveAspects'),
      highRisk: t('highRisk'),
      mediumRisk: t('mediumRisk'),
      lowRisk: t('lowRisk'),
      disclaimer: t('disclaimer'),
      generatedAt: t('generatedAt'),
    });
  };

  const overallRiskConfig: Record<Severity, {
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }> = {
    high: {
      icon: ShieldAlert,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    medium: {
      icon: Shield,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    low: {
      icon: ShieldCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  };

  const riskTextMap: Record<Severity, string> = {
    high: t('riskHigh'),
    medium: t('riskMedium'),
    low: t('riskLow'),
  };

  const severityLabelMap: Record<Severity, string> = {
    high: t('highRisk'),
    medium: t('mediumRisk'),
    low: t('lowRisk'),
  };

  const riskConfig = overallRiskConfig[analysis.overallRisk];
  const RiskIcon = riskConfig.icon;
  
  // Sort red flags by severity (high -> medium -> low)
  const sortedFlags = [...analysis.redFlags].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  const highCount = analysis.redFlags.filter(f => f.severity === 'high').length;
  const mediumCount = analysis.redFlags.filter(f => f.severity === 'medium').length;
  const lowCount = analysis.redFlags.filter(f => f.severity === 'low').length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" onClick={onReset} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('analyzeAnother')}
        </Button>
        <div className="flex items-center gap-2">
          {fileName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
              <FileText className="w-4 h-4" />
              {fileName}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1.5">
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">{t('exportJson')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t('exportPdf')}</span>
          </Button>
        </div>
      </div>

      {/* Overall Risk Card */}
      <Card className={cn("border-2", riskConfig.bgColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", riskConfig.bgColor)}>
              <RiskIcon className={cn("w-6 h-6", riskConfig.color)} />
            </div>
            <div>
              <CardTitle className="text-xl">{t('analysisComplete')}</CardTitle>
              <CardDescription className={riskConfig.color}>
                {riskTextMap[analysis.overallRisk]}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Summary */}
            <div>
              <h3 className="font-medium mb-2">{t('summary')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 pt-2">
              {highCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    {highCount} {t('highRisk')}
                  </span>
                </div>
              )}
              {mediumCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    {mediumCount} {t('mediumRisk')}
                  </span>
                </div>
              )}
              {lowCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    {lowCount} {t('lowRisk')}
                  </span>
                </div>
              )}
              {analysis.redFlags.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {t('noRedFlags')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Red Flags Section */}
      {sortedFlags.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            {t('redFlags')} ({sortedFlags.length})
          </h2>
          <Accordion multiple className="space-y-3">
            {sortedFlags.map((flag, index) => (
              <RedFlagCard 
                key={index} 
                flag={flag} 
                index={index} 
                severityLabel={severityLabelMap[flag.severity]}
                fromContractLabel={t('fromContract')}
              />
            ))}
          </Accordion>
        </div>
      )}

      {/* Positive Points */}
      {analysis.positivePoints && analysis.positivePoints.length > 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              {t('positiveAspects')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.positivePoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-300">
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground pt-4 border-t">
        {t('disclaimer')}
      </p>
    </div>
  );
}
