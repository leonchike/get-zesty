/**
 * Home Task MCP Tools Registration
 *
 * 8 tools for household task management: recurring chores and one-off jobs
 * with optional assignees (household members).
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { HomeTask, Props } from "../types/index.js";
import { wrapWithSentry } from "./sentry-utils.js";
import * as homeTaskApi from "./home-task-api.js";

// Zod schemas for input validation
const GetHomeTasksSchema = {
  view: z
    .enum(["all", "overdue", "dueSoon", "completed"])
    .default("all")
    .describe(
      '"all" = every pending (active) task; "overdue" = past due; "dueSoon" = due within the next 7 days (see dueWithinDays); "completed" = finished one-off tasks'
    ),
  assigneeId: z
    .string()
    .optional()
    .describe(
      "Filter to tasks assigned to one household member (ID from listHouseholdMembers)"
    ),
  dueWithinDays: z
    .number()
    .min(0)
    .optional()
    .describe('Window size for the "dueSoon" view (default 7 days)'),
};

const CreateHomeTaskSchema = {
  title: z.string().describe("Task title (required)"),
  notes: z.string().optional().describe("Free-form notes"),
  category: z
    .string()
    .optional()
    .describe('Category, e.g. "Maintenance", "Cleaning", "Garden"'),
  dueDate: z
    .string()
    .optional()
    .describe("Due date as YYYY-MM-DD or ISO datetime"),
  isRecurring: z
    .boolean()
    .optional()
    .describe(
      "If true, intervalValue AND intervalUnit are required. Recurring tasks never close: completing one schedules the next occurrence from the completion date."
    ),
  intervalValue: z
    .number()
    .min(1)
    .optional()
    .describe('Repeat every N units, e.g. 3 for "every 3 months"'),
  intervalUnit: z
    .enum(["DAY", "WEEK", "MONTH", "YEAR"])
    .optional()
    .describe("Repeat unit"),
  assigneeId: z
    .string()
    .optional()
    .describe(
      "Household member to assign (ID from listHouseholdMembers — never guess IDs)"
    ),
};

const UpdateHomeTaskSchema = {
  taskId: z.string().describe("The unique identifier of the task (required)"),
  title: z.string().optional().describe("New title"),
  notes: z.string().optional().describe("New notes"),
  category: z.string().optional().describe("New category"),
  dueDate: z
    .string()
    .optional()
    .describe("New due date (YYYY-MM-DD or ISO datetime)"),
  isRecurring: z
    .boolean()
    .optional()
    .describe("Set false to stop recurrence; true requires interval fields"),
  intervalValue: z.number().min(1).optional().describe("New repeat interval"),
  intervalUnit: z
    .enum(["DAY", "WEEK", "MONTH", "YEAR"])
    .optional()
    .describe("New repeat unit"),
  assigneeId: z
    .string()
    .optional()
    .describe("Reassign to this member ID (from listHouseholdMembers)"),
};

const CompleteHomeTaskSchema = {
  taskId: z.string().describe("The unique identifier of the task (required)"),
  completedById: z
    .string()
    .optional()
    .describe(
      "Household member who did the work (ID from listHouseholdMembers). Defaults to the task's assignee."
    ),
};

const TaskIdOnlySchema = {
  taskId: z.string().describe("The unique identifier of the task (required)"),
};

function formatCadence(task: HomeTask): string | null {
  if (!task.isRecurring || !task.intervalValue || !task.intervalUnit) {
    return null;
  }
  const unit = task.intervalUnit.toLowerCase();
  return task.intervalValue === 1
    ? `every ${unit}`
    : `every ${task.intervalValue} ${unit}s`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "no due date";
  return new Date(iso).toISOString().slice(0, 10);
}

function formatTaskLine(task: HomeTask): string {
  let line = `- **${task.title}**`;
  if (task.dueDate) line += ` — due ${formatDate(task.dueDate)}`;
  const cadence = formatCadence(task);
  if (cadence) line += ` (↻ ${cadence})`;
  if (task.category) line += ` [${task.category}]`;
  line += ` — ${task.assignee?.name ?? "Unassigned"}`;
  line += ` \`${task.id}\``;
  return line;
}

/**
 * Register all home task tools with the MCP server
 */
