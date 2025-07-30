import React from 'react';
import { FaEdit, FaTrash, FaExclamationTriangle, FaInfo } from 'react-icons/fa';

const ActionConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  productName, 
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonClass = "bg-blue-600 hover:bg-blue-700",
  icon
}) => {
  if (!isOpen) return null;

  const getActionIcon = () => {
    if (icon) return icon;
    
    switch (action) {
      case 'edit':
        return <FaEdit className="w-6 h-6 text-blue-500" />;
      case 'delete':
        return <FaTrash className="w-6 h-6 text-red-500" />;
      default:
        return <FaInfo className="w-6 h-6 text-gray-500" />;
    }
  };

  const getDefaultTitle = () => {
    if (title) return title;
    
    switch (action) {
      case 'edit':
        return 'Confirmar EdiÃ§Ã£o';
      case 'delete':
        return 'Confirmar ExclusÃ£o';
      default:
        return 'Confirmar AÃ§Ã£o';
    }
  };

  const getDefaultDescription = () => {
    if (description) return description;
    
    switch (action) {
      case 'edit':
        return `Você está prestes a editar o produto "${productName}". Deseja continuar?`;
      case 'delete':
        return `Você está prestes a excluir o produto "${productName}". Esta ação não pode ser desfeita.`;
      default:
        return `Você está prestes a realizar uma ação no produto "${productName}". Deseja continuar?`;
    }
  };

  const getConfirmButtonClass = () => {
    if (confirmButtonClass !== "bg-blue-600 hover:bg-blue-700") return confirmButtonClass;
    
    switch (action) {
      case 'edit':
        return "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600";
      case 'delete':
        return "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600";
      default:
        return "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 mr-3">
            {getActionIcon()}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {getDefaultTitle()}
          </h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getDefaultDescription()}
          </p>
          
          {action === 'delete' && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-sm text-red-700 dark:text-red-400 font-medium">
                  Atenção: Esta ação é irreversível!
                </span>
              </div>
            </div>
          )}

          {productName && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div className="text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">Produto: </span>
                <span className="text-gray-900 dark:text-gray-100">{productName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmationModal;
