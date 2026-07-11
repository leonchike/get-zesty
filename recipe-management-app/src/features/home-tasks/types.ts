import type {
  HomeTask,
  HouseholdMember,
  TaskCompletion,
  CadenceUnit,
  HomeTaskStatus,
} from "@prisma/client";

export type HomeTaskWithRelations = HomeTask & {
  assignee: HouseholdMember | null;
};

export type TaskCompletionWithRelations = TaskCompletion & {
  completedBy: HouseholdMember | null;
};

export type HomeTaskView = "all" | "overdue" | "dueSoon" | "completed";

export interface HomeTaskFilter {
  view?: HomeTaskView;
  assigneeId?: string;
  dueWithinDays?: number;
}

export interface CreateHomeTaskInput {
  title: string;
  notes?: string | null;
  category?: string | null;
  dueDate?: Date | string | null;
  isRecurring?: boolean;
  intervalValue?: number | null;
  intervalUnit?: CadenceUnit | null;
  assigneeId?: string | null;
}

export interface UpdateHomeTaskInput {
  title?: string;
  notes?: string | null;
  category?: string | null;
  dueDate?: Date | string | null;
  isRecurring?: boolean;
  intervalValue?: number | null;
  intervalUnit?: CadenceUnit | null;
  assigneeId?: string | null;
  status?: HomeTaskStatus;
}

export interface CreateHouseholdMemberInput {
  name: string;
  color: string;
}

export interface UpdateHouseholdMemberInput {
  name?: string;
  color?: string;
}

export type { CadenceUnit, HomeTaskStatus };
