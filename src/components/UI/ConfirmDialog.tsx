import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (choice?: string) => void;
  title: string;
  message: string;
  type: 'confirm' | 'choice' | 'delete-choice' | 'edit-choice';
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  const renderButtons = () => {
    if (type === 'confirm') {
      return (
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      );
    }

    if (type === 'delete-choice') {
      return (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm('all');
              onClose();
            }}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-left"
          >
            <div className="font-semibold">Excluir todas as ocorrências</div>
            <div className="text-xs text-red-100 mt-1">Todas as parcelas/recorrências serão excluídas</div>
          </button>
          <button
            onClick={() => {
              onConfirm('single');
              onClose();
            }}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors text-left"
          >
            <div className="font-semibold">Excluir apenas esta ocorrência</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Somente este registro será excluído</div>
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      );
    }

    if (type === 'edit-choice') {
      return (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirm('all');
              onClose();
            }}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-left"
          >
            <div className="font-semibold">Atualizar todas as ocorrências</div>
            <div className="text-xs text-blue-100 mt-1">Todas as parcelas/recorrências serão atualizadas</div>
          </button>
          <button
            onClick={() => {
              onConfirm('future');
              onClose();
            }}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-left"
          >
            <div className="font-semibold">Atualizar desta em diante</div>
            <div className="text-xs text-purple-100 mt-1">Esta e as próximas ocorrências serão atualizadas</div>
          </button>
          <button
            onClick={() => {
              onConfirm('single');
              onClose();
            }}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors text-left"
          >
            <div className="font-semibold">Atualizar apenas esta ocorrência</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Somente este registro será atualizado</div>
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          {type === 'confirm' || type === 'delete-choice' ? (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          ) : (
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-6">
          {message}
        </p>

        {/* Buttons */}
        {renderButtons()}
      </div>
    </div>
  );
};

export default ConfirmDialog;
