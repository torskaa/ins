import { registerAgent } from "./registry"
import { InventoryAgent } from "./agents/inventory.agent"
import { FinanceAgent } from "./agents/finance.agent"
import { SalesAgent } from "./agents/sales.agent"
import { RulePlanner } from "./planner/rule-planner"

const rulePlanner = new RulePlanner()

const inventoryAgent = new InventoryAgent()
inventoryAgent.setPlanner(rulePlanner)

const financeAgent = new FinanceAgent()
financeAgent.setPlanner(rulePlanner)

const salesAgent = new SalesAgent()
salesAgent.setPlanner(rulePlanner)

registerAgent(inventoryAgent)
registerAgent(financeAgent)
registerAgent(salesAgent)

export { inventoryAgent, financeAgent, salesAgent }
