import { describe, it, expect } from "vitest"
import {
  CopilotEventTypes,
  createEvent,
  serializeEvent,
  CopilotEventEmitter,
  validateEvent,
} from "@/ai/copilot/events"
import type { CopilotEvent, CopilotEventType } from "@/ai/copilot/events"
import { ToolStepCard } from "@/components/ai/tool-step-card"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

describe("CopilotEvent types", () => {
  it("defines exactly 8 event types", () => {
    expect(CopilotEventTypes).toEqual([
      "thinking",
      "planning",
      "tool_start",
      "tool_progress",
      "tool_result",
      "approval_required",
      "completed",
      "failed",
    ])
  })
})

describe("createEvent", () => {
  it("creates a thinking event with timestamp", () => {
    const event = createEvent("thinking", { message: "Analyzing..." })
    expect(event.type).toBe("thinking")
    expect(event.message).toBe("Analyzing...")
    expect(event.timestamp).toBeTruthy()
    expect(() => new Date(event.timestamp)).not.toThrow()
  })

  it("creates a planning event with optional fields", () => {
    const event = createEvent("planning", {
      message: "3 steps",
      stepCount: 3,
      agentId: "agent-1",
    })
    expect(event.type).toBe("planning")
    expect(event.message).toBe("3 steps")
    expect(event.stepCount).toBe(3)
    expect(event.agentId).toBe("agent-1")
  })

  it("creates a tool_start event", () => {
    const event = createEvent("tool_start", {
      toolName: "inventory.getLowStock",
      input: { threshold: 10 },
    })
    expect(event.type).toBe("tool_start")
    expect(event.toolName).toBe("inventory.getLowStock")
    expect(event.input).toEqual({ threshold: 10 })
  })

  it("creates a tool_progress event", () => {
    const event = createEvent("tool_progress", {
      toolName: "inventory.getLowStock",
      message: "Fetching data...",
    })
    expect(event.type).toBe("tool_progress")
    expect(event.toolName).toBe("inventory.getLowStock")
    expect(event.message).toBe("Fetching data...")
  })

  it("creates a tool_result event with success", () => {
    const event = createEvent("tool_result", {
      toolName: "inventory.getLowStock",
      status: "success",
      output: { items: [] },
      durationMs: 500,
    })
    expect(event.type).toBe("tool_result")
    expect(event.status).toBe("success")
    expect(event.output).toEqual({ items: [] })
    expect(event.durationMs).toBe(500)
  })

  it("creates a tool_result event with error", () => {
    const event = createEvent("tool_result", {
      toolName: "finance.getOutstanding",
      status: "error",
      error: "API unavailable",
    })
    expect(event.type).toBe("tool_result")
    expect(event.status).toBe("error")
    expect(event.error).toBe("API unavailable")
    expect(event.output).toBeUndefined()
  })

  it("creates an approval_required event", () => {
    const event = createEvent("approval_required", {
      toolName: "finance.createInvoice",
      input: { amount: 75000 },
      reason: "Approval needed",
    })
    expect(event.type).toBe("approval_required")
    expect(event.reason).toBe("Approval needed")
  })

  it("creates a completed event", () => {
    const event = createEvent("completed", {
      summary: "Done",
      toolCalls: [{ toolName: "inventory.getLowStock", status: "success" }],
    })
    expect(event.type).toBe("completed")
    expect(event.summary).toBe("Done")
    expect(event.toolCalls).toHaveLength(1)
  })

  it("creates a failed event", () => {
    const event = createEvent("failed", { error: "Something went wrong" })
    expect(event.type).toBe("failed")
    expect(event.error).toBe("Something went wrong")
  })
})

describe("serializeEvent", () => {
  it("serializes to SSE format", () => {
    const event = createEvent("thinking", { message: "hi" })
    const serialized = serializeEvent(event)
    expect(serialized).toContain("event: thinking")
    expect(serialized).toContain('data: {"timestamp":"')
    expect(serialized).toContain('"message":"hi"')
    expect(serialized).toContain("\n\n")
  })

  it("includes all fields except type and timestamp in data", () => {
    const event = createEvent("tool_start", {
      toolName: "test.tool",
      input: { key: "val" },
      agentId: "agent-1",
    })
    const serialized = serializeEvent(event)
    const dataMatch = serialized.match(/data: (.*)\n\n/)
    expect(dataMatch).toBeTruthy()
    const parsed = JSON.parse(dataMatch![1])
    expect(parsed.toolName).toBe("test.tool")
    expect(parsed.input).toEqual({ key: "val" })
    expect(parsed.agentId).toBe("agent-1")
    expect(parsed.type).toBeUndefined()
    expect(parsed.timestamp).toBeTruthy()
  })
})

