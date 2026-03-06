"use client"

import { FormRenderer } from "@/components/renderer/form-renderer"
import { submitResponseAction } from "@/app/actions/responses"
import type { Form } from "@/lib/types/form"
import type { AnswerValue } from "@/lib/db/schema"

interface FormRendererPageProps {
  form: Form
  isPreview?: boolean
}

export function FormRendererPage({ form, isPreview }: FormRendererPageProps) {
  async function handleSubmit(answers: Record<string, AnswerValue>) {
    if (isPreview) return
    await submitResponseAction(form.id, answers)
  }

  return <FormRenderer form={form} onSubmit={handleSubmit} />
}
