import type { AiContext } from "@/ai/context/types"
import { folderService, fileService, tagService } from "@/services/workspace"

export interface WorkspaceSummary {
  folders: number
  files: number
  tags: number
  recentItems: Array<{
    id: string
    name: string
    type: "folder" | "file"
    updatedAt: string
  }>
}

export const workspaceManager = {
  async getSummary(context: AiContext): Promise<WorkspaceSummary> {
    const orgId = context.organizationId
    const folders = await folderService.getByWorkspace(orgId)
    const files = await Promise.all(folders.map((f) => fileService.getByFolder(f.id)))
    const tags = await tagService.getByOrganization(orgId)

    const recentItems = [
      ...folders.map((f) => ({ id: f.id, name: f.name, type: "folder" as const, updatedAt: f.createdAt })),
      ...files.flat().map((f) => ({ id: f.id, name: f.name, type: "file" as const, updatedAt: f.createdAt })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5)

    return {
      folders: folders.length,
      files: files.flat().length,
      tags: tags.length,
      recentItems,
    }
  },
}
