import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = 'Failed to load content',
  message = 'An unexpected error occurred while communicating with the DisasterReady service. Please verify your connection or try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-red-200 bg-red-50/60 p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[#DC3545] mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[#102A43] mb-1">{title}</h3>
      <p className="text-sm text-[#627D98] max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 border-red-300 hover:bg-red-50">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
