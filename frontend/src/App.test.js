import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders CabPulse brand and navigation header', () => {
  render(<App />);
  const brandTitles = screen.getAllByText(/CabPulse/i);
  expect(brandTitles.length).toBeGreaterThan(0);
});

test('renders hero headline for guest landing page', () => {
  render(<App />);
  const headline = screen.getByText(/Fast, Reliable &/i);
  expect(headline).toBeInTheDocument();
  const ctaBtn = screen.getByRole('link', { name: /Book a Ride Now/i });
  expect(ctaBtn).toBeInTheDocument();
});

test('renders authentication links in navbar for guests', () => {
  render(<App />);
  const loginLink = screen.getByRole('link', { name: /Login/i });
  const registerLink = screen.getByRole('link', { name: /Get Started/i });
  expect(loginLink).toBeInTheDocument();
  expect(registerLink).toBeInTheDocument();
});
