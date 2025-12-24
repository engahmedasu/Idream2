import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../../components/Layout';
import { AuthProvider } from '../../context/AuthContext';

jest.mock('react-router-dom');

const renderWithProviders = (component, user = null) => {
  // Mock AuthContext
  const mockAuthContext = {
    user: user,
    logout: jest.fn(),
    login: jest.fn(),
  };

  jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockReturnValue(mockAuthContext);

  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render layout with sidebar', () => {
    renderWithProviders(<Layout />, { role: { name: 'superAdmin' } });
    
    expect(screen.getByText('iDream Admin')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should show menu items based on user role', () => {
    renderWithProviders(<Layout />, { role: { name: 'superAdmin' } });
    
    // SuperAdmin should see all menu items - use getAllByText since Dashboard appears multiple times
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getByText('Shops')).toBeInTheDocument();
  });

  it('should hide menu items for Finance role', () => {
    renderWithProviders(<Layout />, { role: { name: 'Finance' } });
    
    // Finance should only see Reports group, not main menu items like Shops
    expect(screen.queryByText('Shops')).not.toBeInTheDocument();
    // Finance should not see the main Products menu item (path: /products)
    // But can see Products under Reports submenu (path: /reports/products)
    const allLinks = screen.queryAllByRole('link');
    const mainProductsLink = allLinks.find(link => link.getAttribute('href') === '/products');
    expect(mainProductsLink).toBeUndefined();
    // Finance should see Reports
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });
});

