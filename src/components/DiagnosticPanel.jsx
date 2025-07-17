import React from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const DiagnosticPanel = () => {
    const { currentUser, userData } = useAuth();

    const testFirestoreConnection = async () => {
        const toastId = toast.loading('Testando conexão com Firestore...');
        try {
            const testDoc = await addDoc(collection(db, 'test'), {
                message: 'Teste de conexão',
                timestamp: new Date(),
                user: currentUser?.uid || 'anonymous'
            });
            toast.success(`Conexão OK! Doc ID: ${testDoc.id}`, { id: toastId });
            console.log('Teste bem-sucedido:', testDoc.id);
        } catch (error) {
            toast.error(`Erro: ${error.message}`, { id: toastId });
            console.error('Erro no teste:', error);
        }
    };

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                        Painel de Diagnóstico
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700 space-y-1">
                        <p><strong>Status de Autenticação:</strong> {currentUser ? '✅ Autenticado' : '❌ Não autenticado'}</p>
                        {currentUser && (
                            <>
                                <p><strong>UID:</strong> {currentUser.uid}</p>
                                <p><strong>Email:</strong> {currentUser.email}</p>
                                <p><strong>Role:</strong> {userData?.role || 'Não definido'}</p>
                            </>
                        )}
                        <button 
                            onClick={testFirestoreConnection}
                            className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700"
                        >
                            Testar Conexão Firestore
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiagnosticPanel;
