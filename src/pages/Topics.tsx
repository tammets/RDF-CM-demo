
import { useState, type FormEvent } from "react";
import { curriculum, type Subject, type Topic as TopicEntity } from "@/api/curriculumClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookMarked, Filter } from "lucide-react";
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

export default function Topics() {
  const [open, setOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicEntity | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>("all");
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
    if (window.confirm("Kas oled kindel, et soovid selle teema kustutada?")) {
      void deleteMutation.mutate(id);
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((item) => item.id === subjectId);
    return subject ? subject.name_et || subject.name : "Teadmata";
  };

  const filteredTopics =
    filterSubject === "all" ? topics : topics.filter((topic) => topic.subject_id === filterSubject);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Teemad</h1>
            <p className="text-slate-600 mt-1">Halda õppekava teemasid õppeainete sees</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Lisa teema
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTopic ? 'Muuda teemat' : 'Lisa uus teema'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject_id">Õppeaine *</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vali õppeaine" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name_et || subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nimi (inglise keeles) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="nt Algebra"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_et">Nimi (eesti keeles)</Label>
                    <Input
                      id="name_et"
                      value={formData.name_et}
                      onChange={(e) => setFormData({ ...formData, name_et: e.target.value })}
                      placeholder="nt Algebra"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Kirjeldus</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Teema kirjeldus"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_index">Järjekord</Label>
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
                    <Label htmlFor="status">Olek</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as TopicFormData["status"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Mustand</SelectItem>
                        <SelectItem value="published">Avaldatud</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uri">RDF URI</Label>
                  <Input
                    id="uri"
                    value={formData.uri}
                    onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                    placeholder="nt https://oppekava.edu.ee/topics/algebra"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Tühista
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    {editingTopic ? 'Uuenda' : 'Loo'} teema
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
                <BookMarked className="w-5 h-5 text-indigo-600" />
                Kõik teemad
              </CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtreeri õppeaine järgi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kõik õppeained</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name_et || subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Laadimine...</p>
            ) : filteredTopics.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Teemasid pole veel. Lisa esimene teema!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nimi</TableHead>
                    <TableHead>Õppeaine</TableHead>
                    <TableHead>Järjekord</TableHead>
                    <TableHead>Olek</TableHead>
                    <TableHead className="text-right">Tegevused</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{topic.name_et || topic.name}</p>
                          {topic.name_et && topic.name !== topic.name_et && (
                            <p className="text-sm text-slate-500">{topic.name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getSubjectName(topic.subject_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>{topic.order_index || 0}</TableCell>
                      <TableCell>
                        <Badge variant={topic.status === 'published' ? 'default' : 'secondary'}>
                          {topic.status === 'published' ? 'Avaldatud' : 'Mustand'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(topic)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(topic.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
