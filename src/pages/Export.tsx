
import { useState } from "react";
import { base44, type Subject, type Topic, type LearningOutcome } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Code, FileJson, Copy, Check, ExternalLink, Book } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ExportFormat = "json-ld" | "turtle" | "json";

export default function Export() {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("json-ld");
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => base44.entities.Subject.list(),
    initialData: [],
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => base44.entities.Topic.list(),
    initialData: [],
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => base44.entities.LearningOutcome.list(),
    initialData: [],
  });

  const rdfSchema = `@prefix eduschema: <https://oppekava.edu.ee/schema/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .

# Ontology definition
<https://oppekava.edu.ee/schema/> a owl:Ontology ;
    rdfs:label "Estonian Curriculum RDF Schema"@en ;
    rdfs:label "Eesti õppekava RDF skeem"@et ;
    rdfs:comment "RDF vocabulary for describing Estonian curriculum data"@en .

# Classes
eduschema:Subject a owl:Class ;
    rdfs:label "Õppeaine"@et ;
    rdfs:label "Subject"@en ;
    rdfs:comment "Õppekava õppeaine (nt Matemaatika, Eesti keel)"@et .

eduschema:Topic a owl:Class ;
    rdfs:label "Teema"@et ;
    rdfs:label "Topic"@en ;
    rdfs:comment "Õppeaine teema (nt Algebra, Geomeetria)"@et .

eduschema:LearningOutcome a owl:Class ;
    rdfs:label "Õpiväljund"@et ;
    rdfs:label "Learning Outcome"@en ;
    rdfs:comment "Konkreetne õpiväljund teema raames"@et .

eduschema:CurriculumExport a owl:Class ;
    rdfs:label "Õppekava eksport"@et ;
    rdfs:label "Curriculum Export"@en ;
    rdfs:comment "Õppekava andmete eksport"@et .

# Properties
eduschema:hasTopic a owl:ObjectProperty ;
    rdfs:label "sisaldab teemat"@et ;
    rdfs:domain eduschema:Subject ;
    rdfs:range eduschema:Topic .

eduschema:hasOutcome a owl:ObjectProperty ;
    rdfs:label "sisaldab õpiväljundit"@et ;
    rdfs:domain eduschema:Topic ;
    rdfs:range eduschema:LearningOutcome .

eduschema:expects a owl:ObjectProperty ;
    rdfs:label "eeldab"@et ;
    rdfs:comment "Viitab õpiväljunditele, mis peavad olema saavutatud enne seda õpiväljundit"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range eduschema:LearningOutcome .

eduschema:consistsOf a owl:ObjectProperty ;
    rdfs:label "koosneb"@et ;
    rdfs:comment "Viitab alaõpiväljunditele, millest see õpiväljund koosneb"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range eduschema:LearningOutcome .

eduschema:schoolLevel a owl:DatatypeProperty ;
    rdfs:label "kooliaste"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range xsd:string .

eduschema:gradeRange a owl:DatatypeProperty ;
    rdfs:label "klasside vahemik"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range xsd:string .

eduschema:code a owl:DatatypeProperty ;
    rdfs:label "kood"@et ;
    rdfs:domain eduschema:Subject ;
    rdfs:range xsd:string .

eduschema:status a owl:DatatypeProperty ;
    rdfs:label "olek"@et ;
    rdfs:range xsd:string .

eduschema:generatedAtTime a owl:DatatypeProperty ;
    rdfs:label "genereeritud ajal"@et ;
    rdfs:range xsd:dateTime .

eduschema:version a owl:DatatypeProperty ;
    rdfs:label "versioon"@et ;
    rdfs:range xsd:string .

eduschema:totalSubjects a owl:DatatypeProperty ;
    rdfs:label "õppeainete arv"@et ;
    rdfs:range xsd:integer .

eduschema:totalTopics a owl:DatatypeProperty ;
    rdfs:label "teemade arv"@et ;
    rdfs:range xsd:integer .

eduschema:totalOutcomes a owl:DatatypeProperty ;
    rdfs:label "õpiväljundite arv"@et ;
    rdfs:range xsd:integer .

eduschema:totalItems a owl:DatatypeProperty ;
    rdfs:label "kirjete arv kokku"@et ;
    rdfs:range xsd:integer .`;

  const generateJSONLD = (): string => {
    const context: Record<string, unknown> & { "@graph": Record<string, unknown>[] } = {
      "@context": {
        "eduschema": "https://oppekava.edu.ee/schema/",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "name": "rdfs:label",
        "description": "rdfs:comment",
        "hasTopic": "eduschema:hasTopic",
        "hasOutcome": "eduschema:hasOutcome",
        "schoolLevel": "eduschema:schoolLevel",
        "expects": "eduschema:expects",
        "consistsOf": "eduschema:consistsOf"
      },
      "@id": "https://oppekava.edu.ee/export",
      "@type": "eduschema:CurriculumExport",
      "generatedAtTime": new Date().toISOString(),
      "version": "1.0",
      "totalSubjects": subjects.length,
      "totalTopics": topics.length,
      "totalOutcomes": outcomes.length,
      "totalItems": subjects.length + topics.length + outcomes.length,
      "@graph": [],
    };

    subjects.forEach((subject) => {
      const subjectNode: Record<string, unknown> & { hasTopic: Record<string, unknown>[] } = {
        "@id": subject.uri || `https://oppekava.edu.ee/subjects/${subject.id}`,
        "@type": "eduschema:Subject",
        "name": subject.name,
        "name_et": subject.name_et,
        "description": subject.description,
        "code": subject.code,
        "status": subject.status,
        "hasTopic": [],
      };

      const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id);
      subjectTopics.forEach((topic) => {
        const topicNode: Record<string, unknown> & { hasOutcome: Record<string, unknown>[] } = {
          "@id": topic.uri || `https://oppekava.edu.ee/topics/${topic.id}`,
          "@type": "eduschema:Topic",
          "name": topic.name,
          "name_et": topic.name_et,
          "description": topic.description,
          "order_index": topic.order_index,
          "status": topic.status,
          "hasOutcome": [],
        };

        const topicOutcomes = outcomes.filter((outcome) => outcome.topic_id === topic.id);
        topicOutcomes.forEach((outcome) => {
          const outcomeNode: Record<string, unknown> = {
            "@id": outcome.uri || `https://oppekava.edu.ee/outcomes/${outcome.id}`,
            "@type": "eduschema:LearningOutcome",
            "text": outcome.text,
            "text_et": outcome.text_et,
            "schoolLevel": outcome.school_level,
            "gradeRange": outcome.grade_range,
            "order_index": outcome.order_index,
            "status": outcome.status
          };

          if (outcome.expects && outcome.expects.length > 0) {
            (outcomeNode as { expects: string[] }).expects = outcome.expects;
          }
          if (outcome.consists_of && outcome.consists_of.length > 0) {
            (outcomeNode as { consistsOf: string[] }).consistsOf = outcome.consists_of;
          }

          topicNode.hasOutcome.push(outcomeNode);
        });

        subjectNode.hasTopic.push(topicNode);
      });

      context["@graph"].push(subjectNode);
    });

    return JSON.stringify(context, null, 2);
  };

  const generateTurtle = (): string => {
    let turtle = `@prefix eduschema: <https://oppekava.edu.ee/schema/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<https://oppekava.edu.ee/export> a eduschema:CurriculumExport ;
    eduschema:generatedAtTime "${new Date().toISOString()}"^^xsd:dateTime ;
    eduschema:version "1.0" ;
    eduschema:totalSubjects ${subjects.length} ;
    eduschema:totalTopics ${topics.length} ;
    eduschema:totalOutcomes ${outcomes.length} .

`;

    subjects.forEach(subject => {
      const subjectUri = subject.uri || `https://oppekava.edu.ee/subjects/${subject.id}`;
      turtle += `<${subjectUri}> a eduschema:Subject ;\n    rdfs:label "${subject.name}"@en`;
      
      if (subject.name_et) {
        turtle += `,\n        "${subject.name_et}"@et`;
      }
      turtle += ` ;\n`;

      if (subject.description) {
        turtle += `    rdfs:comment "${subject.description}" ;\n`;
      }
      if (subject.code) {
        turtle += `    eduschema:code "${subject.code}" ;\n`;
      }
      
      const subjectTopics = topics.filter(t => t.subject_id === subject.id);
      if (subjectTopics.length > 0) {
        subjectTopics.forEach((topic, idx) => {
          const topicUri = topic.uri || `https://oppekava.edu.ee/topics/${topic.id}`;
          turtle += `    eduschema:hasTopic <${topicUri}>`;
          if (idx < subjectTopics.length - 1) {
            turtle += ` ,\n`;
          } else {
            turtle += ` ;\n`;
          }
        });
      }
      turtle += `    eduschema:status "${subject.status}" .\n\n`;

      subjectTopics.forEach(topic => {
        const topicUri = topic.uri || `https://oppekava.edu.ee/topics/${topic.id}`;
        turtle += `<${topicUri}> a eduschema:Topic ;\n    rdfs:label "${topic.name}"@en`;
        
        if (topic.name_et) {
          turtle += `,\n        "${topic.name_et}"@et`;
        }
        turtle += ` ;\n`;

        if (topic.description) {
          turtle += `    rdfs:comment "${topic.description}" ;\n`;
        }

        const topicOutcomes = outcomes.filter(o => o.topic_id === topic.id);
        if (topicOutcomes.length > 0) {
          topicOutcomes.forEach((outcome, idx) => {
            const outcomeUri = outcome.uri || `https://oppekava.edu.ee/outcomes/${outcome.id}`;
            turtle += `    eduschema:hasOutcome <${outcomeUri}>`;
            if (idx < topicOutcomes.length - 1) {
              turtle += ` ,\n`;
            } else {
              turtle += ` ;\n`;
            }
          });
        }
        turtle += `    eduschema:status "${topic.status}" .\n\n`;

        topicOutcomes.forEach(outcome => {
          const outcomeUri = outcome.uri || `https://oppekava.edu.ee/outcomes/${outcome.id}`;
          turtle += `<${outcomeUri}> a eduschema:LearningOutcome ;\n    rdfs:label "${outcome.text}"@en`;
          
          if (outcome.text_et) {
            turtle += `,\n        "${outcome.text_et}"@et`;
          }
          turtle += ` ;\n`;
          turtle += `    eduschema:schoolLevel "${outcome.school_level}" ;\n`;
          if (outcome.grade_range) {
            turtle += `    eduschema:gradeRange "${outcome.grade_range}" ;\n`;
          }
          if (outcome.expects && outcome.expects.length > 0) {
            turtle += `    eduschema:expects "${outcome.expects.join('", "')}" ;\n`;
          }
          if (outcome.consists_of && outcome.consists_of.length > 0) {
            turtle += `    eduschema:consistsOf "${outcome.consists_of.join('", "')}" ;\n`;
          }
          turtle += `    eduschema:status "${outcome.status}" .\n\n`;
        });
      });
    });

    return turtle;
  };

  const getExportPayload = () => {
    switch (format) {
      case "json-ld":
        return {
          content: generateJSONLD(),
          mime: "application/ld+json",
          extension: "jsonld",
        };
      case "turtle":
        return {
          content: generateTurtle(),
          mime: "text/turtle",
          extension: "ttl",
        };
      default:
        return {
          content: JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              version: "1.0",
              subjects,
              topics,
              outcomes,
            },
            null,
            2,
          ),
          mime: "application/json",
          extension: "json",
        };
    }
  };

  const downloadFile = () => {
    const payload = getExportPayload();
    const blob = new Blob([payload.content], { type: payload.mime });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `curriculum-export-${new Date().toISOString().split('T')[0]}.${payload.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const payload = getExportPayload();
    navigator.clipboard.writeText(payload.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewPayload = getExportPayload();

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Eksport & API</h1>
          <p className="text-slate-600">Ekspordi õppekava andmed masinloetavates formaatides</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-600" />
                  Ekspordi andmed
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? 'Kopeeritud!' : 'Kopeeri'}
                  </Button>
                  <Button size="sm" onClick={downloadFile} className="bg-indigo-600 hover:bg-indigo-700">
                    <Download className="w-4 h-4 mr-2" />
                    Lae alla
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
              >
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="json-ld">JSON-LD</TabsTrigger>
                  <TabsTrigger value="turtle">Turtle (RDF)</TabsTrigger>
                  <TabsTrigger value="json">Lihtne JSON</TabsTrigger>
                </TabsList>
                
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>Märkus:</strong> JSON-LD ja Turtle sisaldavad identset semantilist sisu. 
                    JSON-LD on soovitatav API integratsioonideks; Turtle on ideaalne täielikuks andmevahetuseks.
                  </AlertDescription>
                </Alert>

                <div className="relative">
                  <Textarea
                    value={previewPayload.content}
                    readOnly
                    className="font-mono text-xs h-[500px] bg-slate-900 text-green-400 border-slate-700"
                  />
                </div>

                {format === 'json-ld' && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto flex items-center gap-2 text-blue-600 hover:text-blue-700">
                          <Book className="w-4 h-4" />
                          Vaata RDF skeemi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>RDF Skeem (Turtle)</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-sm text-blue-900">
                              See skeem defineerib RDF struktuuri, mida kasutatakse õppekava andmete eksportimisel.
                            </AlertDescription>
                          </Alert>
                          <Textarea
                            value={rdfSchema}
                            readOnly
                            className="font-mono text-xs h-[500px] bg-slate-900 text-green-400 border-slate-700"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(rdfSchema);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="w-full"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Kopeeri skeem
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <span className="text-slate-500">@context: eduschema</span>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5 text-blue-600" />
                  Ekspordi statistika
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Õppeained</span>
                  <Badge variant="secondary">{subjects.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Teemad</span>
                  <Badge variant="secondary">{topics.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Õpiväljundid</span>
                  <Badge variant="secondary">{outcomes.length}</Badge>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Kokku kirjeid</span>
                    <Badge className="bg-blue-600">{subjects.length + topics.length + outcomes.length}</Badge>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Eksporditud: {new Date().toLocaleDateString('et-EE')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>API lõpp-punktid</span>
                  <a 
                    href="/api/docs" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Dokumentatsioon
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/subjects</p>
                  <p className="text-xs text-slate-500">Kõik õppeained</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/topics</p>
                  <p className="text-xs text-slate-500">Kõik teemad</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/outcomes</p>
                  <p className="text-xs text-slate-500">Kõik õpiväljundid</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/outcomes/:id</p>
                  <p className="text-xs text-slate-500">Üks õpiväljund koos seostega</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-indigo-200">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/export.jsonld</p>
                  <p className="text-xs text-slate-500">Täielik eksport JSON-LD vormingus</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-indigo-200">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/export.ttl</p>
                  <p className="text-xs text-slate-500">Täielik eksport Turtle (RDF) vormingus</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Kõik ekspordinupud kasutavad samu API otspunkte, tagades järjepidevuse liidese ja 
                    väliste integratsioonide vahel.
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-600 font-medium mb-1">Päringute parameetrid:</p>
                  <p className="text-xs text-slate-500">
                    <code className="bg-slate-100 px-1 py-0.5 rounded">?include=expects,consistsOf</code> – 
                    lisa seosed
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-600 font-medium mb-1">Accept päised:</p>
                  <p className="text-xs text-slate-500">
                    <code className="bg-slate-100 px-1 py-0.5 rounded">application/ld+json</code>
                    {' '}või{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">text/turtle</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Formaadi informatsioon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-900 mb-1">JSON-LD</p>
                  <p className="text-xs">
                    Linked Data vorming koos RDF kontekstiga (soovitatav integratsioonideks). 
                    Sisaldab täielikku semantilist struktuuri ja seoseid.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Turtle (RDF)</p>
                  <p className="text-xs">
                    Kompaktne inimloetav semantilise graafi vorming. Ideaalne täielikuks 
                    andmevahetuseks ja RDF tööriistu kasutamiseks.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Lihtne JSON</p>
                  <p className="text-xs">
                    Põhiline andmete eksport ilma RDF kontekstita. Sobib lihtsateks 
                    integratsioonideks, kus ei ole vaja semantilist struktuuri.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    <strong>Märkus:</strong> Kõik ekspordid on versioonitud; iga eksport sisaldab 
                    <code className="bg-slate-100 px-1 py-0.5 rounded mx-1">generatedAtTime</code> 
                    omadust ajatemplit.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
