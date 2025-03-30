'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { runAllDiagnostics } from '@/app/actions/folders/folder-diagnostics';
import { useState } from 'react';
import { RefreshCcw, Check, X, AlertTriangle, Database } from 'lucide-react';

type DiagnosticResult = Awaited<ReturnType<typeof runAllDiagnostics>>;

export function FolderDiagnostics() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const diagnosticResults = await runAllDiagnostics();
      setResults(diagnosticResults);
    } catch (e) {
      console.error('Error al ejecutar diagnósticos:', e);
      setError(e instanceof Error ? e.message : 'Error desconocido al ejecutar diagnósticos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Diagnóstico de Base de Datos
        </CardTitle>
        <CardDescription>
          Herramienta para verificar la conexión y estado de las tablas de la base de datos
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6">
        {error && (
          <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-4">
            <p className="font-medium">Error durante el diagnóstico</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Resultado de conexión */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                {results.connection.success ?
                  <Check className="h-5 w-5 text-green-500" /> :
                  <X className="h-5 w-5 text-destructive" />
                }
                Conexión a la Base de Datos
              </h3>
              <div className={`p-3 rounded-md ${results.connection.success ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <p>{results.connection.message}</p>
                {results.connection.details && (
                  <pre className="text-xs mt-2 p-2 bg-muted rounded">
                    {JSON.stringify(results.connection.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Resultado de estructura */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                {results.structure.success ?
                  <Check className="h-5 w-5 text-green-500" /> :
                  <X className="h-5 w-5 text-destructive" />
                }
                Estructura de la Tabla Folder
              </h3>
              <div className={`p-3 rounded-md ${results.structure.success ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <p>{results.structure.message}</p>
                {results.structure.details && (
                  <pre className="text-xs mt-2 p-2 bg-muted rounded">
                    {JSON.stringify(results.structure.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Resultado de conteo */}
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center gap-2">
                {results.counts.success ?
                  <Check className="h-5 w-5 text-green-500" /> :
                  <X className="h-5 w-5 text-destructive" />
                }
                Conteo de Registros
              </h3>
              <div className={`p-3 rounded-md ${results.counts.success ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                <p>{results.counts.message}</p>
                {results.counts.counts && (
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="bg-muted p-2 rounded">
                      <p className="text-sm font-medium">Carpetas</p>
                      <p className="text-2xl">{results.counts.counts.folder}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-sm font-medium">Imágenes</p>
                      <p className="text-2xl">{results.counts.counts.image}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-sm font-medium">Videos</p>
                      <p className="text-2xl">{results.counts.counts.video}</p>
                    </div>
                  </div>
                )}
                {results.counts.details && (
                  <pre className="text-xs mt-2 p-2 bg-muted rounded">
                    {JSON.stringify(results.counts.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Resultado general */}
            <div className="mt-4 p-4 rounded-md border border-muted bg-muted/50">
              <div className="flex items-center gap-2">
                {results.overallSuccess ? (
                  <>
                    <Check className="h-6 w-6 text-green-500" />
                    <span className="font-medium">Diagnóstico exitoso</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                    <span className="font-medium">Diagnóstico con problemas</span>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm">
                {results.overallSuccess
                  ? 'La base de datos parece estar funcionando correctamente.'
                  : 'Se encontraron problemas con la base de datos. Revise los detalles anteriores.'}
              </p>
            </div>
          </div>
        )}

        {!results && !error && !isLoading && (
          <div className="p-6 text-center border border-dashed rounded-md">
            <p className="text-muted-foreground">
              Ejecute el diagnóstico para verificar el estado de la base de datos
            </p>
          </div>
        )}

        {isLoading && (
          <div className="p-6 text-center">
            <RefreshCcw className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Ejecutando diagnóstico...</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button
          onClick={runDiagnostics}
          disabled={isLoading}
          variant="default"
        >
          {isLoading ? (
            <>
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Ejecutar diagnóstico
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}