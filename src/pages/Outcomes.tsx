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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Target, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type OutcomeFormData = {
  text_et: string;
  topic_id: string;
  school_level: string;
  class: string;
  order_index: number;
  status: "draft" | "published";
};

const PAGE_SIZE = 20;

export default function Outcomes() {
  const [open, setOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<OutcomeEntity | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [page, setPage] = useState(1);
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic_id">Topic *</Label>
                  <Select 
                    value={formData.topic_id} 
                    onValueChange={(value) => setFormData({ ...formData, topic_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => {
                        const subject = getSubjectForTopic(topic.id);
                        return (
                          <SelectItem key={topic.id} value={topic.id}>
                            {subject ? `${subject.name} -> ${topic.name}` : topic.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
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
                    <Select 
                      value={formData.school_level} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, school_level: value, class: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">Stage I (grades 1-3)</SelectItem>
                        <SelectItem value="II">Stage II (grades 4-6)</SelectItem>
                        <SelectItem value="III">Stage III (grades 7-9)</SelectItem>
                        <SelectItem value="Gymnasium">Upper secondary (grades 10-12)</SelectItem>
                        <SelectItem value="University">University</SelectItem>
                        <SelectItem value="All">All levels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Grade</Label>
                    <Select 
                      value={formData.class}
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
                      disabled={formData.school_level === "All"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {getClassOptions(formData.school_level).map((cls) => (
                          <SelectItem key={cls} value={cls}>Grade {cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as OutcomeFormData["status"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                All Learning Outcomes
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={filterTopic} onValueChange={handleTopicFilterChange}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All topics</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterLevel} onValueChange={handleLevelFilterChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="School level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All levels</SelectItem>
                    <SelectItem value="I">Stage I</SelectItem>
                    <SelectItem value="II">Stage II</SelectItem>
                    <SelectItem value="III">Stage III</SelectItem>
                    <SelectItem value="Gymnasium">Upper secondary</SelectItem>
                    <SelectItem value="University">University</SelectItem>
                  </SelectContent>
                </Select>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOutcomes.map((outcome) => {
                      const outcomeLabel = outcome.text_et || outcome.text || "Untitled learning outcome";
                      return (
                        <TableRow key={outcome.id}>
                          <TableCell>
                            <p className="text-sm text-slate-900 line-clamp-2">{outcomeLabel}</p>
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
                            <Badge variant={outcome.status === "published" ? "default" : "secondary"}>
                              {outcome.status === "published" ? "Published" : "Draft"}
                            </Badge>
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
    </div>
  );
}
