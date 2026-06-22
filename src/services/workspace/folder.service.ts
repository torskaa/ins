import type { AiContext } from "@/ai/context/types"

export interface FolderData {
  id: string
  name: string
  parentId: string | null
  workspaceId: string
  createdBy: string
  organizationId: string
  createdAt: string
  children?: FolderData[]
  files?: FileData[]
}

export interface FileData {
  id: string
  name: string
  folderId: string
  content: string
  type: string
  createdBy: string
  organizationId: string
  createdAt: string
}

export interface FolderRepository {
  create(data: FolderData): Promise<FolderData>
  getById(id: string): Promise<FolderData | null>
  getByWorkspace(workspaceId: string): Promise<FolderData[]>
  update(id: string, data: Partial<FolderData>): Promise<FolderData>
  delete(id: string): Promise<void>
}

import { InMemoryFolderRepository } from "./mock-folder.repository"

let repository: FolderRepository | null = null

function getRepo(): FolderRepository {
  if (!repository) {
    repository = new InMemoryFolderRepository()
  }
  return repository
}

export function setFolderRepository(repo: FolderRepository): void {
  repository = repo
}

export const folderService = {
  async create(name: string, context: AiContext, parentId?: string): Promise<FolderData> {
    const data: FolderData = {
      id: crypto.randomUUID(),
      name,
      parentId: parentId || null,
      workspaceId: context.workspaceId || context.organizationId,
      createdBy: context.userId,
      organizationId: context.organizationId,
      createdAt: new Date().toISOString(),
    }
    return getRepo().create(data)
  },

  async getById(id: string): Promise<FolderData | null> {
    return getRepo().getById(id)
  },

  async getByWorkspace(workspaceId: string): Promise<FolderData[]> {
    return getRepo().getByWorkspace(workspaceId)
  },

  async update(id: string, data: Partial<FolderData>): Promise<FolderData> {
    return getRepo().update(id, data)
  },

  async delete(id: string): Promise<void> {
    return getRepo().delete(id)
  },
}
