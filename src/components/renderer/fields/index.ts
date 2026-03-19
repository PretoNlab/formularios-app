/**
 * Barrel export for all renderer field components.
 *
 * Usage:
 *   import { FIELD_COMPONENTS } from "@/components/renderer/fields"
 *   const Field = FIELD_COMPONENTS[question.type]
 *   <Field question={q} value={v} onChange={...} onSubmit={...} />
 */

export type { FieldProps } from "./field-props"

// ── Input fields ─────────────────────────────
export { ShortTextField } from "./short-text"
export { LongTextField } from "./long-text"
export { EmailField } from "./email"
export { NumberField } from "./number"
export { PhoneField } from "./phone"
export { WhatsAppField } from "./whatsapp"
export { CpfField } from "./cpf"
export { CnpjField } from "./cnpj"
export { DateField } from "./date"
export { UrlField } from "./url"

// ── Selection fields ──────────────────────────
export { MultipleChoiceField } from "./multiple-choice"
export { CheckboxField } from "./checkbox"
export { DropdownField } from "./dropdown"
export { YesNoField } from "./yes-no"

// ── Rating fields ─────────────────────────────
export { RatingField } from "./rating"
export { ScaleField } from "./scale"
export { NpsField } from "./nps"

// ── Layout fields ─────────────────────────────
export { WelcomeField } from "./welcome"
export { StatementField } from "./statement"
export { ThankYouField } from "./thank-you"

// ── Advanced fields ───────────────────────────
export { FileUploadField } from "./file-upload"
export { DownloadField } from "./download"
export { SignatureField } from "./signature"

// ─── QuestionType → Component map ────────────────────────────────────────────
import type { QuestionType } from "@/lib/types/form"
import type { ComponentType } from "react"
import type { FieldProps } from "./field-props"

import { ShortTextField } from "./short-text"
import { LongTextField } from "./long-text"
import { EmailField } from "./email"
import { NumberField } from "./number"
import { PhoneField } from "./phone"
import { WhatsAppField } from "./whatsapp"
import { CpfField } from "./cpf"
import { CnpjField } from "./cnpj"
import { DateField } from "./date"
import { UrlField } from "./url"
import { MultipleChoiceField } from "./multiple-choice"
import { CheckboxField } from "./checkbox"
import { DropdownField } from "./dropdown"
import { YesNoField } from "./yes-no"
import { RatingField } from "./rating"
import { ScaleField } from "./scale"
import { NpsField } from "./nps"
import { WelcomeField } from "./welcome"
import { StatementField } from "./statement"
import { ThankYouField } from "./thank-you"
import { FileUploadField } from "./file-upload"
import { DownloadField } from "./download"
import { SignatureField } from "./signature"

export const FIELD_COMPONENTS: Record<QuestionType, ComponentType<FieldProps>> = {
    short_text: ShortTextField,
    long_text: LongTextField,
    email: EmailField,
    number: NumberField,
    phone: PhoneField,
    whatsapp: WhatsAppField,
    cpf: CpfField,
    cnpj: CnpjField,
    date: DateField,
    url: UrlField,
    multiple_choice: MultipleChoiceField,
    checkbox: CheckboxField,
    dropdown: DropdownField,
    yes_no: YesNoField,
    rating: RatingField,
    scale: ScaleField,
    nps: NpsField,
    welcome: WelcomeField,
    statement: StatementField,
    thank_you: ThankYouField,
    download: DownloadField,
    file_upload: FileUploadField,
    signature: SignatureField,
}
