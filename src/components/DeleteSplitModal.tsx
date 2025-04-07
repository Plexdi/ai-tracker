import { useState } from 'react';
import ModernButton from './ModernButton';

interface DeleteSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  splitName: string;
  onConfirmDelete: () => Promise<void>;
}

export default function DeleteSplitModal({ 
  isOpen, 
  onClose, 
  splitName, 
  onConfirmDelete 
}: DeleteSplitModalProps) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete();
      onClose();
    } catch (error) {
      console.error('Error deleting split:', error);
      setError('Failed to delete split. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-slate-900 rounded-lg border border-slate-800 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-800 p-4">
          <h2 className="text-lg font-semibold text-red-500">Delete Split</h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-md text-slate-400 hover:text-white"
            disabled={isDeleting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-center mb-4">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            
            <h3 className="text-xl text-white font-medium mb-2">Are you sure?</h3>
            <p className="text-slate-300">
              You are about to delete <span className="font-medium text-white">{splitName}</span>. 
              This action cannot be undone.
            </p>
          </div>
          
          {error && (
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-200 text-sm mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <ModernButton
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </ModernButton>
            <ModernButton
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
              disabled={isDeleting}
            >
              Delete Split
            </ModernButton>
          </div>
        </div>
      </div>
    </div>
  );
} 