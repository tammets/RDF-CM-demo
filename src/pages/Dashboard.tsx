import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, BookOpen, BookMarked, Target } from "lucide-react";

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

  const stats = [
    {
      id: "subjects",
      name: "Subjects",
      stat: subjects.length,
      icon: BookOpen,
      iconBg: "bg-blue-500",
      link: createPageUrl("Subjects"),
    },
    {
      id: "topics",
      name: "Topics",
      stat: topics.length,
      icon: BookMarked,
      iconBg: "bg-indigo-500",
      link: createPageUrl("Topics"),
    },
    {
      id: "outcomes",
      name: "Learning Outcomes",
      stat: outcomes.length,
      icon: Target,
      iconBg: "bg-purple-500",
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

        <div>
          <h3 className="text-base font-semibold text-slate-900">Current totals</h3>
          <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <Link key={stat.id} to={stat.link} className="group block">
                <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-sm transition-shadow hover:shadow-md sm:px-6 sm:pt-6">
                  <dt>
                    <div className={`absolute rounded-md ${stat.iconBg} p-3`}>
                      <stat.icon aria-hidden="true" className="h-6 w-6 text-white" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-slate-500">{stat.name}</p>
                  </dt>
                  <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-3xl font-semibold text-slate-900">{stat.stat}</p>
                  </dd>
                  <div className="absolute inset-x-0 bottom-0 bg-slate-50 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-indigo-600 transition-colors group-hover:text-indigo-500">
                        View all<span className="sr-only"> {stat.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="mb-2 flex items-center gap-2 text-slate-900">
                <FileText className="h-5 w-5 text-blue-600" />
                Welcome to the RDF Curriculum Manager
              </CardTitle>
              <p className="text-sm text-slate-600">
                Use this dashboard to curate the national curriculum, track publication status, and generate RDF exports.
              </p>
              <p className="text-sm text-slate-600 mt-4">
                Although information is originally sourced from https://oppekava.edu.ee/, there is no direct connection to the original dataset and
                the service extends it based on input from Tallinn University's Centre for Educational Technology researchers.
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

          <Card className="border-slate-200 bg-white">
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
