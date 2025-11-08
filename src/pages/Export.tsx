
import { useMemo, useState } from "react";
import { curriculum, type Subject, type Topic, type LearningOutcome, type SkillBit } from "@/api/curriculumClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Code, Copy, Check, ExternalLink, Book } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildTopicTreeBySubject, type TopicTreeNode } from "@/lib/topicHierarchy";

type ExportFormat = "json-ld" | "turtle" | "json";
const PREVIEW_LINE_LIMIT = 100;

export default function Export() {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("json-ld");
  const [schemaDialogOpen, setSchemaDialogOpen] = useState(false);

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: () => curriculum.entities.Subject.list(),
  });

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["topics"],
    queryFn: () => curriculum.entities.Topic.list(),
  });

  const { data: outcomes = [] } = useQuery<LearningOutcome[]>({
    queryKey: ["outcomes"],
    queryFn: () => curriculum.entities.LearningOutcome.list(),
  });

  const { data: skillBits = [] } = useQuery<SkillBit[]>({
    queryKey: ["skillbits"],
    queryFn: () => curriculum.entities.SkillBit.list(),
  });

  const skillBitsByOutcome = useMemo(() => {
    const map: Record<string, SkillBit[]> = {};
    skillBits.forEach((skill) => {
      if (!map[skill.outcome_id]) {
        map[skill.outcome_id] = [];
      }
      map[skill.outcome_id].push(skill);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => {
        const aOrder = a.manual_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.manual_order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return b.created_at - a.created_at;
      }),
    );
    return map;
  }, [skillBits]);

  const topicTreeBySubject = useMemo(() => buildTopicTreeBySubject(topics), [topics]);

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

eduschema:SkillBit a owl:Class ;
    rdfs:label "Osaoskus"@et ;
    rdfs:label "Skill-bit"@en ;
    rdfs:comment "Konkreetne oskus, mis kuulub õpiväljundi alla"@et .

eduschema:CurriculumExport a owl:Class ;
    rdfs:label "Õppekava eksport"@et ;
    rdfs:label "Curriculum Export"@en ;
    rdfs:comment "Õppekava andmete eksport"@et .

# Properties
eduschema:hasTopic a owl:ObjectProperty ;
    rdfs:label "sisaldab teemat"@et ;
    rdfs:domain eduschema:Subject ;
    rdfs:range eduschema:Topic .

eduschema:hasSubtopic a owl:ObjectProperty ;
    rdfs:label "sisaldab alamteemat"@et ;
    rdfs:comment "Viitab teema alluvatele alamteemadele"@et ;
    rdfs:domain eduschema:Topic ;
    rdfs:range eduschema:Topic .

eduschema:parentTopic a owl:ObjectProperty ;
    rdfs:label "kuulub teemale"@et ;
    rdfs:comment "Viitab alamteema ülemteemale"@et ;
    rdfs:domain eduschema:Topic ;
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

eduschema:hasSkillBit a owl:ObjectProperty ;
    rdfs:label "sisaldab osaoskust"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range eduschema:SkillBit .

eduschema:belongsToLearningOutcome a owl:ObjectProperty ;
    rdfs:label "kuulub õpiväljundile"@et ;
    rdfs:domain eduschema:SkillBit ;
    rdfs:range eduschema:LearningOutcome .

eduschema:schoolLevel a owl:DatatypeProperty ;
    rdfs:label "kooliaste"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range xsd:string .

eduschema:gradeRange a owl:DatatypeProperty ;
    rdfs:label "klasside vahemik"@et ;
    rdfs:domain eduschema:LearningOutcome ;
    rdfs:range xsd:string .

eduschema:manualOrder a owl:DatatypeProperty ;
    rdfs:label "käsitsi järjekord"@et ;
    rdfs:domain eduschema:SkillBit ;
    rdfs:range xsd:integer .

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

