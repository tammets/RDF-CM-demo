
import { useMemo, useState } from "react";
import { base44, type LearningOutcome, type Topic } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Target, ArrowRight, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RelationGraph from "@/components/relations/RelationGraph";

type RelationSummary = {
  expects: LearningOutcome[];
  consists_of: LearningOutcome[];
  expected_by: LearningOutcome[];
  part_of: LearningOutcome[];
};

export default function Relations() {
  const [selectedOutcome, setSelectedOutcome] = useState<LearningOutcome | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => base44.entities.Topic.list(),
    initialData: [],
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => base44.entities.LearningOutcome.list(),
    initialData: [],
  });

  const getTopicName = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    return topic ? topic.name : "Teadmata";
  };

  const getOutcomeById = (id: string) => {
    return outcomes.find((outcome) => outcome.id === id) ?? null;
  };

  const filteredOutcomes =
    filterTopic === "all"
      ? outcomes
      : outcomes.filter((outcome) => outcome.topic_id === filterTopic);

  const outcomesWithRelations = useMemo(() => {
    return filteredOutcomes.filter(
      (outcome) =>
        (outcome.expects && outcome.expects.length > 0) ||
        (outcome.consists_of && outcome.consists_of.length > 0) ||
        outcomes.some(
          (other) =>
            (other.expects && other.expects.includes(outcome.id)) ||
            (other.consists_of && other.consists_of.includes(outcome.id)),
        ),
    );
  }, [filteredOutcomes, outcomes]);

  const getRelatedOutcomes = (outcome: LearningOutcome | null): RelationSummary => {
    if (!outcome) {
      return { expects: [], consists_of: [], expected_by: [], part_of: [] };
    }

    const expects = (outcome.expects || [])
      .map((id) => getOutcomeById(id))
      .filter((item): item is LearningOutcome => Boolean(item));
    const consists_of = (outcome.consists_of || [])
      .map((id) => getOutcomeById(id))
      .filter((item): item is LearningOutcome => Boolean(item));

    const expected_by = outcomes.filter(
      (item) => item.expects && item.expects.includes(outcome.id),
    );

    const part_of = outcomes.filter(
      (item) => item.consists_of && item.consists_of.includes(outcome.id),
    );

    return { expects, consists_of, expected_by, part_of };
  };

  const relations = selectedOutcome ? getRelatedOutcomes(selectedOutcome) : null;
  const safeRelations: RelationSummary = relations ?? {
    expects: [],
    consists_of: [],
    expected_by: [],
    part_of: [],
  };
  const hasAnyRelations =
    safeRelations.expects.length > 0 ||
    safeRelations.consists_of.length > 0 ||
    safeRelations.expected_by.length > 0 ||
    safeRelations.part_of.length > 0;

  const handleOutcomeClick = (outcome: LearningOutcome) => {
    setSelectedOutcome(outcome);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Õpiväljundite seosed</h1>
          <p className="text-slate-600">Visualiseeri õpiväljundite vahelisi seoseid (eeldab / koosneb)</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-purple-600" />
                Vali õpiväljund
              </CardTitle>
              <div className="mt-3">
                <Select
                  value={filterTopic}
                  onValueChange={(value) => setFilterTopic(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtreeri teema järgi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kõik teemad</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-2">
                {outcomesWithRelations.length > 0 ? (
                  outcomesWithRelations.map((outcome) => {
                    const hasExpects = outcome.expects && outcome.expects.length > 0;
                    const hasConsistsOf = outcome.consists_of && outcome.consists_of.length > 0;
                    const isExpectedBy = outcomes.some(o => o.expects && o.expects.includes(outcome.id));
                    const isPartOf = outcomes.some(o => o.consists_of && o.consists_of.includes(outcome.id));
                    
                    return (
                      <div
                        key={outcome.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedOutcome?.id === outcome.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                        }`}
                        onClick={() => handleOutcomeClick(outcome)}
                      >
                        <p className="text-sm font-medium text-slate-900 line-clamp-2 mb-2">
                          {outcome.text_et || outcome.text}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {outcome.school_level}
                          </Badge>
                          {(hasExpects || isExpectedBy) && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Eeldab
                            </Badge>
                          )}
                          {(hasConsistsOf || isPartOf) && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Koosneb
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm">Seostega õpiväljundeid ei leitud</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {selectedOutcome ? (
              <>
                <Card className="border-2 border-purple-500">
                  <CardHeader className="bg-purple-50">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Valitud õpiväljund
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <p className="text-lg font-medium text-slate-900">
                        {selectedOutcome.text_et || selectedOutcome.text}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-purple-600">{selectedOutcome.school_level}</Badge>
                        <Badge variant="outline">{getTopicName(selectedOutcome.topic_id)}</Badge>
                        {selectedOutcome.grade_range && (
                          <Badge variant="secondary">{selectedOutcome.grade_range} klass</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {hasAnyRelations && (
                  <RelationGraph
                    outcome={selectedOutcome}
                    relations={safeRelations}
                    onOutcomeClick={handleOutcomeClick}
                    getTopicName={getTopicName}
                  />
                )}

                {safeRelations.expects.length > 0 && (
                  <Card>
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <ArrowRight className="w-5 h-5" />
                        Eeldab (eeltingimused)
                      </CardTitle>
                      <p className="text-sm text-blue-700 mt-1">
                        Need õpiväljundid peavad olema saavutatud enne valitud õpiväljundit
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.expects.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={() => handleOutcomeClick(outcome)}
                          >
                            <p className="text-sm font-medium text-slate-900 mb-2">
                              {outcome.text_et || outcome.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{outcome.school_level}</Badge>
                              <Badge variant="outline" className="text-xs">{getTopicName(outcome.topic_id)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {safeRelations.consists_of.length > 0 && (
                  <Card>
                    <CardHeader className="bg-green-50">
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <Network className="w-5 h-5" />
                        Koosneb (alaväljundid)
                      </CardTitle>
                      <p className="text-sm text-green-700 mt-1">
                        Valitud õpiväljund koosneb nendest väiksematest õpiväljunditest
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.consists_of.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-green-200 rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors cursor-pointer"
                            onClick={() => handleOutcomeClick(outcome)}
                          >
                            <p className="text-sm font-medium text-slate-900 mb-2">
                              {outcome.text_et || outcome.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{outcome.school_level}</Badge>
                              <Badge variant="outline" className="text-xs">{getTopicName(outcome.topic_id)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {safeRelations.expected_by.length > 0 && (
                  <Card>
                    <CardHeader className="bg-amber-50">
                      <CardTitle className="flex items-center gap-2 text-amber-900">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                        Seda eeldavad
                      </CardTitle>
                      <p className="text-sm text-amber-700 mt-1">
                        Need õpiväljundid eeldavad valitud õpiväljundi saavutamist
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.expected_by.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-amber-200 rounded-lg bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
                            onClick={() => handleOutcomeClick(outcome)}
                          >
                            <p className="text-sm font-medium text-slate-900 mb-2">
                              {outcome.text_et || outcome.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{outcome.school_level}</Badge>
                              <Badge variant="outline" className="text-xs">{getTopicName(outcome.topic_id)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {safeRelations.part_of.length > 0 && (
                  <Card>
                    <CardHeader className="bg-indigo-50">
                      <CardTitle className="flex items-center gap-2 text-indigo-900">
                        <Network className="w-5 h-5" />
                        Osa järgmistest
                      </CardTitle>
                      <p className="text-sm text-indigo-700 mt-1">
                        Valitud õpiväljund on osa nendest suurematest õpiväljunditest
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.part_of.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer"
                            onClick={() => handleOutcomeClick(outcome)}
                          >
                            <p className="text-sm font-medium text-slate-900 mb-2">
                              {outcome.text_et || outcome.text}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">{outcome.school_level}</Badge>
                              <Badge variant="outline" className="text-xs">{getTopicName(outcome.topic_id)}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {safeRelations.expects.length === 0 && 
                 safeRelations.consists_of.length === 0 && 
                 safeRelations.expected_by.length === 0 && 
                 safeRelations.part_of.length === 0 && (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center text-slate-500">
                        <Info className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                        <p>Sellel õpiväljundil pole seoseid teiste õpiväljunditega</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-20">
                  <div className="text-center text-slate-500">
                    <Network className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Vali õpiväljund</h3>
                    <p className="text-sm">Vali vasakult õpiväljund, et näha selle seoseid teiste õpiväljunditega</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
