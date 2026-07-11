"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAvatar } from "@/features/home-tasks/components/member-avatar";
import {
  useDeleteTask,
  useHouseholdMembersQuery,
  useTaskCompletionsQuery,
  useUpdateTask,
} from "@/features/home-tasks/hooks/home-tasks-query-hooks";
import type {
  CadenceUnit,
  HomeTaskWithRelations,
} from "@/features/home-tasks/types";

interface Props {
  task: HomeTaskWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

const NONE_VALUE = "__none__";

const CADENCE_UNITS: { value: CadenceUnit; label: string }[] = [
  { value: "DAY", label: "days" },
  { value: "WEEK", label: "weeks" },
  { value: "MONTH", label: "months" },
  { value: "YEAR", label: "years" },
];

function toDateInputValue(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function EditTaskModal({ task, isOpen, onClose }: Props) {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [intervalValue, setIntervalValue] = React.useState("1");
  const [intervalUnit, setIntervalUnit] = React.useState<CadenceUnit>("MONTH");
  const [assigneeId, setAssigneeId] = React.useState<string>(NONE_VALUE);

  React.useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setCategory(task.category ?? "");
      setDueDate(toDateInputValue(task.dueDate));
      setIsRecurring(task.isRecurring);
      setIntervalValue(task.intervalValue?.toString() ?? "1");
      setIntervalUnit(task.intervalUnit ?? "MONTH");
      setAssigneeId(task.assigneeId ?? NONE_VALUE);
    }
  }, [isOpen, task]);

  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const { data: members } = useHouseholdMembersQuery();
  const { data: completions } = useTaskCompletionsQuery(
    isOpen && task?.isRecurring ? task.id : null
  );

  if (!task) return null;

  const handleSave = () => {
    updateMutation.mutate({
      id: task.id,
      input: {
        title,
        notes: notes || null,
        category: category || null,
        dueDate: dueDate || null,
        isRecurring,
        intervalValue: isRecurring ? parseInt(intervalValue, 10) || 1 : null,
        intervalUnit: isRecurring ? intervalUnit : null,
        assigneeId: assigneeId === NONE_VALUE ? null : assigneeId,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    deleteMutation.mutate(task.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl w-[95vw] max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-foreground">
            Edit Task
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="task-title" className="md:text-right">
              Title
            </Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="md:col-span-3"
              autoComplete="off"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="task-category" className="md:text-right">
              Category
            </Label>
            <Input
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="md:col-span-3"
              placeholder="e.g. Maintenance, Garden, Cleaning"
            />
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="task-due" className="md:text-right">
              Due
            </Label>
            <div className="md:col-span-3 flex items-center gap-2">
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1"
              />
              {dueDate && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setDueDate("")}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label htmlFor="task-repeats" className="md:text-right">
              Repeats
            </Label>
            <div className="md:col-span-3 flex items-center gap-2 flex-wrap">
              <input
                id="task-repeats"
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-[hsl(var(--primary))]"
              />
              {isRecurring && (
                <>
                  <span className="text-sm text-muted-foreground">every</span>
                  <Input
                    type="number"
                    min={1}
                    value={intervalValue}
                    onChange={(e) => setIntervalValue(e.target.value)}
                    className="w-20"
                  />
                  <Select
                    value={intervalUnit}
                    onValueChange={(v) => setIntervalUnit(v as CadenceUnit)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CADENCE_UNITS.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-4 items-center gap-2 md:gap-4">
            <Label className="md:text-right">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="md:col-span-3">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                {members?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid md:grid-cols-4 items-start gap-2 md:gap-4">
            <Label htmlFor="task-notes" className="md:text-right pt-2">
              Notes
            </Label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="md:col-span-3 px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              rows={2}
              placeholder='e.g. "filters are in the garage cabinet"'
            />
          </div>

          {task.isRecurring && (completions?.length ?? 0) > 0 && (
            <div className="grid md:grid-cols-4 items-start gap-2 md:gap-4">
              <Label className="md:text-right pt-1">History</Label>
              <ul className="md:col-span-3 space-y-1.5 max-h-28 overflow-y-auto">
                {completions!.map((completion) => (
                  <li
                    key={completion.id}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    {completion.completedBy && (
                      <MemberAvatar
                        name={completion.completedBy.name}
                        color={completion.completedBy.color}
                      />
                    )}
                    <span>
                      Done{" "}
                      {new Date(completion.completedAt).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Delete task
          </Button>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
