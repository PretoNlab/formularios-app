import type { AnswerValue, Question } from "@/lib/types/form"

/**
 * Base props shared by every field component.
 *
 * Each field component is responsible only for rendering the appropriate
 * input UI and calling `onChange` / `onSubmit` at the right moments.
 * All navigation, validation, and state management live in the parent renderer.
 */
export interface FieldProps {
    /** The question being rendered */
    question: Question
    /** Current answer value (null when unanswered) */
    value: AnswerValue
    /** Called whenever the answer changes */
    onChange: (value: AnswerValue) => void
    /**
     * Called to signal that the user is ready to advance to the next question.
     * Fields that auto-advance (multiple_choice, yes_no, etc.) should call this
     * after a short delay so the selection animation is visible.
     */
    onSubmit: () => void
    /** Whether the parent is currently submitting (disable interactive elements) */
    isSubmitting?: boolean
}
