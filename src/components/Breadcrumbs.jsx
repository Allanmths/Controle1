import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';

const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    const routeNames = {
        'dashboard': 'Dashboard',
        'stock': 'Estoque',
        'registers': 'Cadastros',
        'movements': 'Movimentações',
        'reports': 'Relatórios',
        'settings': 'Configurações',
        'counting': 'Contagem',
        'audit': 'Auditoria',
        'replenishment': 'Reposição'
    };

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link to="/" className="flex items-center hover:text-blue-600 transition-colors">
                <FaHome className="w-4 h-4" />
            </Link>
            
            {pathnames.map((pathname, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const displayName = routeNames[pathname] || pathname;

                return (
                    <React.Fragment key={pathname}>
                        <FaChevronRight className="w-3 h-3 text-gray-400" />
                        {isLast ? (
                            <span className="text-gray-900 font-medium">{displayName}</span>
                        ) : (
                            <Link to={routeTo} className="hover:text-blue-600 transition-colors">
                                {displayName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
