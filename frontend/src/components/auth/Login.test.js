import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from './Login';

const renderLogin = () => {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthProvider>
  );
};

test('renders login card with email and password inputs', () => {
  renderLogin();
  expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/name@example.com/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
});

test('fills demo rider credentials on button click', () => {
  renderLogin();
  const riderDemoBtn = screen.getByRole('button', { name: /Rider Demo/i });
  fireEvent.click(riderDemoBtn);

  const emailInput = screen.getByPlaceholderText(/name@example.com/i);
  const passwordInput = screen.getByPlaceholderText(/••••••••/i);
  expect(emailInput.value).toBe('rider@example.com');
  expect(passwordInput.value).toBe('password123');
});

test('fills demo driver credentials on button click', () => {
  renderLogin();
  const driverDemoBtn = screen.getByRole('button', { name: /Driver Demo/i });
  fireEvent.click(driverDemoBtn);

  const emailInput = screen.getByPlaceholderText(/name@example.com/i);
  const passwordInput = screen.getByPlaceholderText(/••••••••/i);
  expect(emailInput.value).toBe('driver@example.com');
  expect(passwordInput.value).toBe('password123');
});
