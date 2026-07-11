/**
 * @jest-environment node
 */

/// <reference types="jest" />

/**
 * E2E tests for MCP Home Tasks API routes
 *
 * These tests make real HTTP calls to the running Next.js server.
 * Requires:
 *   - Next.js dev server running on localhost:3000
 *   - MCP_API_KEY set in .env
 *   - A valid user in the database
 *
 * Run: npm test -- src/app/api/mcp/home-tasks/__tests__/home-tasks-mcp-e2e.test.ts
 */

const API_BASE = process.env.API_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.MCP_API_KEY;
const USER_ID = process.env.DEFAULT_USER_ID || "clzej3dqz0000inntk5x0bqre";

const canRunE2E = !!API_KEY;
const describeE2ETasks = canRunE2E ? describe : describe.skip;

function taskHeaders(): Record<string, string> {
  return {
    "X-API-Key": API_KEY!,
    "Content-Type": "application/json",
  };
}

describeE2ETasks("MCP Home Tasks API — E2E", () => {
  jest.setTimeout(30000);

  const createdTaskIds: string[] = [];

  afterAll(async () => {
    for (const id of createdTaskIds) {
      try {
        await fetch(`${API_BASE}/api/mcp/home-tasks`, {
          method: "DELETE",
          headers: taskHeaders(),
          body: JSON.stringify({ user_id: USER_ID, id }),
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe("GET /api/mcp/home-tasks", () => {
    it("returns tasks with valid auth", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/home-tasks?user_id=${USER_ID}`,
        { method: "GET", headers: taskHeaders() }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("tasks");
      expect(Array.isArray(data.tasks)).toBe(true);
    });

    it("accepts view filters", async () => {
      for (const view of ["overdue", "dueSoon", "completed"]) {
        const response = await fetch(
          `${API_BASE}/api/mcp/home-tasks?user_id=${USER_ID}&view=${view}`,
          { method: "GET", headers: taskHeaders() }
        );
        expect(response.ok).toBe(true);
        const data = await response.json();
        expect(Array.isArray(data.tasks)).toBe(true);
      }
    });

    it("returns 401 without API key", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/home-tasks?user_id=${USER_ID}`,
        { method: "GET" }
      );
      expect(response.status).toBe(401);
    });

    it("returns 400 without user_id", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "GET",
        headers: taskHeaders(),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/mcp/home-tasks", () => {
    it("creates a one-off task", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "E2E one-off task" },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.task).toHaveProperty("id");
      expect(data.task.status).toBe("ACTIVE");
      expect(data.task.isRecurring).toBe(false);
      createdTaskIds.push(data.task.id);
    });

    it("creates a recurring task with cadence", async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: {
            title: "E2E recurring task",
            dueDate: dueDate.toISOString(),
            isRecurring: true,
            intervalValue: 2,
            intervalUnit: "WEEK",
          },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.task.isRecurring).toBe(true);
      expect(data.task.intervalValue).toBe(2);
      expect(data.task.intervalUnit).toBe("WEEK");
      createdTaskIds.push(data.task.id);
    });

    it("rejects a task without a title", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({ user_id: USER_ID, task: { notes: "no title" } }),
      });
      expect(response.status).toBe(400);
    });

    it("rejects a recurring task without a cadence", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "Bad recurring", isRecurring: true },
        }),
      });
      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toMatch(/repeat/i);
    });
  });

  describe("PATCH /api/mcp/home-tasks", () => {
    it("updates task fields", async () => {
      const createRes = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "E2E to update" },
        }),
      });
      const { task } = await createRes.json();
      createdTaskIds.push(task.id);

      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "PATCH",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { id: task.id, title: "E2E updated", notes: "now with notes" },
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.task.title).toBe("E2E updated");
      expect(data.task.notes).toBe("now with notes");
    });

    it("returns 400 without task id", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "PATCH",
        headers: taskHeaders(),
        body: JSON.stringify({ user_id: USER_ID, task: { title: "no id" } }),
      });
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/mcp/home-tasks/complete + uncomplete", () => {
    it("rolls a recurring task forward from completion date", async () => {
      const originalDue = new Date();
      originalDue.setDate(originalDue.getDate() - 30); // overdue

      const createRes = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: {
            title: "E2E recurring complete",
            dueDate: originalDue.toISOString(),
            isRecurring: true,
            intervalValue: 3,
            intervalUnit: "MONTH",
          },
        }),
      });
      const { task } = await createRes.json();
      createdTaskIds.push(task.id);

      const completeRes = await fetch(
        `${API_BASE}/api/mcp/home-tasks/complete`,
        {
          method: "POST",
          headers: taskHeaders(),
          body: JSON.stringify({ user_id: USER_ID, id: task.id }),
        }
      );

      expect(completeRes.ok).toBe(true);
      const completed = (await completeRes.json()).task;
      // Recurring: stays active, due date rolled forward from NOW (not old due)
      expect(completed.status).toBe("ACTIVE");
      expect(new Date(completed.dueDate).getTime()).toBeGreaterThan(
        Date.now()
      );

      // Uncomplete restores the original overdue date
      const uncompleteRes = await fetch(
        `${API_BASE}/api/mcp/home-tasks/uncomplete`,
        {
          method: "POST",
          headers: taskHeaders(),
          body: JSON.stringify({ user_id: USER_ID, id: task.id }),
        }
      );
      expect(uncompleteRes.ok).toBe(true);
      const restored = (await uncompleteRes.json()).task;
      expect(new Date(restored.dueDate).toISOString()).toBe(
        originalDue.toISOString()
      );
      expect(restored.status).toBe("ACTIVE");
    });

    it("marks a one-off task COMPLETED", async () => {
      const createRes = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "E2E one-off complete" },
        }),
      });
      const { task } = await createRes.json();
      createdTaskIds.push(task.id);

      const completeRes = await fetch(
        `${API_BASE}/api/mcp/home-tasks/complete`,
        {
          method: "POST",
          headers: taskHeaders(),
          body: JSON.stringify({ user_id: USER_ID, id: task.id }),
        }
      );

      expect(completeRes.ok).toBe(true);
      const completed = (await completeRes.json()).task;
      expect(completed.status).toBe("COMPLETED");
    });

    it("rejects uncomplete on a never-completed task", async () => {
      const createRes = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "E2E never completed" },
        }),
      });
      const { task } = await createRes.json();
      createdTaskIds.push(task.id);

      const response = await fetch(
        `${API_BASE}/api/mcp/home-tasks/uncomplete`,
        {
          method: "POST",
          headers: taskHeaders(),
          body: JSON.stringify({ user_id: USER_ID, id: task.id }),
        }
      );
      expect(response.ok).toBe(false);
    });
  });

  describe("GET /api/mcp/home-tasks/members", () => {
    it("returns household members", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/home-tasks/members?user_id=${USER_ID}`,
        { method: "GET", headers: taskHeaders() }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("members");
      expect(Array.isArray(data.members)).toBe(true);
    });
  });

  describe("GET /api/mcp/home-tasks/completions", () => {
    it("returns the completion history for a task", async () => {
      const createRes = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "E2E history task" },
        }),
      });
      const { task } = await createRes.json();
      createdTaskIds.push(task.id);

      await fetch(`${API_BASE}/api/mcp/home-tasks/complete`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({ user_id: USER_ID, id: task.id }),
      });

      const response = await fetch(
        `${API_BASE}/api/mcp/home-tasks/completions?user_id=${USER_ID}&task_id=${task.id}`,
        { method: "GET", headers: taskHeaders() }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(Array.isArray(data.completions)).toBe(true);
      expect(data.completions.length).toBeGreaterThan(0);
      expect(data.completions[0]).toHaveProperty("completedAt");
    });

    it("returns 400 without task_id", async () => {
      const response = await fetch(
        `${API_BASE}/api/mcp/home-tasks/completions?user_id=${USER_ID}`,
        { method: "GET", headers: taskHeaders() }
      );
      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/mcp/home-tasks", () => {
    it("deletes a task", async () => {
      const createRes = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "POST",
        headers: taskHeaders(),
        body: JSON.stringify({
          user_id: USER_ID,
          task: { title: "E2E to delete" },
        }),
      });
      const { task } = await createRes.json();

      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "DELETE",
        headers: taskHeaders(),
        body: JSON.stringify({ user_id: USER_ID, id: task.id }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("returns 400 without id", async () => {
      const response = await fetch(`${API_BASE}/api/mcp/home-tasks`, {
        method: "DELETE",
        headers: taskHeaders(),
        body: JSON.stringify({ user_id: USER_ID }),
      });
      expect(response.status).toBe(400);
    });
  });
});
