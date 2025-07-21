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

  // Função para obter o tema inicial
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme;
      }
      // Se não há preferência salva, verifica a preferência do sistema
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

  // Função para alternar o tema
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
