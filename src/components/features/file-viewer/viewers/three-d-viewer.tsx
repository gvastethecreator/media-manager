/**
 * @file Visor de archivos 3D con Three.js y React Three Fiber
 * @module components/features/file-viewer/viewers/three-d-viewer
 * @description Renderizador de modelos 3D (GLB, GLTF, OBJ, STL)
 */

// @ts-expect-error - Drei types may be missing
import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box as BoxIcon, Download, Info, RotateCcw } from 'lucide-react';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ThreeDViewerProps {
	src: string;
	fileName?: string;
	className?: string;
}

// Modelo 3D que carga y renderiza el archivo
function Model({ url, onError }: { url: string; onError: (error: Error) => void }) {
	const { scene } = useGLTF(url, undefined, (error: Error) => {
		onError(error || new Error('Error loading 3D model'));
	});

	const modelRef = useRef<THREE.Group>(null);

	// Auto-rotación suave
	useFrame((state) => {
		if (modelRef.current) {
			modelRef.current.rotation.y = state.clock.elapsedTime * 0.1;
		}
	});

	// Centrar y escalar el modelo
	scene.traverse((child: any) => {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});

	return <primitive object={scene} position={[0, 0, 0]} ref={modelRef} scale={1} />;
}

// Escena 3D completa
function Scene({ url, onError }: { url: string; onError: (error: Error) => void }) {
	return (
		<>
			<PerspectiveCamera fov={50} makeDefault position={[0, 2, 5]} />
			<ambientLight intensity={0.5} />
			<directionalLight castShadow intensity={1} position={[10, 10, 5]} />
			<pointLight intensity={0.5} position={[-10, -10, -10]} />

			<Suspense fallback={null}>
				<Model onError={onError} url={url} />
				<Environment preset="city" />
				<ContactShadows blur={2.5} far={4} opacity={0.4} position={[0, -1.5, 0]} scale={10} />
			</Suspense>

			<OrbitControls
				autoRotate={false}
				enablePan={true}
				enableRotate={true}
				enableZoom={true}
				maxDistance={10}
				minDistance={2}
			/>
		</>
	);
}

// Placeholder cuando hay error o formato no soportado
function ErrorPlaceholder({
	fileName,
	error,
	onDownload,
}: {
	fileName?: string;
	error?: string;
	onDownload: () => void;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center p-8 text-center">
			<BoxIcon className="mb-4 h-16 w-16 text-muted-foreground/30" />
			<h3 className="mb-2 font-semibold text-lg">{error ? 'Error al cargar modelo' : 'Vista previa limitada'}</h3>
			<p className="mb-4 max-w-md text-muted-foreground text-sm">
				{error ||
					'Algunos formatos 3D requieren software especializado. Descarga el archivo para verlo en una aplicación compatible.'}
			</p>
			{fileName && <p className="mb-4 text-muted-foreground text-xs">{fileName}</p>}
			<Button onClick={onDownload} variant="outline">
				<Download className="mr-2 h-4 w-4" />
				Descargar archivo
			</Button>
		</div>
	);
}

export function ThreeDViewer({ src, fileName, className }: ThreeDViewerProps) {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showInfo, setShowInfo] = useState(false);

	// Determinar el formato del archivo
	const fileExtension = fileName?.split('.').pop()?.toLowerCase() || '';
	const supportedFormats = ['glb', 'gltf', 'obj', 'stl'];
	const isSupported = supportedFormats.includes(fileExtension);

	const handleError = (err: Error) => {
		console.error('Error loading 3D model:', err);
		setError('No se pudo cargar el modelo 3D. El formato puede no ser compatible o el archivo está corrupto.');
		setIsLoading(false);
	};

	const handleDownload = () => {
		const link = document.createElement('a');
		link.href = src;
		link.download = fileName || 'modelo-3d';
		link.click();
	};

	const handleReset = () => {
		window.location.reload();
	};

	// Si no es un formato soportado o hay error, mostrar placeholder
	if (!isSupported || error) {
		return (
			<Card className={cn('flex h-[500px] items-center justify-center', className)}>
				<ErrorPlaceholder
					error={error || (isSupported ? undefined : `Formato .${fileExtension} no soportado para vista previa`)}
					fileName={fileName}
					onDownload={handleDownload}
				/>
			</Card>
		);
	}

	return (
		<Card className={cn('relative h-[500px] overflow-hidden', className)}>
			{/* Canvas 3D */}
			<div className="absolute inset-0 bg-gradient-to-b from-background to-muted">
				<Canvas
					camera={{ position: [0, 2, 5], fov: 50 }}
					gl={{ antialias: true, alpha: true }}
					onCreated={() => setIsLoading(false)}
					shadows
				>
					<Scene onError={handleError} url={src} />
				</Canvas>
			</div>

			{/* Loading indicator */}
			{isLoading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
					<div className="flex flex-col items-center gap-2">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<p className="text-muted-foreground text-sm">Cargando modelo 3D...</p>
					</div>
				</div>
			)}

			{/* Controles */}
			<div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						className="bg-background/80 backdrop-blur"
						onClick={() => setShowInfo(!showInfo)}
						size="icon"
						variant="secondary"
					>
						<Info className="h-4 w-4" />
					</Button>
					<Button className="bg-background/80 backdrop-blur" onClick={handleReset} size="icon" variant="secondary">
						<RotateCcw className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex items-center gap-2">
					<Button className="bg-background/80 backdrop-blur" onClick={handleDownload} size="sm" variant="secondary">
						<Download className="mr-2 h-4 w-4" />
						Descargar
					</Button>
				</div>
			</div>

			{/* Info panel */}
			{showInfo && (
				<div className="absolute right-4 bottom-4 left-4 z-10 rounded-lg bg-background/95 p-4 backdrop-blur">
					<div className="flex items-start justify-between">
						<div>
							<h4 className="mb-1 font-semibold text-sm">{fileName || 'Modelo 3D'}</h4>
							<p className="text-muted-foreground text-xs">Formato: {fileExtension.toUpperCase()}</p>
						</div>
						<Button onClick={() => setShowInfo(false)} size="sm" variant="ghost">
							Cerrar
						</Button>
					</div>
					<div className="mt-2 text-muted-foreground text-xs">
						<p>Controles:</p>
						<ul className="mt-1 list-inside list-disc">
							<li>Arrastrar para rotar</li>
							<li>Scroll para zoom</li>
							<li>Clic derecho para pan</li>
						</ul>
					</div>
				</div>
			)}

			{/* Instrucciones flotantes */}
			{!showInfo && (
				<div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1.5 text-muted-foreground text-xs backdrop-blur">
					Arrastrar para rotar · Scroll para zoom
				</div>
			)}
		</Card>
	);
}

export default ThreeDViewer;
