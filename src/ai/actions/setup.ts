import { actionRegistry } from "./registry"
import { createFolderAction } from "./create-folder.action"
import { createFileAction } from "./create-file.action"
import { createTagAction } from "./create-tag.action"
import { createRecordAction } from "./create-record.action"
import { updateRecordAction } from "./update-record.action"
import { createViewAction } from "./create-view.action"
import { createWorkflowAction } from "./create-workflow.action"

export function registerAllActions(): void {
  actionRegistry.register(createFolderAction)
  actionRegistry.register(createFileAction)
  actionRegistry.register(createTagAction)
  actionRegistry.register(createRecordAction)
  actionRegistry.register(updateRecordAction)
  actionRegistry.register(createViewAction)
  actionRegistry.register(createWorkflowAction)
}
