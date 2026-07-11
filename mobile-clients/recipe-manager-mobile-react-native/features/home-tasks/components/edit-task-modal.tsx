import React, { useEffect, useState } from "react";
import { ScrollView, Switch, Text, View } from "react-native";

import SheetModalBase from "@/components/sheet-modal-base";
import InputField from "@/components/input-field";
import CustomButton from "@/components/custom-button";
import PopupPicker from "@/components/pop-up-picker";
import {
  useDeleteHomeTask,
  useHouseholdMembersQuery,
  useUpdateHomeTask,
} from "@/features/home-tasks/hooks/home-task-query-hooks";
import { useHomeTaskStore } from "@/features/home-tasks/stores/home-task-store";
import type { CadenceUnit } from "@/features/home-tasks/types";

type DueChoice =
  | ""
  | "none"
  | "today"
  | "tomorrow"
  | "3d"
  | "1w"
  | "2w"
  | "1m";

const DUE_CHOICES: { label: string; value: DueChoice }[] = [
  { label: "No due date", value: "none" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "In 3 days", value: "3d" },
  { label: "In a week", value: "1w" },
  { label: "In 2 weeks", value: "2w" },
  { label: "In a month", value: "1m" },
];

const CADENCE_UNITS: { label: string; value: CadenceUnit }[] = [
  { label: "days", value: "DAY" },
  { label: "weeks", value: "WEEK" },
  { label: "months", value: "MONTH" },
  { label: "years", value: "YEAR" },
];

const UNASSIGNED = "__unassigned__";

function resolveDueChoice(choice: DueChoice): string | null {
  const now = new Date();
  switch (choice) {
    case "none":
      return null;
    case "today":
      return now.toISOString();
    case "tomorrow":
      now.setDate(now.getDate() + 1);
      return now.toISOString();
    case "3d":
      now.setDate(now.getDate() + 3);
      return now.toISOString();
    case "1w":
      now.setDate(now.getDate() + 7);
      return now.toISOString();
    case "2w":
      now.setDate(now.getDate() + 14);
      return now.toISOString();
    case "1m":
      now.setMonth(now.getMonth() + 1);
      return now.toISOString();
    default:
      return null;
  }
}

export const EditTaskModal = () => {
  const editingTask = useHomeTaskStore((s) => s.editingTask);
  const setEditingTask = useHomeTaskStore((s) => s.setEditingTask);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("");
  const [dueChoice, setDueChoice] = useState<DueChoice>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalValue, setIntervalValue] = useState("1");
  const [intervalUnit, setIntervalUnit] = useState<CadenceUnit>("MONTH");
  const [assigneeId, setAssigneeId] = useState<string>(UNASSIGNED);

  const updateMutation = useUpdateHomeTask();
  const deleteMutation = useDeleteHomeTask();
  const { data: members } = useHouseholdMembersQuery();

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes ?? "");
      setCategory(editingTask.category ?? "");
      setDueChoice("");
      setIsRecurring(editingTask.isRecurring);
      setIntervalValue(editingTask.intervalValue?.toString() ?? "1");
      setIntervalUnit(editingTask.intervalUnit ?? "MONTH");
      setAssigneeId(editingTask.assigneeId ?? UNASSIGNED);
    }
  }, [editingTask]);

  if (!editingTask) return null;

  const currentDueLabel = editingTask.dueDate
    ? `Due ${new Date(editingTask.dueDate).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`
    : "No due date";

  const handleClose = () => setEditingTask(null);

  const handleSave = () => {
    updateMutation.mutate({
      id: editingTask.id,
      input: {
        title: title.trim(),
        notes: notes.trim() || null,
        category: category.trim() || null,
        ...(dueChoice !== "" && { dueDate: resolveDueChoice(dueChoice) }),
        isRecurring,
        intervalValue: isRecurring ? parseInt(intervalValue, 10) || 1 : null,
        intervalUnit: isRecurring ? intervalUnit : null,
        assigneeId: assigneeId === UNASSIGNED ? null : assigneeId,
      },
    });
    handleClose();
  };

  const handleDelete = () => {
    deleteMutation.mutate(editingTask.id);
    handleClose();
  };

  const memberTypes = [
    { label: "Unassigned", value: UNASSIGNED },
    ...(members ?? []).map((m) => ({ label: m.name, value: m.id })),
  ];

  return (
    <SheetModalBase
      isVisible={!!editingTask}
      onClose={handleClose}
      title="Edit Task"
    >
      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-12 pt-2"
        keyboardShouldPersistTaps="handled"
      >
        <InputField
          title="Title"
          value={title}
          handleChange={setTitle}
          placeholder="Task title"
        />
        <InputField
          title="Category"
          value={category}
          handleChange={setCategory}
          placeholder="e.g. Maintenance, Garden"
        />
        <PopupPicker
          title={`Due date (${currentDueLabel})`}
          options={DUE_CHOICES.map((c) => c.label)}
          value={dueChoice}
          onSelect={(v) => setDueChoice(v as DueChoice)}
          types={DUE_CHOICES}
          placeholder={currentDueLabel}
        />

        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-body-medium text-foreground-light dark:text-foreground-dark opacity-80">
            Repeats
          </Text>
          <Switch value={isRecurring} onValueChange={setIsRecurring} />
        </View>

        {isRecurring && (
          <View className="flex-row items-end gap-3">
            <InputField
              title="Every"
              value={intervalValue}
              handleChange={setIntervalValue}
              keyboardType="number-pad"
              containerClassName="w-24"
            />
            <PopupPicker
              options={CADENCE_UNITS.map((u) => u.label)}
              value={intervalUnit}
              onSelect={(v) => setIntervalUnit(v as CadenceUnit)}
              types={CADENCE_UNITS}
              containerClassName="flex-1"
            />
          </View>
        )}

        <PopupPicker
          title="Assignee"
          options={memberTypes.map((m) => m.label)}
          value={assigneeId}
          onSelect={(v) => setAssigneeId(v as string)}
          types={memberTypes}
        />

        <InputField
          title="Notes"
          value={notes}
          handleChange={setNotes}
          placeholder="Anything worth remembering"
          multiline
        />

        <View className="gap-3 mt-2">
          <CustomButton
            title="Save"
            onPress={handleSave}
            isDisabled={!title.trim()}
          />
          <CustomButton
            title="Delete task"
            variant="danger"
            onPress={handleDelete}
          />
        </View>
      </ScrollView>
    </SheetModalBase>
  );
};
