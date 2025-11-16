import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { curriculum, type RawDataset } from "@/api/curriculumClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, UploadCloud } from "lucide-react";

type ImportStatus = "idle" | "loading" | "success";

type DatasetSummary = {
  subjects: number;
  topics: number;
  outcomes: number;
  skillBits: number;
};

const schemaHighlights = [
  {
    label: "subjects",
    description: "Simple string list (Mathematics, Science, etc.) that become Subjects in the editor.",
  },
  {
    label: "topics",
    description: "Objects with `text`, optional `subject`, `parent_topic`, and `uri` properties.",
  },
  {
    label: "learning_outcomes",
    description: "Outcome objects that can link to topics, prerequisites/capstone relations, school levels, and URIs.",
  },
  {
    label: "skill_bits / sub_skills",
    description: "Optional arrays containing `label`, `belongs_to`/`outcome`, and manual ordering metadata.",
  },
];

export default function ImportPage() {
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setError(null);
    setStatus("loading");
    setSummary(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as RawDataset;
      const nextState = await curriculum.importFromRaw(parsed);
      setSummary({
        subjects: nextState.subjects.length,
        topics: nextState.topics.length,
        outcomes: nextState.outcomes.length,
        skillBits: nextState.skillBits.length,
      });
      await Promise.all(
        ["subjects", "topics", "outcomes", "skillbits"].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] }),
        ),
      );
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import the provided dataset.");
      setStatus("idle");
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const totalItems =
    (summary?.subjects ?? 0) +
    (summary?.topics ?? 0) +
    (summary?.outcomes ?? 0) +
    (summary?.skillBits ?? 0);

  return (
    <div className="space-y-6 p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Data management
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Import curriculum JSON</h1>
        <p className="text-sm text-slate-500">
          Upload a JSON export that follows the schema provided in <code>public/data/oppekava.json</code>.
          The selected dataset immediately becomes the active curriculum so you can continue editing the data
          within the UI.
        </p>
      </div>

      <Card className="space-y-4">
        <CardHeader className="space-y-1">
          <CardTitle>Upload an RDF curriculum export</CardTitle>
          <p className="text-sm text-slate-500">
            The import accepts the same structure that the export page produces (subjects, topics, learning
            outcomes, skill bits/sub skills) and stores the imported payload locally so you can immediately
            continue editing.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
            <UploadCloud className="h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-600">
              Choose a JSON file (max ~10MB) and we will parse it client-side before replacing the current
              curriculum state.
            </p>
            <Button size="md" variant="outline" onClick={handleButtonClick} disabled={status === "loading"}>
              Select JSON file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
            {fileName && (
              <p className="text-xs text-slate-500">
                Selected file: <span className="font-semibold text-slate-900">{fileName}</span>
              </p>
            )}
            {status === "loading" ? (
              <p className="text-xs text-slate-500">Importing dataset…</p>
            ) : (
              <p className="text-xs text-slate-500">
                Imported entries are immediately available in every section of the tool.
              </p>
            )}
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">Schema highlights</p>
              <ul className="space-y-1 pl-5 text-slate-500">
                {schemaHighlights.map((item) => (
                  <li key={item.label}>
                    <span className="font-medium text-slate-700">{item.label}</span>: {item.description}
                  </li>
                ))}
              </ul>
            </div>
            <Alert className="bg-white">
              <AlertDescription>
                Only subjects, topics, learning outcomes, and optional skill bits are imported for now. The JSON
                structure is aligned with the RDF exports so you can reuse the same payload across tooling.
              </AlertDescription>
            </Alert>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Sample payload</p>
              <pre className="mt-2 rounded-xl border border-slate-200 bg-slate-900/80 p-3 text-xs text-slate-50">
                {`{
  "subjects": [
    "Mathematics",
    "Programming"
  ],
  "topics": [
    {
      "text": "Algebra",
      "subject": ["Mathematics"],
      "parent_topic": [],
      "url": "https://oppekava.edu.ee/topics/algebra"
    }
  ],
  "learning_outcomes": [
    {
      "text": "Solves linear equations.",
      "topic": ["Algebra"],
      "school_level": ["III kooliaste"],
      "url": "https://oppekava.edu.ee/outcomes/algebra-1"
    }
  ],
  "skill_bits": [
    {
      "label": "Identifies denominators",
      "belongs_to": ["https://oppekava.edu.ee/outcomes/algebra-1"]
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Imported {totalItems} curriculum entries</CardTitle>
              <p className="text-xs text-slate-500">The current dataset reflects your uploaded JSON.</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-6 text-sm text-slate-600">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Subjects</dt>
                <dd className="text-lg font-semibold text-slate-900">{summary.subjects}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Topics</dt>
                <dd className="text-lg font-semibold text-slate-900">{summary.topics}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Outcomes</dt>
                <dd className="text-lg font-semibold text-slate-900">{summary.outcomes}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Skill bits</dt>
                <dd className="text-lg font-semibold text-slate-900">{summary.skillBits}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
