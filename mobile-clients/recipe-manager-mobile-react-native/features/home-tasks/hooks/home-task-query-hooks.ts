import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import {
  completeHomeTask,
  createHomeTask,
  deleteHomeTask,
  getHomeTasks,
  getHouseholdMembers,
  uncompleteHomeTask,
  updateHomeTask,
} from "@/lib/backend-api";
import type {
  CreateHomeTaskInput,
  HomeTask,
  HouseholdMember,
  UpdateHomeTaskInput,
} from "@/features/home-tasks/types";

const ACTIVE_TASKS_KEY = ["homeTasks", "active"];
const COMPLETED_TASKS_KEY = ["homeTasks", "completed"];

export const useHomeTasksQuery = () => {
  return useQuery<HomeTask[], Error>({
    queryKey: ACTIVE_TASKS_KEY,
    queryFn: () => getHomeTasks(),
    staleTime: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCompletedTasksQuery = (enabled: boolean) => {
  return useQuery<HomeTask[], Error>({
    queryKey: COMPLETED_TASKS_KEY,
    queryFn: () => getHomeTasks({ view: "completed" }),
    enabled,
  });
};

export const useHouseholdMembersQuery = () => {
  return useQuery<HouseholdMember[], Error>({
    queryKey: ["householdMembers"],
    queryFn: getHouseholdMembers,
    staleTime: 60000,
  });
};

export const useCreateHomeTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateHomeTaskInput) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return createHomeTask(input);
    },
    onSuccess: (newTask) => {
      queryClient.setQueryData<HomeTask[]>(ACTIVE_TASKS_KEY, (old) =>
        old ? [...old, newTask] : [newTask]
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["homeTasks"] }),
  });
};

export const useUpdateHomeTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHomeTaskInput }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return updateHomeTask(id, input);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["homeTasks"] }),
  });
};

export const useDeleteHomeTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return deleteHomeTask(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["homeTasks"] });
      const previous = queryClient.getQueryData<HomeTask[]>(ACTIVE_TASKS_KEY);
      queryClient.setQueryData<HomeTask[]>(
        ACTIVE_TASKS_KEY,
        (old) => old?.filter((t) => t.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ACTIVE_TASKS_KEY, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["homeTasks"] }),
  });
};

export const useCompleteHomeTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return completeHomeTask(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["homeTasks"] });
      const previous = queryClient.getQueryData<HomeTask[]>(ACTIVE_TASKS_KEY);
      // One-off tasks leave the list; recurring roll forward server-side
      queryClient.setQueryData<HomeTask[]>(
        ACTIVE_TASKS_KEY,
        (old) => old?.filter((t) => t.id !== id || t.isRecurring) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ACTIVE_TASKS_KEY, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["homeTasks"] }),
  });
};

export const useUncompleteHomeTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return uncompleteHomeTask(id);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["homeTasks"] }),
  });
};
