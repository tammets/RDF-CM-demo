
import { useState, useMemo, type FormEvent } from "react";
import { curriculum, type Subject, type Topic, type LearningOutcome, type SkillBit } from "@/api/curriculumClient";
import { buildTopicTreeBySubject, type TopicTreeNode } from "@/lib/topicHierarchy";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ChevronDown, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SkillBitPanel } from "@/components/skillbits/SkillBitPanel";

type SubjectFormData = {
  title: string;
  description: string;
  uri: string;
  status: "draft" | "published";
};

const nativeSelectClass =
  "col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-9 pl-3 text-sm text-slate-900 outline outline-1 -outline-offset-1 outline-slate-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const chevronClass =
  "pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-slate-500";

export default function Subjects() {
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [detailsSubject, setDetailsSubject] = useState<Subject | null>(null);
  const [focusOutcomeId, setFocusOutcomeId] = useState<string | null>(null);
  const [uriTouched, setUriTouched] = useState(false);
  const [formData, setFormData] = useState<SubjectFormData>({
    title: "",
    description: "",
    uri: "",
    status: "draft",
  });

  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculum.entities.Subject.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) => curriculum.entities.Subject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) =>
      curriculum.entities.Subject.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => curriculum.entities.Subject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => curriculum.entities.Topic.list("order_index"),
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => curriculum.entities.LearningOutcome.list("order_index"),
  });

  const { data: skillBits = [] } = useQuery<SkillBit[]>({
    queryKey: ["skillbits"],
    queryFn: () => curriculum.entities.SkillBit.list(),
  });

  const topicsBySubject = useMemo(() => {
    const map: Record<string, Topic[]> = {};
    topics.forEach((topic) => {
      if (!map[topic.subject_id]) {
        map[topic.subject_id] = [];
      }
      map[topic.subject_id].push(topic);
    });
    return map;
  }, [topics]);

  const topicTreesBySubject = useMemo(() => buildTopicTreeBySubject(topics), [topics]);

  const outcomeCountBySubject = useMemo(() => {
    const topicToSubject = new Map<string, string>();
    topics.forEach((topic) => {
      topicToSubject.set(topic.id, topic.subject_id);
    });
    const counts: Record<string, number> = {};
    outcomes.forEach((outcome) => {
      const subjectId = topicToSubject.get(outcome.topic_id);
      if (!subjectId) return;
      counts[subjectId] = (counts[subjectId] ?? 0) + 1;
    });
    return counts;
  }, [topics, outcomes]);

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

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      uri: "",
      status: "draft",
    });
    setEditingSubject(null);
    setUriTouched(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingSubject) {
      void updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      void createMutation.mutate(formData);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      title: subject.title || "",
      description: subject.description || "",
      uri: subject.uri || "",
      status: (subject.status as SubjectFormData["status"]) || "draft",
    });
    setOpen(true);
    setUriTouched(Boolean(subject.uri));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      void deleteMutation.mutate(id);
    }
  };

  const openStructureDialog = (subject: Subject) => {
    setDetailsSubject(subject);
    setFocusOutcomeId(null);
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/õ/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const maybeUpdateUriFromTitle = (nextTitle: string) => {
    if (uriTouched) return;
    const slug = slugify(nextTitle);
    setFormData((prev) => ({
      ...prev,
      uri: slug ? `/subjects/${slug}` : "",
    }));
  };

  const TopicStructure = ({ node, depth = 0 }: { node: TopicTreeNode; depth?: number }) => {
    const topic = node.topic;
    const topicOutcomes = outcomesByTopic[topic.id] ?? [];
    const childNodes = node.children;
    return (
      <div
        className={`rounded-lg border border-slate-200 bg-slate-50 p-4 ${depth ? "ml-4" : ""}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-900">{topic.name}</h4>
              {depth > 0 ? (
                <Badge variant="outline" className="text-[10px] uppercase border-blue-200 text-blue-700 bg-blue-50/70">
                  Subtopic
                </Badge>
              ) : null}
            </div>
            {topic.description && (
              <p className="text-sm text-slate-600 mt-1">{topic.description}</p>
            )}
          </div>
          <Badge variant="secondary">{topicOutcomes.length} outcomes</Badge>
        </div>
        <div className="mt-4 space-y-3">
          {topicOutcomes.length === 0 ? (
            <p className="text-sm text-slate-500">No learning outcomes under this topic.</p>
          ) : (
            topicOutcomes.map((outcome) => {
              const skills = skillBitsByOutcome[outcome.id] ?? [];
              const isFocused = focusOutcomeId === outcome.id;
              return (
                <div key={outcome.id} className="rounded-md border border-white bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {outcome.text_et || outcome.text || "Learning outcome"}
                      </p>
                      <p className="text-xs text-slate-500">{skills.length} skill-bits</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFocusOutcomeId(isFocused ? null : outcome.id)}
                      >
                        {isFocused ? "Hide editor" : "Quick add"}
                      </Button>
                    </div>
                  </div>
                  {skills.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      {skills.map((skill) => (
                        <li key={skill.id} className="flex items-start gap-2">
                          <span className="text-xs font-mono text-slate-400">
                            {skill.manual_order ?? "•"}.
                          </span>
                          <span>{skill.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No skill-bits yet.</p>
                  )}
                  {isFocused ? (
                    <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
                      <SkillBitPanel outcome={outcome} />
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        {childNodes.length > 0 ? (
          <div className="mt-4 space-y-3 border-l border-dashed border-slate-200 pl-4">
            {childNodes.map((child) => (
              <TopicStructure key={child.topic.id} node={child} depth={(depth ?? 0) + 1} />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <>
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Subjects</h1>
            <p className="text-slate-600 mt-1">Manage curriculum subjects</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit subject" : "Add new subject"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 m-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setFormData({ ...formData, title: nextTitle });
                      maybeUpdateUriFromTitle(nextTitle);
                    }}
                    placeholder="e.g. Mathematics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          status: event.target.value as SubjectFormData["status"],
                        })
                      }
                      className={nativeSelectClass}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                    <ChevronDown aria-hidden="true" className={chevronClass} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Subject description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ID</Label>
                  <Input value={editingSubject?.id ?? "Will be generated"} disabled readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uri">RDF URI</Label>
                    <Input id="uri" value={formData.uri || "Will be generated"} disabled readOnly />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSubject ? "Update" : "Create"} subject
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="mb-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              All subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Loading...</p>
            ) : subjects.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No subjects yet. Create the first subject!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Topics</TableHead>
                    <TableHead>Learning Outcomes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...subjects]
                    .slice()
                    .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
                    .map((subject) => {
                      const subjectTopics = topicsBySubject[subject.id] ?? [];
                      const topicCount = subjectTopics.length;
                      const outcomeCount = outcomeCountBySubject[subject.id] ?? 0;
                      const isPublished = subject.status === "published";
                      return (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="font-medium text-slate-900">{subject.title}</p>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span
                                    className={`inline-flex h-2.5 w-2.5 items-center justify-center rounded-full ${isPublished ? "bg-emerald-500/30" : "bg-amber-400/30"}`}
                                    aria-label={isPublished ? "Published" : "Draft"}
                                  >
                                    <span
                                      className={`inline-flex h-1.5 w-1.5 rounded-full ${isPublished ? "bg-emerald-600" : "bg-amber-500"}`}
                                    />
                                  </span>
                                  <span>{isPublished ? "Published" : "Draft"}</span>
                                </div>
                              </div>
                            <button
                              type="button"
                              className="mt-1 text-xs text-blue-600 hover:underline"
                              onClick={() => openStructureDialog(subject)}
                            >
                              View structure
                            </button>
                            <p className="text-xs text-slate-500 mt-1">ID: {subject.id}</p>
                          </div>
                        </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-slate-50 text-slate-800 border-slate-200">
                              {topicCount} {topicCount === 1 ? "topic" : "topics"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {outcomeCount} {outcomeCount === 1 ? "outcome" : "outcomes"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(subject)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(subject.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
      <Dialog
        open={Boolean(detailsSubject)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDetailsSubject(null);
            setFocusOutcomeId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {detailsSubject ? `Subject structure · ${detailsSubject.title}` : "Subject structure"}
            </DialogTitle>
          </DialogHeader>
          {detailsSubject ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
              {(() => {
                const subjectTree = topicTreesBySubject[detailsSubject.id] ?? [];
                if (subjectTree.length === 0) {
                  return <p className="text-sm text-slate-500">No topics linked to this subject yet.</p>;
                }
                return subjectTree.map((node) => (
                  <TopicStructure key={node.topic.id} node={node} depth={0} />
                ));
              })()}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
