/**
 * @file 3D file viewer powered by Three.js and React Three Fiber.
 * @module components/features/file-viewer/viewers/three-d-viewer
 */

import { ContactShadows, Environment, OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Box as BoxIcon, Download, Info, RotateCcw } from 'lucide-react';
import { memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { ErrorBoundary } from '@/components/core/error-boundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';

const logger = clientLogger.withContext('ThreeDViewer');
const SUPPORTED_FORMATS = ['glb', 'gltf', 'obj', 'stl'] as const;
type Supported3DFormat = (typeof SUPPORTED_FORMATS)[number];

interface ThreeDViewerProps {
	className?: string;
	fileName?: string;
	src: string;
}

interface LoadedModelProps {
	format: Supported3DFormat;
	onReady: () => void;
	url: string;
}

function isSupportedFormat(value: string): value is Supported3DFormat {
	return SUPPORTED_FORMATS.includes(value as Supported3DFormat);
}

function enablePreviewShading(object: THREE.Object3D) {
	object.traverse((child) => {
		if (child instanceof THREE.Mesh) {
			child.castShadow = true;
			child.receiveShadow = true;
			if (!child.material) {
				child.material = new THREE.MeshStandardMaterial({ color: new THREE.Color('white'), roughness: 0.55 });
			}
		}
	});
}

function normalizeForPreview(source: THREE.Object3D) {
	const object = source.clone(true);
	enablePreviewShading(object);

	const box = new THREE.Box3().setFromObject(object);
	if (box.isEmpty()) {
		return object;
	}

	const center = box.getCenter(new THREE.Vector3());
	const size = box.getSize(new THREE.Vector3());
	const maxDimension = Math.max(size.x, size.y, size.z);

	object.position.sub(center);
	if (maxDimension > 0) {
		object.scale.setScalar(2.4 / maxDimension);
	}

	return object;
}

function AutoRotatingObject({ object, onReady }: { object: THREE.Object3D; onReady: () => void }) {
	const modelRef = useRef<THREE.Group>(null);

	useEffect(() => {
		onReady();
	}, [onReady]);

	useFrame((state) => {
		if (modelRef.current) {
			modelRef.current.rotation.y = state.clock.elapsedTime * 0.1;
		}
	});

	return (
		<group ref={modelRef}>
			<primitive object={object} />
		</group>
	);
}

function GltfModel({ onReady, url }: Omit<LoadedModelProps, 'format'>) {
	const { scene } = useGLTF(url);
	const object = useMemo(() => normalizeForPreview(scene), [scene]);
	return <AutoRotatingObject object={object} onReady={onReady} />;
}

function ObjModel({ onReady, url }: Omit<LoadedModelProps, 'format'>) {
	const model = useLoader(OBJLoader, url);
	const object = useMemo(() => normalizeForPreview(model), [model]);
	return <AutoRotatingObject object={object} onReady={onReady} />;
}

function StlModel({ onReady, url }: Omit<LoadedModelProps, 'format'>) {
	const geometry = useLoader(STLLoader, url);
	const object = useMemo(() => {
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color('white'),
			metalness: 0.05,
			roughness: 0.55,
		});
		const mesh = new THREE.Mesh(geometry, material);
		geometry.computeVertexNormals();
		return normalizeForPreview(mesh);
	}, [geometry]);

	return <AutoRotatingObject object={object} onReady={onReady} />;
}

const LoadedModel = memo(function LoadedModel({ format, onReady, url }: LoadedModelProps) {
	switch (format) {
		case 'glb':
		case 'gltf':
			return <GltfModel onReady={onReady} url={url} />;
		case 'obj':
			return <ObjModel onReady={onReady} url={url} />;
		case 'stl':
			return <StlModel onReady={onReady} url={url} />;
	}
});

const Scene = memo(function Scene({ format, onReady, url }: LoadedModelProps) {
	return (
		<>
			<PerspectiveCamera fov={50} makeDefault position={[0, 1.6, 4.2]} />
			<ambientLight intensity={0.55} />
			<directionalLight castShadow intensity={1.1} position={[8, 10, 5]} />
			<pointLight intensity={0.35} position={[-8, -6, -8]} />

			<Suspense fallback={null}>
				<LoadedModel format={format} onReady={onReady} url={url} />
				<Environment preset="city" />
				<ContactShadows blur={2.5} far={4} opacity={0.35} position={[0, -1.25, 0]} scale={8} />
			</Suspense>

			<OrbitControls enablePan enableRotate enableZoom makeDefault maxDistance={12} minDistance={1.2} />
		</>
	);
});

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
			<h3 className="mb-2 font-semibold text-lg">{error ? 'Could not load model' : 'Limited preview'}</h3>
			<p className="mb-4 max-w-md text-muted-foreground text-sm">
				{error ||
					'Some 3D formats require specialized software. Download the file to open it in a compatible application.'}
			</p>
			{fileName && <p className="mb-4 text-muted-foreground text-xs">{fileName}</p>}
			<Button onClick={onDownload} variant="outline">
				<Download className="mr-2 h-4 w-4" />
				Download file
			</Button>
		</div>
	);
}

