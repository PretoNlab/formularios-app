"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FormRenderer } from "@/components/renderer/form-renderer"
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
  const [offlineQueued, setOfflineQueued] = useState(false)

  // Capture UTM params and device type once on mount
  useEffect(() => {
    clientMetaRef.current = {
      utmSource: searchParams.get("utm_source") ?? undefined,
      utmMedium: searchParams.get("utm_medium") ?? undefined,
      utmCampaign: searchParams.get("utm_campaign") ?? undefined,
      referrer: document.referrer || undefined,
      deviceType: getDeviceType(),
    }
  }, [searchParams])

  // Register Service Worker and cache this page on the very first visit.
  // The SW can't intercept the initial navigation (it wasn't active yet), so after
  // it takes control we re-fetch the current URL — the SW intercepts it and caches
  // the HTML. This makes the form available offline even on first load.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/f/" })
      .catch(() => {})

    function cacheSelf() {
      fetch(window.location.href).catch(() => {})
    }

    if (navigator.serviceWorker.controller) {
      // SW already in control (e.g. page refresh) — cache immediately
      cacheSelf()
    } else {
      // First install — wait for SW to claim this page, then cache
      navigator.serviceWorker.addEventListener("controllerchange", cacheSelf, { once: true })
    }
  }, [])

  // Fallback for browsers without Background Sync (Safari, Firefox)
  // When the device comes back online, tell the SW to flush its queue
  useEffect(() => {
    function handleOnline() {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage("flush-queue")
      }
    }
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  async function handleSubmit(answers: Record<string, AnswerValue>) {
    if (isPreview) return

    const response = await fetch("/api/responses/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formId: form.id,
        answers,
        clientMeta: clientMetaRef.current,
      }),
    })

    if (response.status === 202) {
      // Offline — SW queued the response
      setOfflineQueued(true)
      return
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error((data as { error?: string }).error ?? "Erro ao enviar resposta.")
    }
  }

  return <FormRenderer form={form} onSubmit={handleSubmit} pendingSync={offlineQueued} />
}