describe("CopilotEventEmitter", () => {
  it("emits events via controller", () => {
    const chunks: Uint8Array[] = []
    const controller = {
      enqueue: (chunk: Uint8Array) => chunks.push(chunk),
      close: () => {},
      error: () => {},
    } as unknown as ReadableStreamDefaultController<Uint8Array>

    const emitter = new CopilotEventEmitter(controller)
    emitter.emit("thinking", { message: "test" })
    emitter.emit("completed", { toolCalls: [] })

    expect(chunks).toHaveLength(2)
    const first = new TextDecoder().decode(chunks[0])
    expect(first).toContain("event: thinking")
    expect(first).toContain("test")

    const second = new TextDecoder().decode(chunks[1])
    expect(second).toContain("event: completed")
  })
})

describe("Event order correctness", () => {
  const expectedOrder: CopilotEventType[] = [
    "thinking",
    "planning",
    "tool_start",
    "tool_result",
    "completed",
  ]

  it("events appear in the declared order", () => {
    const order = CopilotEventTypes.filter(
      (t) => expectedOrder.includes(t),
    )
    expect(order).toEqual(expectedOrder)
  })

  it("tool_start always precedes tool_result for the same tool", () => {
    const events: CopilotEvent[] = [
      createEvent("tool_start", { toolName: "inventory.getLowStock", input: {} }),
      createEvent("tool_result", { toolName: "inventory.getLowStock", status: "success", output: {} }),
    ]

    const startIdx = events.findIndex(
      (e) => e.type === "tool_start" && e.toolName === "inventory.getLowStock",
    )
    const resultIdx = events.findIndex(
      (e) => e.type === "tool_result" && e.toolName === "inventory.getLowStock",
    )

    expect(startIdx).toBeGreaterThanOrEqual(0)
    expect(resultIdx).toBeGreaterThan(startIdx)
  })

  it("approval_required pauses the stream (no completed follows)", () => {
    const events: CopilotEvent[] = [
      createEvent("thinking", { message: "analyzing" }),
      createEvent("planning", { message: "1 step" }),
      createEvent("tool_start", { toolName: "finance.createInvoice", input: {} }),
      createEvent("approval_required", {
        toolName: "finance.createInvoice",
        input: {},
        reason: "needs approval",
      }),
    ]

    const hasCompleted = events.some((e) => e.type === "completed")
    const hasApproval = events.some((e) => e.type === "approval_required")

    expect(hasApproval).toBe(true)
    expect(hasCompleted).toBe(false)
    expect(events[events.length - 1].type).toBe("approval_required")
  })

  it("failed event ends the sequence", () => {
    const events: CopilotEvent[] = [
      createEvent("thinking", { message: "thinking" }),
      createEvent("failed", { error: "crash" }),
    ]

    const failedIdx = events.findIndex((e) => e.type === "failed")
    expect(failedIdx).toBe(events.length - 1)
  })

  it("produces a realistic successful sequence", () => {
    const events: CopilotEvent[] = [
      createEvent("thinking", { message: "Analyzing..." }),
      createEvent("planning", { message: "2 steps", stepCount: 2 }),
      createEvent("tool_start", { toolName: "inventory.getLowStock", input: { threshold: 10 } }),
      createEvent("tool_result", {
        toolName: "inventory.getLowStock",
        status: "success",
        output: { items: [{ name: "Steel Rod", stock: 3 }] },
        durationMs: 300,
      }),
      createEvent("tool_start", { toolName: "inventory.forecast", input: { productId: "prod-1" } }),
      createEvent("tool_result", {
        toolName: "inventory.forecast",
        status: "success",
        output: { forecast: [100, 110, 120] },
        durationMs: 400,
      }),
      createEvent("completed", {
        toolCalls: [
          { toolName: "inventory.getLowStock", status: "success" },
          { toolName: "inventory.forecast", status: "success" },
        ],
      }),
    ]

    expect(events[0].type).toBe("thinking")
    expect(events[1].type).toBe("planning")
    expect(events[2].type).toBe("tool_start")
    expect(events[3].type).toBe("tool_result")
    expect(events[4].type).toBe("tool_start")
    expect(events[5].type).toBe("tool_result")
    expect(events[6].type).toBe("completed")

    const toolStarts = events.filter((e) => e.type === "tool_start")
    const toolResults = events.filter((e) => e.type === "tool_result")
    expect(toolStarts).toHaveLength(2)
    expect(toolResults).toHaveLength(2)
    expect(toolStarts.length).toBe(toolResults.length)
  })

  it("approval_required in multi-step sequence halts before execution", () => {
    const events: CopilotEvent[] = [
      createEvent("thinking", { message: "Analyzing..." }),
      createEvent("planning", { message: "2 steps", stepCount: 2 }),
      createEvent("tool_start", { toolName: "customers.search", input: { query: "ABC" } }),
      createEvent("tool_result", {
        toolName: "customers.search",
        status: "success",
        output: { data: [{ name: "ABC Corp" }] },
      }),
      createEvent("tool_start", { toolName: "finance.createInvoice", input: { amount: 50000 } }),
      createEvent("approval_required", {
        toolName: "finance.createInvoice",
        input: { amount: 50000 },
        reason: "Invoice creation requires approval",
      }),
    ]

    const approvalIdx = events.findIndex((e) => e.type === "approval_required")
    expect(approvalIdx).toBe(events.length - 1)

    const firstToolResult = events.find(
      (e) => e.type === "tool_result" && e.toolName === "customers.search",
    )
    expect(firstToolResult).toBeDefined()

    const secondResult = events.find(
      (e) => e.type === "tool_result" && e.toolName === "finance.createInvoice",
    )
    expect(secondResult).toBeUndefined()
  })
})

