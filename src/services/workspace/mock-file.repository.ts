import type { FileRecord, FileRepository } from "./file.service"

export class InMemoryFileRepository implements FileRepository {
  private files = new Map<string, FileRecord>()

  async create(data: FileRecord): Promise<FileRecord> {
    this.files.set(data.id, { ...data })
    return data
  }

  async getById(id: string): Promise<FileRecord | null> {
    return this.files.get(id) || null
  }

  async getByFolder(folderId: string): Promise<FileRecord[]> {
    return Array.from(this.files.values()).filter((f) => f.folderId === folderId)
  }

  async update(id: string, data: Partial<FileRecord>): Promise<FileRecord> {
    const existing = this.files.get(id)
    if (!existing) throw new Error(`File ${id} not found`)
    const updated = { ...existing, ...data }
    this.files.set(id, updated)
    return updated
  }

  async delete(id: string): Promise<void> {
    this.files.delete(id)
  }
}
