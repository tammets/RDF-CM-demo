
import { useState, type FormEvent } from "react";
import { base44, type Subject } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type SubjectFormData = {
  name: string;
  name_et: string;
  description: string;
  code: string;
  uri: string;
  status: "draft" | "published";
};

export default function Subjects() {
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    name: "",
    name_et: "",
    description: "",
    code: "",
    uri: "",
    status: "draft",
  });

  const queryClient = useQueryClient();

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list("-created_date"),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data: SubjectFormData) => base44.entities.Subject.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectFormData }) =>
      base44.entities.Subject.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Subject.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      name_et: "",
      description: "",
      code: "",
      uri: "",
      status: "draft",
    });
    setEditingSubject(null);
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
      name: subject.name || "",
      name_et: subject.name_et || "",
      description: subject.description || "",
      code: subject.code || "",
      uri: subject.uri || "",
      status: (subject.status as SubjectFormData["status"]) || "draft",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Kas oled kindel, et soovid selle õppeaine kustutada?")) {
      void deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Õppeained</h1>
            <p className="text-slate-600 mt-1">Halda õppekava õppeaineid</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Lisa õppeaine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSubject ? 'Muuda õppeainet' : 'Lisa uus õppeaine'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nimi (inglise keeles) *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="nt Mathematics"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_et">Nimi (eesti keeles)</Label>
                    <Input
                      id="name_et"
                      value={formData.name_et}
                      onChange={(e) => setFormData({ ...formData, name_et: e.target.value })}
                      placeholder="nt Matemaatika"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Kirjeldus</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Õppeaine kirjeldus"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Kood</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="nt MATH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Olek</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value as SubjectFormData["status"] })
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
                    placeholder="nt https://oppekava.edu.ee/subjects/mathematics"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Tühista
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingSubject ? 'Uuenda' : 'Loo'} õppeaine
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Kõik õppeained
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-slate-500">Laadimine...</p>
            ) : subjects.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Õppeaineid pole veel. Lisa esimene õppeaine!</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nimi</TableHead>
                    <TableHead>Kood</TableHead>
                    <TableHead>Olek</TableHead>
                    <TableHead>URI</TableHead>
                    <TableHead className="text-right">Tegevused</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{subject.name_et || subject.name}</p>
                          {subject.name_et && subject.name !== subject.name_et && (
                            <p className="text-sm text-slate-500">{subject.name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.code || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={subject.status === 'published' ? 'default' : 'secondary'}>
                          {subject.status === 'published' ? 'Avaldatud' : 'Mustand'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {subject.uri ? (
                          <a href={subject.uri} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 underline">
                            {subject.uri.substring(0, 40)}...
                          </a>
                        ) : '—'}
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
