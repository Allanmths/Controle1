import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StockPage from '../StockPage';
import { AuthContext } from '../../context/AuthContext';
import { SettingsContext } from '../../context/SettingsContext';

// Mock do hook useFirestore
vi.mock('../../hooks/useFirestore', () => ({
  __esModule: true,
  default: (collectionName) => {
    if (collectionName === 'products') {
      return { data: [], loading: false, error: null };
    }
    return { data: [], loading: false, error: null };
  },
}));

// Mock do componente ProductModal para evitar erros de portal
vi.mock('../../components/ProductModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }) => (isOpen ? <div data-testid="product-modal">Modal Aberto</div> : null),
}));

const mockAuthContext = {
  currentUser: { uid: 'test-user' },
};

const mockSettingsContext = {
  settings: { darkMode: false, itemsPerPage: 10 },
};

describe('StockPage', () => {
  it('deve renderizar o tÃ­tulo principal da pÃ¡gina', () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <SettingsContext.Provider value={mockSettingsContext}>
          <StockPage />
        </SettingsContext.Provider>
      </AuthContext.Provider>
    );

    const heading = screen.getByRole('heading', { name: /Controle de Estoque/i });
    expect(heading).toBeInTheDocument();
  });
});
