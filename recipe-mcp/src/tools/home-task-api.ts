/**
 * HTTP client for Next.js /api/mcp/home-tasks/* endpoints
 */

import type {
  HomeTaskDeleteResponse,
  HomeTaskListResponse,
  HomeTaskResponse,
  HouseholdMembersResponse,
  TaskCompletionsResponse,
} from "../types/index.js";

interface HomeTaskApiConfig {
  baseUrl: string;
  apiKey: string;
  userId: string;
}

export interface HomeTaskFilter {
  view?: "all" | "overdue" | "dueSoon" | "completed";
  assigneeId?: string;
  dueWithinDays?: number;
}

export interface CreateHomeTaskInput {
  title: string;
  notes?: string;
  category?: string;
  dueDate?: string;
  isRecurring?: boolean;
  intervalValue?: number;
  intervalUnit?: "DAY" | "WEEK" | "MONTH" | "YEAR";
  assigneeId?: string;
}

export type UpdateHomeTaskInput = Partial<CreateHomeTaskInput> & {
  id: string;
};

function getHeaders(apiKey: string): Record<string, string> {
  return {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
  };
}

async function ensureOk(response: Response): Promise<void> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 500)}`);
  }
}

/**
 * List home tasks with an optional view filter
 */
export async function getHomeTasks(
  config: HomeTaskApiConfig,
  filter: HomeTaskFilter = {}
): Promise<HomeTaskListResponse> {
  const params = new URLSearchParams({ user_id: config.userId });
  if (filter.view) params.set("view", filter.view);
  if (filter.assigneeId) params.set("assignee_id", filter.assigneeId);
  if (filter.dueWithinDays !== undefined) {
    params.set("due_within_days", String(filter.dueWithinDays));
  }

  const response = await fetch(
    `${config.baseUrl}/api/mcp/home-tasks?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(config.apiKey),
      signal: AbortSignal.timeout(30000),
    }
  );

  await ensureOk(response);
  return (await response.json()) as HomeTaskListResponse;
}

/**
 * Create a one-off or recurring home task
 */
export async function createHomeTask(
  config: HomeTaskApiConfig,
  task: CreateHomeTaskInput
): Promise<HomeTaskResponse> {
  const response = await fetch(`${config.baseUrl}/api/mcp/home-tasks`, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({ user_id: config.userId, task }),
    signal: AbortSignal.timeout(30000),
  });

  await ensureOk(response);
  return (await response.json()) as HomeTaskResponse;
}

/**
 * Partially update a home task
 */
export async function updateHomeTask(
  config: HomeTaskApiConfig,
  task: UpdateHomeTaskInput
): Promise<HomeTaskResponse> {
  const response = await fetch(`${config.baseUrl}/api/mcp/home-tasks`, {
    method: "PATCH",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({ user_id: config.userId, task }),
    signal: AbortSignal.timeout(30000),
  });

  await ensureOk(response);
  return (await response.json()) as HomeTaskResponse;
}

/**
 * Complete a task. Recurring tasks roll forward to the next due date;
 * one-off tasks flip to COMPLETED.
 */
export async function completeHomeTask(
  config: HomeTaskApiConfig,
  id: string,
  completedById?: string
): Promise<HomeTaskResponse> {
  const response = await fetch(
    `${config.baseUrl}/api/mcp/home-tasks/complete`,
    {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify({
        user_id: config.userId,
        id,
        ...(completedById && { completed_by_id: completedById }),
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  await ensureOk(response);
  return (await response.json()) as HomeTaskResponse;
}

/**
 * Undo the most recent completion, restoring the prior due date/status
 */
export async function uncompleteHomeTask(
  config: HomeTaskApiConfig,
  id: string
): Promise<HomeTaskResponse> {
  const response = await fetch(
    `${config.baseUrl}/api/mcp/home-tasks/uncomplete`,
    {
      method: "POST",
      headers: getHeaders(config.apiKey),
      body: JSON.stringify({ user_id: config.userId, id }),
      signal: AbortSignal.timeout(30000),
    }
  );

  await ensureOk(response);
  return (await response.json()) as HomeTaskResponse;
}

/**
 * Permanently delete a home task (and its completion history)
 */
export async function deleteHomeTask(
  config: HomeTaskApiConfig,
  id: string
): Promise<HomeTaskDeleteResponse> {
  const response = await fetch(`${config.baseUrl}/api/mcp/home-tasks`, {
    method: "DELETE",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify({ user_id: config.userId, id }),
    signal: AbortSignal.timeout(30000),
  });

  await ensureOk(response);
  return (await response.json()) as HomeTaskDeleteResponse;
}

/**
 * List household members (read-only — managed in the web app)
 */
export async function getHouseholdMembers(
  config: HomeTaskApiConfig
): Promise<HouseholdMembersResponse> {
  const params = new URLSearchParams({ user_id: config.userId });

  const response = await fetch(
    `${config.baseUrl}/api/mcp/home-tasks/members?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(config.apiKey),
      signal: AbortSignal.timeout(30000),
    }
  );

  await ensureOk(response);
  return (await response.json()) as HouseholdMembersResponse;
}

/**
 * Get the completion history for a task
 */
export async function getTaskCompletions(
  config: HomeTaskApiConfig,
  taskId: string
): Promise<TaskCompletionsResponse> {
  const params = new URLSearchParams({
    user_id: config.userId,
    task_id: taskId,
  });

  const response = await fetch(
    `${config.baseUrl}/api/mcp/home-tasks/completions?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(config.apiKey),
      signal: AbortSignal.timeout(30000),
    }
  );

  await ensureOk(response);
  return (await response.json()) as TaskCompletionsResponse;
}