eduschema:totalSkillBits a owl:DatatypeProperty ;
    rdfs:label "osaoskuste arv"@et ;
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
        "hasSubtopic": "eduschema:hasSubtopic",
        "parentTopic": "eduschema:parentTopic",
        "hasOutcome": "eduschema:hasOutcome",
        "schoolLevel": "eduschema:schoolLevel",
        "expects": "eduschema:expects",
        "consistsOf": "eduschema:consistsOf",
        "hasSkillBit": "eduschema:hasSkillBit",
        "belongsToLearningOutcome": "eduschema:belongsToLearningOutcome",
        "manualOrder": "eduschema:manualOrder"
      },
      "@id": "https://oppekava.edu.ee/export",
      "@type": "eduschema:CurriculumExport",
      "generatedAtTime": new Date().toISOString(),
      "version": "1.0",
      "totalSubjects": subjects.length,
      "totalTopics": topics.length,
      "totalOutcomes": outcomes.length,
      "totalSkillBits": skillBits.length,
      "totalItems": subjects.length + topics.length + outcomes.length + skillBits.length,
      "@graph": [],
    };

    const buildTopicNode = (node: TopicTreeNode, parentId?: string) => {
      const topic = node.topic;
      const topicId = topic.uri || `https://oppekava.edu.ee/topics/${topic.id}`;
      const topicNode: Record<string, unknown> & {
        hasOutcome: Record<string, unknown>[];
        hasSubtopic?: Record<string, unknown>[];
        parentTopic?: string;
      } = {
        "@id": topicId,
        "@type": "eduschema:Topic",
        "name": topic.name,
        "name_et": topic.name_et,
        "description": topic.description,
        "order_index": topic.order_index,
        "status": topic.status,
        "hasOutcome": [],
      };

      if (parentId) {
        topicNode.parentTopic = parentId;
      }

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
          "status": outcome.status,
        };

        if (outcome.expects && outcome.expects.length > 0) {
          (outcomeNode as { expects: string[] }).expects = outcome.expects;
        }
        if (outcome.consists_of && outcome.consists_of.length > 0) {
          (outcomeNode as { consistsOf: string[] }).consistsOf = outcome.consists_of;
        }
        const outcomeSkills = skillBitsByOutcome[outcome.id] ?? [];
        if (outcomeSkills.length > 0) {
          (outcomeNode as { hasSkillBit: Record<string, unknown>[] }).hasSkillBit = outcomeSkills.map((skill) => ({
            "@id": `https://oppekava.edu.ee/skillbits/${skill.id}`,
            "@type": "eduschema:SkillBit",
            "name": skill.label,
            "manualOrder": skill.manual_order,
            "belongsToLearningOutcome": outcomeNode["@id"],
          }));
        }

        topicNode.hasOutcome.push(outcomeNode);
      });

      if (node.children.length > 0) {
        topicNode.hasSubtopic = node.children.map((child) => buildTopicNode(child, topicId));
      }

      return topicNode;
    };

    subjects.forEach((subject) => {
      const subjectNode: Record<string, unknown> & { hasTopic: Record<string, unknown>[] } = {
        "@id": subject.uri || `https://oppekava.edu.ee/subjects/${subject.id}`,
        "@type": "eduschema:Subject",
        "name": subject.title,
        "description": subject.description,
        "status": subject.status,
        "hasTopic": [],
      };

      const subjectTopics = topicTreeBySubject[subject.id] ?? [];
      subjectTopics.forEach((topicNode) => {
        subjectNode.hasTopic.push(buildTopicNode(topicNode));
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
    eduschema:totalOutcomes ${outcomes.length} ;
    eduschema:totalSkillBits ${skillBits.length} .

`;

    const renderOutcomeNode = (outcome: LearningOutcome) => {
      const outcomeUri = outcome.uri || `https://oppekava.edu.ee/outcomes/${outcome.id}`;
      const outcomeSkills = skillBitsByOutcome[outcome.id] ?? [];
      let block = `<${outcomeUri}> a eduschema:LearningOutcome ;\n    rdfs:label "${outcome.text}"@en`;
      if (outcome.text_et) {
        block += `,\n        "${outcome.text_et}"@et`;
      }
      block += ` ;\n`;
      if (outcome.school_level) {
        block += `    eduschema:schoolLevel "${outcome.school_level}" ;\n`;
      }
      if (outcome.grade_range) {
        block += `    eduschema:gradeRange "${outcome.grade_range}" ;\n`;
      }
      if (outcome.expects && outcome.expects.length > 0) {
        block += `    eduschema:expects "${outcome.expects.join('", "')}" ;\n`;
      }
      if (outcome.consists_of && outcome.consists_of.length > 0) {
        block += `    eduschema:consistsOf "${outcome.consists_of.join('", "')}" ;\n`;
      }
      if (outcomeSkills.length > 0) {
        outcomeSkills.forEach((skill, idx) => {
          const skillUri = `https://oppekava.edu.ee/skillbits/${skill.id}`;
          block += `    eduschema:hasSkillBit <${skillUri}>`;
          block += idx === outcomeSkills.length - 1 ? ` ;\n` : ` ,\n`;
        });
      }
      block += `    eduschema:status "${outcome.status}" .\n\n`;
      return block;
    };

    const renderTopicNode = (node: TopicTreeNode, parentUri?: string) => {
      const topic = node.topic;
      const topicUri = topic.uri || `https://oppekava.edu.ee/topics/${topic.id}`;
      let block = `<${topicUri}> a eduschema:Topic ;\n    rdfs:label "${topic.name}"@en`;
      if (topic.name_et) {
        block += `,\n        "${topic.name_et}"@et`;
      }
      block += ` ;\n`;

      if (topic.description) {
        block += `    rdfs:comment "${topic.description}" ;\n`;
      }
      if (parentUri) {
        block += `    eduschema:parentTopic <${parentUri}> ;\n`;
      }

      const childUris = node.children.map((child) => child.topic.uri || `https://oppekava.edu.ee/topics/${child.topic.id}`);
      if (childUris.length > 0) {
        childUris.forEach((childUri, idx) => {
          block += `    eduschema:hasSubtopic <${childUri}>`;
          block += idx < childUris.length - 1 ? ` ,\n` : ` ;\n`;
        });
      }

      const topicOutcomes = outcomes.filter((o) => o.topic_id === topic.id);
      if (topicOutcomes.length > 0) {
        topicOutcomes.forEach((outcome, idx) => {
          const outcomeUri = outcome.uri || `https://oppekava.edu.ee/outcomes/${outcome.id}`;
          block += `    eduschema:hasOutcome <${outcomeUri}>`;
          block += idx < topicOutcomes.length - 1 ? ` ,\n` : ` ;\n`;
        });
      }

      block += `    eduschema:status "${topic.status}" .\n\n`;
      topicOutcomes.forEach((outcome) => {
        block += renderOutcomeNode(outcome);
      });
      node.children.forEach((child) => {
        block += renderTopicNode(child, topicUri);
      });
      return block;
    };

    subjects.forEach((subject) => {
      const subjectUri = subject.uri || `https://oppekava.edu.ee/subjects/${subject.id}`;
      turtle += `<${subjectUri}> a eduschema:Subject ;\n    rdfs:label "${subject.title}"@en ;\n`;

      if (subject.description) {
        turtle += `    rdfs:comment "${subject.description}" ;\n`;
      }

      const subjectTopics = topicTreeBySubject[subject.id] ?? [];
      if (subjectTopics.length > 0) {
        subjectTopics.forEach((topicNode, idx) => {
          const topicUri = topicNode.topic.uri || `https://oppekava.edu.ee/topics/${topicNode.topic.id}`;
          turtle += `    eduschema:hasTopic <${topicUri}>`;
          turtle += idx < subjectTopics.length - 1 ? ` ,\n` : ` ;\n`;
        });
      }

      turtle += `    eduschema:status "${subject.status}" .\n\n`;

      subjectTopics.forEach((topicNode) => {
        turtle += renderTopicNode(topicNode);
      });
    });

    const outcomeUriMap = new Map(
      outcomes.map((outcome) => [outcome.id, outcome.uri || `https://oppekava.edu.ee/outcomes/${outcome.id}`]),
    );

    skillBits.forEach((skill) => {
      const skillUri = `https://oppekava.edu.ee/skillbits/${skill.id}`;
      const parentOutcomeUri = outcomeUriMap.get(skill.outcome_id) || `https://oppekava.edu.ee/outcomes/${skill.outcome_id}`;
      turtle += `<${skillUri}> a eduschema:SkillBit ;\n    rdfs:label "${skill.label}"@en ;\n`;
      if (typeof skill.manual_order === "number") {
        turtle += `    eduschema:manualOrder ${skill.manual_order} ;\n`;
      }
      turtle += `    eduschema:belongsToLearningOutcome <${parentOutcomeUri}> .\n\n`;
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
              skillBits,
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
  const previewLines = previewPayload.content.split("\n");
  const truncatedPreview =
    previewLines.length > PREVIEW_LINE_LIMIT
      ? `${previewLines.slice(0, PREVIEW_LINE_LIMIT).join("\n")}\n...\n(Preview truncated. Download for full content.)`
      : previewPayload.content;
  const previewIsTruncated = previewLines.length > PREVIEW_LINE_LIMIT;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Export & API</h1>
          <p className="text-slate-600">Export curriculum data in machine-readable formats</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 min-h-[80vh]">
          <Card className="lg:col-span-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-600" />
                  Export Data
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button size="sm" onClick={downloadFile} className="bg-indigo-600 hover:bg-indigo-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download
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
                  <TabsTrigger value="json">Simple JSON</TabsTrigger>
                </TabsList>
                
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm text-blue-900">
                    <strong>Note:</strong> JSON-LD and Turtle contain identical semantic content.
                    JSON-LD works best for API integrations; Turtle is ideal for full RDF data exchange.
                  </AlertDescription>
                </Alert>

                <div className="relative">
                  <Textarea
                    value={truncatedPreview}
                    readOnly
                    className="font-mono text-xs h-[640px] bg-transparent text-green-400 border-slate-700"
                    style={{ backgroundColor: "#0f172a" }}
                  />
                  {previewIsTruncated ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Showing the first 20 lines. Download to view the full export.
                    </p>
                  ) : null}
                </div>

                {format === 'json-ld' && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <Dialog open={schemaDialogOpen} onOpenChange={setSchemaDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" className="p-0 h-auto flex items-center gap-2 text-blue-600 hover:text-blue-700">
                          <Book className="w-4 h-4" />
                          View RDF schema
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>RDF Schema (Turtle)</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Alert className="bg-blue-50 border-blue-200">
                            <AlertDescription className="text-sm text-blue-900">
                              This schema defines the RDF structure used when exporting curriculum data.
                            </AlertDescription>
                          </Alert>
                          <Textarea
                            value={rdfSchema}
                            readOnly
                            className="font-mono text-xs h-[640px] bg-transparent text-green-400 border-slate-700"
                            style={{ backgroundColor: "#0f172a" }}
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
                            Copy schema
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
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>API Endpoints</span>
                  <a
                    href="/api/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Documentation
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/subjects</p>
                  <p className="text-xs text-slate-500">List all subjects</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/topics</p>
                  <p className="text-xs text-slate-500">List all topics</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/outcomes</p>
                  <p className="text-xs text-slate-500">List all learning outcomes</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/outcomes/:id</p>
                  <p className="text-xs text-slate-500">Single learning outcome with relations</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-indigo-200">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/export.jsonld</p>
                  <p className="text-xs text-slate-500">Full export in JSON-LD format</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border-2 border-indigo-200">
                  <p className="text-xs font-mono text-slate-700 mb-1">GET /api/export.ttl</p>
                  <p className="text-xs text-slate-500">Full export in Turtle (RDF) format</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    All export actions call the same API endpoints, keeping the UI and integrations aligned.
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-600 font-medium mb-1">Query parameters:</p>
                  <p className="text-xs text-slate-500">
                    <code className="bg-slate-100 px-1 py-0.5 rounded">?include=expects,consistsOf</code> -
                    include relation identifiers
                  </p>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-600 font-medium mb-1">Accept headers:</p>
                  <p className="text-xs text-slate-500">
                    <code className="bg-slate-100 px-1 py-0.5 rounded">application/ld+json</code>
                    {" "}or{" "}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">text/turtle</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Format Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div>
                  <p className="font-medium text-slate-900 mb-1">JSON-LD</p>
                  <p className="text-xs">
                    Linked Data format with an RDF context, recommended for integrations that need semantic structure.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Turtle (RDF)</p>
                  <p className="text-xs">
                    Compact, human-readable RDF notation. Ideal for full data exchange and RDF toolchains.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-slate-900 mb-1">Simple JSON</p>
                  <p className="text-xs">
                    Basic export without RDF context. Useful for lightweight integrations that do not require semantics.
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    <strong>Note:</strong> All exports are versioned and include a
                    <code className="bg-slate-100 px-1 py-0.5 rounded mx-1">generatedAtTime</code>
                    timestamp.
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
