/**
 * @jest-environment node
 */

/// <reference types="jest" />

jest.mock("@/lib/prisma-client", () => ({
  __esModule: true,
  default: {
    householdMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/actions/auth-actions", () => ({
  getUser: jest.fn(),
  redirectToLogin: jest.fn(),
}));

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma-client";
import {
  createHouseholdMemberBase,
  deleteHouseholdMemberBase,
  getHouseholdMembersBase,
  updateHouseholdMemberBase,
} from "../household-member-actions";

const mockedFindMany = prisma.householdMember.findMany as jest.Mock;
const mockedFindFirst = prisma.householdMember.findFirst as jest.Mock;
const mockedCreate = prisma.householdMember.create as jest.Mock;
const mockedUpdate = prisma.householdMember.update as jest.Mock;
const mockedDelete = prisma.householdMember.delete as jest.Mock;

const USER_ID = "user-1";

function duplicateError() {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

beforeEach(() => jest.clearAllMocks());

describe("createHouseholdMemberBase", () => {
  it("requires a name and color", async () => {
    await expect(
      createHouseholdMemberBase({ name: " ", color: "#fff" }, USER_ID)
    ).rejects.toThrow("name is required");
    await expect(
      createHouseholdMemberBase({ name: "Leon", color: "" }, USER_ID)
    ).rejects.toThrow("color is required");
  });

  it("creates a member scoped to the user", async () => {
    mockedCreate.mockResolvedValue({ id: "m-1", name: "Leon" });
    await createHouseholdMemberBase(
      { name: "  Leon ", color: "#FF385C" },
      USER_ID
    );
    expect(mockedCreate).toHaveBeenCalledWith({
      data: { name: "Leon", color: "#FF385C", userId: USER_ID },
    });
  });

  it("gives a friendly error on duplicate names", async () => {
    mockedCreate.mockRejectedValue(duplicateError());
    await expect(
      createHouseholdMemberBase({ name: "Leon", color: "#FF385C" }, USER_ID)
    ).rejects.toThrow('A member named "Leon" already exists');
  });
});

describe("updateHouseholdMemberBase", () => {
  it("verifies ownership", async () => {
    mockedFindFirst.mockResolvedValue(null);
    await expect(
      updateHouseholdMemberBase("m-1", { name: "New" }, USER_ID)
    ).rejects.toThrow("Member not found");
  });

  it("updates name and color", async () => {
    mockedFindFirst.mockResolvedValue({ id: "m-1" });
    mockedUpdate.mockResolvedValue({ id: "m-1" });
    await updateHouseholdMemberBase(
      "m-1",
      { name: "Ada", color: "#38A862" },
      USER_ID
    );
    expect(mockedUpdate).toHaveBeenCalledWith({
      where: { id: "m-1" },
      data: { name: "Ada", color: "#38A862" },
    });
  });
});

describe("deleteHouseholdMemberBase", () => {
  it("verifies ownership before deleting", async () => {
    mockedFindFirst.mockResolvedValue(null);
    await expect(deleteHouseholdMemberBase("m-1", USER_ID)).rejects.toThrow(
      "Member not found"
    );
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("deletes an owned member", async () => {
    mockedFindFirst.mockResolvedValue({ id: "m-1" });
    mockedDelete.mockResolvedValue({});
    await expect(deleteHouseholdMemberBase("m-1", USER_ID)).resolves.toEqual({
      success: true,
    });
  });
});

describe("getHouseholdMembersBase", () => {
  it("scopes to the user", async () => {
    mockedFindMany.mockResolvedValue([]);
    await getHouseholdMembersBase(USER_ID);
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } })
    );
  });
});
