import React from 'react';
import { Card } from '../components/ui';
import CategoriesManager from '../components/CategoriesManager';
import LocationManager from '../components/LocationManager';
import ProductManager from '../components/ProductManager';
import ProductBulkImport from '../components/ProductBulkImport';

export default function RegistersPage() {
    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <header className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Cadastros</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Gerencie seus produtos, categorias e localidades em um só lugar.
                </p>
            </header>
            
            <div className="space-y-6 max-w-4xl mx-auto">
                <Card title="Gerenciar Produtos" variant="primary" hoverable className="w-full">
                    <div className="space-y-6">
                        <ProductManager />
                        <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-4">Importar Produtos em Massa</h3>
                            <ProductBulkImport />
                        </div>
                    </div>
                </Card>

                <Card title="Gerenciar Categorias" variant="secondary" hoverable className="w-full">
                    <CategoriesManager />
                </Card>

                <Card title="Gerenciar Localidades" variant="accent" hoverable className="w-full">
                    <LocationManager />
                </Card>
            </div>
        </div>
    );
}
