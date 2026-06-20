export type ProviderType = "openai" | "anthropic" | "local"

export interface ProviderConfig {
  type: ProviderType
  apiKey?: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ChatCompletionOptions {
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface ChatCompletionResult {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface AiProvider {
  readonly type: ProviderType
  chat(options: ChatCompletionOptions): Promise<ChatCompletionResult>
  chatStream(
    options: ChatCompletionOptions,
  ): AsyncIterable<string>
  isAvailable(): boolean
}
