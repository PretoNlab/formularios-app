import { eq } from "drizzle-orm"
import { db } from "../client"
import { workspaces } from "../schema"
import type { WorkspaceBrandKit } from "../schema"
import type { ApiResponse } from "../../types/form"

export async function updateWorkspaceBrandKit(
  workspaceId: string,
  brandKit: WorkspaceBrandKit
): Promise<ApiResponse<void>> {
  try {
    await db
      .update(workspaces)
      .set({ brandKit, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : "Database error",
      },
    }
  }
}
