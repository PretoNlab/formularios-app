"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { FormRenderer } from "@/components/renderer/form-renderer"
import { submitResponseAction } from "@/app/actions/responses"
import type { Form } from "@/lib/types/form"
import type { AnswerValue } from "@/lib/db/schema"

interface FormRendererPageProps {
  form: Form
  isPreview?: boolean
}

type ClientMeta = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referrer?: string
  deviceType?: "desktop" | "mobile" | "tablet"
}

function getDeviceType(): "desktop" | "mobile" | "tablet" {
  const w = window.screen.width
  if (w < 768) return "mobile"
  if (w < 1024) return "tablet"
  return "desktop"
}

export function FormRendererPage({ form, isPreview }: FormRendererPageProps) {
  const searchParams = useSearchParams()
  const clientMetaRef = useRef<ClientMeta>({})

  useEffect(() => {
    clientMetaRef.current = {
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
      deviceType: getDeviceType(),
    }
  }, [searchParams])

  async function handleSubmit(answers: Record<string, AnswerValue>) {
    if (isPreview) return
    await submitResponseAction(form.id, answers, clientMetaRef.current)
  }

  return <FormRenderer form={form} onSubmit={handleSubmit} />
}
