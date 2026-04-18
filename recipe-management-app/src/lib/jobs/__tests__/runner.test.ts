/**
 * @jest-environment node
 */

/// <reference types="jest" />

// Mock the prisma client and the handler module before importing runner.
jest.mock("@/lib/prisma-client", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    job: { update: jest.fn() },
  },
}));

jest.mock("../handlers", () => ({
  __esModule: true,
  runJob: jest.fn(),
  handlers: {},
}));

import prisma from "@/lib/prisma-client";
import { runJob } from "../handlers";
import { runBatch } from "../runner";
import type { JobRow } from "../runner";

const mockedQueryRaw = prisma.$queryRaw as jest.MockedFunction<typeof prisma.$queryRaw>;
const mockedUpdate = prisma.job.update as jest.MockedFunction<typeof prisma.job.update>;
const mockedRunJob = runJob as jest.MockedFunction<typeof runJob>;

function job(id: string, attempts = 0): JobRow {
  return { id, type: "embed_recipe", payload: { recipeId: id }, attempts: attempts + 1 };
}

beforeEach(() => {
  mockedQueryRaw.mockReset();
  mockedUpdate.mockReset();
  mockedRunJob.mockReset();
  mockedUpdate.mockResolvedValue({} as any);
});

describe("runBatch", () => {
  it("processes jobs until the queue is empty and returns counts", async () => {
    // Queue emits 3 jobs then empty.
    mockedQueryRaw
      .mockResolvedValueOnce([job("a")])
      .mockResolvedValueOnce([job("b")])
      .mockResolvedValueOnce([job("c")])
      .mockResolvedValueOnce([]);
    mockedRunJob.mockResolvedValue(undefined);

    const res = await runBatch({ workerId: "w", maxDurationMs: 5_000 });

    expect(res.processed).toBe(3);
    expect(res.succeeded).toBe(3);
    expect(res.failed).toBe(0);
    expect(res.retried).toBe(0);
    expect(mockedRunJob).toHaveBeenCalledTimes(3);
    // One UPDATE per job to mark `done`
    expect(mockedUpdate).toHaveBeenCalledTimes(3);
  });

  it("honors maxJobs", async () => {
    mockedQueryRaw.mockResolvedValue([job("x")]); // would be infinite
    mockedRunJob.mockResolvedValue(undefined);

    const res = await runBatch({ workerId: "w", maxDurationMs: 5_000, maxJobs: 2 });

    expect(res.processed).toBe(2);
    expect(res.succeeded).toBe(2);
  });

  it("retries a failed job if under MAX_ATTEMPTS", async () => {
    mockedQueryRaw
      .mockResolvedValueOnce([job("a", 0)])
      .mockResolvedValueOnce([]);
    mockedRunJob.mockRejectedValueOnce(new Error("OpenAI 500"));

    const res = await runBatch({ workerId: "w", maxDurationMs: 5_000 });

    expect(res.retried).toBe(1);
    expect(res.failed).toBe(0);
    // Update called once to flip state back to 'pending' with a runAfter
    const updateCall = mockedUpdate.mock.calls[0][0];
    expect((updateCall as any).data.state).toBe("pending");
    expect((updateCall as any).data.runAfter).toBeInstanceOf(Date);
  });

  it("marks a job failed once attempts reaches MAX_ATTEMPTS", async () => {
    // attempts: 5 comes in (runner sees attempts already 5 after the pickup increment)
    mockedQueryRaw
      .mockResolvedValueOnce([job("a", 4)]) // attempts will be 5
      .mockResolvedValueOnce([]);
    mockedRunJob.mockRejectedValueOnce(new Error("permanent"));

    const res = await runBatch({ workerId: "w", maxDurationMs: 5_000 });

    expect(res.failed).toBe(1);
    expect(res.retried).toBe(0);
    const updateCall = mockedUpdate.mock.calls[0][0];
    expect((updateCall as any).data.state).toBe("failed");
    expect((updateCall as any).data.lastError).toBe("permanent");
  });

  it("exits cleanly when the queue is empty on first poll", async () => {
    mockedQueryRaw.mockResolvedValueOnce([]);
    const res = await runBatch({ workerId: "w", maxDurationMs: 5_000 });
    expect(res.processed).toBe(0);
    expect(res.durationMs).toBeLessThan(5_000);
  });

  it("stops picking new jobs once the time budget is exhausted", async () => {
    // Make each runJob take ~60ms so a 100ms budget allows maybe 1–2 iterations.
    mockedQueryRaw.mockResolvedValue([job("x")]);
    mockedRunJob.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 60))
    );

    const res = await runBatch({ workerId: "w", maxDurationMs: 100 });

    expect(res.processed).toBeGreaterThan(0);
    expect(res.processed).toBeLessThan(10); // would run forever otherwise
    expect(res.durationMs).toBeGreaterThanOrEqual(60);
  });
});
