import type { TagData, EntityTagData, TagRepository } from "./tag.service"

export class InMemoryTagRepository implements TagRepository {
  private tags = new Map<string, TagData>()
  private entityTags = new Map<string, EntityTagData>()

  async create(data: TagData): Promise<TagData> {
    this.tags.set(data.id, { ...data })
    return data
  }

  async getById(id: string): Promise<TagData | null> {
    return this.tags.get(id) || null
  }

  async getByOrganization(orgId: string): Promise<TagData[]> {
    return Array.from(this.tags.values()).filter((t) => t.organizationId === orgId)
  }

  async delete(id: string): Promise<void> {
    this.tags.delete(id)
    for (const [key, et] of this.entityTags.entries()) {
      if (et.tagId === id) this.entityTags.delete(key)
    }
  }

  async tagEntity(tagId: string, entityId: string, entityType: string): Promise<EntityTagData> {
    const key = `${tagId}:${entityId}:${entityType}`
    const existing = this.entityTags.get(key)
    if (existing) return existing
    const data: EntityTagData = {
      id: crypto.randomUUID(),
      tagId,
      entityId,
      entityType,
      createdAt: new Date().toISOString(),
    }
    this.entityTags.set(key, data)
    return data
  }

  async getEntityTags(entityId: string, entityType: string): Promise<TagData[]> {
    const tagIds = Array.from(this.entityTags.values())
      .filter((et) => et.entityId === entityId && et.entityType === entityType)
      .map((et) => et.tagId)
    return tagIds.map((id) => this.tags.get(id)).filter(Boolean) as TagData[]
  }
}
