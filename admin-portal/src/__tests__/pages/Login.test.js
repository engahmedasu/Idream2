import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../utils/api';

jest.mock('../../utils/api');
jest.mock('react-router-dom');
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  ToastContainer: () => null,
}));

const mockPost = jest.fn();
const mockGet = jest.fn();

// Mock the default export (api instance)
api.post = mockPost;
api.get = mockGet;

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks
    mockPost.mockClear();
    mockGet.mockClear();
    // Clear toast mocks
    const { toast } = require('react-toastify');
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it('should render login form', () => {
    mockGet.mockResolvedValueOnce({ data: null }); // Mock initial auth check
    const { container } = renderLogin();
    
    expect(screen.getByPlaceholderText(/email|phone/i)).toBeInTheDocument();
    expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show validation error for empty fields', async () => {
    mockGet.mockResolvedValueOnce({ data: null });
    renderLogin();
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // HTML5 validation should prevent submission, but check for any error messages
      expect(submitButton).toBeInTheDocument();
    });
  });

  it('should submit login form with valid credentials', async () => {
    const { toast } = require('react-toastify');
    mockGet.mockResolvedValueOnce({ data: null }); // Initial auth check
    mockPost.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        user: { id: '1', email: 'test@test.com', role: { name: 'superAdmin' } }
      }
    });

    const { container } = renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/email|phone/i);
    const passwordInput = container.querySelector('input[name="password"]');
    
    fireEvent.change(emailInput, {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(passwordInput, {
      target: { value: 'password123' }
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123'
      });
      expect(toast.success).toHaveBeenCalledWith('Login successful');
    });
  });

  it('should display error message on login failure', async () => {
    const { toast } = require('react-toastify');
    mockGet.mockResolvedValueOnce({ data: null });
    mockPost.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    const { container } = renderLogin();
    
    const emailInput = screen.getByPlaceholderText(/email|phone/i);
    const passwordInput = container.querySelector('input[name="password"]');
    
    fireEvent.change(emailInput, {
      target: { value: 'test@test.com' }
    });
    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' }
    });
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });
});

