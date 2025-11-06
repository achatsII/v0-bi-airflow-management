"use client"

import { RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface RefreshButtonProps {
  onRefresh: () => Promise<void>
  className?: string
}

/**
 * Refresh Button Component
 * 
 * Bypasses cache and forces fresh data fetch from BigQuery
 */
export function RefreshButton({ onRefresh, className }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleClick = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className={`h-8 w-8 ${className || ""}`}
      onClick={handleClick}
      disabled={isRefreshing}
      title="Actualiser les données (contourne le cache)"
    >
      <RefreshCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
    </Button>
  )
}

