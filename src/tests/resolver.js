/**
 * @file Resolver personalizado para Jest
 */

const resolver = require('jest-resolve');

module.exports = (path, options) => {
  // Mock resolución de paquetes específicos o archivos específicos aquí
  return resolver.default.sync(path, {
    ...options,
    packageFilter: pkg => {
      const pkgCopy = { ...pkg };
      // Para módulos específicos, se puede ajustar la resolución
      return pkgCopy;
    },
  });
};