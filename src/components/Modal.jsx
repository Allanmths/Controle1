import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    // Handle Escape key to close modal
    React.useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300"
            onClick={onClose} // Close modal on overlay click
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
