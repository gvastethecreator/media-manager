'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
	const router = useRouter();

	return (
		<div className="flex items-center justify-center min-h-screen bg-background/80 p-4">
			<Card className="max-w-md w-full border-muted/30 shadow-lg">
				<CardHeader className="space-y-1 flex flex-col items-center text-center pb-2">
					<div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-2">
						<FileQuestion className="h-8 w-8 text-muted-foreground" />
					</div>
					<CardTitle className="text-2xl">Página no encontrada</CardTitle>
					<CardDescription>La página que estás buscando no existe o ha sido movida.</CardDescription>
				</CardHeader>
				<CardContent className="text-center text-muted-foreground text-sm pb-2">
					<p>Verifica la URL o regresa a la página principal para continuar navegando.</p>
				</CardContent>
				<CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
					<Button
						type="button"
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => router.back()}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Volver atrás
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
