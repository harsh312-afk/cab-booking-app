import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Register from './Register';

const renderRegister = () => {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </AuthProvider>
  );
};

test('renders registration fields for passenger by default', () => {
  renderRegister();
  expect(screen.getByRole('heading', { name: /Create Your Account/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Jane Doe/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/jane@example.com/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/\+1-555-0199/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Register as Rider/i })).toBeInTheDocument();
  expect(screen.queryByPlaceholderText(/Honda City/i)).not.toBeInTheDocument();
});

test('toggles driver vehicle fields when Driver role tab is selected', () => {
  renderRegister();
  const driverTab = screen.getByRole('button', { name: /Driver Partner/i });
  fireEvent.click(driverTab);

  expect(screen.getByText(/Vehicle Information/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Honda City/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/KA-01-AB-1234/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Register as Driver Partner/i })).toBeInTheDocument();
});
