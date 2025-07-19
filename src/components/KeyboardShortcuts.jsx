import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaKeyboard, FaTimes } from 'react-icons/fa';

const KeyboardShortcuts = () => {
    const [showHelp, setShowHelp] = useState(false);
    const navigate = useNavigate();

    const shortcuts = [
        { key: 'Ctrl + D', action: 'Ir para Dashboard', path: '/dashboard' },
        { key: 'Ctrl + E', action: 'Ir para Estoque', path: '/stock' },
        { key: 'Ctrl + R', action: 'Ir para Cadastros', path: '/registers' },
        { key: 'Ctrl + M', action: 'Ir para Movimentações', path: '/movements' },
        { key: 'Ctrl + N', action: 'Novo Produto', path: '/registers' },
        { key: '?', action: 'Mostrar atalhos', path: null },
        { key: 'Esc', action: 'Fechar modais', path: null }
    ];

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Evita atalhos em inputs
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            if (event.ctrlKey) {
                switch (event.key.toLowerCase()) {
                    case 'd':
                        event.preventDefault();
                        navigate('/dashboard');
                        break;
                    case 'e':
                        event.preventDefault();
                        navigate('/stock');
                        break;
                    case 'r':
                        event.preventDefault();
                        navigate('/registers');
                        break;
                    case 'm':
                        event.preventDefault();
                        navigate('/movements');
                        break;
                }
            } else if (event.key === '?') {
                setShowHelp(true);
            } else if (event.key === 'Escape') {
                setShowHelp(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    if (!showHelp) {
        return (
            <button
                onClick={() => setShowHelp(true)}
                className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
                title="Atalhos do teclado (?)"
            >
                <FaKeyboard className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Atalhos do Teclado</h3>
                    <button
                        onClick={() => setShowHelp(false)}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes />
                    </button>
                </div>
                <div className="p-4">
                    <div className="space-y-3">
                        {shortcuts.map((shortcut, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <span className="text-gray-700">{shortcut.action}</span>
                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                                    {shortcut.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-b-lg">
                    <p className="text-xs text-gray-600">
                        Pressione <kbd className="px-1 py-0.5 text-xs bg-gray-200 rounded">?</kbd> para mostrar/ocultar esta ajuda
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcuts;
