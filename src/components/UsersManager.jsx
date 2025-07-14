import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import useFirestore from '../hooks/useFirestore';
import { useAuth } from '../context/AuthContext';

// Funções disponíveis no sistema
const ROLES = ['admin', 'editor', 'reader'];

export default function UsersManager() {
    const { docs: users, loading } = useFirestore('users');
    const { userData, currentUser } = useAuth(); // Para verificar se o usuário atual é um admin
    const [updating, setUpdating] = useState(null); // Para rastrear qual usuário está sendo atualizado

    const handleRoleChange = async (userId, newRole) => {
        setUpdating(userId);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role: newRole });
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Falha ao atualizar a função do usuário.');
        } finally {
            setUpdating(null);
        }
    };

    // Apenas administradores podem gerenciar usuários
    if (userData?.role !== 'admin') {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciar Usuários</h3>
                <p className="text-gray-600">Você não tem permissão para visualizar ou gerenciar usuários.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Gerenciar Usuários</h3>
            
            {loading ? (
                <p className="text-center text-gray-500 py-4">Carregando usuários...</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função (Role)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.length > 0 ? users.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <select 
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={updating === user.id || user.id === currentUser.uid} // Desabilita a alteração do próprio usuário
                                            className="p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100"
                                        >
                                            {ROLES.map(role => (
                                                <option key={role} value={role}>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="2" className="text-center text-gray-500 py-4">Nenhum usuário encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
