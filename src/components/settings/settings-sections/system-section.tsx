'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/lib/contexts';
import { Activity, AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export function SystemSection() {
	const { settings } = useSettings();

	return (
		<Card className="flex flex-col gap-2 bg-muted/30 rounded-sm">
			<CardHeader className="p-2 pb-0 bg-transparent">
				<CardTitle className="text-base text-muted-foreground font-semibold flex items-center justify-between pl-1">
					<span className="flex items-center gap-2 h-7">
						<Activity className="h-5 w-5" /> Estado del Sistema
					</span>
				</CardTitle>
			</CardHeader>
			<Separator className="my-0" />
			<CardContent className="p-2">
				<div className="space-y-3">
					<motion.div
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						className="space-y-2"
					>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<Activity className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-xs">CPU</span>
								</div>
								<Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
									{settings.system.cpuUsage || '0'}%
								</Badge>
							</div>
							<Progress value={settings.system.cpuUsage || 0} className="h-1" />
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-xs">Memoria</span>
								</div>
								<Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
									{settings.system.memoryUsage || '0'}%
								</Badge>
							</div>
							<Progress value={settings.system.memoryUsage || 0} className="h-1" />
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-1.5">
									<Database className="h-3.5 w-3.5 text-muted-foreground" />
									<span className="text-xs">Caché</span>
								</div>
								<Badge variant="outline" className="text-[10px] font-mono h-4 px-1">
									{settings.system.cacheSize || '0'}MB
								</Badge>
							</div>
							<Progress value={(settings.system.cacheSize || 0) / 10} className="h-1" />
						</div>
					</motion.div>

					<Separator className="my-2" />

					<motion.div
						animate={{
							opacity: [0, 1],
							y: [20, 0],
						}}
						className="space-y-1.5"
					>
						<div className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent transition-colors group">
							<div className="flex items-center gap-2">
								<RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
								<div>
									<span className="text-xs font-medium">Reparar sistema</span>
									<p className="text-[10px] text-muted-foreground">Corrige problemas comunes</p>
								</div>
							</div>
							<Button variant="outline" size="sm" className="h-7 text-xs">
								Reparar
							</Button>
						</div>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<motion.div
									animate={{ scale: 1 }}
									className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer group"
								>
									<div className="flex items-center gap-2">
										<Trash2 className="h-3.5 w-3.5 text-destructive" />
										<div>
											<span className="text-xs font-medium">Resetear base de datos</span>
											<p className="text-[10px] text-muted-foreground">Elimina todos los datos</p>
										</div>
									</div>
									<Button variant="destructive" size="sm" className="h-7 text-xs">
										Resetear
									</Button>
								</motion.div>
							</AlertDialogTrigger>
							<AlertDialogContent className="sm:max-w-[425px]">
								<AlertDialogHeader>
									<AlertDialogTitle className="text-base flex items-center gap-2">
										<AlertCircle className="h-5 w-5 text-destructive" />
										¿Estás seguro?
									</AlertDialogTitle>
									<AlertDialogDescription className="text-xs">
										Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos de la base de datos.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
									<AlertDialogAction className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
										Eliminar
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</motion.div>
				</div>
			</CardContent>
		</Card>
	);
}
