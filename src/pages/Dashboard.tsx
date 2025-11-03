import { Link } from "react-router-dom";
import { BookOpen, BookMarked, Target, CheckCircle, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { base44, type Subject, type Topic, type LearningOutcome } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list("-created_date"),
    initialData: [],
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => base44.entities.Topic.list("-created_date"),
    initialData: [],
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => base44.entities.LearningOutcome.list("-created_date"),
    initialData: [],
  });

  const publishedSubjects = subjects.filter((subject) => subject.status === "published").length;
  const publishedTopics = topics.filter((topic) => topic.status === "published").length;
  const publishedOutcomes = outcomes.filter((outcome) => outcome.status === "published").length;

  const stats = [
    {
      title: "Õppeained",
      value: subjects.length,
      published: publishedSubjects,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      link: createPageUrl("Subjects"),
    },
    {
      title: "Teemad",
      value: topics.length,
      published: publishedTopics,
      icon: BookMarked,
      color: "from-indigo-500 to-indigo-600",
      link: createPageUrl("Topics"),
    },
    {
      title: "Õpiväljundid",
      value: outcomes.length,
      published: publishedOutcomes,
      icon: Target,
      color: "from-purple-500 to-purple-600",
      link: createPageUrl("Outcomes"),
    },
  ];

  const recentOutcomes = outcomes.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Õppekava ülevaade</h1>
          <p className="text-slate-600">Halda Eesti õppekava andmeid RDF ekspordiga</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {stats.map((stat) => (
            <Link key={stat.title} to={stat.link}>
              <Card className="group cursor-pointer border-slate-200 bg-white transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg transition-transform group-hover:scale-110`}
                        >
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-600">{stat.published} avaldatud</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <FileText className="h-5 w-5 text-blue-600" />
                Viimased õpiväljundid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOutcomes.length > 0 ? (
                  recentOutcomes.map((outcome) => (
                    <div
                      key={outcome.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 flex-1 text-sm text-slate-700">
                          {outcome.text_et || outcome.text}
                        </p>
                        <Badge className="shrink-0 bg-indigo-600 text-white">
                          {outcome.school_level || "—"}
                        </Badge>
                      </div>
                      <Badge className="w-fit text-xs">
                        {outcome.status === "published" ? "Avaldatud" : "Mustand"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="py-8 text-center text-slate-500">Õpiväljundeid pole veel</p>
                )}
              </div>
              <Link to={createPageUrl("Outcomes")}>
                <Button className="mt-4 w-full">Vaata kõiki õpiväljundeid</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-slate-900">Kiirtegevused</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={createPageUrl("Subjects")}>
                <Button className="w-full justify-start">Lisa uus õppeaine</Button>
              </Link>
              <Link to={createPageUrl("Topics")}>
                <Button className="w-full justify-start">Lisa uus teema</Button>
              </Link>
              <Link to={createPageUrl("Outcomes")}>
                <Button className="w-full justify-start">Lisa õpiväljund</Button>
              </Link>
              <Link to={createPageUrl("Import")}>
                <Button className="w-full justify-start">Impordi JSON andmed</Button>
              </Link>
              <Link to={createPageUrl("Export")}>
                <Button className="w-full justify-start">Ekspordi RDF/JSON-LD-na</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
