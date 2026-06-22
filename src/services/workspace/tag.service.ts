import type { AiContext } from "@/ai/context/types"

export interface TagData {
  id: string
  name: string
  color: string
  organizationId: string
  createdAt: string
}

export interface EntityTagData {
  id: string
  tagId: string
  entityId: string
  entityType: string
  createdAt: string
}

export interface TagRepository {
  create(data: TagData): Promise<TagData>
  getById(id: string): Promise<TagData | null>
  getByOrganization(orgId: string): Promise<TagData[]>
  delete(id: string): Promise<void>
  tagEntity(tagId: string, entityId: string, entityType: string): Promise<EntityTagData>
  getEntityTags(entityId: string, entityType: string): Promise<TagData[]>
}

import { InMemoryTagRepository } from "./mock-tag.repository"

let repository: TagRepository | null = null

function getRepo(): TagRepository {
  if (!repository) {
    repository = new InMemoryTagRepository()
  }
  return repository
}

export function setTagRepository(repo: TagRepository): void {
  repository = repo
}

export const tagService = {
  async create(name: string, context: AiContext, color?: string): Promise<TagData> {
    const data: TagData = {
      id: crypto.randomUUID(),
      name,
      color: color || "#6366f1",
      organizationId: context.organizationId,
      createdAt: new Date().toISOString(),
    }
    return getRepo().create(data)
  },

  async getById(id: string): Promise<TagData | null> {
    return getRepo().getById(id)
  },

  async getByOrganization(orgId: string): Promise<TagData[]> {
    return getRepo().getByOrganization(orgId)
  },

  async delete(id: string): Promise<void> {
    return getRepo().delete(id)
  },

  async tagEntity(tagId: string, entityId: string, entityType: string) {
    return getRepo().tagEntity(tagId, entityId, entityType)
  },

  async getEntityTags(entityId: string, entityType: string) {
    return getRepo().getEntityTags(entityId, entityType)
  },
}
