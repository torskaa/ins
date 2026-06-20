import type { AiProvider, ProviderConfig, ChatMessage, ChatCompletionOptions, ChatCompletionResult } from "./types"
import type { ProviderType } from "./types"

class OpenAiProvider implements AiProvider {
  readonly type: ProviderType = "openai"
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    this.ensureConfigured()
    const response = await fetch(`${this.config.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model ?? "gpt-4o",
        messages: options.messages,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async *chatStream(options: ChatCompletionOptions): AsyncIterable<string> {
    this.ensureConfigured()
    const response = await fetch(`${this.config.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model ?? "gpt-4o",
        messages: options.messages,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") return
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey
  }

  private ensureConfigured(): void {
    if (!this.isAvailable()) {
      throw new Error("OpenAI provider not configured: missing API key")
    }
  }
}

class AnthropicProvider implements AiProvider {
  readonly type: ProviderType = "anthropic"
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    this.ensureConfigured()

    const systemMessages = options.messages.filter(m => m.role === "system")
    const conversationMessages = options.messages.filter(m => m.role !== "system")

    const response = await fetch(`${this.config.baseUrl ?? "https://api.anthropic.com/v1"}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model ?? "claude-3-opus-20240229",
        max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
        system: systemMessages.map(m => m.content).join("\n"),
        messages: conversationMessages.map(m => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.content[0].text,
      model: data.model,
      usage: undefined,
    }
  }

  async *chatStream(options: ChatCompletionOptions): AsyncIterable<string> {
    this.ensureConfigured()

    const systemMessages = options.messages.filter(m => m.role === "system")
    const conversationMessages = options.messages.filter(m => m.role !== "system")

    const response = await fetch(`${this.config.baseUrl ?? "https://api.anthropic.com/v1"}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.config.model ?? "claude-3-haiku-20240307",
        max_tokens: options.maxTokens ?? this.config.maxTokens ?? 4096,
        system: systemMessages.map(m => m.content).join("\n"),
        messages: conversationMessages.map(m => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? this.config.temperature ?? 0.7,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") return
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            yield parsed.delta.text
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey
  }

  private ensureConfigured(): void {
    if (!this.isAvailable()) {
      throw new Error("Anthropic provider not configured: missing API key")
    }
  }
}

class LocalProvider implements AiProvider {
  readonly type: ProviderType = "local"
  private config: ProviderConfig

  constructor(config: ProviderConfig) {
    this.config = config
  }

  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
    const response = await fetch(
      `${this.config.baseUrl ?? "http://localhost:11434"}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model ?? "llama3",
          messages: options.messages,
          max_tokens: options.maxTokens ?? this.config.maxTokens,
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Local provider error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      model: data.model ?? "local",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
            totalTokens: data.usage.total_tokens ?? 0,
          }
        : undefined,
    }
  }

  async *chatStream(options: ChatCompletionOptions): AsyncIterable<string> {
    const response = await fetch(
      `${this.config.baseUrl ?? "http://localhost:11434"}/v1/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.config.model ?? "llama3",
          messages: options.messages,
          max_tokens: options.maxTokens ?? this.config.maxTokens,
          temperature: options.temperature ?? this.config.temperature ?? 0.7,
          stream: true,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Local provider error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") return
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  isAvailable(): boolean {
    return true
  }
}

export function createProvider(config: ProviderConfig): AiProvider {
  switch (config.type) {
    case "openai":
      return new OpenAiProvider(config)
    case "anthropic":
      return new AnthropicProvider(config)
    case "local":
      return new LocalProvider(config)
    default:
      throw new Error(`Unknown provider type: ${config.type}`)
  }
}
