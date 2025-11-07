
import { useEffect, useMemo, useState } from "react";
import { curriculum, type LearningOutcome, type Topic, type Subject } from "@/api/curriculumClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Target, ArrowRight, Info, ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";

type RelationSummary = {
  expects: LearningOutcome[];
  consists_of: LearningOutcome[];
  expected_by: LearningOutcome[];
  part_of: LearningOutcome[];
};

export default function Relations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOutcome, setSelectedOutcome] = useState<LearningOutcome | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculum.entities.Subject.list(),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => curriculum.entities.Topic.list(),
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => curriculum.entities.LearningOutcome.list(),
  });

  useEffect(() => {
    const outcomeId = searchParams.get("outcome");
    if (!outcomeId) {
      return;
    }
    const outcome = outcomes.find((item) => item.id === outcomeId);
    if (!outcome) {
      return;
    }
    const outcomeTopic = topics.find((item) => item.id === outcome.topic_id);
    if (outcomeTopic) {
      if (filterSubject !== outcomeTopic.subject_id) {
        setFilterSubject(outcomeTopic.subject_id);
      }
      if (filterTopic !== outcome.topic_id) {
        setFilterTopic(outcome.topic_id);
      }
    }
    if (selectedOutcome?.id !== outcome.id) {
      setSelectedOutcome(outcome);
    }
  }, [searchParams, outcomes, topics, selectedOutcome?.id, filterSubject, filterTopic]);

  const getTopicName = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    return topic ? topic.name : "Unknown topic";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((item) => item.id === subjectId);
    return subject ? subject.title : "Unknown subject";
  };

  const getSubjectNameForOutcome = (outcome: LearningOutcome | null) => {
    if (!outcome) {
      return "Unknown subject";
    }
    const topic = topics.find((item) => item.id === outcome.topic_id);
    if (!topic) {
      return "Unknown subject";
    }
    return getSubjectName(topic.subject_id);
  };

  const getOutcomeById = (id: string) => {
    return outcomes.find((outcome) => outcome.id === id) ?? null;
  };

  const sortByOrder = <T extends { order_index?: number }>(items: T[]) =>
    [...items].sort((a, b) => {
      const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
      if (orderA === orderB) {
        return 0;
      }
      return orderA - orderB;
    });

  const filteredTopics = useMemo(() => {
    const relevantTopics =
      filterSubject === "all"
        ? topics
        : topics.filter((topic) => topic.subject_id === filterSubject);
    return sortByOrder(relevantTopics);
  }, [topics, filterSubject]);

  const filteredOutcomes = useMemo(() => {
    return sortByOrder(
      outcomes.filter((outcome) => {
        const outcomeTopic = topics.find((topic) => topic.id === outcome.topic_id);
        if (!outcomeTopic) {
          return filterSubject === "all";
        }
        if (filterSubject !== "all" && outcomeTopic.subject_id !== filterSubject) {
          return false;
        }
        if (filterTopic !== "all" && outcome.topic_id !== filterTopic) {
          return false;
        }
        return true;
      }),
    );
  }, [outcomes, topics, filterSubject, filterTopic]);

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
  const handleSubjectChange = (value: string) => {
    setFilterSubject(value);
    setFilterTopic("all");
    if (selectedOutcome) {
      const outcomeTopic = topics.find((item) => item.id === selectedOutcome.topic_id);
      if (!outcomeTopic || (value !== "all" && outcomeTopic.subject_id !== value)) {
        setSelectedOutcome(null);
        setSearchParams({});
      }
    }
  };

  const handleTopicChange = (value: string) => {
    setFilterTopic(value);
    if (selectedOutcome && value !== "all" && selectedOutcome.topic_id !== value) {
      setSelectedOutcome(null);
      setSearchParams({});
    }
  };

  const handleOutcomeClick = (outcome: LearningOutcome) => {
    const outcomeTopic = topics.find((item) => item.id === outcome.topic_id);
    if (outcomeTopic) {
      if (filterSubject !== outcomeTopic.subject_id) {
        setFilterSubject(outcomeTopic.subject_id);
      }
      if (filterTopic !== outcome.topic_id) {
        setFilterTopic(outcome.topic_id);
      }
    }
    setSelectedOutcome(outcome);
    setSearchParams({ outcome: outcome.id });
  };

  const handleOutcomeSelect = (value: string) => {
    if (!value) {
      setSelectedOutcome(null);
      setSearchParams({});
      return;
    }
    const outcome = outcomes.find((item) => item.id === value);
    if (outcome) {
      handleOutcomeClick(outcome);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-purple-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Learning Outcome Relations</h1>
          <p className="text-slate-600">
            Visualise the relationships between learning outcomes (requires / consists of)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-slate-200/70">
            <CardHeader className="pb-4 border-b border-slate-100/80">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-purple-600" />
                Choose a learning outcome
              </CardTitle>
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="relations-subject"
                    className="block text-xs font-medium text-slate-600"
                  >
                    Subject
                  </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="relations-subject"
                      value={filterSubject}
                      onChange={(event) => handleSubjectChange(event.target.value)}
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-9 pl-3 text-sm text-slate-900 outline outline-1 -outline-offset-1 outline-slate-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="all">All subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="relations-topic"
                    className="block text-xs font-medium text-slate-600"
                  >
                    Topic
                  </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="relations-topic"
                      value={filterTopic}
                      onChange={(event) => handleTopicChange(event.target.value)}
                      disabled={filteredTopics.length === 0}
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-9 pl-3 text-sm text-slate-900 outline outline-1 -outline-offset-1 outline-slate-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="all">All topics</option>
                      {filteredTopics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="relations-outcome"
                    className="block text-xs font-medium text-slate-600"
                  >
                    Learning outcome
                  </label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="relations-outcome"
                      value={selectedOutcome?.id ?? ""}
                      onChange={(event) => handleOutcomeSelect(event.target.value)}
                      disabled={filteredOutcomes.length === 0}
                      className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-9 pl-3 text-sm text-slate-900 outline outline-1 -outline-offset-1 outline-slate-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {filteredOutcomes.length === 0
                          ? "No outcomes available"
                          : "Select a learning outcome"}
                      </option>
                      {filteredOutcomes.map((outcome) => (
                        <option key={outcome.id} value={outcome.id}>
                          {outcome.text_et || outcome.text || "Unnamed outcome"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <div className="space-y-2">
                {filteredOutcomes.length > 0 ? (
                  filteredOutcomes.map((outcome) => {
                    const hasExpects = outcome.expects && outcome.expects.length > 0;
                    const hasConsistsOf = outcome.consists_of && outcome.consists_of.length > 0;
                    const isExpectedBy = outcomes.some(o => o.expects && o.expects.includes(outcome.id));
                    const isPartOf = outcomes.some(o => o.consists_of && o.consists_of.includes(outcome.id));
                    
                    return (
                      <div
                        key={outcome.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedOutcome?.id === outcome.id
                            ? 'border-purple-300 bg-purple-50/60'
                            : 'border-slate-200/70 hover:border-purple-300 hover:bg-slate-50'
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
                              Requires
                            </Badge>
                          )}
                          {(hasConsistsOf || isPartOf) && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Includes parts
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Info className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm">No learning outcomes match the current filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            {selectedOutcome ? (
              <>
                <Card className="border border-purple-200 bg-white/90">
                  <CardHeader className="bg-purple-50/80 pb-4 border-b border-purple-100/80">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Selected learning outcome
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 min-h-[150px]">
                    <div className="space-y-3">
                      <p className="text-lg font-medium text-slate-900">
                        {selectedOutcome.text_et || selectedOutcome.text}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-slate-100 text-slate-700">
                          {getSubjectNameForOutcome(selectedOutcome)}
                        </Badge>
                        <Badge className="bg-purple-600">{selectedOutcome.school_level}</Badge>
                        <Badge variant="outline">{getTopicName(selectedOutcome.topic_id)}</Badge>
                        {selectedOutcome.grade_range && (
                          <Badge variant="secondary">Grade {selectedOutcome.grade_range}</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {safeRelations.expects.length > 0 && (
                  <Card className="border-blue-200/70">
                    <CardHeader className="bg-blue-50/70 pb-4 border-b border-blue-200/70">
                      <CardTitle className="flex items-center gap-2 text-blue-900">
                        <ArrowRight className="w-5 h-5" />
                        Requires (prerequisites)
                      </CardTitle>
                      <p className="text-sm text-blue-700 mt-1">
                        These learning outcomes should be completed before the selected outcome.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.expects.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-blue-200/70 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer"
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
                  <Card className="border-green-200/70">
                    <CardHeader className="bg-green-50/70 pb-4 border-b border-green-200/70">
                      <CardTitle className="flex items-center gap-2 text-green-900">
                        <Network className="w-5 h-5" />
                        Consists of (components)
                      </CardTitle>
                      <p className="text-sm text-green-700 mt-1">
                        The selected outcome is built from these smaller learning outcomes.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.consists_of.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-green-200/70 rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors cursor-pointer"
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
                  <Card className="border-amber-200/70">
                    <CardHeader className="bg-amber-50/70 pb-4 border-b border-amber-200/70">
                      <CardTitle className="flex items-center gap-2 text-amber-900">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                        Required by
                      </CardTitle>
                      <p className="text-sm text-amber-700 mt-1">
                        These learning outcomes treat the selected one as a prerequisite.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.expected_by.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-amber-200/70 rounded-lg bg-amber-50/50 hover:bg-amber-50 transition-colors cursor-pointer"
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
                  <Card className="border-indigo-200/70">
                    <CardHeader className="bg-indigo-50/70 pb-4 border-b border-indigo-200/70">
                      <CardTitle className="flex items-center gap-2 text-indigo-900">
                        <Network className="w-5 h-5" />
                        Part of
                      </CardTitle>
                      <p className="text-sm text-indigo-700 mt-1">
                        The selected outcome is included inside these broader outcomes.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {safeRelations.part_of.map((outcome) => (
                          <div
                            key={outcome.id}
                            className="p-4 border border-indigo-200/70 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 transition-colors cursor-pointer"
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
                        <p>This learning outcome does not have connections to others yet.</p>
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
                    <h3 className="text-lg font-medium text-slate-700 mb-2">Select a learning outcome</h3>
                    <p className="text-sm">Choose an outcome from the list to explore its relations with other outcomes.</p>
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
