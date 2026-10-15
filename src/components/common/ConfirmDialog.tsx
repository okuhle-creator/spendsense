import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {isDestructive && (
            <div className="p-2 bg-burgundy-100 text-burgundy-700 rounded-md shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm text-charcoal-700 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-charcoal-700 bg-white border border-charcoal-300 rounded-md hover:bg-charcoal-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              isDestructive
                ? 'bg-burgundy-700 hover:bg-burgundy-800'
                : 'bg-forest-700 hover:bg-forest-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
