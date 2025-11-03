import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { LearningOutcome } from "@/api/base44Client";

type Outcome = LearningOutcome;

type Relations = {
  expects: Outcome[];
  consists_of: Outcome[];
  expected_by: Outcome[];
  part_of: Outcome[];
};

type RelationGraphProps = {
  outcome: Outcome;
  relations: Relations;
  onOutcomeClick: (outcome: Outcome) => void;
  getTopicName: (topicId: string) => string;
};

type RelationColumnProps = {
  title: string;
  description: string;
  items: Outcome[];
  badgeColor: string;
  emptyState: string;
  onClick: (outcome: Outcome) => void;
};

function RelationColumn({
  title,
  description,
  items,
  badgeColor,
  emptyState,
  onClick,
}: RelationColumnProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onClick(item)}
              className="w-full text-left"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-slate-300 hover:bg-slate-100">
                <p className="text-xs font-medium text-slate-800 line-clamp-2">
                  {item.text_et || item.text || "—"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {item.school_level ? (
                    <Badge className={badgeColor}>{item.school_level}</Badge>
                  ) : null}
                  <ArrowRight className="h-3 w-3 text-slate-400" />
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    Vaata
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-3 py-5 text-center text-xs text-slate-500">
          {emptyState}
        </p>
      )}
    </div>
  );
}

export default function RelationGraph({
  outcome,
  relations,
  onOutcomeClick,
  getTopicName,
}: RelationGraphProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-purple-200 bg-purple-50/40 p-6">
      <div>
        <h2 className="text-lg font-semibold text-purple-900">Seoste ülevaade</h2>
        <p className="text-sm text-purple-700/80">
          Valitud õpiväljund: {outcome.text_et || outcome.text || "—"}
        </p>
        <p className="text-xs text-purple-600/80">
          Seotud teema: {getTopicName(outcome.topic_id)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RelationColumn
          title="Eeldab"
          description="Õpiväljundid, mis tuleb saavutada enne seda"
          items={relations.expects}
          badgeColor="bg-blue-600 text-white"
          emptyState="Eeldavaid õpiväljundeid pole lisatud"
          onClick={onOutcomeClick}
        />
        <RelationColumn
          title="Koosneb"
          description="Alam-õpiväljundid, millest see koosneb"
          items={relations.consists_of}
          badgeColor="bg-emerald-600 text-white"
          emptyState="Koosnevaid õpiväljundeid pole lisatud"
          onClick={onOutcomeClick}
        />
        <RelationColumn
          title="Eeldab seda"
          description="Õpiväljundid, mille eelduseks see on"
          items={relations.expected_by}
          badgeColor="bg-amber-500 text-slate-900"
          emptyState="Teised õpiväljundid ei eelda seda"
          onClick={onOutcomeClick}
        />
        <RelationColumn
          title="On osa"
          description="Õpiväljundid, mille sisse see kuulub"
          items={relations.part_of}
          badgeColor="bg-purple-600 text-white"
          emptyState="Õpiväljund ei kuulu teistesse loenditesse"
          onClick={onOutcomeClick}
        />
      </div>
    </div>
  );
}
