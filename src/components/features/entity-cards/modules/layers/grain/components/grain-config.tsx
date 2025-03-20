import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useGrainStore } from "../actions/grain-config.action";

interface GrainConfigProps {
	className?: string;
}

const blendModes = [
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten",
	"color-dodge",
	"color-burn",
	"hard-light",
	"soft-light",
	"difference",
	"exclusion",
] as const;

const patterns = [
	"perlin",
	"simplex",
	"worley",
	"value",
	"cellular",
] as const;

const distributions = [
	"uniform",
	"gaussian",
	"exponential",
] as const;

const colorModes = [
	"monochrome",
	"rgb",
	"hsl",
] as const;

export function GrainConfig({ className }: GrainConfigProps) {
	const {
		enabled,
		intensity,
		size,
		animated,
		speed,
		colorMode,
		opacity,
		blend,
		seed,
		pattern,
		fractalNoise,
		roughness,
		distribution,
		toggleEnabled,
		toggleAnimated,
		toggleFractalNoise,
		updateConfig,
	} = useGrainStore();

	return (
		<div className={cn("space-y-4", className)}>
			{/* Controles básicos */}
			<div className="flex items-center justify-between">
				<Label htmlFor="enabled">Habilitar efecto grain</Label>
				<Switch
					id="enabled"
					checked={enabled}
					onCheckedChange={toggleEnabled}
				/>
			</div>

			{enabled && (
				<>
					{/* Controles de intensidad y tamaño */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Intensidad</Label>
							<Slider
								value={[intensity]}
								onValueChange={([value]) => updateConfig({ intensity: value })}
								min={0}
								max={1}
								step={0.01}
							/>
						</div>

						<div className="space-y-2">
							<Label>Tamaño</Label>
							<Slider
								value={[size]}
								onValueChange={([value]) => updateConfig({ size: value })}
								min={1}
								max={10}
								step={0.1}
							/>
						</div>

						<div className="space-y-2">
							<Label>Opacidad</Label>
							<Slider
								value={[opacity]}
								onValueChange={([value]) => updateConfig({ opacity: value })}
								min={0}
								max={1}
								step={0.01}
							/>
						</div>
					</div>

					{/* Controles de animación */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<Label htmlFor="animated">Animación</Label>
							<Switch
								id="animated"
								checked={animated}
								onCheckedChange={toggleAnimated}
							/>
						</div>

						{animated && (
							<div className="space-y-2">
								<Label>Velocidad</Label>
								<Slider
									value={[speed]}
									onValueChange={([value]) => updateConfig({ speed: value })}
									min={0.1}
									max={5}
									step={0.1}
								/>
							</div>
						)}
					</div>

					{/* Controles de patrón y ruido */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Patrón</Label>
							<Select
								value={pattern}
								onValueChange={(value) => updateConfig({ pattern: value as typeof pattern })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un patrón" />
								</SelectTrigger>
								<SelectContent>
									{patterns.map((p) => (
										<SelectItem key={p} value={p}>
											{p.charAt(0).toUpperCase() + p.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center justify-between">
							<Label htmlFor="fractalNoise">Ruido fractal</Label>
							<Switch
								id="fractalNoise"
								checked={fractalNoise}
								onCheckedChange={toggleFractalNoise}
							/>
						</div>

						{fractalNoise && (
							<div className="space-y-2">
								<Label>Rugosidad</Label>
								<Slider
									value={[roughness]}
									onValueChange={([value]) => updateConfig({ roughness: value })}
									min={0}
									max={1}
									step={0.01}
								/>
							</div>
						)}
					</div>

					{/* Controles de distribución y color */}
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Distribución</Label>
							<Select
								value={distribution}
								onValueChange={(value) => updateConfig({ distribution: value as typeof distribution })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona una distribución" />
								</SelectTrigger>
								<SelectContent>
									{distributions.map((d) => (
										<SelectItem key={d} value={d}>
											{d.charAt(0).toUpperCase() + d.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Modo de color</Label>
							<Select
								value={colorMode}
								onValueChange={(value) => updateConfig({ colorMode: value as typeof colorMode })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un modo de color" />
								</SelectTrigger>
								<SelectContent>
									{colorModes.map((c) => (
										<SelectItem key={c} value={c}>
											{c.charAt(0).toUpperCase() + c.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Modo de mezcla</Label>
							<Select
								value={blend}
								onValueChange={(value) => updateConfig({ blend: value as typeof blend })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecciona un modo de mezcla" />
								</SelectTrigger>
								<SelectContent>
									{blendModes.map((b) => (
										<SelectItem key={b} value={b}>
											{b.charAt(0).toUpperCase() + b.slice(1)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Semilla</Label>
							<Slider
								value={[seed]}
								onValueChange={([value]) => updateConfig({ seed: value })}
								min={0}
								max={1000}
								step={1}
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}