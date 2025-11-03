import { useState } from "react";
import { base44, type Subject, type Topic, type LearningOutcome } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, BookOpen, BookMarked, Target, ExternalLink } from "lucide-react";

type ExpandedState = Record<string, boolean>;

export default function Browse() {
  const [expandedSubjects, setExpandedSubjects] = useState<ExpandedState>({});
  const [expandedTopics, setExpandedTopics] = useState<ExpandedState>({});

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list(),
    initialData: [],
  });

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

  const getTopicsForSubject = (subjectId: string) => {
    return topics
      .filter((topic) => topic.subject_id === subjectId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const getOutcomesForTopic = (topicId: string) => {
    return outcomes
      .filter((outcome) => outcome.topic_id === topicId)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
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
            const subjectTopics = getTopicsForSubject(subject.id);
            
            return (
              <Card key={subject.id} className="border-slate-200 bg-white shadow-md overflow-hidden">
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
                          <h3 className="text-lg font-semibold text-slate-900">{subject.name}</h3>
                          {subject.status === 'published' && (
                            <Badge variant="default" className="bg-green-600">Published</Badge>
                          )}
                          {subject.code && (
                            <Badge variant="outline">{subject.code}</Badge>
                          )}
                        </div>
                        {subject.name_et && (
                          <p className="text-sm text-slate-500 mt-1">{subject.name_et}</p>
                        )}
                        {subject.description && (
                          <p className="text-sm text-slate-600 mt-2">{subject.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {subjectTopics.length} topics
                        </Badge>
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
                    {subjectTopics.length > 0 ? (
                      <div className="p-4 space-y-3">
                        {subjectTopics.map((topic) => {
                          const isTopicExpanded = expandedTopics[topic.id];
                          const topicOutcomes = getOutcomesForTopic(topic.id);
                          
                          return (
                            <Card key={topic.id} className="border-indigo-200 bg-white">
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
                                      <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900">{topic.name}</h4>
                                        {topic.status === 'published' && (
                                          <Badge variant="default" className="bg-green-600 text-xs">Published</Badge>
                                        )}
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
                                <div className="border-t border-indigo-100 bg-purple-50/30 p-4">
                                  {topicOutcomes.length > 0 ? (
                                    <div className="space-y-2">
                                      {topicOutcomes.map((outcome) => (
                                        <div key={outcome.id} className="p-3 bg-white border border-purple-200 rounded-lg">
                                          <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                                              <Target className="w-3 h-3 text-white" />
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm text-slate-900">{outcome.text}</p>
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <Badge variant="secondary" className="text-xs">
                                                    {outcome.school_level}
                                                  </Badge>
                                                  {outcome.status === 'published' && (
                                                    <Badge variant="default" className="bg-green-600 text-xs">
                                                      Published
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                              {outcome.text_et && (
                                                <p className="text-xs text-slate-500 mt-1">{outcome.text_et}</p>
                                              )}
                                              {outcome.uri && (
                                                <a 
                                                  href={outcome.uri} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  <ExternalLink className="w-3 h-3" />
                                                  View RDF URI
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-center text-slate-500 text-sm py-4">No learning outcomes yet</p>
                                  )}
                                </div>
                              )}
                            </Card>
                          );
                        })}
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
    </div>
  );
}
