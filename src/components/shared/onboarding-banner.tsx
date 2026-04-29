"use client"

import { useEffect, useState, type ReactNode } from "react"
import { X, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface OnboardingBannerAction {
  label: string
  icon?: LucideIcon
  onClick: () => void | Promise<void>
  hint?: string
  variant?: "default" | "outline" | "ghost"
}

export interface OnboardingBannerProps {
  storageKey: string
  title: string
  description: ReactNode
  actions: OnboardingBannerAction[]
  icon?: LucideIcon
  visible?: boolean
  className?: string
  onDismiss?: () => void
}

export function OnboardingBanner({
  storageKey,
  title,
  description,
  actions,
  icon: Icon,
  visible = true,
  className,
  onDismiss,
}: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    setDismissed(!!window.localStorage.getItem(storageKey))
  }, [storageKey])

  function handleDismiss() {
    window.localStorage.setItem(storageKey, "1")
    setDismissed(true)
    onDismiss?.()
  }

  if (!visible || dismissed === null || dismissed) return null

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm",
        "animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted shrink-0"
          aria-label={`Dispensar ${title}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {actions.length > 0 && (
        <div className={cn("mt-4 flex flex-wrap items-center gap-2", Icon ? "sm:pl-11" : "")}>
          {actions.map((action, i) => {
            const ActionIcon = action.icon
            return (
              <Button
                key={i}
                size="sm"
                variant={action.variant ?? (i === 0 ? "default" : "outline")}
                onClick={action.onClick}
                className="rounded-full h-8 text-xs gap-1.5"
              >
                {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                {action.label}
                {action.hint && (
                  <span className="text-[10px] text-muted-foreground/80 ml-1">
                    {action.hint}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export interface OnboardingHintProps {
  storageKey: string
  title: string
  description: ReactNode
  action?: OnboardingBannerAction
  icon?: LucideIcon
  visible?: boolean
}

export function OnboardingHint({
  storageKey,
  title,
  description,
  action,
  icon: Icon,
  visible = true,
}: OnboardingHintProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    setDismissed(!!window.localStorage.getItem(storageKey))
  }, [storageKey])

  if (!visible || dismissed === null || dismissed) return null

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs space-y-2 animate-in fade-in slide-in-from-top-1">
      <div className="flex items-start gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(storageKey, "1")
            setDismissed(true)
          }}
          className="text-muted-foreground hover:text-foreground p-0.5"
          aria-label="Dispensar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {action && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs w-full"
          onClick={action.onClick}
        >
          {action.icon && <action.icon className="h-3 w-3 mr-1.5" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}
