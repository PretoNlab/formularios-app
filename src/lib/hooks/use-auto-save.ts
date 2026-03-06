"use client"

import { useEffect, useRef, useState } from "react"
import { useBuilderStore } from "@/stores/builder-store"
import { updateFormAction, upsertQuestionsAction } from "@/app/actions/forms"

const DEBOUNCE_MS = 2000

export function useAutoSave() {
  const form = useBuilderStore((s) => s.form)
  const hasUnsavedChanges = useBuilderStore((s) => s.hasUnsavedChanges)
  const markSaved = useBuilderStore((s) => s.markSaved)
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // form is null as unknown as Form initially — guard here
    if (!(form as unknown) || !hasUnsavedChanges) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await Promise.all([
          updateFormAction(form.id, {
            title: form.title,
            description: form.description ?? null,
            slug: form.slug,
            theme: form.theme,
            settings: form.settings,
          }),
          upsertQuestionsAction(
            form.id,
            form.questions.map((q) => ({
              id: q.id,
              formId: form.id,
              type: q.type,
              title: q.title,
              description: q.description ?? null,
              required: q.required,
              order: q.order,
              properties: q.properties,
              logicRules: q.logicRules,
            }))
          ),
        ])
        markSaved()
      } catch (err) {
        console.error("Auto-save failed:", err)
      } finally {
        setIsSaving(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [form, hasUnsavedChanges, markSaved])

  return { isSaving }
}
