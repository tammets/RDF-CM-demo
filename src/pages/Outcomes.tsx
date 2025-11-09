import { useState, useMemo, useEffect, type FormEvent } from "react";
import {
  curriculum,
  type LearningOutcome as OutcomeEntity,
  type Subject,
  type Topic,
} from "@/api/curriculumClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Target, Filter, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SkillBitManagerDialog } from "@/components/skillbits/SkillBitManagerDialog";

type OutcomeFormData = {
  text_et: string;
  topic_id: string;
  school_level: string;
  class: string;
  order_index: number;
  status: "draft" | "published";
};

const PAGE_SIZE = 20;

const nativeSelectClass =
  "col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-9 pl-3 text-sm text-slate-900 outline outline-1 -outline-offset-1 outline-slate-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const chevronClass =
  "pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-slate-500";

export default function Outcomes() {
  const [open, setOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<OutcomeEntity | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [skillBitOutcome, setSkillBitOutcome] = useState<OutcomeEntity | null>(null);
  const [formData, setFormData] = useState<OutcomeFormData>({
    text_et: "",
    topic_id: "",
    school_level: "III",
    class: "",
    order_index: 0,
    status: "draft",
  });

  const queryClient = useQueryClient();

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => curriculum.entities.Topic.list(),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculum.entities.Subject.list(),
  });

  const { data: outcomes = [], isLoading } = useQuery<OutcomeEntity[]>({
    queryKey: ["outcomes"],
    queryFn: () => curriculum.entities.LearningOutcome.list("-created_date"),
  });

  const { data: skillBitCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["skillbit-counts"],
    queryFn: () => curriculum.skillBits.countByOutcome(),
  });

  const createMutation = useMutation({
    mutationFn: (data: OutcomeFormData & { uri: string }) =>
      curriculum.entities.LearningOutcome.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OutcomeFormData & { uri: string } }) =>
      curriculum.entities.LearningOutcome.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => curriculum.entities.LearningOutcome.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outcomes"] });
    },
  });

  const resetForm = () => {
    setFormData({
      text_et: "",
      topic_id: "",
      school_level: "III",
      class: "",
      order_index: 0,
      status: "draft",
    });
    setEditingOutcome(null);
  };

  const generateUri = (text: string) => {
    const slug = text
      .toLowerCase()
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/õ/g, "o")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
    return `/outcomes/${slug || "outcome"}`;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dataToSave: OutcomeFormData & { uri: string } = {
      ...formData,
      uri: editingOutcome?.uri || generateUri(formData.text_et),
    };
    
    if (editingOutcome) {
      void updateMutation.mutate({ id: editingOutcome.id, data: dataToSave });
    } else {
      void createMutation.mutate(dataToSave);
    }
  };

  const handleEdit = (outcome: OutcomeEntity) => {
    setEditingOutcome(outcome);
    setFormData({
      text_et: outcome.text_et || "",
      topic_id: outcome.topic_id || "",
      school_level: outcome.school_level || "III",
      class: outcome.class || "",
      order_index: outcome.order_index || 0,
      status: (outcome.status as OutcomeFormData["status"]) || "draft",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this learning outcome?")) {
      void deleteMutation.mutate(id);
    }
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    return topic ? topic.name : "Unknown topic";
  };

  const getSubjectForTopic = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    if (!topic) return null;
    return subjects.find((subject) => subject.id === topic.subject_id) ?? null;
  };

  const getClassOptions = (schoolLevel: string) => {
    switch (schoolLevel) {
      case "I":
        return ["1", "2", "3"];
      case "II":
        return ["4", "5", "6"];
      case "III":
        return ["7", "8", "9"];
      case "Gymnasium":
        return ["10", "11", "12"];
      case "University":
        return ["1", "2", "3", "4", "5"];
      case "All":
        return [];
      default: return [];
    }
  };

  const classOptions = useMemo(() => getClassOptions(formData.school_level), [formData.school_level]);

  const filteredOutcomes = useMemo(
    () =>
      outcomes.filter((outcome) => {
        const topicMatch = filterTopic === "all" || outcome.topic_id === filterTopic;
        const levelMatch = filterLevel === "all" || outcome.school_level === filterLevel;
        return topicMatch && levelMatch;
      }),
    [outcomes, filterTopic, filterLevel],
  );

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(filteredOutcomes.length / PAGE_SIZE));
    if (page > nextTotalPages) {
      setPage(nextTotalPages);
    }
  }, [filteredOutcomes.length, page]);

  const totalPages = Math.max(1, Math.ceil(filteredOutcomes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedOutcomes = useMemo(
    () => filteredOutcomes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredOutcomes, currentPage],
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const startItem = filteredOutcomes.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + PAGE_SIZE, filteredOutcomes.length);

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleTopicFilterChange = (value: string) => {
    setFilterTopic(value);
    setPage(1);
  };

  const handleLevelFilterChange = (value: string) => {
    setFilterLevel(value);
    setPage(1);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Learning Outcomes</h1>
            <p className="text-slate-600 mt-1">Manage specific learning outcomes within each topic</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Learning Outcome
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOutcome ? "Edit Learning Outcome" : "Add Learning Outcome"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 m-6">
                <div className="space-y-2">
                  <Label htmlFor="topic_id">Topic *</Label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="topic_id"
                      value={formData.topic_id}
                      onChange={(event) =>
                        setFormData({ ...formData, topic_id: event.target.value })
                      }
                      required
                      className={nativeSelectClass}
                    >
                      <option value="">Select topic</option>
                      {topics.map((topic) => {
                        const subject = getSubjectForTopic(topic.id);
                        const label = subject ? `${subject.title} -> ${topic.name}` : topic.name;
                        return (
                          <option key={topic.id} value={topic.id}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown aria-hidden="true" className={chevronClass} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text_et">Learning outcome text *</Label>
                  <Textarea
                    id="text_et"
                    value={formData.text_et}
                    onChange={(e) => setFormData({ ...formData, text_et: e.target.value })}
                    placeholder="e.g. Simplifies algebraic fractions and applies the results in problem solving"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_level">School level *</Label>
                    <div className="mt-2 grid grid-cols-1">
                      <select
                        id="school_level"
                        value={formData.school_level}
                        onChange={(event) => {
                          setFormData({ ...formData, school_level: event.target.value, class: "" });
                        }}
                        className={nativeSelectClass}
                      >
                        <option value="I">I kooliaste (1.-3. klass)</option>
                        <option value="II">II kooliaste (4.-6. klass)</option>
                        <option value="III">III kooliaste (7.-9. klass)</option>
                        <option value="Gymnasium">Gümnaasium (10.-12. klass)</option>
                        <option value="University">Ülikool</option>
                        <option value="All">All levels</option>
                      </select>
                      <ChevronDown aria-hidden="true" className={chevronClass} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Grade</Label>
                    <div className="mt-2 grid grid-cols-1">
                      <select
                        id="class"
                        value={formData.class}
                        onChange={(event) => setFormData({ ...formData, class: event.target.value })}
                        disabled={formData.school_level === "All" || classOptions.length === 0}
                        className={nativeSelectClass}
                      >
                        <option value="">
                          {formData.school_level === "All" ? "All grades" : "Select grade"}
                        </option>
                        {classOptions.map((cls) => (
                          <option key={cls} value={cls}>
                            Grade {cls}
                          </option>
                        ))}
                      </select>
                      <ChevronDown aria-hidden="true" className={chevronClass} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_index">Display order</Label>
                    <Input
                      id="order_index"
                      type="number"
                      value={formData.order_index}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setFormData({
                          ...formData,
                          order_index: Number.isNaN(value) ? 0 : value,
                        });
                      }}
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
                            status: event.target.value as OutcomeFormData["status"],
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
                </div>
                {editingOutcome && (
                  <div className="space-y-2">
                    <Label>RDF URI</Label>
                    <Input
                      value={editingOutcome.uri || ""}
                      disabled
                      className="bg-slate-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500">The URI is generated automatically and cannot be changed.</p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingOutcome ? "Update" : "Create"} learning outcome
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-slate-200">
          <CardHeader className="mb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                All Learning Outcomes
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <div className="grid grid-cols-1 w-48">
                    <select
                      value={filterTopic}
                      onChange={(event) => handleTopicFilterChange(event.target.value)}
                      className={nativeSelectClass}
                    >
                      <option value="all">All topics</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className={chevronClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 w-40">
                  <select
                    value={filterLevel}
                    onChange={(event) => handleLevelFilterChange(event.target.value)}
                    className={nativeSelectClass}
                  >
                    <option value="all">All levels</option>
                    <option value="I">I kooliaste</option>
                    <option value="II">II kooliaste</option>
                    <option value="III">III kooliaste</option>
                    <option value="Gymnasium">Gümnaasium</option>
                    <option value="University">Ülikool</option>
                  </select>
                  <ChevronDown aria-hidden="true" className={chevronClass} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Loading learning outcomes...</p>
            ) : filteredOutcomes.length === 0 ? (
              <p className="text-center py-8 text-slate-500">
                No learning outcomes yet. Create the first one!
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Learning Outcome</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>School Level</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Skill-bits</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOutcomes.map((outcome) => {
                      const outcomeLabel = outcome.text_et || outcome.text || "Untitled learning outcome";
                      const isPublished = outcome.status === "published";
                      return (
                        <TableRow key={outcome.id}>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 line-clamp-2">{outcomeLabel}</p>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <span
                                    className={`inline-flex h-2.5 w-2.5 items-center justify-center rounded-full ${
                                      isPublished ? "bg-emerald-500/30" : "bg-amber-400/30"
                                    }`}
                                    aria-label={isPublished ? "Published" : "Draft"}
                                  >
                                    <span
                                      className={`inline-flex h-1.5 w-1.5 rounded-full ${
                                        isPublished ? "bg-emerald-600" : "bg-amber-500"
                                      }`}
                                    />
                                  </span>
                                  <span>{isPublished ? "Published" : "Draft"}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              {getTopicName(outcome.topic_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{outcome.school_level}</Badge>
                          </TableCell>
                          <TableCell>
                            {outcome.class ? (
                              <span className="text-sm text-slate-600">Grade {outcome.class}</span>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start gap-1">
                              <Badge variant="outline">{skillBitCounts[outcome.id] ?? 0} items</Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSkillBitOutcome(outcome)}
                              >
                                Manage
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(outcome)}
                                aria-label={`Edit learning outcome ${outcomeLabel}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(outcome.id)}
                                aria-label={`Delete learning outcome ${outcomeLabel}`}
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
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Showing {startItem}-{endItem} of {filteredOutcomes.length} outcomes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || filteredOutcomes.length === 0}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
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
