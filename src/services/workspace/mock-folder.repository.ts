import type { FolderData, FolderRepository } from "./folder.service"

export class InMemoryFolderRepository implements FolderRepository {
  private folders = new Map<string, FolderData>()

  async create(data: FolderData): Promise<FolderData> {
    this.folders.set(data.id, { ...data })
    return data
  }

  async getById(id: string): Promise<FolderData | null> {
    return this.folders.get(id) || null
  }

  async getByWorkspace(workspaceId: string): Promise<FolderData[]> {
    return Array.from(this.folders.values()).filter(
      (f) => f.workspaceId === workspaceId && !f.parentId,
    )
  }

  async update(id: string, data: Partial<FolderData>): Promise<FolderData> {
    const existing = this.folders.get(id)
    if (!existing) throw new Error(`Folder ${id} not found`)
    const updated = { ...existing, ...data }
    this.folders.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.folders.delete(id)
  }
}
