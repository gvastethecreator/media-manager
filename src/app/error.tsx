'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	// Registrar el error en la consola para depuración
	useEffect(() => {
		console.error('Error global de Next.js:', error);
	}, [error]);

	return (
		<div className="flex items-center justify-center min-h-screen bg-background/80 p-4">
			<Card className="max-w-md w-full border-destructive/30 bg-destructive/5 shadow-lg">
				<CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
					<div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>
					<CardTitle className="text-2xl">Algo salió mal</CardTitle>
					<CardDescription>Ha ocurrido un error inesperado en la aplicación.</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-muted-foreground text-sm pb-2">
					<p className="mb-3">Estamos trabajando para solucionar el problema. Puedes intentar recargar la página.</p>
					{error.message && (
						<div className="bg-background/20 p-3 rounded text-xs font-mono text-destructive/70 max-h-32 overflow-auto text-left">
							{error.message}
							{error.digest && <div className="mt-2 text-[10px] opacity-70">ID: {error.digest}</div>}
						</div>
					)}
				</CardContent>
				<CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
					<Button
						variant="outline"
						className="w-full sm:w-auto border-destructive/30 bg-background/30 hover:bg-background/50"
						onClick={reset}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Reintentar
					</Button>
					<Button className="w-full sm:w-auto" asChild>
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Ir al inicio
						</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
