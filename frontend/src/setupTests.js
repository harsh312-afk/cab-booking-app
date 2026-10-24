import '@testing-library/jest-dom';

// Node.js util polyfills for Jest / jsdom (React Router v7)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Browser API mocks
window.scrollTo = jest.fn();
window.alert = jest.fn();

// Mock canvas confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn()
  };
  return {
    io: jest.fn(() => mSocket)
  };
});
