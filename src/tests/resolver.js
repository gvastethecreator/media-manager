const defaultResolver = require('jest-resolve').default;

module.exports = (request, options) =>
  defaultResolver(request, {
    ...options,
    extensions: [...options.extensions, '.ts', '.tsx', '.mjs', '.js', '.jsx'],
  });
