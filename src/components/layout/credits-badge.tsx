"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { getUserCreditsAction } from "@/app/actions/credits"

interface CreditsBadgeProps {
  initialCredits?: number
}

export function CreditsBadge({ initialCredits = 0 }: CreditsBadgeProps) {
  const [credits, setCredits] = useState(initialCredits)

  useEffect(() => {
    function refreshCredits() {
      getUserCreditsAction().then((res) => {
        if (res.success && res.data) {
          setCredits(res.data.creditBalance)
        }
      })
    }

    refreshCredits()

    window.addEventListener("credits_updated", refreshCredits)
    return () => {
      window.removeEventListener("credits_updated", refreshCredits)
    }
  }, [])

  return (
    <Link
      href="/billing"
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-xs font-semibold text-primary"
      title="Seus créditos de IA para criação e insights. Clique para ver detalhes."
    >
      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
      <span>{credits} créditos</span>
    </Link>
  )
}
