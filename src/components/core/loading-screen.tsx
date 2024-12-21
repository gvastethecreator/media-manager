"use client"

import { useLoadingStore } from "@/store/loading-store"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const TRANSITION_DURATION = 0.3

export function LoadingScreen() {
  const { services, progress, isInitializing, isReady } = useLoadingStore()

  // No renderizar nada si no estamos inicializando
  if (!isInitializing) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: TRANSITION_DURATION }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-2 text-center pb-4">
          <CardTitle className="text-3xl font-bold tracking-tight">Image Manager</CardTitle>
          <CardDescription className="text-base">
            {isReady
              ? "¡Todo listo! Iniciando aplicación..."
              : "Inicializando servicios y preparando la aplicación..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: TRANSITION_DURATION, delay: 0.1 }}
          >
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progreso general</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>

          <div className="space-y-4">
            {services.map((service, index) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: TRANSITION_DURATION,
                  delay: 0.2 + index * 0.1,
                }}
                className={cn(
                  "flex items-center justify-between space-x-4 rounded-lg border p-3",
                  service.status === "error" && "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20",
                  service.status === "success" && "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                )}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-medium leading-none">{service.name}</p>
                  {service.message ? (
                    <p className="text-sm text-muted-foreground truncate">{service.message}</p>
                  ) : (
                    <Skeleton className="h-4 w-[120px] mt-1" />
                  )}
                  {service.status === "loading" && service.startTime && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round((Date.now() - service.startTime) / 1000)}s
                    </p>
                  )}
                </div>
                <StatusIcon status={service.status} />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatusIcon({ status }: { status: string }) {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      {status === "success" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        </motion.div>
      )}
      {status === "error" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <XCircle className="h-5 w-5 text-red-500" />
        </motion.div>
      )}
      {(status === "loading" || status === "pending") && (
        <Loader2 className={cn(
          "h-5 w-5 text-muted-foreground",
          status === "loading" && "animate-spin"
        )} />
      )}
    </div>
  )
}