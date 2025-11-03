import { useState, type FormEvent } from "react";
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

export default function Outcomes() {
  const [open, setOpen] = useState(false);
  const [editingOutcome, setEditingOutcome] = useState<OutcomeEntity | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
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
    if (window.confirm("Kas oled kindel, et soovid selle õpiväljundi kustutada?")) {
      void deleteMutation.mutate(id);
    }
  };

  const getTopicName = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    return topic ? topic.name : "Teadmata";
  };

  const getSubjectForTopic = (topicId: string) => {
    const topic = topics.find((item) => item.id === topicId);
    if (!topic) return null;
    return subjects.find((subject) => subject.id === topic.subject_id) ?? null;
  };

  const filteredOutcomes = outcomes.filter((outcome) => {
    const topicMatch = filterTopic === "all" || outcome.topic_id === filterTopic;
    const levelMatch = filterLevel === "all" || outcome.school_level === filterLevel;
    return topicMatch && levelMatch;
  });

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

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Õpiväljundid</h1>
            <p className="text-slate-600 mt-1">Halda konkreetseid õpiväljundeid teemade sees</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Lisa õpiväljund
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOutcome ? 'Muuda õpiväljundit' : 'Lisa uus õpiväljund'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic_id">Teema *</Label>
                  <Select 
                    value={formData.topic_id} 
                    onValueChange={(value) => setFormData({ ...formData, topic_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vali teema" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => {
                        const subject = getSubjectForTopic(topic.id);
                        return (
                          <SelectItem key={topic.id} value={topic.id}>
                            {subject?.name} → {topic.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text_et">Õpiväljundi tekst *</Label>
                  <Textarea
                    id="text_et"
                    value={formData.text_et}
                    onChange={(e) => setFormData({ ...formData, text_et: e.target.value })}
                    placeholder="nt: Taandab ja laiendab algebralist murdu ning liidab, lahutab, korrutab ja jagab algebralisi murde"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_level">Kooliaste *</Label>
                    <Select 
                      value={formData.school_level} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, school_level: value, class: '' });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">I kooliaste (1-3 klass)</SelectItem>
                        <SelectItem value="II">II kooliaste (4-6 klass)</SelectItem>
                        <SelectItem value="III">III kooliaste (7-9 klass)</SelectItem>
                        <SelectItem value="Gymnasium">Gümnaasium (10-12 klass)</SelectItem>
                        <SelectItem value="University">Ülikool</SelectItem>
                        <SelectItem value="All">Kõik tasemed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Klass</Label>
                    <Select 
                      value={formData.class}
                      onValueChange={(value) => setFormData({ ...formData, class: value })}
                      disabled={formData.school_level === 'All'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vali klass" />
                      </SelectTrigger>
                      <SelectContent>
                        {getClassOptions(formData.school_level).map(cls => (
                          <SelectItem key={cls} value={cls}>{cls}. klass</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        setFormData({ ...formData, status: value as OutcomeFormData["status"] })
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
                {editingOutcome && (
                  <div className="space-y-2">
                    <Label>RDF URI</Label>
                    <Input
                      value={editingOutcome.uri || ''}
                      disabled
                      className="bg-slate-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500">URI genereeritakse automaatselt ja seda ei saa muuta</p>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Tühista
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    {editingOutcome ? 'Uuenda' : 'Loo'} õpiväljund
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
                Kõik õpiväljundid
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={filterTopic} onValueChange={setFilterTopic}>
                    <SelectTrigger className="w-48">
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
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Kooliaste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Kõik astmed</SelectItem>
                    <SelectItem value="I">I kooliaste</SelectItem>
                    <SelectItem value="II">II kooliaste</SelectItem>
                    <SelectItem value="III">III kooliaste</SelectItem>
                    <SelectItem value="Gymnasium">Gümnaasium</SelectItem>
                    <SelectItem value="University">Ülikool</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Laadimine...</p>
            ) : filteredOutcomes.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Õpiväljundeid pole veel. Lisa esimene õpiväljund!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Õpiväljund</TableHead>
                    <TableHead>Teema</TableHead>
                    <TableHead>Kooliaste</TableHead>
                    <TableHead>Klass</TableHead>
                    <TableHead>Olek</TableHead>
                    <TableHead className="text-right">Tegevused</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOutcomes.map((outcome) => (
                    <TableRow key={outcome.id}>
                      <TableCell>
                        <p className="text-sm text-slate-900 line-clamp-2">{outcome.text_et}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {getTopicName(outcome.topic_id)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {outcome.school_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {outcome.class ? (
                          <span className="text-sm text-slate-600">{outcome.class}. klass</span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={outcome.status === 'published' ? 'default' : 'secondary'}>
                          {outcome.status === 'published' ? 'Avaldatud' : 'Mustand'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(outcome)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(outcome.id)}
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
