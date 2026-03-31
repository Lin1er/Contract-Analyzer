'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useI18n } from '@/lib/i18n';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onTextSubmit: (text: string) => void;
  isProcessing: boolean;
  error?: string | null;
}

export function FileUploadZone({ 
  onFileSelect, 
  onTextSubmit, 
  isProcessing,
  error 
}: FileUploadZoneProps) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'text'>('upload');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isProcessing,
  });

  const handleAnalyze = () => {
    if (mode === 'upload' && selectedFile) {
      onFileSelect(selectedFile);
    } else if (mode === 'text' && textInput.trim()) {
      onTextSubmit(textInput.trim());
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const canAnalyze = mode === 'upload' 
    ? selectedFile !== null 
    : textInput.trim().length >= 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit mx-auto">
        <button
          onClick={() => setMode('upload')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === 'upload' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t('uploadPdf')}
        </button>
        <button
          onClick={() => setMode('text')}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all",
            mode === 'text' 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t('pasteText')}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mode === 'upload' ? (
        <>
          {/* Drag and Drop Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 cursor-pointer",
              "bg-gradient-to-b from-muted/30 to-muted/50",
              "hover:border-primary/50 hover:bg-muted/60",
              isDragActive && "border-primary bg-primary/5 scale-[1.02]",
              isDragReject && "border-destructive bg-destructive/5",
              isProcessing && "opacity-50 cursor-not-allowed",
              selectedFile && "border-primary/30 bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {selectedFile ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('remove')}
                  </Button>
                </>
              ) : (
                <>
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                    isDragActive ? "bg-primary/20" : "bg-muted"
                  )}>
                    <Upload className={cn(
                      "w-8 h-8 transition-colors",
                      isDragActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {isDragActive ? t('dropHere') : t('dragDrop')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('clickBrowse')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Text Input Mode */
        <div className="space-y-3">
          <Textarea
            placeholder={t('pasteTextPlaceholder')}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isProcessing}
            className="min-h-[250px] resize-y text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground text-right">
            {textInput.length} {t('characters')} {textInput.length < 100 && `(${t('minimum')})`}
          </p>
        </div>
      )}

      {/* Analyze Button */}
      <Button
        onClick={handleAnalyze}
        disabled={!canAnalyze || isProcessing}
        size="lg"
        className="w-full h-12 text-base font-medium"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            {t('analyzing')}
          </span>
        ) : (
          t('analyzeContract')
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        {t('privacyNote')}
      </p>
    </div>
  );
}
