import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Form, Question, ThemeConfig, FormSettings, BuilderState } from "@/lib/types/form"

interface BuilderActions {
  setForm: (form: Form) => void
  updateFormTitle: (title: string) => void
  updateFormDescription: (description: string) => void
  updateFormTheme: (theme: ThemeConfig) => void
  updateFormSettings: (settings: Partial<FormSettings>) => void
  updateFormSlug: (slug: string) => void
  updateFormStatus: (status: Form["status"]) => void
  addQuestion: (question: Question) => void
  updateQuestion: (questionId: string, updates: Partial<Question>) => void
  deleteQuestion: (questionId: string) => void
  duplicateQuestion: (questionId: string) => void
  reorderQuestions: (fromIndex: number, toIndex: number) => void
  selectQuestion: (questionId: string | null) => void
  setDragging: (isDragging: boolean) => void
  undo: () => void
  redo: () => void
  saveSnapshot: () => void
  markSaved: () => void
}

const MAX_UNDO_STACK = 50

export const useBuilderStore = create<BuilderState & BuilderActions>()(
  immer((set) => ({
    form: null as unknown as Form,
    selectedQuestionId: null,
    isDragging: false,
    hasUnsavedChanges: false,
    undoStack: [],
    redoStack: [],

    setForm: (form) => set((state) => {
      state.form = form
      state.hasUnsavedChanges = false
      state.undoStack = []
      state.redoStack = []
    }),

    updateFormTitle: (title) => set((state) => {
      state.form.title = title
      state.hasUnsavedChanges = true
    }),

    updateFormDescription: (description) => set((state) => {
      state.form.description = description
      state.hasUnsavedChanges = true
    }),

    updateFormTheme: (theme) => set((state) => {
      state.form.theme = theme
      state.hasUnsavedChanges = true
    }),

    updateFormSettings: (settings) => set((state) => {
      state.form.settings = { ...state.form.settings, ...settings }
      state.hasUnsavedChanges = true
    }),

    updateFormSlug: (slug) => set((state) => {
      state.form.slug = slug
      state.hasUnsavedChanges = true
    }),

    updateFormStatus: (status) => set((state) => {
      state.form.status = status
      state.hasUnsavedChanges = true
    }),

    addQuestion: (question) => set((state) => {
      state.form.questions.push(question)
      state.selectedQuestionId = question.id
      state.hasUnsavedChanges = true
    }),

    updateQuestion: (questionId, updates) => set((state) => {
      const idx = state.form.questions.findIndex((q: Question) => q.id === questionId)
      if (idx !== -1) {
        state.form.questions[idx] = { ...state.form.questions[idx], ...updates }
        state.hasUnsavedChanges = true
      }
    }),

    deleteQuestion: (questionId) => set((state) => {
      state.form.questions = state.form.questions.filter((q: Question) => q.id !== questionId)
      state.form.questions.forEach((q: Question, i: number) => { q.order = i })
      if (state.selectedQuestionId === questionId) {
        state.selectedQuestionId = null
      }
      state.hasUnsavedChanges = true
    }),

    duplicateQuestion: (questionId) => set((state) => {
      const idx = state.form.questions.findIndex((q: Question) => q.id === questionId)
      if (idx !== -1) {
        const original = state.form.questions[idx]
        const duplicate: Question = {
          ...JSON.parse(JSON.stringify(original)),
          id: crypto.randomUUID(),
          title: original.title + " (copia)",
          order: idx + 1,
        }
        state.form.questions.splice(idx + 1, 0, duplicate)
        state.form.questions.forEach((q: Question, i: number) => { q.order = i })
        state.selectedQuestionId = duplicate.id
        state.hasUnsavedChanges = true
      }
    }),

    reorderQuestions: (fromIndex, toIndex) => set((state) => {
      const questions = state.form.questions
      const [moved] = questions.splice(fromIndex, 1)
      questions.splice(toIndex, 0, moved)
      questions.forEach((q: Question, i: number) => { q.order = i })
      state.hasUnsavedChanges = true
    }),

    selectQuestion: (questionId) => set((state) => {
      state.selectedQuestionId = questionId
    }),

    setDragging: (isDragging) => set((state) => {
      state.isDragging = isDragging
    }),

    saveSnapshot: () => set((state) => {
      const snapshot = JSON.parse(JSON.stringify(state.form))
      state.undoStack.push(snapshot)
      if (state.undoStack.length > MAX_UNDO_STACK) {
        state.undoStack.shift()
      }
      state.redoStack = []
    }),

    undo: () => set((state) => {
      if (state.undoStack.length === 0) return
      const current = JSON.parse(JSON.stringify(state.form))
      state.redoStack.push(current)
      state.form = state.undoStack.pop()!
      state.hasUnsavedChanges = true
    }),

    redo: () => set((state) => {
      if (state.redoStack.length === 0) return
      const current = JSON.parse(JSON.stringify(state.form))
      state.undoStack.push(current)
      state.form = state.redoStack.pop()!
      state.hasUnsavedChanges = true
    }),

    markSaved: () => set((state) => {
      state.hasUnsavedChanges = false
    }),
  }))
)
