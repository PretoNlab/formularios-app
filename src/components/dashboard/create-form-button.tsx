"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { createFormAction } from "@/app/actions/forms"

interface CreateFormButtonProps {
  variant?: "hero" | "header"
}

export function CreateFormButton({ variant = "hero" }: CreateFormButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(() => createFormAction())
  }

  if (variant === "header") {
    return (
      <Button className="rounded-full px-6" onClick={handleClick} disabled={isPending}>
        {isPending ? "Criando..." : "Novo form"}
      </Button>
    )
  }

  return (
    <Button size="lg" className="rounded-full px-8 shrink-0 text-base font-medium h-12" onClick={handleClick} disabled={isPending}>
      {isPending ? "Criando..." : "Criar novo formulário"}
    </Button>
  )
}
