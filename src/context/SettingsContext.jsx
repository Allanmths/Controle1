import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. CriaÃ§Ã£o do Contexto
const SettingsContext = createContext();

// 2. Hook para facilitar o uso do contexto
export const useSettings = () => {
  return useContext(SettingsContext);
};

// 3. Provider do Contexto
export const SettingsProvider = ({ children }) => {
  // Tenta ler do localStorage, com um valor padrÃ£o de 10
  const getInitialItemsPerPage = () => {
    try {
      const savedValue = localStorage.getItem('itemsPerPage');
      // Verifica se o valor salvo Ã© um nÃºmero vÃ¡lido, senÃ£o retorna o padrÃ£o.
      return savedValue && !isNaN(parseInt(savedValue, 10)) ? parseInt(savedValue, 10) : 10;
    } catch (error) {
      console.error("Erro ao ler 'itemsPerPage' do localStorage:", error);
      return 10; // Retorna o padrÃ£o em caso de erro
    }
  };

  // FunÃ§Ã£o para obter o tema inicial
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      // Se nÃ£o hÃ¡ preferÃªncia salva, verifica a preferÃªncia do sistema
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch (error) {
      console.error("Erro ao ler 'theme' do localStorage:", error);
      return 'light';
    }
  };

  const [itemsPerPage, setItemsPerPage] = useState(getInitialItemsPerPage);
  const [theme, setTheme] = useState(getInitialTheme);

  // Efeito para salvar no localStorage sempre que o valor mudar
  useEffect(() => {
    try {
      localStorage.setItem('itemsPerPage', itemsPerPage);
    } catch (error) {
      console.error("Erro ao salvar 'itemsPerPage' no localStorage:", error);
    }
  }, [itemsPerPage]);

  // Efeito para aplicar e salvar o tema
  useEffect(() => {
    try {
      localStorage.setItem('theme', theme);
      
      // Aplica ou remove a classe 'dark' no elemento html
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error("Erro ao salvar 'theme' no localStorage:", error);
    }
  }, [theme]);

  // FunÃ§Ã£o para alternar o tema
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    itemsPerPage,
    setItemsPerPage,
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
