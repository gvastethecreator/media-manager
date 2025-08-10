import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Configurar happy-dom usando GlobalRegistrator
GlobalRegistrator.register();

// Limpiar después de cada test
afterEach(() => {
	cleanup();
});
