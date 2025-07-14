import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Criação do Contexto
const SettingsContext = createContext();

// 2. Hook para facilitar o uso do contexto
export const useSettings = () => {
  return useContext(SettingsContext);
};

// 3. Provider do Contexto
export const SettingsProvider = ({ children }) => {
  // Tenta ler do localStorage, com um valor padrão de 10
  const getInitialItemsPerPage = () => {
    try {
      const savedValue = localStorage.getItem('itemsPerPage');
      // Verifica se o valor salvo é um número válido, senão retorna o padrão.
      return savedValue && !isNaN(parseInt(savedValue, 10)) ? parseInt(savedValue, 10) : 10;
    } catch (error) {
      console.error("Erro ao ler 'itemsPerPage' do localStorage:", error);
      return 10; // Retorna o padrão em caso de erro
    }
  };

  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage);

  // Efeito para salvar no localStorage sempre que o valor mudar
  useEffect(() => {
    try {
      localStorage.setItem('itemsPerPage', itemsPerPage);
    } catch (error) {
      console.error("Erro ao salvar 'itemsPerPage' no localStorage:", error);
    }
  }, [itemsPerPage]);

  const value = {
    itemsPerPage,
    setItemsPerPage,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
