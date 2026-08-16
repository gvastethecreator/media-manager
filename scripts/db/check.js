console.error('Este diagnóstico legacy fue retirado porque inspeccionaba dev.db y podía dar un falso verde.');
console.error('Usa `bun run db:check -- --database <copia.sqlite>` o DATABASE_URL explícito.');
process.exitCode = 2;
