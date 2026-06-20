import type { JsonSchema } from "../tools/types"

const JSON_SCHEMA_TYPE_MAP: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  object: "object",
  array: "array",
}

export class ToolSchemaMapper {
  toJsonSchema(schema: JsonSchema): Record<string, unknown> {
    const properties: Record<string, unknown> = {}

    for (const [key, prop] of Object.entries(schema.properties)) {
      const mapped: Record<string, unknown> = {
        type: JSON_SCHEMA_TYPE_MAP[prop.type] ?? prop.type,
      }
      if (prop.description) mapped.description = prop.description
      if (prop.enum) mapped.enum = prop.enum
      properties[key] = mapped
    }

    const result: Record<string, unknown> = {
      type: "object",
      properties,
    }

    if (schema.required && schema.required.length > 0) {
      result.required = schema.required
    }

    return result
  }
}
