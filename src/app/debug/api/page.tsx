import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Prueba de API Logger',
	description: 'Página para probar el sistema de logging para rutas API',
};

export default function ApiLoggerTestPage() {
	return (
		<div className="container space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold">Prueba de API Logger</h1>
				<p className="text-muted-foreground">
					Esta página demuestra el uso del sistema de logging para rutas API. Revisa la consola del servidor para ver
					los logs detallados.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Solicitud GET</CardTitle>
						<CardDescription>Prueba una solicitud GET a la ruta de prueba</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm">
							Esta solicitud enviará una petición GET a la ruta de prueba. Observa cómo se registran los detalles de la
							solicitud y la respuesta.
						</p>
						<div className="flex items-end gap-4">
							<div className="grid w-full items-center gap-1.5">
								<Label htmlFor="query">Parámetro de consulta</Label>
								<Input id="query" name="query" placeholder="valor=123" defaultValue="valor=test" />
							</div>
							<Button
								id="sendGet"
								className="mb-0.5"
								onClick={() => {
									const queryInput = document.getElementById('query') as HTMLInputElement;
									const query = queryInput.value || '';
									const url = `/api/logger-test${query ? `?${query}` : ''}`;

									fetch(url)
										.then((response) => response.json())
										.then((data) => {
											console.log('Respuesta recibida:', data);
										})
										.catch((error) => {
											console.error('Error:', error);
										});
								}}
							>
								Enviar GET
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Solicitud POST</CardTitle>
						<CardDescription>Prueba una solicitud POST con datos JSON</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm">
							Esta solicitud enviará una petición POST con un cuerpo JSON a la ruta de prueba. Observa cómo se registran
							los datos del cuerpo y los encabezados.
						</p>
						<div className="grid w-full gap-1.5">
							<Label htmlFor="jsonBody">Cuerpo JSON</Label>
							<textarea
								id="jsonBody"
								className="min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								placeholder='{"name": "test", "value": 123}'
								defaultValue={JSON.stringify(
									{
										name: 'usuario_test',
										email: 'test@ejemplo.com',
										data: {
											id: 123,
											items: ['item1', 'item2'],
											password: 'contraseña_secreta',
										},
									},
									null,
									2
								)}
							/>
						</div>
						<Button
							onClick={() => {
								const jsonInput = document.getElementById('jsonBody') as HTMLTextAreaElement;
								let jsonData;

								try {
									jsonData = JSON.parse(jsonInput.value);
								} catch (error) {
									alert('JSON inválido: ' + (error as Error).message);
									return;
								}

								fetch('/api/logger-test', {
									method: 'POST',
									headers: {
										'Content-Type': 'application/json',
										'X-Custom-Header': 'valor-personalizado',
									},
									body: JSON.stringify(jsonData),
								})
									.then((response) => response.json())
									.then((data) => {
										console.log('Respuesta recibida:', data);
									})
									.catch((error) => {
										console.error('Error:', error);
									});
							}}
						>
							Enviar POST
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle>Instrucciones</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-medium">Cómo usar el API Logger:</h3>
						<pre className="bg-muted p-4 rounded-md text-sm mt-2 overflow-x-auto">
							{`import { apiLogger } from '@/lib/server/api-logger';
import { NextRequest, NextResponse } from 'next/server';

// Crear un logger específico para esta ruta API
const routeLogger = apiLogger.createRouteLogger('MiRutaAPI');

export async function GET(request: NextRequest) {
  // Registrar la solicitud entrante
  const requestInfo = routeLogger.logRequest(request);

  try {
    // Tu lógica aquí
    const response = NextResponse.json({ success: true });

    // Registrar la respuesta
    routeLogger.logResponse(response, requestInfo);

    return response;
  } catch (error) {
    // Registrar el error
    routeLogger.logError(error as Error, requestInfo);

    const errorResponse = NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );

    routeLogger.logResponse(errorResponse, requestInfo);

    return errorResponse;
  }
}`}
						</pre>
					</div>
				</CardContent>
				<CardFooter>
					<p className="text-sm text-muted-foreground">
						Revisa la consola del servidor para ver los logs detallados de las solicitudes API.
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
