
import { useState, useMemo, useEffect, type FormEvent } from "react";
import { curriculum, type Subject, type Topic as TopicEntity } from "@/api/curriculumClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookMarked, Filter, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type TopicFormData = {
  name: string;
  name_et: string;
  description: string;
  subject_id: string;
  uri: string;
  order_index: number;
  status: "draft" | "published";
};

const PAGE_SIZE = 20;

const nativeSelectClass =
  "col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-9 pl-3 text-sm text-slate-900 outline outline-1 -outline-offset-1 outline-slate-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const chevronClass =
  "pointer-events-none col-start-1 row-start-1 mr-3 size-4 self-center justify-self-end text-slate-500";

export default function Topics() {
  const [open, setOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicEntity | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState<TopicFormData>({
    name: "",
    name_et: "",
    description: "",
    subject_id: "",
    uri: "",
    order_index: 0,
    status: "draft",
  });

  const queryClient = useQueryClient();

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculum.entities.Subject.list(),
  });

  const { data: topics = [], isLoading } = useQuery<TopicEntity[]>({
    queryKey: ["topics"],
    queryFn: () => curriculum.entities.Topic.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data: TopicFormData) => curriculum.entities.Topic.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TopicFormData }) =>
      curriculum.entities.Topic.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => curriculum.entities.Topic.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      name_et: "",
      description: "",
      subject_id: "",
      uri: "",
      order_index: 0,
      status: "draft",
    });
    setEditingTopic(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editingTopic) {
      void updateMutation.mutate({ id: editingTopic.id, data: formData });
    } else {
      void createMutation.mutate(formData);
    }
  };

  const handleEdit = (topic: TopicEntity) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name || "",
      name_et: topic.name_et || "",
      description: topic.description || "",
      subject_id: topic.subject_id || "",
      uri: topic.uri || "",
      order_index: topic.order_index || 0,
      status: (topic.status as TopicFormData["status"]) || "draft",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this topic?")) {
      void deleteMutation.mutate(id);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((item) => item.id === subjectId);
    return subject ? subject.name_et || subject.name : "Unknown subject";
  };

  const filteredTopics = useMemo(
    () =>
      (filterSubject === "all"
        ? topics
        : topics.filter((topic) => topic.subject_id === filterSubject)),
    [topics, filterSubject],
  );

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredTopics.length / PAGE_SIZE));
    if (page > total) {
      setPage(total);
    }
  }, [filteredTopics.length, page]);

  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTopics = useMemo(
    () => filteredTopics.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredTopics, currentPage],
  );
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const startItem = filteredTopics.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + PAGE_SIZE, filteredTopics.length);

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleSubjectFilterChange = (value: string) => {
    setFilterSubject(value);
    setPage(1);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Topics</h1>
            <p className="text-slate-600 mt-1">Manage curriculum topics within each subject</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Topic
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTopic ? "Edit Topic" : "Add Topic"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 m-6">
                <div className="space-y-2">
                  <Label htmlFor="subject_id">Subject *</Label>
                  <div className="mt-2 grid grid-cols-1">
                    <select
                      id="subject_id"
                      value={formData.subject_id}
                      onChange={(event) =>
                        setFormData({ ...formData, subject_id: event.target.value })
                      }
                      required
                      className={nativeSelectClass}
                    >
                      <option value="">Select subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name_et || subject.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className={chevronClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name (English) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Algebra"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_et">Name (Estonian)</Label>
                    <Input
                      id="name_et"
                      value={formData.name_et}
                      onChange={(e) => setFormData({ ...formData, name_et: e.target.value })}
                      placeholder="e.g. Algebra"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Topic description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
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
                            status: event.target.value as TopicFormData["status"],
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
                <div className="space-y-2">
                  <Label htmlFor="uri">RDF URI</Label>
                  <Input
                    id="uri"
                    value={formData.uri}
                    onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                    placeholder="e.g. https://oppekava.edu.ee/topics/algebra"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editingTopic ? "Update" : "Create"} topic
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
                <BookMarked className="w-5 h-5 text-indigo-600" />
                All Topics
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <div className="grid grid-cols-1 w-48">
                  <select
                    value={filterSubject}
                    onChange={(event) => handleSubjectFilterChange(event.target.value)}
                    className={nativeSelectClass}
                  >
                    <option value="all">All subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name_et || subject.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className={chevronClass} />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Loading topics...</p>
            ) : filteredTopics.length === 0 ? (
              <p className="text-center py-8 text-slate-500">No topics yet. Create the first topic!</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTopics.map((topic) => {
                      const topicTitle = topic.name_et || topic.name || "Untitled topic";
                      return (
                        <TableRow key={topic.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900">{topicTitle}</p>
                              {topic.name_et && topic.name && topic.name !== topic.name_et && (
                                <p className="text-sm text-slate-500">{topic.name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {getSubjectName(topic.subject_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>{topic.order_index ?? 0}</TableCell>
                          <TableCell>
                            <Badge variant={topic.status === "published" ? "default" : "secondary"}>
                              {topic.status === "published" ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(topic)}
                                aria-label={`Edit topic ${topicTitle}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(topic.id)}
                                aria-label={`Delete topic ${topicTitle}`}
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
                    Showing {startItem}-{endItem} of {filteredTopics.length} topics
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
                      disabled={currentPage === totalPages || filteredTopics.length === 0}
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
