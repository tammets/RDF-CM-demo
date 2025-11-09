import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { LearningOutcome } from "@/api/curriculumClient";
import { SkillBitPanel } from "./SkillBitPanel";

type SkillBitManagerDialogProps = {
  outcome: LearningOutcome | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SkillBitManagerDialog({ outcome, open, onOpenChange }: SkillBitManagerDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false);
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="max-w-2xl sm:m-4 sm:pb-6">
        <DialogHeader>
          <DialogTitle>
            {outcome ? `Skill-bits · ${outcome.text_et || outcome.text || "Learning outcome"}` : "Skill-bits"}
          </DialogTitle>
        </DialogHeader>
        {outcome ? <SkillBitPanel key={outcome.id} outcome={outcome} /> : null}
        <div className="mt-8 flex justify-end border-t border-slate-200 pt-4">
          <Button type="button" onClick={() => onOpenChange(false)} className="bg-indigo-600 hover:bg-indigo-700 px-6 mr-4">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
