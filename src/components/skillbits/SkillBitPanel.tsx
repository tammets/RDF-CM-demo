import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { curriculum, type LearningOutcome, type SkillBit } from "@/api/curriculumClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, Edit2, Trash2, X, Check } from "lucide-react";

type SkillBitPanelProps = {
  outcome: LearningOutcome;
};

type SkillFormState = {
  label: string;
  manualOrder: string;
};

const defaultState: SkillFormState = {
  label: "",
  manualOrder: "",
};

export function SkillBitPanel({ outcome }: SkillBitPanelProps) {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<SkillFormState>(defaultState);
  const [editingSkill, setEditingSkill] = useState<SkillBit | null>(null);

  const { data: skillBits = [], isFetching } = useQuery<SkillBit[]>({
    queryKey: ["skillbits", outcome.id],
    queryFn: () => curriculum.skillBits.listForOutcome(outcome.id),
  });

  const sortedSkills = useMemo(
    () =>
      [...skillBits].sort((a, b) => {
        const aOrder = a.manual_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.manual_order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.created_at - a.created_at;
      }),
    [skillBits],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["skillbits", outcome.id] });
    queryClient.invalidateQueries({ queryKey: ["skillbits"] });
    queryClient.invalidateQueries({ queryKey: ["skillbit-counts"] });
  };

  const resetForm = () => {
    setFormState(defaultState);
    setEditingSkill(null);
  };

  const upsertMutation = useMutation({
    mutationFn: async (input: { label: string; manual_order?: number; id?: string }) => {
      if (input.id) {
        return curriculum.entities.SkillBit.update(input.id, {
          label: input.label,
          manual_order: input.manual_order,
          outcome_id: outcome.id,
        });
      }
      return curriculum.entities.SkillBit.create({
        label: input.label,
        manual_order: input.manual_order,
        outcome_id: outcome.id,
      });
    },
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => curriculum.entities.SkillBit.delete(id),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (input: { id: string; direction: "up" | "down" }) =>
      curriculum.skillBits.reorder(input.id, input.direction),
    onSuccess: () => {
      invalidate();
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedLabel = formState.label.trim();
    if (!trimmedLabel) return;
    const manualOrderValue = formState.manualOrder.trim()
      ? Number.parseInt(formState.manualOrder, 10)
      : undefined;
    void upsertMutation.mutate({
      id: editingSkill?.id,
      label: trimmedLabel,
      manual_order: Number.isFinite(manualOrderValue) ? manualOrderValue : undefined,
    });
  };

  const handleEdit = (skill: SkillBit) => {
    setEditingSkill(skill);
    setFormState({
      label: skill.label,
      manualOrder: skill.manual_order ? String(skill.manual_order) : "",
    });
  };

  const handleDelete = (skill: SkillBit) => {
    if (window.confirm(`Delete skill-bit "${skill.label}"?`)) {
      void deleteMutation.mutate(skill.id);
    }
  };

  const handleReorder = (skill: SkillBit, direction: "up" | "down") => {
    void reorderMutation.mutate({ id: skill.id, direction });
  };

  const isSubmitting = upsertMutation.isPending || deleteMutation.isPending || reorderMutation.isPending;

  return (
    <div className="space-y-4 sm:m-3 md:m-4">
      <div>
        <p className="text-sm text-slate-500">Skill-bits linked to</p>
        <p className="font-semibold text-slate-900">{outcome.text_et || outcome.text || "Unnamed outcome"}</p>
      </div>

      <div className="space-y-2">
        {isFetching ? (
          <p className="text-sm text-slate-500">Loading skill-bits…</p>
        ) : sortedSkills.length === 0 ? (
          <p className="text-sm text-slate-500">No skill-bits yet. Add the first concise ability below.</p>
        ) : (
          <div className="space-y-2">
            {sortedSkills.map((skill, index) => (
              <div
                key={skill.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {skill.manual_order ?? "—"}
                    </Badge>
                    <span className="text-sm text-slate-900">{skill.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">ID: {skill.id}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isSubmitting || index === 0}
                    onClick={() => handleReorder(skill, "up")}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isSubmitting || index === sortedSkills.length - 1}
                    onClick={() => handleReorder(skill, "down")}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleEdit(skill)} title="Edit">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => handleDelete(skill)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="space-y-2">
          <Label htmlFor="skillbit-label">Skill-bit label *</Label>
          <Input
            id="skillbit-label"
            value={formState.label}
            onChange={(event) => setFormState((prev) => ({ ...prev, label: event.target.value }))}
            placeholder="e.g. Documents sprint work in English"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="skillbit-order">Manual order</Label>
          <Input
            id="skillbit-order"
            type="number"
            min={1}
            value={formState.manualOrder}
            onChange={(event) => setFormState((prev) => ({ ...prev, manualOrder: event.target.value }))}
            placeholder="Optional number to control list order"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          {editingSkill ? (
            <>
              <Button type="button" variant="ghost" onClick={resetForm}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                <Check className="mr-2 h-4 w-4" />
                Save changes
              </Button>
            </>
          ) : (
            <Button type="submit" disabled={upsertMutation.isPending}>
              <Check className="mr-2 h-4 w-4" />
              Add skill-bit
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
