console.error('Error: db:reset está deshabilitado hasta disponer de migraciones reproducibles y restore obligatorio.');
console.error('Usa `bun run db:backup` para proteger datos o el runner aislado para una base descartable de tests.');
process.exitCode = 2;
