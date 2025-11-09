import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, PlugZap } from "lucide-react";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

const endpoints = [
  {
    method: "GET",
    path: "/api/subjects",
    purpose: "Populate subject pickers or metadata lookups.",
  },
  {
    method: "GET",
    path: "/api/topics?subject_id=SUBJECT_ID",
    purpose: "Load topic choices scoped to the selected subject.",
  },
  {
    method: "GET",
    path: "/api/outcomes?topic_id=TOPIC_ID",
    purpose: "Return learning outcomes for a topic.",
  },
  {
    method: "GET",
    path: "/api/skillbits?outcome_id=OUTCOME_ID",
    purpose: "Fetch granular skill-bit descriptors for outcome-driven forms.",
  },
  {
    method: "GET",
    path: "/api/export.jsonld",
    purpose: "Download the complete dataset with semantic context.",
  },
];

export default function IntegrationGuide() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            <PlugZap className="h-3.5 w-3.5" />
            External integrations
          </div>
          <h1 className="text-4xl font-bold text-slate-900">API Integration Guide</h1>
          <p className="text-base text-slate-600">
            Use these guidelines when building forms or digital tools that need curriculum-aligned dropdowns such as subjects, topics, learning
            outcomes, or skill-bits. Every UI element should reference the single source of truth maintained in the RDF Curriculum Manager.
          </p>
        </header>

        <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <ExclamationTriangleIcon aria-hidden="true" className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Base URL:
                <code className="mx-1 rounded bg-white px-1 py-0.5 text-xs text-yellow-800">https://your-domain.edu</code>
                Prefix each API path below with this domain before calling it from external services.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-gray-200">
          <CardHeader className="mb-4">
            <CardTitle>Recommended workflow for forms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            <ol className="list-decimal space-y-3 pl-6">
              <li>
                Fetch <strong>subjects</strong> up front and cache them. These provide the first dropdown options for curriculum selection flows.
              </li>
              <li>
                When a subject is chosen, query <strong>topics</strong> with <code className="rounded bg-slate-100 px-1">subject_id</code> to keep
                options filtered and relevant.
              </li>
              <li>
                For deeper guidance, load <strong>learning outcomes</strong> tied to the topic, then optionally fetch <strong>skill-bits</strong> for
                fine-grained capability tagging.
              </li>
              <li>
                Use the export endpoints whenever you need an offline snapshot or to feed semantic stores (JSON-LD/Turtle).
              </li>
            </ol>
            <p className="text-xs text-slate-500">
              Hint: Every entity includes stable identifiers so you can persist selections externally without denormalising names.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="mb-4">
            <CardTitle>Key API endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {endpoints.map((endpoint) => (
              <div key={endpoint.path} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-mono text-slate-900">
                  <span className="font-semibold text-emerald-600">{endpoint.method}</span> {endpoint.path}
                </p>
                <p className="text-xs text-slate-500 mt-1">{endpoint.purpose}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              Add <code className="rounded bg-slate-100 px-1">?include=expects,consistsOf</code> to enrich responses with relational identifiers
              whenever dependency chains are needed.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="mb-4">
            <CardTitle>Example: cascading curriculum selector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">
              The snippet below demonstrates how a typical frontend can hydrate dropdowns that depend on each other. Replace the base URL to match
              your deployment.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`const API_BASE = "https://your-domain.edu/api";

async function loadSubjects() {
  const res = await fetch(\`\${API_BASE}/subjects\`);
  return res.json();
}

async function loadTopics(subjectId) {
  const res = await fetch(\`\${API_BASE}/topics?subject_id=\${subjectId}\`);
  return res.json();
}

async function loadOutcomes(topicId) {
  const res = await fetch(\`\${API_BASE}/outcomes?topic_id=\${topicId}&include=skillBits\`);
  return res.json();
}`}
            </pre>
            <p className="text-xs text-slate-500">
              Reuse the same pattern for skill-bits and remember to debounce calls when wiring autocomplete widgets.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="mb-4">
            <CardTitle>Operational tips</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Version awareness</p>
              <p className="mt-1 text-xs text-slate-600">
                Export payloads include a version stamp. Log it with every sync so you can detect when cached choices are outdated.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Access control</p>
              <p className="mt-1 text-xs text-slate-600">
                Keep your integration keys on the server-side. Client forms should call your middleware rather than hitting the API directly.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Data freshness</p>
              <p className="mt-1 text-xs text-slate-600">
                When the curriculum is updated, only refresh the affected branch (subject → topic → outcome) to avoid full reloads.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Feedback loop</p>
              <p className="mt-1 text-xs text-slate-600">
                If you surface derived attributes (e.g., grade ranges), keep the field names aligned with the schema so educators recognise them.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Need richer semantics?</p>
          <p className="mt-1">
            Combine the JSON-LD export with your ontology tools or RDF triple stores. This keeps external recommendation engines in sync with the
            authoritative data curated here.
          </p>
          <a
            href="https://json-ld.org"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Learn more about JSON-LD
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
