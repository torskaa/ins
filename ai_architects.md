# AI-NATIVE ERP OS ARCHITECTURE

You are building an AI-native ERP Operating System.

This is not a chatbot application.

The goal is to create a business operating system where AI can:

- understand business context
- assist users
- execute workflows
- automate operations
- safely perform actions with permissions

The system consists of:

1. AI Copilot
2. AI Agents
3. MCP Server
4. AI Tool System
5. Workflow Automation
6. Memory System
7. Permission Layer

---

# Core Principle

AI is an execution layer.

Architecture:

```
User
 |
AI Copilot
 |
Agent Orchestrator
 |
AI Agents
 |
Tools
 |
Business Services
 |
Database
```

Never allow AI to directly manipulate database.

AI must always use:

- Services
- APIs
- Tools
- Workflows

---

# PART 1: AI COPILOT

## Purpose

AI Copilot is the main user interface.

It helps users interact with ERP naturally.

It is NOT only chat.

It supports:

- chat
- command
- suggestions
- contextual actions
- quick actions

Example:

```
User:

"Show me inventory risk"

Copilot:

Understands:

Current company
Current workspace
User permissions

Calls:

Inventory Agent

Returns:

- low stock items
- forecast
- recommendation
- actions
```

---

# Copilot Features

Create:

AI Command Center

Features:

- conversation history
- suggested actions
- quick commands
- AI insights
- approvals
- agent status

Support:

Command palette: `⌘K`

Examples:

```
"Create invoice"
"Find customer"
"Generate report"
"Analyze stock"
```

---

# Context Awareness

Copilot should understand:

- Current page
- Selected object
- User role
- Organization
- Permissions

Example:

```
On Inventory page:

User asks: "Why is this item low?"

Copilot should know:
- selected material
- stock history
- supplier data
```

---

# PART 2: AI AGENTS

AI Agents are digital employees.

They perform business tasks.

Each agent requires:

- Identity
- Role
- Goal
- Instructions
- Tools
- Permissions
- Memory
- Execution history

---

# Agent Architecture

Create:

```
src/ai/
```

Structure:

```
ai/
  agents/
  orchestrator/
  tools/
  memory/
  permissions/
  workflows/
  logs/
  evaluations/
```

---

# Agent Lifecycle

Every agent follows:

```
Receive Task
    ↓
Understand Context
    ↓
Create Plan
    ↓
Select Tools
    ↓
Execute
    ↓
Verify
    ↓
Return Result
```

---

# Agent Types

Create foundation for:

## Inventory Agent

Responsibilities:

- monitor inventory
- detect shortage
- forecast demand
- recommend purchase

Tools:

```
inventory.getStock()
inventory.getMovement()
inventory.forecast()
purchase.createDraft()
```

---

## Sales Agent

Responsibilities:

- analyze customers
- suggest actions
- prepare quotations

Tools:

```
customer.search()
order.createDraft()
quotation.create()
```

---

## Finance Agent

Responsibilities:

- analyze financial data
- detect issues
- create reports

Tools:

```
invoice.search()
payment.status()
financial.report()
```

---

## Operations Agent

Responsibilities:

- monitor workflows
- detect bottlenecks
- optimize processes

---

# Agent Permission System

Every agent must have permissions.

Example:

```
Inventory Agent:

Can:
  ✓ read inventory
  ✓ analyze stock

Cannot:
  ✕ approve purchase
  ✕ modify financial records
```

---

# Human Approval System

Critical actions require approval.

Examples:

- Creating invoice
- Creating purchase order
- Changing accounting data

Flow:

```
Agent proposes
    ↓
Approval request
    ↓
User approves
    ↓
Execute action
```

---

# PART 3: MCP SERVER

MCP is a first-class interface.

The ERP becomes an AI-accessible system.

External AI can connect:

- Claude
- ChatGPT
- IDE Agents
- Internal AI

---

# MCP Architecture

Create:

```
src/mcp/
```

Structure:

```
mcp/
  server.ts
  tools/
  schemas/
  handlers/
```

---

# MCP Rules

MCP must:

- reuse existing services
- respect permissions
- respect organization isolation
- validate inputs

Never duplicate business logic.

---

# MCP Tools

Expose ERP capabilities.

Examples:

```
Inventory:
  get_inventory
  get_stock_movement
  forecast_inventory

Sales:
  search_customer
  create_order_draft
  create_quote

Finance:
  get_invoice
  get_payment
  generate_report

Workflow:
  start_workflow
  approve_request
```

---

# Tool Specification

Every tool requires:

- Name
- Description
- Input schema
- Output schema
- Required permission

Example:

```
Tool: get_inventory

Input:
{
  material_id
}

Output:
{
  quantity,
  reserved,
  available,
  forecast
}
```

---

# PART 4: TOOL SYSTEM

All AI actions must go through tools.

Create:

```
src/ai/tools/
```

Every tool:

- validates input
- checks permission
- calls business service
- returns structured response

---

# PART 5: MEMORY SYSTEM

AI needs memory.

Create:

```
Company Memory:
  Stores:
    - business rules
    - preferences
    - workflows

User Memory:
  Stores:
    - preferences
    - common actions

Agent Memory:
  Stores:
    - previous tasks
    - decisions
```

---

# PART 6: AI LOGGING

Every AI action must be logged.

Store:

- Agent
- User
- Input
- Tools Used
- Actions
- Result
- Status
- Timestamp

---

# PART 7: SECURITY

AI follows same security model.

Must respect:

- RBAC
- Organization isolation
- Permissions
- Audit logs

AI cannot bypass security.

---

# PART 8: DATABASE MODELS

Create:

```
Agent
  - id
  - name
  - role
  - status

AgentRun
  - id
  - agent_id
  - task
  - result
  - status

AgentPermission
  - agent_id
  - permission

Memory
  - organization_id
  - key
  - value

AIUsage
  - tokens
  - credits
  - cost
```

---

# PART 9: UI REQUIREMENTS

Create:

```
AI Center
```

Menu:

- AI Copilot
- Agents
- Automations
- Approvals
- History
- MCP

---

# Development Strategy

```
Phase 1: Create AI foundation
  - folders
  - interfaces
  - architecture
  - database schema

Phase 2: Create tool system

Phase 3: Create MCP server

Phase 4: Create AI Copilot

Phase 5: Create first Agent

Phase 6: Add automation
```

---

# Quality Standard

Before coding:

- Analyze existing system
- Do not rewrite randomly

Maintain:

- scalability
- security
- enterprise quality
- reusable architecture

Think like:

- Staff AI Engineer
- ERP Architect
- Product Designer
