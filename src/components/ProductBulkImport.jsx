import React, { useState } from 'react';
import useFirestore from '../hooks/useFirestore';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { FaDownload, FaUpload, FaFileExcel, FaFileCsv, FaFileCode } from 'react-icons/fa';

const ProductBulkImport = () => {
    const { docs: locations } = useFirestore('locations', { orderBy: ['name', 'asc'] });
    const { docs: categories } = useFirestore('categories', { orderBy: ['name', 'asc'] });
    const [isImporting, setIsImporting] = useState(false);

    const handleDownloadTemplate = (format = 'csv') => {
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
                ...(locations || []).reduce((acc, loc) => ({ ...acc, [`Estoque_${loc.name.replace(/\s+/g, '_')}`]: '10' }), {})
            }
        ];

        if (format === 'csv') {
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
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(sampleData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
            XLSX.writeFile(wb, 'modelo_importacao_produtos.xlsx');
        } else if (format === 'json') {
            const jsonData = JSON.stringify(sampleData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'modelo_importacao_produtos.json');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const parseFileData = (file, callback) => {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        switch (fileExtension) {
            case 'csv':
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: callback,
                    error: (error) => {
                        toast.error(`Erro ao ler arquivo CSV: ${error.message}`);
                        setIsImporting(false);
                    }
                });
                break;
            
            case 'xlsx':
            case 'xls':
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        
                        if (jsonData.length < 2) {
                            toast.error('Arquivo Excel deve conter pelo menos uma linha de cabeçalho e uma linha de dados.');
                            setIsImporting(false);
                            return;
                        }
                        
                        const headers = jsonData[0];
                        const rows = jsonData.slice(1);
                        const parsedData = rows.map(row => {
                            const obj = {};
                            headers.forEach((header, index) => {
                                obj[header] = row[index] || '';
                            });
                            return obj;
                        });
                        
                        callback({ data: parsedData });
                    } catch (error) {
                        toast.error(`Erro ao ler arquivo Excel: ${error.message}`);
                        setIsImporting(false);
                    }
                };
                reader.onerror = () => {
                    toast.error('Erro ao ler o arquivo Excel.');
                    setIsImporting(false);
                };
                reader.readAsArrayBuffer(file);
                break;
            
            case 'json':
                const jsonReader = new FileReader();
                jsonReader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        callback({ data: Array.isArray(jsonData) ? jsonData : [jsonData] });
                    } catch (error) {
                        toast.error(`Erro ao ler arquivo JSON: ${error.message}`);
                        setIsImporting(false);
                    }
                };
                jsonReader.onerror = () => {
                    toast.error('Erro ao ler o arquivo JSON.');
                    setIsImporting(false);
                };
                jsonReader.readAsText(file);
                break;
            
            default:
                toast.error(`Tipo de arquivo não suportado: .${fileExtension}. Use CSV, Excel (.xlsx/.xls) ou JSON.`);
                setIsImporting(false);
                break;
        }
    };

    // Função para criar categoria se não existir
    const createCategoryIfNotExists = async (categoryName, categoriesMap) => {
        const normalizedName = categoryName.toLowerCase();
        if (categoriesMap.has(normalizedName)) {
            return categoriesMap.get(normalizedName);
        }

        try {
            const docRef = await addDoc(collection(db, 'categories'), {
                name: categoryName.trim()
            });
            categoriesMap.set(normalizedName, docRef.id);
            toast.success(`Nova categoria criada: "${categoryName}"`);
            return docRef.id;
        } catch (error) {
            toast.error(`Erro ao criar categoria "${categoryName}": ${error.message}`);
            return null;
        }
    };

    // Função para criar localidade se não existir
    const createLocationIfNotExists = async (locationName, locationsMap) => {
        const fieldName = `Estoque_${locationName.replace(/\s+/g, '_')}`;
        if (locationsMap.has(fieldName)) {
            return locationsMap.get(fieldName);
        }

        try {
            const docRef = await addDoc(collection(db, 'locations'), {
                name: locationName.trim()
            });
            locationsMap.set(fieldName, docRef.id);
            toast.success(`Nova localidade criada: "${locationName}"`);
            return docRef.id;
        } catch (error) {
            toast.error(`Erro ao criar localidade "${locationName}": ${error.message}`);
            return null;
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const allowedTypes = ['csv', 'xlsx', 'xls', 'json'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            toast.error(`Tipo de arquivo não suportado. Use: ${allowedTypes.join(', ')}`);
            return;
        }

        setIsImporting(true);
        
        parseFileData(file, async (results) => {
            const productsToImport = results.data;
            const categoriesMap = new Map((categories || []).map(cat => [cat.name.toLowerCase(), cat.id]));
            const locationsMap = new Map((locations || []).map(loc => [`Estoque_${loc.name.replace(/\s+/g, '_')}`, loc.id]));

            // Identificar todas as categorias e localidades únicas da planilha
            const uniqueCategories = new Set();
            const uniqueLocations = new Set();

            productsToImport.forEach(productRow => {
                const { Categoria, ...stockFields } = productRow;
                if (Categoria) {
                    uniqueCategories.add(Categoria.trim());
                }
                
                // Extrair nomes de localidades dos campos de estoque
                Object.keys(stockFields).forEach(field => {
                    if (field.startsWith('Estoque_') && stockFields[field]) {
                        const locationName = field.replace('Estoque_', '').replace(/_/g, ' ');
                        uniqueLocations.add(locationName);
                    }
                });
            });

            // Criar categorias e localidades que não existem
            toast.loading('Verificando e criando categorias e localidades...', { id: 'creating-entities' });
            
            for (const categoryName of uniqueCategories) {
                await createCategoryIfNotExists(categoryName, categoriesMap);
            }

            for (const locationName of uniqueLocations) {
                await createLocationIfNotExists(locationName, locationsMap);
            }

            toast.dismiss('creating-entities');
            toast.loading('Importando produtos...', { id: 'importing-products' });

            const promises = (productsToImport || []).map(async (productRow) => {
                const { Nome, Categoria, Unidade, EstoqueMinimo, ...stockFields } = productRow;

                if (!Nome || !Categoria) {
                    toast.error(`Produto "${Nome || 'Sem nome'}" ignorado: Nome e Categoria são obrigatórios.`);
                    return Promise.resolve();
                }

                const categoryId = categoriesMap.get(Categoria.toLowerCase());
                if (!categoryId) {
                    toast.error(`Produto "${Nome}" ignorado: Erro ao obter categoria "${Categoria}".`);
                    return Promise.resolve();
                }

                const locationQuantities = {};
                for (const [field, value] of Object.entries(stockFields)) {
                    if (field.startsWith('Estoque_') && value) {
                        const locationId = locationsMap.get(field);
                        if (locationId) {
                            locationQuantities[locationId] = Number(value) || 0;
                        }
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
                toast.dismiss('importing-products');
                toast.success(`${successCount} de ${productsToImport.length} produtos foram importados com sucesso!`);
            } catch (error) {
                toast.dismiss('importing-products');
                toast.error(`Ocorreu um erro durante a importação: ${error.message}`);
            } finally {
                setIsImporting(false);
                event.target.value = null;
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Importação em Massa de Produtos</h3>
            <p className="text-gray-600 mb-6">
                Para adicionar múltiplos produtos de uma vez, baixe uma planilha modelo, preencha com os dados e importe o arquivo aqui.
                Formatos suportados: <strong>CSV, Excel (.xlsx/.xls) e JSON</strong>.
                <br />
                <span className="text-green-600 font-medium"> Novo:</span> Categorias e localidades que não existirem serão criadas automaticamente durante a importação!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <FaFileCsv className="mx-auto text-3xl text-green-600 mb-2" />
                    <h4 className="font-semibold text-gray-800 mb-2">CSV</h4>
                    <p className="text-sm text-gray-600 mb-3">Formato simples e compatível</p>
                    <button
                        onClick={() => handleDownloadTemplate('csv')}
                        className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition duration-300 text-sm"
                    >
                        <FaDownload className="inline mr-1" />
                        Baixar CSV
                    </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <FaFileExcel className="mx-auto text-3xl text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-800 mb-2">Excel</h4>
                    <p className="text-sm text-gray-600 mb-3">Planilha com formatação</p>
                    <button
                        onClick={() => handleDownloadTemplate('xlsx')}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition duration-300 text-sm"
                    >
                        <FaDownload className="inline mr-1" />
                        Baixar Excel
                    </button>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <FaFileCode className="mx-auto text-3xl text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-800 mb-2">JSON</h4>
                    <p className="text-sm text-gray-600 mb-3">Formato para desenvolvedores</p>
                    <button
                        onClick={() => handleDownloadTemplate('json')}
                        className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded hover:bg-purple-700 transition duration-300 text-sm"
                    >
                        <FaDownload className="inline mr-1" />
                        Baixar JSON
                    </button>
                </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
                <label htmlFor="file-upload" className="flex items-center justify-center bg-orange-500 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-lg hover:bg-orange-600 transition duration-300 cursor-pointer min-h-[44px] sm:min-h-[48px] text-sm sm:text-base">
                    <FaUpload className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                    {isImporting ? 'Importando...' : 'Importar Arquivo'}
                </label>
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                    Tipos aceitos: CSV, Excel (.xlsx, .xls), JSON
                </p>
            </div>
        </div>
    );
};

export default ProductBulkImport;
