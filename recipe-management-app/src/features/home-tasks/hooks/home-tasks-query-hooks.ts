"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { HouseholdMember } from "@prisma/client";
import {
  completeHomeTaskAction,
  createHomeTaskAction,
  deleteHomeTaskAction,
  getHomeTasksAction,
  getTaskCompletionsAction,
  uncompleteHomeTaskAction,
  updateHomeTaskAction,
} from "@/features/home-tasks/actions/home-task-actions";
import {
  createHouseholdMemberAction,
  deleteHouseholdMemberAction,
  getHouseholdMembersAction,
  updateHouseholdMemberAction,
} from "@/features/home-tasks/actions/household-member-actions";
import type {
  CreateHomeTaskInput,
  CreateHouseholdMemberInput,
  HomeTaskWithRelations,
  UpdateHomeTaskInput,
  UpdateHouseholdMemberInput,
} from "@/features/home-tasks/types";

const ACTIVE_TASKS_KEY = ["homeTasks", "active"] as const;
const COMPLETED_TASKS_KEY = ["homeTasks", "completed"] as const;

function invalidateTasks(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["homeTasks"] });
}

export const useHomeTasksQuery = () => {
  return useQuery<HomeTaskWithRelations[], Error>({
    queryKey: ACTIVE_TASKS_KEY,
    queryFn: () => getHomeTasksAction(),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCompletedTasksQuery = (enabled: boolean) => {
  return useQuery<HomeTaskWithRelations[], Error>({
    queryKey: COMPLETED_TASKS_KEY,
    queryFn: () => getHomeTasksAction({ view: "completed" }),
    enabled,
  });
};

export const useTaskCompletionsQuery = (taskId: string | null) => {
  return useQuery({
    queryKey: ["taskCompletions", taskId],
    queryFn: () => getTaskCompletionsAction(taskId!),
    enabled: !!taskId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHomeTaskInput) => createHomeTaskAction(input),
    onSuccess: (newTask) => {
      if (!newTask) return;
      queryClient.setQueryData<HomeTaskWithRelations[]>(
        ACTIVE_TASKS_KEY,
        (old) => (old ? [...old, newTask] : [newTask])
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Failed to add task"),
    onSettled: () => invalidateTasks(queryClient),
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHomeTaskInput }) =>
      updateHomeTaskAction(id, input),
    onSettled: () => invalidateTasks(queryClient),
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update task"
      ),
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHomeTaskAction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["homeTasks"] });
      const previous = queryClient.getQueryData<HomeTaskWithRelations[]>(
        ACTIVE_TASKS_KEY
      );
      queryClient.setQueryData<HomeTaskWithRelations[]>(
        ACTIVE_TASKS_KEY,
        (old) => old?.filter((t) => t.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ACTIVE_TASKS_KEY, context.previous);
      }
      toast.error("Failed to delete task");
    },
    onSettled: () => invalidateTasks(queryClient),
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      completedById,
    }: {
      id: string;
      completedById?: string | null;
    }) => completeHomeTaskAction(id, completedById),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ["homeTasks"] });
      const previous = queryClient.getQueryData<HomeTaskWithRelations[]>(
        ACTIVE_TASKS_KEY
      );
      // One-off tasks leave the active list; recurring ones roll forward
      // (the server computes the new due date, so just drop non-recurring).
      queryClient.setQueryData<HomeTaskWithRelations[]>(
        ACTIVE_TASKS_KEY,
        (old) => old?.filter((t) => t.id !== id || t.isRecurring) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ACTIVE_TASKS_KEY, context.previous);
      }
      toast.error("Failed to complete task");
    },
    onSettled: () => invalidateTasks(queryClient),
  });
};

export const useUncompleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => uncompleteHomeTaskAction(id),
    onError: () => toast.error("Failed to undo completion"),
    onSettled: () => invalidateTasks(queryClient),
  });
};

export const useHouseholdMembersQuery = () => {
  return useQuery<HouseholdMember[], Error>({
    queryKey: ["householdMembers"],
    queryFn: () => getHouseholdMembersAction(),
  });
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHouseholdMemberInput) =>
      createHouseholdMemberAction(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["householdMembers"] }),
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      ),
  });
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateHouseholdMemberInput;
    }) => updateHouseholdMemberAction(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
      invalidateTasks(queryClient);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update member"
      ),
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHouseholdMemberAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["householdMembers"] });
      invalidateTasks(queryClient);
    },
    onError: () => toast.error("Failed to delete member"),
  });
};
