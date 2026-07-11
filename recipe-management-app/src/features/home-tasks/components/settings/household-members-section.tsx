"use client";

import React from "react";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/features/home-tasks/components/member-avatar";
import { MEMBER_COLORS } from "@/features/home-tasks/constants/member-colors";
import {
  useCreateMember,
  useDeleteMember,
  useHouseholdMembersQuery,
} from "@/features/home-tasks/hooks/home-tasks-query-hooks";

export default function HouseholdMembersSection() {
  const { data: members, isLoading } = useHouseholdMembersQuery();
  const createMutation = useCreateMember();
  const deleteMutation = useDeleteMember();

  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState<string>(MEMBER_COLORS[0]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), color },
      {
        onSuccess: () => {
          setName("");
          const used = new Set([...(members?.map((m) => m.color) ?? []), color]);
          setColor(
            MEMBER_COLORS.find((c) => !used.has(c)) ?? MEMBER_COLORS[0]
          );
        },
      }
    );
  };

  return (
    <GlassPanel rounded="2xl" className="p-5 w-full max-w-xl">
      <h2 className="font-heading text-lg font-medium text-foreground">
        Household members
      </h2>
      <p className="text-sm text-muted-foreground mt-0.5 mb-4">
        People you can assign home tasks to. No account needed.
      </p>

      {isLoading ? (
        <div className="py-4 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <ul className="space-y-2 mb-4">
          {(members ?? []).map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface/60 border border-border/50"
            >
              <MemberAvatar name={member.name} color={member.color} size="md" />
              <span className="flex-1 text-sm font-medium text-foreground truncate">
                {member.name}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(member.id)}
                aria-label={`Remove ${member.name}`}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
          {(members?.length ?? 0) === 0 && (
            <li className="text-sm text-muted-foreground py-2">
              No members yet — add the first one below.
            </li>
          )}
        </ul>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Member name"
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending ? "Adding…" : "Add"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {MEMBER_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-label={`Pick color ${option}`}
              aria-pressed={color === option}
              className={clsx(
                "w-6 h-6 rounded-full transition-transform",
                color === option
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                  : "hover:scale-110"
              )}
              style={{ backgroundColor: option }}
            />
          ))}
        </div>
      </form>
    </GlassPanel>
  );
}
