import type { AiContext } from "@/ai/context/types"

export interface FileRecord {
  id: string
  name: string
  folderId: string
  content: string
  type: string
  createdBy: string
  organizationId: string
  createdAt: string
}

export interface FileRepository {
  create(data: FileRecord): Promise<FileRecord>
  getById(id: string): Promise<FileRecord | null>
  getByFolder(folderId: string): Promise<FileRecord[]>
  update(id: string, data: Partial<FileRecord>): Promise<FileRecord>
  delete(id: string): Promise<void>
}

import { InMemoryFileRepository } from "./mock-file.repository"

let repository: FileRepository | null = null

function getRepo(): FileRepository {
  if (!repository) {
    repository = new InMemoryFileRepository()
  }
  return repository
}

export function setFileRepository(repo: FileRepository): void {
  repository = repo
}

export const fileService = {
  async create(
    name: string,
    folderId: string,
    context: AiContext,
    content?: string,
    type?: string,
  ): Promise<FileRecord> {
    const data: FileRecord = {
      id: crypto.randomUUID(),
      name,
      folderId,
      content: content || "",
      type: type || "text",
      createdBy: context.userId,
      organizationId: context.organizationId,
      createdAt: new Date().toISOString(),
    }
    return getRepo().create(data)
  },

  async getById(id: string): Promise<FileRecord | null> {
    return getRepo().getById(id)
  },

  async getByFolder(folderId: string): Promise<FileRecord[]> {
    return getRepo().getByFolder(folderId)
  },

  async update(id: string, data: Partial<FileRecord>): Promise<FileRecord> {
    return getRepo().update(id, data)
  },

  async delete(id: string): Promise<void> {
    return getRepo().delete(id)
  },
}
