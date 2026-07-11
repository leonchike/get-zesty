import { H1 } from "@/components/ui/typography";
import AddTaskInput from "@/features/home-tasks/components/add-task-input";
import TaskListView from "@/features/home-tasks/components/task-list-view";

export default async function HomeTasksPage() {
  return (
    <div className="m-auto max-w-4xl">
      <H1>Home Tasks</H1>
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Chores, maintenance, and one-off jobs around the house.
      </p>
      <AddTaskInput />
      <TaskListView />
    </div>
  );
}
