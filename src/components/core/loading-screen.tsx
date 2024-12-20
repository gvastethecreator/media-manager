"use client"

import { useLoadingStore } from "@/store/loading-store"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingScreen() {
  const { services, progress, isInitializing } = useLoadingStore()

  if (!isInitializing) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="space-y-2 text-center pb-4">
            <CardTitle className="text-3xl font-bold tracking-tight">Image Manager</CardTitle>
            <CardDescription className="text-base">
              Inicializando servicios y preparando la aplicación...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progreso general</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-4">
              {services.map((service) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between space-x-4 rounded-lg border p-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium leading-none">{service.name}</p>
                    {service.message ? (
                      <p className="text-sm text-muted-foreground truncate">{service.message}</p>
                    ) : (
                      <Skeleton className="h-4 w-[120px] mt-1" />
                    )}
                  </div>
                  <StatusIcon status={service.status} />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
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