import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const UserRoleManager = () => {
    const [email, setEmail] = useState('demo@teste.com');
    const [role, setRole] = useState('admin');
    const [loading, setLoading] = useState(false);

    const updateUserRole = async () => {
        if (!email || !role) {
            toast.error('Email e role são obrigatórios');
            return;
        }

        setLoading(true);
        const toastId = toast.loading('Atualizando role do usuário...');

        try {
            // Buscar o usuário pelo email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Se o usuário não existe, criar um novo documento
                // Nota: Normalmente o UID seria obtido da autenticação, mas para demo usaremos o email como referência
                const userRef = doc(usersRef, email.replace('@', '_').replace('.', '_'));
                await setDoc(userRef, {
                    email: email,
                    role: role,
                    name: 'Demo User',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                toast.success(`Usuário criado com role ${role}!`, { id: toastId });
            } else {
                // Atualizar o usuário existente
                const userDoc = querySnapshot.docs[0];
                const userRef = doc(db, 'users', userDoc.id);
                await updateDoc(userRef, {
                    role: role,
                    updatedAt: new Date()
                });
                toast.success(`Role atualizada para ${role}!`, { id: toastId });
            }

            console.log(`Role do usuário ${email} atualizada para ${role}`);
        } catch (error) {
            console.error('Erro ao atualizar role:', error);
            toast.error(`Erro: ${error.message}`, { id: toastId });
        }

        setLoading(false);
    };

    const checkUserRole = async () => {
        if (!email) {
            toast.error('Email é obrigatório');
            return;
        }

        const toastId = toast.loading('Verificando usuário...');

        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast.error('Usuário não encontrado', { id: toastId });
            } else {
                const userData = querySnapshot.docs[0].data();
                toast.success(`Usuário encontrado! Role atual: ${userData.role || 'não definida'}`, { id: toastId });
                console.log('Dados do usuário:', userData);
            }
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
            toast.error(`Erro: ${error.message}`, { id: toastId });
        }
    };

    return (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex">
                <div className="ml-3 w-full">
                    <h3 className="text-sm font-medium text-blue-800">
                        Gerenciador de Roles de Usuário
                    </h3>
                    <div className="mt-2 space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-blue-700">Email:</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full text-sm p-2 border border-blue-300 rounded"
                                placeholder="usuario@exemplo.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-blue-700">Role:</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full text-sm p-2 border border-blue-300 rounded"
                            >
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={checkUserRole}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                disabled={loading}
                            >
                                Verificar Usuário
                            </button>
                            <button
                                onClick={updateUserRole}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                disabled={loading}
                            >
                                {loading ? 'Atualizando...' : 'Atualizar Role'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRoleManager;
