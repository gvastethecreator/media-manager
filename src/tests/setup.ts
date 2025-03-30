/**
 * @file Configuración global para las pruebas con Jest
 * @module tests/setup
 */

import '@testing-library/jest-dom';

// Silenciar consola durante las pruebas
global.console = {
  ...console,
  // Mantener nativo error para debug
  error: jest.fn(),
  // Mantener avisos para debug
  warn: jest.fn(),
  // Solo silenciar info y logs standard
  info: jest.fn(),
  log: jest.fn(),
};

// Configuración adicional si es necesaria