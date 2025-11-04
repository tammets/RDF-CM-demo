import { Badge } from "@/components/ui/badge";
import type { LearningOutcome } from "@/api/curriculumClient";

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
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
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
              className="w-full text-left cursor-pointer"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-slate-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
                <p className="text-xs font-medium text-slate-800 line-clamp-2">
                  {item.text_et || item.text || "—"}
                </p>
                {item.school_level ? (
                  <Badge className={`${badgeColor} mt-3 w-full justify-center`}>
                    {item.school_level}
                  </Badge>
                ) : null}
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
        <h2 className="text-lg font-semibold text-purple-900">Relation Overview</h2>
        <p className="text-sm text-purple-700/80">
          Selected learning outcome: {outcome.text_et || outcome.text || "—"}
        </p>
        <p className="text-xs text-purple-600/80">
          Linked topic: {getTopicName(outcome.topic_id)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RelationColumn
          title="Requires"
          description="Learning outcomes that should be completed beforehand"
          items={relations.expects}
          badgeColor="bg-blue-600 text-white"
          emptyState="No prerequisite learning outcomes yet"
          onClick={onOutcomeClick}
        />
        <RelationColumn
          title="Consists of"
          description="Component outcomes that make up the selected outcome"
          items={relations.consists_of}
          badgeColor="bg-emerald-600 text-white"
          emptyState="No component learning outcomes yet"
          onClick={onOutcomeClick}
        />
        <RelationColumn
          title="Required by"
          description="Outcomes that rely on the selected outcome as a prerequisite"
          items={relations.expected_by}
          badgeColor="bg-amber-500 text-slate-900"
          emptyState="No outcomes require this yet"
          onClick={onOutcomeClick}
        />
        <RelationColumn
          title="Part of"
          description="Broader outcomes that include the selected outcome"
          items={relations.part_of}
          badgeColor="bg-purple-600 text-white"
          emptyState="No broader outcomes include this yet"
          onClick={onOutcomeClick}
        />
      </div>
    </div>
  );
}
