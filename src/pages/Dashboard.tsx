import { Link } from "react-router-dom";
import { BookOpen, BookMarked, Target, CheckCircle, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { curriculum, type Subject, type Topic, type LearningOutcome } from "@/api/curriculumClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculum.entities.Subject.list("-created_date"),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => curriculum.entities.Topic.list("-created_date"),
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => curriculum.entities.LearningOutcome.list("-created_date"),
  });

  const publishedSubjects = subjects.filter((subject) => subject.status === "published").length;
  const publishedTopics = topics.filter((topic) => topic.status === "published").length;
  const publishedOutcomes = outcomes.filter((outcome) => outcome.status === "published").length;

  const stats = [
    {
      title: "Subjects",
      value: subjects.length,
      published: publishedSubjects,
      icon: BookOpen,
      color: "from-blue-500 to-blue-600",
      link: createPageUrl("Subjects"),
    },
    {
      title: "Topics",
      value: topics.length,
      published: publishedTopics,
      icon: BookMarked,
      color: "from-indigo-500 to-indigo-600",
      link: createPageUrl("Topics"),
    },
    {
      title: "Learning Outcomes",
      value: outcomes.length,
      published: publishedOutcomes,
      icon: Target,
      color: "from-purple-500 to-purple-600",
      link: createPageUrl("Outcomes"),
    },
  ];

  const quickActions = [
    {
      label: "Add New Subject",
      description: "Create a subject to group related topics.",
      link: createPageUrl("Subjects"),
    },
    {
      label: "Add New Topic",
      description: "Organise learning outcomes within a subject.",
      link: createPageUrl("Topics"),
    },
    {
      label: "Add Learning Outcome",
      description: "Capture measurable outcomes for each topic.",
      link: createPageUrl("Outcomes"),
    },
    {
      label: "Export as RDF/JSON-LD",
      description: "Download data for sharing and integrations.",
      link: createPageUrl("Export"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-slate-900">Curriculum Overview</h1>
          <p className="text-slate-600">Manage Estonian curriculum data with streamlined RDF exports</p>
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
                        <span className="text-sm text-slate-600">{stat.published} published</span>
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
              <CardTitle className="mb-2 flex items-center gap-2 text-slate-900">
                <FileText className="h-5 w-5 text-blue-600" />
                Welcome to the RDF Curriculum Manager
              </CardTitle>
              <p className="text-sm text-slate-600">
                Use this dashboard to curate the national curriculum, track publication status, and generate RDF exports.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-slate-700">
                <p>With this tool you can:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Create and manage subjects, topics, and learning outcomes.</li>
                  <li>Monitor drafts versus published content to keep the curriculum up to date.</li>
                  <li>Export your work as RDF/JSON-LD for downstream integrations.</li>
                </ul>
                <p>Not sure where to begin? Use the quick actions to add new items or review exports.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-md">
            <CardHeader>
              <CardTitle className="mb-2 text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.link} className="block">
                  <div className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-white hover:shadow-sm">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">{action.label}</p>
                      <p className="text-xs text-slate-500">{action.description}</p>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-600" aria-hidden="true">
                      &rsaquo;
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
