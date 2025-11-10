import type React from 'react';
import { Loader2 } from 'lucide-react';

interface ContentGenerationModalProps {
  isOpen: boolean;
  moduleTitle: string;
  message?: string;
}

export const ContentGenerationModal: React.FC<ContentGenerationModalProps> = ({
  isOpen,
  moduleTitle,
  message = "Generating learning content...",
}): JSX.Element | null => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Generating Content</h3>
            <p className="text-sm text-slate-600 mb-1">{message}</p>
            <p className="text-sm font-medium text-indigo-600">{moduleTitle}</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full animate-pulse"
              style={{ width: '60%' }}
            />
          </div>
          <p className="text-xs text-slate-500 text-center">
            This may take a few moments. Please wait...
          </p>
        </div>
      </div>
    </div>
  );
};
