import React, { useState } from 'react';
import useFirestore from '../hooks/useFirestore';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { FaDownload, FaUpload } from 'react-icons/fa';

const ProductBulkImport = () => {
    const { docs: locations } = useFirestore('locations', { orderBy: ['name', 'asc'] });
    const { docs: categories } = useFirestore('categories', { orderBy: ['name', 'asc'] });
    const [isImporting, setIsImporting] = useState(false);

    const handleDownloadTemplate = () => {
        const headers = [
            'Nome', 
            'Categoria', 
            'Unidade', 
            'EstoqueMinimo', 
            ...(locations && locations.length > 0 ? locations.map(loc => `Estoque_${loc.name.replace(/\s+/g, '_')}`) : ['Estoque_Local'])
        ];
        
        const sampleData = [
            {
                'Nome': 'Exemplo: Monitor 24 Polegadas',
                'Categoria': 'Eletrônicos',
                'Unidade': 'un',
                'EstoqueMinimo': '5',
                ...locations.reduce((acc, loc) => ({ ...acc, [`Estoque_${loc.name.replace(/\s+/g, '_')}`]: '10' }), {})
            }
        ];

        const csv = Papa.unparse({
            fields: headers,
            data: sampleData
        });

        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_importacao_produtos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        setIsImporting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const productsToImport = results.data;
                const categoriesMap = new Map((categories || []).map(cat => [cat.name.toLowerCase(), cat.id]));
                const locationsMap = new Map((locations || []).map(loc => [`Estoque_${loc.name.replace(/\s+/g, '_')}`, loc.id]));

                const promises = productsToImport.map(async (productRow) => {
                    const { Nome, Categoria, Unidade, EstoqueMinimo, ...stockFields } = productRow;

                    if (!Nome || !Categoria) {
                        toast.error(`Produto "${Nome || 'Sem nome'}" ignorado: Nome e Categoria são obrigatórios.`);
                        return Promise.resolve();
                    }

                    const categoryId = categoriesMap.get(Categoria.toLowerCase());
                    if (!categoryId) {
                        toast.error(`Produto "${Nome}" ignorado: Categoria "${Categoria}" não encontrada.`);
                        return Promise.resolve();
                    }

                    const locationQuantities = {};
                    for (const [field, value] of Object.entries(stockFields)) {
                        const locationId = locationsMap.get(field);
                        if (locationId) {
                            locationQuantities[locationId] = Number(value) || 0;
                        }
                    }

                    const newProduct = {
                        name: Nome,
                        categoryId,
                        unit: Unidade || 'un',
                        minStock: Number(EstoqueMinimo) || 0,
                        locations: locationQuantities
                    };

                    return addDoc(collection(db, 'products'), newProduct);
                });

                try {
                    const results = await Promise.allSettled(promises);
                    const successCount = results.filter(r => r.status === 'fulfilled').length;
                    toast.success(`${successCount} de ${productsToImport.length} produtos foram importados com sucesso!`);
                } catch (error) {
                    toast.error(`Ocorreu um erro durante a importação: ${error.message}`);
                } finally {
                    setIsImporting(false);
                    event.target.value = null;
                }
            },
            error: (error) => {
                toast.error(`Erro ao ler o arquivo: ${error.message}`);
                setIsImporting(false);
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Importação em Massa de Produtos</h3>
            <p className="text-gray-600 mb-6">
                Para adicionar múltiplos produtos de uma vez, baixe a planilha modelo, preencha com os dados e importe o arquivo aqui.
            </p>
            <div className="flex flex-col md:flex-row gap-4">
                <button
                    onClick={handleDownloadTemplate}
                    className="flex-1 flex items-center justify-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300"
                >
                    <FaDownload className="mr-2" />
                    Baixar Planilha Modelo
                </button>
                
                <label htmlFor="csv-upload" className="flex-1 flex items-center justify-center bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 cursor-pointer">
                    <FaUpload className="mr-2" />
                    {isImporting ? 'Importando...' : 'Importar Planilha'}
                </label>
                <input
                    type="file"
                    id="csv-upload"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                />
            </div>
        </div>
    );
};

export default ProductBulkImport;
