import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { curriculum, type Subject, type Topic, type LearningOutcome, type SkillBit } from "@/api/curriculumClient";
import { buildTopicTreeBySubject, type TopicTreeNode } from "@/lib/topicHierarchy";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, BookOpen, BookMarked, Target, ExternalLink } from "lucide-react";
import { SkillBitManagerDialog } from "@/components/skillbits/SkillBitManagerDialog";

type ExpandedState = Record<string, boolean>;

export default function Browse() {
  const navigate = useNavigate();
  const [expandedSubjects, setExpandedSubjects] = useState<ExpandedState>({});
  const [expandedTopics, setExpandedTopics] = useState<ExpandedState>({});
  const [skillBitOutcome, setSkillBitOutcome] = useState<LearningOutcome | null>(null);

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

  const { data: skillBits = [] } = useQuery<SkillBit[]>({
    queryKey: ["skillbits"],
    queryFn: () => curriculum.entities.SkillBit.list(),
  });

  const skillBitsByOutcome = useMemo(() => {
    const map: Record<string, SkillBit[]> = {};
    skillBits.forEach((skill) => {
      if (!map[skill.outcome_id]) {
        map[skill.outcome_id] = [];
      }
      map[skill.outcome_id].push(skill);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => {
        const aOrder = a.manual_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.manual_order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.created_at - a.created_at;
      }),
    );
    return map;
  }, [skillBits]);

  const topicTreesBySubject = useMemo(() => buildTopicTreeBySubject(topics), [topics]);

  const topicCountBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    topics.forEach((topic) => {
      counts[topic.subject_id] = (counts[topic.subject_id] ?? 0) + 1;
    });
    return counts;
  }, [topics]);

  const outcomesByTopic = useMemo(() => {
    const map: Record<string, LearningOutcome[]> = {};
    outcomes.forEach((outcome) => {
      if (!map[outcome.topic_id]) {
        map[outcome.topic_id] = [];
      }
      map[outcome.topic_id].push(outcome);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => {
        const aOrder = a.order_index ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order_index ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.created_at - a.created_at;
      }),
    );
    return map;
  }, [outcomes]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const getOutcomesForTopic = (topicId: string) => {
    return outcomesByTopic[topicId] ?? [];
  };

  const openRelationsForOutcome = (outcomeId: string) => {
    navigate(`/relations?outcome=${outcomeId}`);
  };

  const TopicCard = ({ node, depth = 0 }: { node: TopicTreeNode; depth?: number }) => {
    const topic = node.topic;
    const isTopicExpanded = expandedTopics[topic.id];
    const topicOutcomes = getOutcomesForTopic(topic.id);
    const childNodes = node.children;
    return (
      <div style={{ marginLeft: depth ? depth * 16 : 0 }}>
        <Card className="border-indigo-200 bg-white">
          <div
            className="p-4 cursor-pointer hover:bg-indigo-50/50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleTopic(topic.id);
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <BookMarked className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-slate-900">{topic.name}</h4>
                    {depth > 0 ? (
                      <Badge variant="outline" className="text-[10px] uppercase border-indigo-200 text-indigo-600 bg-indigo-50/60">
                        Subtopic
                      </Badge>
                    ) : null}
                  </div>
                  {topic.name_et && (
                    <p className="text-xs text-slate-500 mt-0.5">{topic.name_et}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {topicOutcomes.length} outcomes
                  </Badge>
                  {isTopicExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {isTopicExpanded && (
            <div className="border-t border-indigo-100 bg-purple-50/30 p-4 space-y-4">
              {topicOutcomes.length > 0 ? (
                <div className="space-y-2">
                  {topicOutcomes.map((outcome) => {
                    const skills = skillBitsByOutcome[outcome.id] ?? [];
                    return (
                      <div
                        key={outcome.id}
                        role="button"
                        tabIndex={0}
                        className="p-3 bg-white border border-purple-200 rounded-lg cursor-pointer transition-all hover:border-purple-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                        onClick={() => openRelationsForOutcome(outcome.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openRelationsForOutcome(outcome.id);
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                            <Target className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{outcome.text_et || outcome.text || "Learning outcome"}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{outcome.school_level || "Level TBD"}</p>
                            {outcome.uri && (
                              <a
                                href={outcome.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                                View RDF URI
                              </a>
                            )}
                            {skills.length > 0 ? (
                              <div className="mt-3 rounded-md border border-purple-100 bg-purple-50/50 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Skill-bits
                                </p>
                                <ul className="mt-2 space-y-1">
                                  {skills.map((skill) => (
                                    <li key={skill.id} className="flex items-center gap-2 text-xs text-slate-700">
                                      <span className="font-mono text-[11px] text-slate-400">
                                        {skill.manual_order ?? "•"}.
                                      </span>
                                      <span className="flex-1">{skill.label}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="mt-3 text-xs text-slate-500">No skill-bits yet.</p>
                            )}
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSkillBitOutcome(outcome);
                                }}
                              >
                                Manage skill-bits
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 text-sm py-4">No learning outcomes yet</p>
              )}

              {childNodes.length > 0 ? (
                <div className="space-y-3">
                  {childNodes.map((child) => (
                    <TopicCard key={child.topic.id} node={child} depth={(depth ?? 0) + 1} />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Browse Curriculum</h1>
          <p className="text-slate-600">Hierarchical view of subjects, topics, and learning outcomes</p>
        </div>

        <div className="space-y-4">
          {subjects.map((subject) => {
            const isExpanded = expandedSubjects[subject.id];
            const subjectTopics = topicTreesBySubject[subject.id] ?? [];
            const topicCount = topicCountBySubject[subject.id] ?? 0;

            return (
              <Card key={subject.id} className="border-slate-200 bg-white overflow-hidden">
                <div 
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-900">{subject.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">ID: {subject.id}</p>
                        {subject.description && (
                          <p className="text-sm text-slate-600 mt-2">{subject.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50">
                    {topicCount > 0 ? (
                      <div className="p-4 space-y-3">
                        {subjectTopics.map((node) => (
                          <TopicCard key={node.topic.id} node={node} depth={0} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-slate-500 text-sm py-6">No topics yet</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
          {subjects.length === 0 && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12">
                <p className="text-center text-slate-500">No curriculum data yet. Start by adding subjects!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <SkillBitManagerDialog
        outcome={skillBitOutcome}
        open={Boolean(skillBitOutcome)}
        onOpenChange={(open) => {
          if (!open) {
            setSkillBitOutcome(null);
          }
        }}
      />
    </div>
  );
}