describe("ToolStepCard rendering", () => {
  it("renders with success status", () => {
    const { container } = render(
      <ToolStepCard
        toolName="inventory.getLowStock"
        status="success"
        input={{ threshold: 10 }}
        output={{ items: [{ name: "Test", stock: 3 }] }}
        durationMs={500}
      />,
    )
    expect(container.textContent).toContain("inventory.getLowStock")
    expect(container.textContent).toContain("success")
    expect(container.textContent).toContain("500ms")
  })

  it("renders with running status", () => {
    const { container } = render(
      <ToolStepCard
        toolName="inventory.forecast"
        status="running"
        input={{ productId: "prod-1" }}
      />,
    )
    expect(container.textContent).toContain("inventory.forecast")
    expect(container.textContent).toContain("running")
  })

  it("renders with error status and message", () => {
    const { container } = render(
      <ToolStepCard
        toolName="finance.getOutstanding"
        status="error"
        error="API temporarily unavailable"
      />,
    )
    expect(container.textContent).toContain("finance.getOutstanding")
    expect(container.textContent).toContain("error")
  })

  it("renders with waiting_approval status", () => {
    const { container } = render(
      <ToolStepCard
        toolName="finance.createInvoice"
        status="waiting_approval"
        input={{ amount: 75000, customerId: "cust-1" }}
      />,
    )
    expect(container.textContent).toContain("finance.createInvoice")
    expect(container.textContent).toContain("waiting_approval")
  })

  it("expands to show input and output on click", async () => {
    const user = userEvent.setup()
    render(
      <ToolStepCard
        toolName="inventory.getLowStock"
        status="success"
        input={{ threshold: 10 }}
        output={{ items: [] }}
      />,
    )

    expect(screen.queryByText("Input")).not.toBeInTheDocument()
    expect(screen.queryByText("Output")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Input")).toBeInTheDocument()
    expect(screen.getByText("Output")).toBeInTheDocument()
  })

  it("expands to show error on click", async () => {
    const user = userEvent.setup()
    render(
      <ToolStepCard
        toolName="finance.getOutstanding"
        status="error"
        error="API unavailable"
      />,
    )

    expect(screen.queryByText("Error")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Error")).toBeInTheDocument()
    expect(screen.getByText("API unavailable")).toBeInTheDocument()
  })

  it("shows input JSON when expanded", async () => {
    const user = userEvent.setup()
    render(
      <ToolStepCard
        toolName="test.tool"
        status="success"
        input={{ key: "value", num: 42 }}
        output={null}
      />,
    )

    await user.click(screen.getByRole("button"))
    const pre = document.querySelector("pre")
    expect(pre).toBeInTheDocument()
    expect(pre?.textContent).toContain('"key"')
    expect(pre?.textContent).toContain('"value"')
    expect(pre?.textContent).toContain("42")
  })
})

describe("validateEvent", () => {
  it("passes a valid thinking event", () => {
    const result = validateEvent({
      type: "thinking",
      timestamp: "2026-01-01T00:00:00.000Z",
      message: "Analyzing...",
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails when type is missing", () => {
    const result = validateEvent({
      timestamp: "2026-01-01T00:00:00.000Z",
      message: "test",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("type is required")
  })

  it("fails when type is invalid", () => {
    const result = validateEvent({
      type: "invalid_type",
      timestamp: "2026-01-01T00:00:00.000Z",
      message: "test",
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.startsWith("type must be one of"))).toBe(true)
  })

  it("fails when timestamp is missing", () => {
    const result = validateEvent({
      type: "thinking",
      message: "test",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("timestamp is required")
  })

  it("fails when timestamp is not valid ISO", () => {
    const result = validateEvent({
      type: "thinking",
      timestamp: "not-a-date",
      message: "test",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("timestamp must be a valid ISO 8601 string")
  })

  it("fails tool_start without toolName", () => {
    const result = validateEvent({
      type: "tool_start",
      timestamp: "2026-01-01T00:00:00.000Z",
      input: {},
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("toolName is required for tool_start event")
  })

  it("fails tool_start without input", () => {
    const result = validateEvent({
      type: "tool_start",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "test.tool",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("input is required for tool_start event")
  })

  it("passes valid tool_start", () => {
    const result = validateEvent({
      type: "tool_start",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "inventory.getLowStock",
      input: { threshold: 10 },
    })
    expect(result.valid).toBe(true)
  })

  it("fails tool_result without status", () => {
    const result = validateEvent({
      type: "tool_result",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "test.tool",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("status is required for tool_result event")
  })

  it("fails tool_result with invalid status", () => {
    const result = validateEvent({
      type: "tool_result",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "test.tool",
      status: "invalid",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('tool_result status must be "success" or "error"')
  })

  it("passes valid tool_result success", () => {
    const result = validateEvent({
      type: "tool_result",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "test.tool",
      status: "success",
      output: { data: 1 },
    })
    expect(result.valid).toBe(true)
  })

  it("passes valid tool_result error", () => {
    const result = validateEvent({
      type: "tool_result",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "test.tool",
      status: "error",
      error: "Something failed",
    })
    expect(result.valid).toBe(true)
  })

  it("fails approval_required without toolName", () => {
    const result = validateEvent({
      type: "approval_required",
      timestamp: "2026-01-01T00:00:00.000Z",
      input: {},
      reason: "needs approval",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("toolName is required for approval_required event")
  })

  it("fails approval_required without reason", () => {
    const result = validateEvent({
      type: "approval_required",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "finance.createInvoice",
      input: { amount: 100 },
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("reason is required for approval_required event")
  })

  it("passes valid approval_required", () => {
    const result = validateEvent({
      type: "approval_required",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolName: "finance.createInvoice",
      input: { amount: 75000 },
      reason: "Invoice creation requires approval",
    })
    expect(result.valid).toBe(true)
  })

  it("fails completed without toolCalls", () => {
    const result = validateEvent({
      type: "completed",
      timestamp: "2026-01-01T00:00:00.000Z",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("toolCalls is required for completed event")
  })

  it("fails completed with non-array toolCalls", () => {
    const result = validateEvent({
      type: "completed",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolCalls: "not-an-array",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("completed toolCalls must be an array")
  })

  it("passes valid completed event", () => {
    const result = validateEvent({
      type: "completed",
      timestamp: "2026-01-01T00:00:00.000Z",
      toolCalls: [{ toolName: "test.tool", status: "success" }],
    })
    expect(result.valid).toBe(true)
  })

  it("fails planning without message", () => {
    const result = validateEvent({
      type: "planning",
      timestamp: "2026-01-01T00:00:00.000Z",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("message is required for planning event")
  })

  it("fails failed without error", () => {
    const result = validateEvent({
      type: "failed",
      timestamp: "2026-01-01T00:00:00.000Z",
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("error is required for failed event")
  })

  it("passes valid failed event", () => {
    const result = validateEvent({
      type: "failed",
      timestamp: "2026-01-01T00:00:00.000Z",
      error: "Something went wrong",
    })
    expect(result.valid).toBe(true)
  })

  it("validates createEvent output automatically", () => {
    const event = createEvent("tool_start", {
      toolName: "test.tool",
      input: { key: "val" },
    })
    const result = validateEvent(event as unknown as Record<string, unknown>)
    expect(result.valid).toBe(true)
  })

  it("reports multiple errors at once", () => {
    const result = validateEvent({
      type: "tool_result",
      timestamp: "",
      toolName: "test.tool",
      status: "invalid",
    })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})
