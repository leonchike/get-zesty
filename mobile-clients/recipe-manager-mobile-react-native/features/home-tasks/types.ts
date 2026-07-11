export type CadenceUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";
export type HomeTaskStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type HomeTaskView = "all" | "overdue" | "dueSoon" | "completed";

export interface HouseholdMember {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface HomeTask {
  id: string;
  title: string;
  notes: string | null;
  category: string | null;
  status: HomeTaskStatus;
  dueDate: string | null;
  isRecurring: boolean;
  intervalValue: number | null;
  intervalUnit: CadenceUnit | null;
  lastCompletedAt: string | null;
  assigneeId: string | null;
  assignee: HouseholdMember | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHomeTaskInput {
  title: string;
  notes?: string | null;
  category?: string | null;
  dueDate?: string | null;
  isRecurring?: boolean;
  intervalValue?: number | null;
  intervalUnit?: CadenceUnit | null;
  assigneeId?: string | null;
}

export type UpdateHomeTaskInput = Partial<CreateHomeTaskInput> & {
  status?: HomeTaskStatus;
};
