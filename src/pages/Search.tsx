import { useMemo, useState } from "react";
import {
  base44,
  type Subject,
  type Topic,
  type LearningOutcome,
} from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, BookOpen, BookMarked, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SearchFilterType = "all" | "subjects" | "topics" | "outcomes";
type SearchFilterLevel = "all" | "I" | "II" | "III" | "Gymnasium" | "University";

type BaseResult = {
  id: string;
  title: string;
  title_et?: string;
  description?: string;
  status?: string;
  uri?: string;
  subject_name?: string;
  topic_name?: string;
  school_level?: string;
};

type SubjectResult = BaseResult & {
  type: "subject";
};

type TopicResult = BaseResult & {
  type: "topic";
  subject_name: string;
};

type OutcomeResult = BaseResult & {
  type: "outcome";
  topic_name: string;
  school_level?: string;
};

type SearchResult = SubjectResult | TopicResult | OutcomeResult;

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<SearchFilterType>("all");
  const [filterLevel, setFilterLevel] = useState<SearchFilterLevel>("all");

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

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((item) => item.id === subjectId);
    return subject ? subject.name : "Unknown";
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    return topic ? topic.name : "Unknown";
  };

  const results = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [] as SearchResult[];

    const matches: SearchResult[] = [];

    // Search subjects
    if (filterType === "all" || filterType === "subjects") {
      subjects.forEach((subject) => {
        if (
          subject.name?.toLowerCase().includes(query) ||
          subject.name_et?.toLowerCase().includes(query) ||
          subject.description?.toLowerCase().includes(query) ||
          subject.code?.toLowerCase().includes(query)
        ) {
          matches.push({
            type: "subject",
            id: subject.id,
            title: subject.name,
            title_et: subject.name_et,
            description: subject.description,
            status: subject.status,
            uri: subject.uri,
          });
        }
      });
    }

    // Search topics
    if (filterType === "all" || filterType === "topics") {
      topics.forEach((topic) => {
        if (
          topic.name?.toLowerCase().includes(query) ||
          topic.name_et?.toLowerCase().includes(query) ||
          topic.description?.toLowerCase().includes(query)
        ) {
          matches.push({
            type: "topic",
            id: topic.id,
            title: topic.name,
            title_et: topic.name_et,
            description: topic.description,
            status: topic.status,
            uri: topic.uri,
            subject_name: getSubjectName(topic.subject_id),
          });
        }
      });
    }

    // Search learning outcomes
    if (filterType === "all" || filterType === "outcomes") {
      outcomes.forEach((outcome) => {
        const levelMatch = filterLevel === "all" || outcome.school_level === filterLevel;
        if (
          levelMatch &&
          (outcome.text?.toLowerCase().includes(query) ||
            outcome.text_et?.toLowerCase().includes(query))
        ) {
          const outcomeTitle = outcome.text || outcome.text_et || "Unnamed outcome";
          matches.push({
            type: "outcome",
            id: outcome.id,
            title: outcomeTitle,
            title_et: outcome.text_et,
            status: outcome.status,
            uri: outcome.uri,
            school_level: outcome.school_level,
            topic_name: getTopicName(outcome.topic_id),
          });
        }
      });
    }

    return matches;
  }, [filterLevel, filterType, outcomes, searchQuery, subjects, topics]);

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "subject":
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case "topic":
        return <BookMarked className="w-5 h-5 text-indigo-600" />;
      case "outcome":
        return <Target className="w-5 h-5 text-purple-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "subject":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "topic":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "outcome":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-indigo-50/30 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Search Curriculum</h1>
          <p className="text-slate-600">Find subjects, topics, and learning outcomes</p>
        </div>

        <Card className="border-slate-200 bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  className="pl-11 h-12 text-lg"
                  placeholder="Search by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as SearchFilterType)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subjects">Subjects</SelectItem>
                    <SelectItem value="topics">Topics</SelectItem>
                    <SelectItem value="outcomes">Learning Outcomes</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterLevel}
                  onValueChange={(value) => setFilterLevel(value as SearchFilterLevel)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="School level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="I">Level I (1-3)</SelectItem>
                    <SelectItem value="II">Level II (4-6)</SelectItem>
                    <SelectItem value="III">Level III (7-9)</SelectItem>
                    <SelectItem value="Gymnasium">Gymnasium (10-12)</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {searchQuery && results.length > 0 ? (
            <>
              <p className="text-sm text-slate-600">{results.length} result(s) found</p>
              {results.map((result) => (
                <Card key={`${result.type}-${result.id}`} className="border-slate-200 bg-white hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">{getTypeIcon(result.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={getTypeColor(result.type)}>
                                {result.type}
                              </Badge>
                              {result.status === 'published' && (
                                <Badge variant="default" className="bg-green-600">Published</Badge>
                              )}
                              {result.school_level && (
                                <Badge variant="secondary">{result.school_level}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-lg">{result.title}</h3>
                            {result.title_et && (
                              <p className="text-sm text-slate-500 mt-1">{result.title_et}</p>
                            )}
                            {result.description && (
                              <p className="text-sm text-slate-600 mt-2">{result.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-3">
                              {result.subject_name && (
                                <span className="text-xs text-slate-500">
                                  Subject: <span className="font-medium">{result.subject_name}</span>
                                </span>
                              )}
                              {result.topic_name && (
                                <span className="text-xs text-slate-500">
                                  Topic: <span className="font-medium">{result.topic_name}</span>
                                </span>
                              )}
                            </div>
                            {result.uri && (
                              <a 
                                href={result.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                              >
                                {result.uri}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : searchQuery ? (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12">
                <p className="text-center text-slate-500">No results found for "{searchQuery}"</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 bg-white">
              <CardContent className="py-12">
                <p className="text-center text-slate-500">Start typing to search the curriculum...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
