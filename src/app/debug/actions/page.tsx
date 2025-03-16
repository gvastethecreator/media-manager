import { errorAction, sensitiveDataAction, successAction } from '@/app/actions/logger-test';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Prueba de Server Actions',
	description: 'Página para probar los Server Actions con el sistema de logging',
};

export default function ActionTestPage() {
	return (
		<div className="container py-10 space-y-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold">Prueba de Server Actions con Logger</h1>
				<p className="text-muted-foreground">
					Esta página demuestra el uso del sistema de logging con Server Actions. Revisa la consola del servidor para
					ver los logs detallados.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Acción Exitosa</CardTitle>
						<CardDescription>Prueba una acción del servidor que se completa con éxito</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm mb-4">
							Esta acción simula un procesamiento exitoso y devuelve datos procesados. Observa cómo se registra el
							inicio y la finalización de la acción.
						</p>
						<form
							action={async () => {
								'use server';
								await successAction({
									id: 123,
									name: 'Prueba',
									value: Math.random() * 100,
								});
							}}
						>
							<Button type="submit" className="w-full">
								Ejecutar Acción Exitosa
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Acción con Error</CardTitle>
						<CardDescription>Prueba una acción del servidor que genera un error</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm mb-4">
							Esta acción simula un error durante el procesamiento. Observa cómo se registra el error con detalles
							adicionales.
						</p>
						<form
							action={async () => {
								'use server';
								try {
									await errorAction(true);
								} catch (error) {
									// El error se captura aquí pero ya ha sido registrado por el wrapper
									console.error('Error capturado en el cliente:', (error as Error).message);
								}
							}}
						>
							<Button type="submit" variant="destructive" className="w-full">
								Ejecutar Acción con Error
							</Button>
						</form>
					</CardContent>
				</Card>

				<Card className="md:col-span-2">
					<CardHeader>
						<CardTitle>Acción con Datos Sensibles</CardTitle>
						<CardDescription>
							Prueba una acción que maneja datos sensibles que son redactados en los logs
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm mb-4">
							Esta acción procesa datos que incluyen información sensible como contraseñas y tokens. Observa cómo estos
							campos son redactados automáticamente en los logs.
						</p>
						<form
							action={async () => {
								'use server';
								await sensitiveDataAction({
									username: 'usuario_prueba',
									email: 'usuario@ejemplo.com',
									password: 'contraseña_super_secreta',
								});
							}}
						>
							<Button type="submit" variant="outline" className="w-full">
								Procesar Datos Sensibles
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>

			<Card className="mt-8">
				<CardHeader>
					<CardTitle>Instrucciones</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h3 className="font-medium">Cómo usar el Action Logger:</h3>
						<pre className="bg-muted p-4 rounded-md text-sm mt-2 overflow-x-auto">
							{`import { actionLogger } from '@/lib/server/action-logger';

// Crear un logger específico para tus acciones
const myActionLogger = actionLogger.createActionLogger('MiServicio');

// Envolver tu función de acción con el logger
export const miAccion = myActionLogger.wrapAction(async (parametros) => {
  // Tu lógica aquí
  return resultado;
});`}
						</pre>
					</div>

					<div>
						<h3 className="font-medium">Opciones de configuración:</h3>
						<pre className="bg-muted p-4 rounded-md text-sm mt-2 overflow-x-auto">
							{`const logger = actionLogger.createActionLogger('MiServicio', {
  showParams: true,           // Mostrar parámetros en los logs
  showResult: true,           // Mostrar resultados en los logs
  sensitiveParamFields: ['password', 'token'], // Campos sensibles en parámetros
  sensitiveResultFields: ['token', 'key']      // Campos sensibles en resultados
});`}
						</pre>
					</div>
				</CardContent>
				<CardFooter>
					<p className="text-sm text-muted-foreground">
						Revisa la consola del servidor para ver los logs detallados de las acciones ejecutadas.
					</p>
				</CardFooter>
			</Card>
		</div>
	);
}
