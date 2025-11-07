import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {outcome ? `Skill-bits · ${outcome.text_et || outcome.text || "Learning outcome"}` : "Skill-bits"}
          </DialogTitle>
        </DialogHeader>
        {outcome ? <SkillBitPanel key={outcome.id} outcome={outcome} /> : null}
      </DialogContent>
    </Dialog>
  );
}
