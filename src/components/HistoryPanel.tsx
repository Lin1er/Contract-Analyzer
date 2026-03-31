'use client';

import React from 'react';
import { History, Trash2, Eye, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { getHistory, removeFromHistory, clearHistory, formatRelativeTime } from '@/lib/history';
import type { HistoryEntry, Severity } from '@/types';

interface HistoryPanelProps {
  onSelectEntry: (entry: HistoryEntry) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryPanel({ onSelectEntry, isOpen, onClose }: HistoryPanelProps) {
  const { t } = useI18n();
  const [entries, setEntries] = React.useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setEntries(getHistory());
  }, [isOpen]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    setEntries(getHistory());
  };

  const handleClearAll = () => {
    clearHistory();
    setEntries([]);
  };

  const severityConfig: Record<Severity, { color: string; icon: React.ElementType }> = {
    high: { color: 'text-red-600', icon: AlertTriangle },
    medium: { color: 'text-amber-600', icon: AlertCircle },
    low: { color: 'text-blue-600', icon: Info },
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <Card className="relative w-full max-w-md h-full max-h-screen overflow-hidden rounded-none border-l shadow-2xl animate-in slide-in-from-right duration-300">
        <CardHeader className="flex flex-row items-center justify-between border-b p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5" />
            {t('recentAnalyses')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                {t('clearHistory')}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {!mounted || entries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>{t('noHistory')}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {entries.map((entry) => {
                const config = severityConfig[entry.analysis.overallRisk];
                const Icon = config.icon;
                const flagCount = entry.analysis.redFlags.length;

                return (
                  <li
                    key={entry.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group"
                    onClick={() => onSelectEntry(entry)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn("w-4 h-4 shrink-0", config.color)} />
                          <p className="font-medium truncate">{entry.fileName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entry.analysis.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {flagCount} {t('redFlags').toLowerCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(entry.createdAt, t)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEntry(entry);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDelete(entry.id, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
