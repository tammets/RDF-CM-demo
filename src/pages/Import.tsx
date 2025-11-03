import { useState, type ChangeEvent } from "react";
import { base44, type Subject, type Topic, type LearningOutcome } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileJson, Check, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

type ImportCounts = {
  subjects: number;
  topics: number;
  outcomes: number;
};

type ImportJson = {
  subjects?: Partial<Subject>[];
  topics?: Partial<Topic>[];
  outcomes?: Partial<LearningOutcome>[];
};

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportCounts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/json") {
      setFile(selectedFile);
      setResult(null);
      setError(null);
    } else {
      setError("Please select a valid JSON file");
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ImportJson;

      let subjectsCreated = 0;
      let topicsCreated = 0;
      let outcomesCreated = 0;

      // Import subjects
      if (data.subjects && Array.isArray(data.subjects)) {
        for (const subject of data.subjects) {
          if (!subject?.name) continue;

          await base44.entities.Subject.create({
            name: subject.name,
            name_et: subject.name_et,
            description: subject.description,
            code: subject.code,
            uri: subject.uri,
            status: subject.status || "draft",
          });
          subjectsCreated++;
        }
      }

      // Import topics
      if (data.topics && Array.isArray(data.topics)) {
        for (const topic of data.topics) {
          if (!topic?.name || !topic.subject_id) continue;

          await base44.entities.Topic.create({
            name: topic.name,
            name_et: topic.name_et,
            description: topic.description,
            subject_id: topic.subject_id,
            uri: topic.uri,
            order_index: topic.order_index || 0,
            status: topic.status || "draft",
          });
          topicsCreated++;
        }
      }

      // Import outcomes
      if (data.outcomes && Array.isArray(data.outcomes)) {
        for (const outcome of data.outcomes) {
          if (!outcome?.topic_id) continue;

          await base44.entities.LearningOutcome.create({
            text: outcome.text,
            text_et: outcome.text_et,
            topic_id: outcome.topic_id,
            school_level: outcome.school_level,
            grade_range: outcome.grade_range,
            uri: outcome.uri,
            related_outcomes: outcome.related_outcomes || [],
            expects: outcome.expects || [],
            consists_of: outcome.consists_of || [],
            order_index: outcome.order_index || 0,
            status: outcome.status || "draft",
          });
          outcomesCreated++;
        }
      }

      setResult({
        subjects: subjectsCreated,
        topics: topicsCreated,
        outcomes: outcomesCreated
      });

      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['outcomes'] });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to import data. Please check the file format.";
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  const handleCreateSample = async () => {
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      // Create Mathematics subject
      const mathSubject = await base44.entities.Subject.create({
        name: 'Mathematics',
        name_et: 'Matemaatika',
        description: 'Mathematics curriculum for Estonian schools',
        code: 'MATH',
        uri: 'https://oppekava.edu.ee/subjects/mathematics',
        status: 'published'
      });

      // Create Algebra topic
      const algebraTopic = await base44.entities.Topic.create({
        name: 'Algebra',
        name_et: 'Algebra',
        description: 'Algebraic operations and expressions',
        subject_id: mathSubject.id,
        uri: 'https://oppekava.edu.ee/topics/algebra',
        order_index: 1,
        status: 'published'
      });

      // Create sample learning outcomes
      const outcomes = [
        {
          text: 'Simplifies and expands algebraic fractions and adds, subtracts, multiplies and divides algebraic fractions.',
          text_et: 'Taandab ja laiendab algebralist murdu ning liidab, lahutab, korrutab ja jagab algebralisi murde.',
          school_level: 'III',
          grade_range: '7-9'
        },
        {
          text: 'Solves linear equations and inequalities and applies them to solving real-world problems.',
          text_et: 'Lahendab lineaarvõrrandeid ja -võrratusi ning rakendab neid reaalprobleemide lahendamisel.',
          school_level: 'III',
          grade_range: '7-9'
        },
        {
          text: 'Factorizes simple polynomials and applies factorization in solving equations.',
          text_et: 'Teostab lihtsate polünoomide tegurdamist ja rakendab tegurdamist võrrandite lahendamisel.',
          school_level: 'III',
          grade_range: '8-9'
        }
      ];

      for (const [index, outcome] of outcomes.entries()) {
        await base44.entities.LearningOutcome.create({
          ...outcome,
          topic_id: algebraTopic.id,
          uri: `https://oppekava.edu.ee/outcomes/algebra-${index + 1}`,
          order_index: index + 1,
          status: 'published'
        });
      }

      setResult({
        subjects: 1,
        topics: 1,
        outcomes: outcomes.length
      });

      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['outcomes'] });

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create sample data.";
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Import Data</h1>
          <p className="text-slate-600">Import curriculum data from JSON files</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully imported {result.subjects} subject(s), {result.topics} topic(s), and {result.outcomes} learning outcome(s)!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Import JSON File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => (document.getElementById("file-upload") as HTMLInputElement | null)?.click()}
              >
                <FileJson className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 mb-2">
                  {file ? file.name : 'Click to select JSON file'}
                </p>
                <p className="text-xs text-slate-500">
                  Supports curriculum data in JSON format
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-green-600" />
                Sample Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 border border-slate-200 rounded-lg bg-slate-50">
                <p className="text-sm text-slate-600 mb-4">
                  Create sample Mathematics curriculum data with:
                </p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">1</Badge>
                    Subject (Mathematics)
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-indigo-50">1</Badge>
                    Topic (Algebra)
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50">3</Badge>
                    Learning Outcomes
                  </li>
                </ul>
              </div>

              <Button 
                onClick={handleCreateSample} 
                disabled={importing}
                variant="outline"
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Sample Data'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>JSON Format Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`{
  "subjects": [
    {
      "name": "Mathematics",
      "name_et": "Matemaatika",
      "description": "Mathematics curriculum",
      "code": "MATH",
      "uri": "https://oppekava.edu.ee/subjects/math",
      "status": "published"
    }
  ],
  "topics": [
    {
      "name": "Algebra",
      "name_et": "Algebra",
      "subject_id": "<subject-id>",
      "order_index": 1,
      "status": "published"
    }
  ],
  "outcomes": [
    {
      "text": "Learning outcome description",
      "text_et": "Õpiväljundi kirjeldus",
      "topic_id": "<topic-id>",
      "school_level": "III",
      "grade_range": "7-9",
      "status": "published"
    }
  ]
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
