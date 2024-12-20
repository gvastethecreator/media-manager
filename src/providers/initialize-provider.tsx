"use client"

import { useInitializeApp } from "@/hooks/use-initialize-app"

export function InitializeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useInitializeApp()
  return <>{children}</>
}