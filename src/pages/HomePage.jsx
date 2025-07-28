import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import useFirestore from '../hooks/useFirestore';
import { 
  FaBox, FaBoxes, FaTags, FaExclamationTriangle, 
  FaPlus, FaEye, FaChartLine, FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Card para estatísticas (igual ao do print)
const StatCard = ({ title, value, subtitle, icon: Icon, borderColor }) => (
  <div className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${borderColor}`}>
    <div className="flex justify-between">
      <div>
        <h3 className="text-gray-700 font-medium">{title}</h3>
        <p className="text-4xl font-bold mt-2 mb-1">{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="p-4 bg-gray-100 rounded-lg self-start">
        <Icon className="text-gray-500" size={24} />
      </div>
    </div>
  </div>
);

// Card de ação rápida (igual ao do print)
const QuickActionCard = ({ icon: Icon, title, description, to, badge = null }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(to)}
      className="bg-white rounded-lg shadow-sm p-4 flex items-center cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="bg-gray-100 p-4 rounded-lg mr-4">
        <Icon className="text-blue-500" size={20} />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-800 font-medium">{title}</h3>
          {badge && (
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">{badge}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <FaArrowRight className="text-gray-400 ml-4" />
    </div>
  );
};

const HomePage = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  // Período selecionado
  const [selectedPeriod, setSelectedPeriod] = useState('Últimos 7 dias');

  // Estados para os dados estatísticos
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    categories: 0,
    lowStockCount: 0
  });

  // Buscar estatísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Total de produtos
        const productsQuery = query(collection(db, 'products'));
        const productsSnapshot = await getDocs(productsQuery);
        const totalProducts = productsSnapshot.size;
        
        // Total de itens em estoque
        let totalStock = 0;
        productsSnapshot.docs.forEach(doc => {
          const product = doc.data();
          totalStock += product.totalStock || 0;
        });
        
        // Categorias ativas
        const categoriesQuery = query(collection(db, 'categories'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const categoriesCount = categoriesSnapshot.size;
        
        // Produtos com estoque baixo
        const lowStockQuery = query(
          collection(db, 'products'),
          where('totalStock', '<', 10)
        );
        const lowStockSnapshot = await getDocs(lowStockQuery);
        const lowStockCount = lowStockSnapshot.size;
        
        setStats({
          totalProducts,
          totalStock,
          categories: categoriesCount,
          lowStockCount
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="p-6">
      {/* Título e seletor de período */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
          <p className="text-gray-600">Visão geral completa do seu sistema de controle de estoque</p>
        </div>
        <div className="flex items-center">
          <div className="text-gray-500 mr-2">
            <span className="inline-block align-middle">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <select 
            className="border rounded-md py-1 px-3 bg-white"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="Últimos 7 dias">Últimos 7 dias</option>
            <option value="Último mês">Último mês</option>
            <option value="Último trimestre">Último trimestre</option>
          </select>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Produtos"
          value={stats.totalProducts}
          subtitle="Produtos cadastrados"
          icon={FaBoxes}
          borderColor="border-blue-500"
        />
        
        <StatCard
          title="Itens em Estoque"
          value={stats.totalStock}
          subtitle="Quantidade total"
          icon={FaBox}
          borderColor="border-green-500"
        />
        
        <StatCard
          title="Categorias"
          value={stats.categories}
          subtitle="Categorias ativas"
          icon={FaTags}
          borderColor="border-purple-500"
        />
        
        <StatCard
          title="Estoque Baixo"
          value={stats.lowStockCount}
          subtitle="Produtos com baixo estoque"
          icon={FaExclamationTriangle}
          borderColor="border-red-500"
        />
      </div>
      
      {/* Ações Rápidas */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <QuickActionCard
            icon={FaPlus}
            title="Adicionar Produto"
            description="Cadastrar novo item no estoque"
            to="/registers/products/new"
          />
          
          <QuickActionCard
            icon={FaEye}
            title="Ver Estoque"
            description="Visualizar todos os produtos"
            to="/stock"
          />
          
          <QuickActionCard
            icon={FaChartLine}
            title="Relatórios"
            description="Gerar relatórios detalhados"
            to="/reports"
            badge="1 novos"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
