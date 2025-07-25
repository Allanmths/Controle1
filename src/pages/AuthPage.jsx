import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.message || 'Falha na autenticaÃ§Ã£o. Verifique suas credenciais.');
        }
        setLoading(false);
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-50">
            <div className="w-full max-w-md">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 text-center">
                    <i className={`fas ${isLogin ? 'fa-boxes-stacked' : 'fa-user-plus'} fa-2x text-blue-600 mb-4`}></i>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{isLogin ? 'Bem-vindo de volta!' : 'Crie sua Conta'}</h2>
                    <p className="text-gray-500 mb-6">{isLogin ? 'FaÃ§a login para acessar o estoque.' : 'O registro cria uma conta com permissÃ£o de \'Visualizador\'.'}</p>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input 
                            type="email" 
                            placeholder="Email" 
                            className="w-full p-3 bg-white rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input 
                            type="password" 
                            placeholder={isLogin ? "Senha" : "Senha (mÃ­nimo 6 caracteres)"}
                            className="w-full p-3 bg-white rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="submit" disabled={loading} className={`w-full text-white font-bold py-3 rounded-lg transition ${isLogin ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-400`}>
                            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Registrar')}
                        </button>
                    </form>
                    <p className="mt-6 text-sm">
                        {isLogin ? 'NÃ£o tem uma conta?' : 'JÃ¡ tem uma conta?'}
                        <button onClick={toggleForm} className="font-semibold text-blue-600 hover:underline ml-1">{isLogin ? 'Registre-se' : 'FaÃ§a Login'}</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
