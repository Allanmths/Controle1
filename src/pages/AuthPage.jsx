import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { login, register } = useAuth();
    const navigate = useNavigate();

    // Atualizar relógio em tempo real
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Carregar email salvo se "Lembrar-me" estava marcado
    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validações adicionais para registro
        if (!isLogin) {
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                setLoading(false);
                return;
            }
        }

        try {
            if (isLogin) {
                await login(email, password);
                // Salvar email se "Lembrar-me" estiver marcado
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
            } else {
                await register(email, password);
            }
            navigate('/');
        } catch (err) {
            let errorMessage = 'Falha na autenticação. Verifique suas credenciais.';
            
            // Mensagens de erro mais específicas
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado. Verifique o email digitado.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta. Tente novamente.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este email já está em uso. Faça login ou use outro email.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Formato de email inválido.';
            }
            
            setError(errorMessage);
        }
        setLoading(false);
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('pt-BR', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Efeitos de fundo */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
            
            {/* Círculos decorativos animados */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 bg-indigo-400 rounded-full opacity-20 animate-pulse delay-1000"></div>
            <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-purple-400 rounded-full opacity-20 animate-pulse delay-500"></div>

            {/* Container principal */}
            <div className="w-full max-w-4xl flex bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden relative z-10">
                {/* Painel lateral esquerdo */}
                <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between text-white relative">
                    <div className="absolute inset-0 bg-black/10"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i className="fas fa-boxes-stacked text-2xl"></i>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Controle de Estoque</h1>
                                <p className="text-blue-200 text-sm">Sistema Profissional</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Dashboard Avançado</h3>
                                    <p className="text-blue-200 text-sm">Analytics e relatórios em tempo real</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-users"></i>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Gestão de Usuários</h3>
                                    <p className="text-blue-200 text-sm">5 níveis de permissão</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-mobile-alt"></i>
                                </div>
                                <div>
                                    <h3 className="font-semibold">PWA Completo</h3>
                                    <p className="text-blue-200 text-sm">Funciona offline e é instalável</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-bell"></i>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Notificações Inteligentes</h3>
                                    <p className="text-blue-200 text-sm">Alertas de estoque baixo</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-blue-200">Horário atual</span>
                                <i className="fas fa-clock text-blue-200"></i>
                            </div>
                            <div className="text-2xl font-bold mb-1">{formatTime(currentTime)}</div>
                            <div className="text-sm text-blue-200 capitalize">{formatDate(currentTime)}</div>
                        </div>
                    </div>
                </div>

                {/* Painel de login direito */}
                <div className="w-full lg:w-1/2 p-8 lg:p-12">
                    <div className="max-w-sm mx-auto">
                        {/* Header do formulário */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'} text-white text-xl`}></i>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                {isLogin ? 'Bem-vindo de volta!' : 'Criar Conta'}
                            </h2>
                            <p className="text-gray-600">
                                {isLogin 
                                    ? 'Acesse seu painel de controle de estoque' 
                                    : 'Crie sua conta como Visualizador'
                                }
                            </p>
                        </div>

                        {/* Mensagem de erro */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3">
                                <i className="fas fa-exclamation-triangle text-red-500"></i>
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Formulário */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Campo de Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <i className="fas fa-envelope text-gray-400"></i>
                                    </div>
                                    <input 
                                        type="email" 
                                        placeholder="seu@email.com"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        required 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Campo de Senha */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <i className="fas fa-lock text-gray-400"></i>
                                    </div>
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder={isLogin ? "Sua senha" : "Mínimo 6 caracteres"}
                                        className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        required 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400 hover:text-gray-600`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Confirmar senha (apenas no registro) */}
                            {!isLogin && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirmar Senha
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <i className="fas fa-lock text-gray-400"></i>
                                        </div>
                                        <input 
                                            type="password"
                                            placeholder="Digite a senha novamente"
                                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                            required 
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Checkbox Lembrar-me (apenas no login) */}
                            {isLogin && (
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                                    </label>
                                    <button type="button" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                        Esqueceu a senha?
                                    </button>
                                </div>
                            )}

                            {/* Botão de submit */}
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                                    isLogin 
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25' 
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg shadow-green-500/25'
                                }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processando...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`}></i>
                                        {isLogin ? 'Entrar' : 'Criar Conta'}
                                    </div>
                                )}
                            </button>
                        </form>

                        {/* Toggle entre login/registro */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-600">
                                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                                <button 
                                    onClick={toggleForm} 
                                    className="ml-2 font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                >
                                    {isLogin ? 'Registre-se' : 'Faça Login'}
                                </button>
                            </p>
                        </div>

                        {/* Informações adicionais */}
                        <div className="mt-8 text-center">
                            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <i className="fas fa-shield-alt"></i>
                                    Seguro
                                </span>
                                <span className="flex items-center gap-1">
                                    <i className="fas fa-clock"></i>
                                    24/7
                                </span>
                                <span className="flex items-center gap-1">
                                    <i className="fas fa-mobile-alt"></i>
                                    Responsivo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