export const ThreeDViewer = memo(function ThreeDViewer({ src, fileName, className }: ThreeDViewerProps) {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showInfo, setShowInfo] = useState(false);
	const [viewKey, setViewKey] = useState(0);

	const fileExtension = useMemo(() => fileName?.split('.').pop()?.toLowerCase() || '', [fileName]);
	const format = useMemo(() => (isSupportedFormat(fileExtension) ? fileExtension : null), [fileExtension]);

	const handleError = useCallback((err: unknown) => {
		logger.error('Error loading 3D model:', err);
		setError('Could not load the 3D model. The format may be unsupported or the file may be corrupted.');
		setIsLoading(false);
	}, []);

	const handleDownload = useCallback(() => {
		const link = document.createElement('a');
		link.href = src;
		link.download = fileName || '3d-model';
		link.click();
	}, [src, fileName]);

	const handleReset = useCallback(() => {
		setError(null);
		setShowInfo(false);
		setIsLoading(true);
		setViewKey((current) => current + 1);
	}, []);

	const handleModelReady = useCallback(() => {
		setIsLoading(false);
	}, []);

	const toggleInfo = useCallback(() => {
		setShowInfo((prev) => !prev);
	}, []);

	const closeInfo = useCallback(() => {
		setShowInfo(false);
	}, []);

	if (!format || error) {
		return (
			<Card className={cn('flex h-full items-center justify-center', className)}>
				<ErrorPlaceholder
					error={error || (format ? undefined : `.${fileExtension} files are not supported for preview`)}
					fileName={fileName}
					onDownload={handleDownload}
				/>
			</Card>
		);
	}

	return (
		<Card className={cn('relative h-full overflow-hidden', className)}>
			<div className="absolute inset-0 bg-gradient-to-b from-background to-muted">
				<ErrorBoundary
					fallback={<ErrorPlaceholder error="Could not render the 3D view." fileName={fileName} onDownload={handleDownload} />}
				>
					<Canvas
						camera={{ position: [0, 1.6, 4.2], fov: 50 }}
						gl={{ antialias: true, alpha: true }}
						key={viewKey}
						onError={handleError}
						shadows
					>
						<Scene format={format} onReady={handleModelReady} url={src} />
					</Canvas>
				</ErrorBoundary>
			</div>

			{isLoading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
					<div className="flex flex-col items-center gap-2">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<p className="text-muted-foreground text-sm">Loading 3D model...</p>
					</div>
				</div>
			)}

			<div className="absolute top-4 right-4 left-4 z-10 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Button
						aria-label="Show model information"
						className="bg-background/80 backdrop-blur"
						onClick={toggleInfo}
						size="icon"
						variant="secondary"
					>
						<Info className="h-4 w-4" />
					</Button>
					<Button
						aria-label="Reset 3D view"
						className="bg-background/80 backdrop-blur"
						onClick={handleReset}
						size="icon"
						variant="secondary"
					>
						<RotateCcw className="h-4 w-4" />
					</Button>
				</div>
				<Button className="bg-background/80 backdrop-blur" onClick={handleDownload} size="sm" variant="secondary">
					<Download className="mr-2 h-4 w-4" />
					Download
				</Button>
			</div>

			{showInfo && (
				<div className="absolute right-4 bottom-4 left-4 z-10 rounded-lg bg-background/95 p-4 backdrop-blur">
					<div className="flex items-start justify-between">
						<div>
							<h4 className="mb-1 font-semibold text-sm">{fileName || '3D Model'}</h4>
							<p className="text-muted-foreground text-xs">Format: {fileExtension.toUpperCase()}</p>
						</div>
						<Button onClick={closeInfo} size="sm" variant="ghost">
							Close
						</Button>
					</div>
					<div className="mt-2 text-muted-foreground text-xs">
						<p>Controls:</p>
						<ul className="mt-1 list-inside list-disc">
							<li>Drag to rotate</li>
							<li>Scroll to zoom</li>
							<li>Right-click to pan</li>
						</ul>
					</div>
				</div>
			)}

			{!(showInfo || isLoading) && (
				<div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1.5 text-muted-foreground text-xs backdrop-blur">
					Drag to rotate - Scroll to zoom
				</div>
			)}
		</Card>
	);
});

export default ThreeDViewer;