export function registerHomeTaskTools(
  server: McpServer,
  env: Env,
  _props: Props,
  userId: string
): void {
  const apiConfig = {
    baseUrl: (env as any).RECIPE_API_BASE_URL,
    apiKey: (env as any).RECIPE_API_KEY,
    userId,
  };

  // 1. getHomeTasks
  server.tool(
    "getHomeTasks",
    "List the user's household tasks (chores, maintenance, one-off jobs), sorted by due date with overdue tasks flagged. Use view='overdue' for what's late, 'dueSoon' for the coming week, 'completed' for finished one-offs. Each task line ends with its ID for use in other task tools.",
    GetHomeTasksSchema,
    wrapWithSentry("getHomeTasks", async ({ view, assigneeId, dueWithinDays }) => {
      const data = await homeTaskApi.getHomeTasks(apiConfig, {
        view,
        assigneeId,
        dueWithinDays,
      });
      const tasks = data.tasks || [];

      if (tasks.length === 0) {
        const label =
          view === "all" ? "pending" : view === "dueSoon" ? "due soon" : view;
        return {
          content: [
            { type: "text" as const, text: `No ${label} home tasks found.` },
          ],
        };
      }

      let text = "";

      if (view === "completed") {
        text += `**Completed Home Tasks** (${tasks.length})\n\n`;
        for (const task of tasks) {
          text += `- ~~${task.title}~~`;
          if (task.lastCompletedAt) {
            text += ` — done ${formatDate(task.lastCompletedAt)}`;
          }
          text += ` \`${task.id}\`\n`;
        }
      } else if (view === "all") {
        const now = Date.now();
        const soonCutoff = now + 7 * 24 * 60 * 60 * 1000;
        const overdue = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate).getTime() < now
        );
        const dueSoon = tasks.filter((t) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate).getTime();
          return due >= now && due <= soonCutoff;
        });
        const later = tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate).getTime() > soonCutoff
        );
        const noDate = tasks.filter((t) => !t.dueDate);

        text += `**Home Tasks** (${tasks.length} pending`;
        if (overdue.length > 0) text += `, ⚠️ ${overdue.length} overdue`;
        text += ")\n\n";

        const sections: [string, HomeTask[]][] = [
          ["⚠️ Overdue", overdue],
          ["Due soon", dueSoon],
          ["Later", later],
          ["Anytime", noDate],
        ];
        for (const [title, group] of sections) {
          if (group.length === 0) continue;
          text += `### ${title}\n`;
          for (const task of group) text += formatTaskLine(task) + "\n";
          text += "\n";
        }
      } else {
        const label = view === "overdue" ? "Overdue" : "Due Soon";
        text += `**${label} Home Tasks** (${tasks.length})\n\n`;
        for (const task of tasks) text += formatTaskLine(task) + "\n";
      }

      return { content: [{ type: "text" as const, text }] };
    })
  );

  // 2. createHomeTask
  server.tool(
    "createHomeTask",
    "Create a household task: a one-off job (e.g. 'paint the fence') or a recurring chore (e.g. 'clean HVAC filters every 3 months' — set isRecurring with intervalValue + intervalUnit). To assign it, resolve the member's ID with listHouseholdMembers first.",
    CreateHomeTaskSchema,
    wrapWithSentry("createHomeTask", async (input) => {
      const data = await homeTaskApi.createHomeTask(apiConfig, input);
      const task = data.task;

      let text = `**Task Created** — ${task.title}\n\n`;
      if (task.dueDate) text += `- Due: ${formatDate(task.dueDate)}\n`;
      const cadence = formatCadence(task);
      if (cadence) text += `- Repeats: ${cadence} (from each completion)\n`;
      if (task.assignee) text += `- Assigned to: ${task.assignee.name}\n`;
      if (task.category) text += `- Category: ${task.category}\n`;
      text += `- ID: \`${task.id}\``;

      return { content: [{ type: "text" as const, text }] };
    })
  );

  // 3. updateHomeTask
  server.tool(
    "updateHomeTask",
    "Update a task's details, due date, recurrence, or assignee. Only the fields you provide are changed. Set isRecurring=false to stop a chore from repeating. Get the taskId from getHomeTasks.",
    UpdateHomeTaskSchema,
    wrapWithSentry("updateHomeTask", async ({ taskId, ...fields }) => {
      const data = await homeTaskApi.updateHomeTask(apiConfig, {
        id: taskId,
        ...fields,
      });
      const task = data.task;

      let text = `**Task Updated** — ${task.title}\n\n`;
      if (task.dueDate) text += `- Due: ${formatDate(task.dueDate)}\n`;
      const cadence = formatCadence(task);
      text += cadence ? `- Repeats: ${cadence}\n` : `- One-off task\n`;
      text += `- Assigned to: ${task.assignee?.name ?? "Unassigned"}\n`;
      text += `- ID: \`${task.id}\``;

      return { content: [{ type: "text" as const, text }] };
    })
  );

  // 4. completeHomeTask
  server.tool(
    "completeHomeTask",
    "Mark a household task as done. Recurring tasks are never closed — completing one automatically schedules the next occurrence (due date = today + cadence) and the response states the new date. One-off tasks move to completed. Optionally record who did it via completedById.",
    CompleteHomeTaskSchema,
    wrapWithSentry("completeHomeTask", async ({ taskId, completedById }) => {
      const data = await homeTaskApi.completeHomeTask(
        apiConfig,
        taskId,
        completedById
      );
      const task = data.task;

      let text = `**Task Completed** — ${task.title}\n\n`;
      if (task.isRecurring && task.status === "ACTIVE") {
        const cadence = formatCadence(task);
        text += `- Recurring (${cadence}) — rolled forward\n`;
        text += `- **Next due**: ${formatDate(task.dueDate)}\n`;
      } else {
        text += `- One-off task marked **COMPLETED**\n`;
      }
      text += `- ID: \`${task.id}\`\n\n`;
      text += "Use `uncompleteHomeTask` to undo if this was a mistake.";

      return { content: [{ type: "text" as const, text }] };
    })
  );

  // 5. uncompleteHomeTask
  server.tool(
    "uncompleteHomeTask",
    "Undo a task's most recent completion: removes the completion record and restores the due date and status the task had before it was completed.",
    TaskIdOnlySchema,
    wrapWithSentry("uncompleteHomeTask", async ({ taskId }) => {
      const data = await homeTaskApi.uncompleteHomeTask(apiConfig, taskId);
      const task = data.task;

      let text = `**Completion Undone** — ${task.title}\n\n`;
      text += `- Status: ${task.status}\n`;
      text += `- Due: ${formatDate(task.dueDate)}\n`;
      text += `- ID: \`${task.id}\``;

      return { content: [{ type: "text" as const, text }] };
    })
  );

  // 6. deleteHomeTask
  server.tool(
    "deleteHomeTask",
    "Permanently delete a household task and its completion history. Cannot be undone — to keep the history, complete the task or set isRecurring=false instead.",
    TaskIdOnlySchema,
    wrapWithSentry("deleteHomeTask", async ({ taskId }) => {
      await homeTaskApi.deleteHomeTask(apiConfig, taskId);

      return {
        content: [
          {
            type: "text" as const,
            text: `**Task Deleted** — \`${taskId}\` and its history are permanently removed.`,
          },
        ],
      };
    })
  );

  // 7. listHouseholdMembers
  server.tool(
    "listHouseholdMembers",
    "List the household members tasks can be assigned to, with their IDs. Use this to resolve a name (e.g. 'assign it to Ada') to an assigneeId or completedById — never guess member IDs. Members are managed in the Get Zesty web app settings (read-only here).",
    {},
    wrapWithSentry("listHouseholdMembers", async () => {
      const data = await homeTaskApi.getHouseholdMembers(apiConfig);
      const members = data.members || [];

      if (members.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No household members yet. They can be added in the Get Zesty web app under Settings.",
            },
          ],
        };
      }

      let text = `**Household Members** (${members.length})\n\n`;
      for (const member of members) {
        text += `- ${member.name} \`${member.id}\`\n`;
      }

      return { content: [{ type: "text" as const, text }] };
    })
  );

  // 8. getHomeTaskHistory
  server.tool(
    "getHomeTaskHistory",
    "Show the completion log for a task — every time it was done, when, and by whom. Useful for questions like 'when did we last change the filters?' or 'who cleaned the bathroom last?'. Get the taskId from getHomeTasks.",
    TaskIdOnlySchema,
    wrapWithSentry("getHomeTaskHistory", async ({ taskId }) => {
      const data = await homeTaskApi.getTaskCompletions(apiConfig, taskId);
      const completions = data.completions || [];

      if (completions.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "This task has never been completed.",
            },
          ],
        };
      }

      let text = `**Completion History** (${completions.length})\n\n`;
      for (const completion of completions) {
        text += `- ${formatDate(completion.completedAt)}`;
        if (completion.completedBy) {
          text += ` — by ${completion.completedBy.name}`;
        }
        text += "\n";
      }

      return { content: [{ type: "text" as const, text }] };
    })
  );
}
