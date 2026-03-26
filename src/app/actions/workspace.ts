"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ensureUserExists } from "@/lib/db/queries/users"
import { updateWorkspaceBrandKit } from "@/lib/db/queries/workspaces"
import type { WorkspaceBrandKit } from "@/lib/db/schema"

export async function updateBrandKitAction(input: WorkspaceBrandKit) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: userWithWs, success } = await ensureUserExists({
    id: user.id,
    email: user.email!,
    user_metadata: user.user_metadata,
  })
  if (!success || !userWithWs) throw new Error("Falha ao obter dados do usuário.")

  const result = await updateWorkspaceBrandKit(userWithWs.defaultWorkspace.id, input)
  if (!result.success) throw new Error("Falha ao salvar Brand Kit.")

  revalidatePath("/settings/brand-kit")
}
