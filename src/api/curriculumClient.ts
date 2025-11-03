type BaseEntity = {
  id: string;
  created_at: number;
  updated_at: number;
};

export type Subject = BaseEntity & {
  name: string;
  name_et?: string;
  description?: string;
  uri?: string;
  code?: string;
  status?: "draft" | "published";
};

export type Topic = BaseEntity & {
  name: string;
  name_et?: string;
  description?: string;
  subject_id: string;
  uri?: string;
  order_index?: number;
  status?: "draft" | "published";
};

export type LearningOutcome = BaseEntity & {
  text?: string;
  text_et?: string;
  topic_id: string;
  school_level?: string;
  class?: string;
  grade_range?: string;
  uri?: string;
  status?: "draft" | "published";
  order_index?: number;
  expects?: string[];
  consists_of?: string[];
  related_outcomes?: string[];
};

type CurriculumState = {
  subjects: Subject[];
  topics: Topic[];
  outcomes: LearningOutcome[];
};

const STORAGE_KEY = "curriculum-demo-state";

const defaultState: CurriculumState = {
  subjects: [
    makeSubject({
      id: "subj-math",
      name: "Mathematics",
      name_et: "Matemaatika",
      description: "Mathematics curriculum for Estonian schools",
      code: "MATH",
      status: "published",
      uri: "https://oppekava.edu.ee/subjects/mathematics",
    }),
    makeSubject({
      id: "subj-prog",
      name: "Programming",
      name_et: "Programmeerimine",
      description: "Core programming skills and software development processes",
      code: "PROG",
      status: "published",
      uri: "https://oppekava.edu.ee/subjects/programming",
    }),
  ],
  topics: [
    makeTopic({
      id: "topic-algebra",
      subject_id: "subj-math",
      name: "Algebra",
      name_et: "Algebra",
      description: "Expressions, equations and algebraic reasoning",
      status: "published",
      uri: "https://oppekava.edu.ee/topics/algebra",
      order_index: 1,
    }),
    makeTopic({
      id: "topic-geometry",
      subject_id: "subj-math",
      name: "Geometry",
      name_et: "Geomeetria",
      description: "Shapes, measurement and spatial reasoning",
      status: "draft",
      uri: "https://oppekava.edu.ee/topics/geometry",
      order_index: 2,
    }),
    makeTopic({
      id: "topic-software",
      subject_id: "subj-prog",
      name: "Software Development",
      name_et: "Tarkvaraarendus",
      description: "Software engineering lifecycle and collaboration practices",
      status: "published",
      uri: "https://oppekava.edu.ee/topics/software-development",
      order_index: 1,
    }),
  ],
  outcomes: [
    makeOutcome({
      id: "lo-1",
      topic_id: "topic-algebra",
      text:
        "Simplifies algebraic fractions and performs addition, subtraction, multiplication and division with them.",
      text_et:
        "Kasutab harilike murdudega tehteid sooritades ühiskordse ja ühisteguri leidmist.",
      school_level: "III",
      status: "published",
      order_index: 1,
      uri: "https://oppekava.edu.ee/outcomes/algebra-1",
    }),
    makeOutcome({
      id: "lo-2",
      topic_id: "topic-algebra",
      text: "Solves linear equations and inequalities and applies them in problem solving.",
      text_et: "Lahendab lineaarvõrrandeid ja -võrratusi ning rakendab neid reaalsete probleemide lahendamisel.",
      school_level: "III",
      status: "draft",
      order_index: 2,
      uri: "https://oppekava.edu.ee/outcomes/algebra-2",
      expects: ["lo-1"],
    }),
    makeOutcome({
      id: "lo-3",
      topic_id: "topic-software",
      text: "Documents created applications in English following team conventions.",
      text_et: "Dokumenteerib loodud rakendused inglise keeles.",
      school_level: "Gymnasium",
      status: "published",
      order_index: 1,
      uri: "https://oppekava.edu.ee/outcomes/software-1",
    }),
    makeOutcome({
      id: "lo-4",
      topic_id: "topic-software",
      text: "Collaborates in agile software development teams and participates in sprint reviews.",
      text_et: "Töötab koos meeskonnaga agiilses tarkvaraarenduse protsessis ning osaleb sprindi ülevaatustel.",
      school_level: "Gymnasium",
      status: "published",
      order_index: 2,
      uri: "https://oppekava.edu.ee/outcomes/software-2",
      consists_of: ["lo-3"],
    }),
  ],
};

let state: CurriculumState = loadInitialState();
let datasetSnapshot: CurriculumState | null = null;
let datasetLoaded = false;
let datasetPromise: Promise<void> | null = null;

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

async function ensureDatasetReady(force = false) {
  if (datasetLoaded && !force) {
    return;
  }
  if (datasetPromise) {
    await datasetPromise;
    return;
  }
  await loadDataset(force);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function now() {
  return Date.now();
}

function makeBase(id?: string): BaseEntity {
  const timestamp = now();
  return {
    id: id ?? createId("item"),
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function makeSubject(data: Omit<Subject, keyof BaseEntity> & { id?: string }): Subject {
  return {
    ...makeBase(data.id),
    ...data,
  };
}

function makeTopic(data: Omit<Topic, keyof BaseEntity> & { id?: string }): Topic {
  return {
    ...makeBase(data.id),
    ...data,
  };
}

function makeOutcome(data: Omit<LearningOutcome, keyof BaseEntity> & { id?: string }): LearningOutcome {
  return {
    ...makeBase(data.id),
    ...data,
  };
}

function slugify(source: string, fallback: string) {
  const base = source
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/õ/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || fallback;
}

function ensureUniqueId(prefix: string, source: string, index: number, bucket: Map<string, number>) {
  const slug = slugify(source, `${prefix}-${index}`);
  const usage = bucket.get(slug) ?? 0;
  bucket.set(slug, usage + 1);
  return usage === 0 ? slug : `${slug}-${usage + 1}`;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadInitialState(): CurriculumState {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as CurriculumState;
        if (stored && stored.subjects && stored.topics && stored.outcomes) {
          return stored;
        }
      }
    } catch {
      // If storage parsing fails we silently fall back to defaults
    }
  }
  return clone(defaultState);
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

function notify() {
  for (const subscriber of subscribers) {
    subscriber();
  }
}

function sortByOrder<T extends { order_index?: number; created_at: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aIndex = a.order_index ?? Number.MAX_SAFE_INTEGER;
    const bIndex = b.order_index ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return b.created_at - a.created_at;
  });
}

function sortByCreated<T extends BaseEntity>(items: T[], direction: "asc" | "desc" = "desc"): T[] {
  const sorted = [...items].sort((a, b) => a.created_at - b.created_at);
  return direction === "desc" ? sorted.reverse() : sorted;
}

type EntityName = "Subject" | "Topic" | "LearningOutcome";

const entityConfig: Record<
  EntityName,
  {
    key: keyof CurriculumState;
    prefix: string;
    factory: (data: any) => any;
  }
> = {
  Subject: { key: "subjects", prefix: "subj", factory: makeSubject },
  Topic: { key: "topics", prefix: "topic", factory: makeTopic },
  LearningOutcome: { key: "outcomes", prefix: "lo", factory: makeOutcome },
};

type EntityRecord<Name extends EntityName> = Name extends "Subject"
  ? Subject
  : Name extends "Topic"
    ? Topic
    : LearningOutcome;

type EntityInput<Name extends EntityName> = Omit<
  EntityRecord<Name>,
  keyof BaseEntity
> &
  Partial<Pick<EntityRecord<Name>, "id">>;

function createEntityApi<Name extends EntityName>(entityName: Name) {
  const config = entityConfig[entityName];

  return {
    async list(order?: string): Promise<EntityRecord<Name>[]> {
      await ensureDatasetReady();
      const rawItems = state[config.key] as EntityRecord<Name>[];
      let items = [...rawItems];

      if (order === "-created_date") {
        items = sortByCreated(items, "desc");
      } else if (order === "created_date") {
        items = sortByCreated(items, "asc");
      } else if (order === "order_index" && entityName !== "Subject") {
        items = sortByOrder(items as Array<{ order_index?: number; created_at: number }>) as EntityRecord<Name>[];
      } else if (order === "-order_index" && entityName !== "Subject") {
        items = sortByOrder(items as Array<{ order_index?: number; created_at: number }>)
          .reverse() as EntityRecord<Name>[];
      }

      return clone(items);
    },

    async create(data: EntityInput<Name>): Promise<EntityRecord<Name>> {
      await ensureDatasetReady();
      const id = data.id ?? createId(config.prefix);
      const entity = config.factory({ ...data, id }) as EntityRecord<Name>;

      const current = state[config.key] as EntityRecord<Name>[];
      state = {
        ...state,
        [config.key]: [entity, ...current],
      };

      if (entityName === "Topic") {
        state.topics = sortByOrder(state.topics);
      }

      if (entityName === "LearningOutcome") {
        state.outcomes = sortByOrder(state.outcomes);
      }

      persist();
      notify();

      return clone(entity);
    },

    async update(id: string, data: Partial<EntityInput<Name>>): Promise<EntityRecord<Name>> {
      await ensureDatasetReady();
      const collection = state[config.key] as EntityRecord<Name>[];
      const index = collection.findIndex((item) => item.id === id);
      if (index === -1) {
        throw new Error(`${entityName} with id "${id}" not found`);
      }

      const updated: EntityRecord<Name> = {
        ...collection[index],
        ...data,
        updated_at: now(),
      } as EntityRecord<Name>;

      const updatedCollection = [...collection];
      updatedCollection[index] = updated;

      state = {
        ...state,
        [config.key]: updatedCollection,
      };

      if (entityName === "Topic") {
        state.topics = sortByOrder(state.topics);
      }

      if (entityName === "LearningOutcome") {
        state.outcomes = sortByOrder(state.outcomes);
      }

      persist();
      notify();

      return clone(updated);
    },

    async delete(id: string): Promise<void> {
      await ensureDatasetReady();
      if (entityName === "Subject") {
        cascadeDeleteSubject(id);
      } else if (entityName === "Topic") {
        cascadeDeleteTopic(id);
      } else {
        cascadeDeleteOutcome(id);
      }

      persist();
      notify();
    },
  };
}

function cascadeDeleteSubject(subjectId: string) {
  const remainingSubjects = state.subjects.filter((subject) => subject.id !== subjectId);
  const topicIdsToDelete = state.topics.filter((topic) => topic.subject_id === subjectId).map((t) => t.id);
  const remainingTopics = state.topics.filter((topic) => topic.subject_id !== subjectId);
  const remainingOutcomes = state.outcomes.filter((outcome) => !topicIdsToDelete.includes(outcome.topic_id));

  state = {
    subjects: remainingSubjects,
    topics: remainingTopics,
    outcomes: remainingOutcomes,
  };
}

function cascadeDeleteTopic(topicId: string) {
  const remainingTopics = state.topics.filter((topic) => topic.id !== topicId);
  const remainingOutcomes = state.outcomes.filter((outcome) => outcome.topic_id !== topicId);

  state = {
    ...state,
    topics: remainingTopics,
    outcomes: remainingOutcomes,
  };
}

function cascadeDeleteOutcome(outcomeId: string) {
  const remainingOutcomes = state.outcomes.filter((outcome) => outcome.id !== outcomeId);

  state = {
    ...state,
    outcomes: remainingOutcomes,
  };

  state.outcomes = state.outcomes.map((outcome) => ({
    ...outcome,
    expects: outcome.expects?.filter((id) => id !== outcomeId),
    consists_of: outcome.consists_of?.filter((id) => id !== outcomeId),
  }));
}

type RawDataset = {
  subjects?: string[];
  topics?: Array<{
    text?: string;
    url?: string;
    subject?: string[];
    school_level?: string[];
    parent_topic?: string[];
  }>;
  learning_outcomes?: Array<{
    text?: string;
    url?: string;
    subject?: string[];
    school_level?: string[];
    topic?: string[];
    expects?: string[];
    consists_of?: string[];
  }>;
};

type SerializedSubject = {
  id: string;
  name?: string | null;
  name_et?: string | null;
  description?: string | null;
  uri?: string | null;
  code?: string | null;
  status?: "draft" | "published" | null;
};

type SerializedTopic = {
  id: string;
  subject_id?: string | null;
  name?: string | null;
  name_et?: string | null;
  description?: string | null;
  uri?: string | null;
  order_index?: number | null;
  status?: "draft" | "published" | null;
};

type SerializedOutcome = {
  id: string;
  text?: string | null;
  text_et?: string | null;
  topic_id?: string | null;
  school_level?: string | null;
  uri?: string | null;
  status?: "draft" | "published" | null;
  order_index?: number | null;
  expects?: string[] | null;
  consists_of?: string[] | null;
};

async function fetchSplitDataset(): Promise<CurriculumState | null> {
  try {
    const [subjectsRes, topicsRes, outcomesRes] = await Promise.all([
      fetch("/data/subjects.json", { cache: "no-store" }),
      fetch("/data/topics.json", { cache: "no-store" }),
      fetch("/data/outcomes.json", { cache: "no-store" }),
    ]);

    if (!subjectsRes.ok || !topicsRes.ok || !outcomesRes.ok) {
      return null;
    }

    const [subjectsRaw, topicsRaw, outcomesRaw] = (await Promise.all([
      subjectsRes.json(),
      topicsRes.json(),
      outcomesRes.json(),
    ])) as [SerializedSubject[], SerializedTopic[], SerializedOutcome[]];

    const subjectRecords = subjectsRaw.map((record, index) =>
      makeSubject({
        id: record.id,
        name: record.name ?? `Õppeaine ${index + 1}`,
        name_et: record.name_et ?? record.name ?? `Õppeaine ${index + 1}`,
        description: record.description ?? undefined,
        uri: record.uri ?? undefined,
        code: record.code ?? undefined,
        status: (record.status as Subject["status"]) ?? "draft",
      }),
    );

    const fallbackSubjectId = subjectRecords[0]?.id ?? createId("subject");
    if (!subjectRecords.length) {
      subjectRecords.push(
        makeSubject({
          id: fallbackSubjectId,
          name: "Määramata",
          name_et: "Määramata",
          status: "draft",
        }),
      );
    }

    const subjectSet = new Set(subjectRecords.map((subject) => subject.id));

    const topicRecords = topicsRaw.map((record, index) => {
      const subjectId = subjectSet.has(record.subject_id ?? "")
        ? (record.subject_id as string)
        : fallbackSubjectId;
      return makeTopic({
        id: record.id,
        subject_id: subjectId,
        name: record.name ?? `Teema ${index + 1}`,
        name_et: record.name_et ?? record.name ?? `Teema ${index + 1}`,
        description: record.description ?? undefined,
        uri: record.uri ?? undefined,
        order_index: record.order_index ?? index,
        status: (record.status as Topic["status"]) ?? "draft",
      });
    });

    const topicSet = new Set(topicRecords.map((topic) => topic.id));
    const outcomeRecords = outcomesRaw.map((record, index) => {
      const topicId = topicSet.has(record.topic_id ?? "")
        ? (record.topic_id as string)
        : topicRecords[0]?.id ?? fallbackSubjectId;
      return makeOutcome({
        id: record.id,
        text: record.text ?? undefined,
        text_et: record.text_et ?? record.text ?? undefined,
        topic_id: topicId,
        school_level: record.school_level ?? undefined,
        uri: record.uri ?? undefined,
        status: (record.status as LearningOutcome["status"]) ?? "draft",
        order_index: record.order_index ?? index,
        expects: Array.isArray(record.expects) ? record.expects.slice() : [],
        consists_of: Array.isArray(record.consists_of) ? record.consists_of.slice() : [],
      });
    });

    const validOutcome = new Set(outcomeRecords.map((outcome) => outcome.id));
    outcomeRecords.forEach((outcome) => {
      outcome.expects = outcome.expects?.filter((id) => validOutcome.has(id)) ?? [];
      outcome.consists_of = outcome.consists_of?.filter((id) => validOutcome.has(id)) ?? [];
    });

    return {
      subjects: subjectRecords,
      topics: sortByOrder(topicRecords),
      outcomes: sortByOrder(outcomeRecords),
    };
  } catch (error) {
    console.warn("[curriculum] Failed to load split dataset", error);
    return null;
  }
}

async function loadFromCombinedFile(): Promise<CurriculumState> {
  const response = await fetch("/data/oppekava.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.status} ${response.statusText}`);
  }
  const raw = (await response.json()) as RawDataset;

  const subjectNames = new Set<string>();
  if (Array.isArray(raw.subjects)) {
    raw.subjects.forEach((name) => {
      if (typeof name === "string" && name.trim()) {
        subjectNames.add(name.trim());
      }
    });
  }
  raw.topics?.forEach((topic) => {
    topic.subject?.forEach((name) => {
      if (typeof name === "string" && name.trim()) {
        subjectNames.add(name.trim());
      }
    });
  });
  raw.learning_outcomes?.forEach((outcome) => {
    outcome.subject?.forEach((name) => {
      if (typeof name === "string" && name.trim()) {
        subjectNames.add(name.trim());
      }
    });
  });

  if (subjectNames.size === 0) {
    subjectNames.add("Määramata");
  }

  const idUsage = new Map<string, number>();
  const subjectRecords: Subject[] = [];
  const subjectNameToId = new Map<string, string>();

  Array.from(subjectNames).forEach((name, index) => {
    const id = ensureUniqueId("subject", name, index, idUsage);
    const subject = makeSubject({
      id,
      name,
      name_et: name,
      status: "published",
    });
    subjectRecords.push(subject);
    subjectNameToId.set(name, subject.id);
  });

  const topicUsage = new Map<string, number>();
  const topicRecords: Topic[] = [];
  const topicLookup = new Map<string, string>();

  raw.topics?.forEach((topic, index) => {
    const subjectName = topic.subject?.find((name) => subjectNameToId.has(name));
    if (!subjectName) {
      return;
    }
    const subjectId = subjectNameToId.get(subjectName)!;
    const name = topic.text?.trim() || topic.url?.trim() || `Teema ${index + 1}`;
    const id = ensureUniqueId("topic", name, index, topicUsage);
    const record = makeTopic({
      id,
      subject_id: subjectId,
      name,
      name_et: name,
      description: topic.parent_topic?.join(", ") || undefined,
      uri: topic.url,
      order_index: index,
      status: "published",
    });
    topicRecords.push(record);
    if (topic.text) {
      topicLookup.set(topic.text, id);
    }
    if (topic.url) {
      topicLookup.set(topic.url, id);
    }
  });

  const fallbackSubjectId = subjectRecords[0]?.id ?? ensureUniqueId("subject", "default", 0, idUsage);
  if (!subjectRecords.length) {
    const fallbackSubject = makeSubject({
      id: fallbackSubjectId,
      name: "Määramata",
      name_et: "Määramata",
      status: "draft",
    });
    subjectRecords.push(fallbackSubject);
    subjectNameToId.set("Määramata", fallbackSubjectId);
  }

  const outcomeUsage = new Map<string, number>();
  const outcomeRecords: LearningOutcome[] = [];
  const outcomeLookup = new Map<string, LearningOutcome>();
  const awaitingRelations: Array<{
    record: LearningOutcome;
    expects: string[];
    consists: string[];
  }> = [];

  raw.learning_outcomes?.forEach((outcome, index) => {
    const title = outcome.text?.trim() || outcome.url?.trim() || `Õpiväljund ${index + 1}`;
    const id = ensureUniqueId("outcome", title, index, outcomeUsage);

    let topicId: string | undefined;
    const topicRef = outcome.topic?.[0];
    if (topicRef) {
      topicId = topicLookup.get(topicRef) ?? topicLookup.get(topicRef.trim());
    }
    if (!topicId && topicRef) {
      const generatedTopicId = ensureUniqueId("topic", topicRef, topicRecords.length, topicUsage);
      const generatedTopic = makeTopic({
        id: generatedTopicId,
        subject_id: subjectNameToId.get(outcome.subject?.[0] ?? "") ?? fallbackSubjectId,
        name: topicRef,
        name_et: topicRef,
        status: "draft",
        order_index: topicRecords.length,
      });
      topicRecords.push(generatedTopic);
      topicLookup.set(topicRef, generatedTopicId);
      topicLookup.set(topicRef.trim(), generatedTopicId);
      topicId = generatedTopicId;
    }
    if (!topicId) {
      topicId = topicRecords[0]?.id ?? ensureUniqueId("topic", "default-topic", 0, topicUsage);
      if (!topicRecords.length) {
        topicRecords.push(
          makeTopic({
            id: topicId,
            subject_id: fallbackSubjectId,
            name: "Määramata teema",
            status: "draft",
            order_index: 0,
          }),
        );
      }
    }

    const record = makeOutcome({
      id,
      text: outcome.text,
      text_et: outcome.text,
      topic_id: topicId,
      school_level: outcome.school_level?.[0],
      uri: outcome.url,
      order_index: index,
      status: "published",
      expects: [],
      consists_of: [],
    });

    outcomeRecords.push(record);
    if (outcome.text) {
      outcomeLookup.set(outcome.text, record);
    }
    if (outcome.url) {
      outcomeLookup.set(outcome.url, record);
    }

    awaitingRelations.push({
      record,
      expects: Array.isArray(outcome.expects) ? outcome.expects : [],
      consists: Array.isArray(outcome.consists_of) ? outcome.consists_of : [],
    });
  });

  awaitingRelations.forEach(({ record, expects, consists }) => {
    record.expects = expects
      .map((ref) => outcomeLookup.get(ref)?.id)
      .filter((value): value is string => Boolean(value));
    record.consists_of = consists
      .map((ref) => outcomeLookup.get(ref)?.id)
      .filter((value): value is string => Boolean(value));
  });

  return {
    subjects: subjectRecords,
    topics: sortByOrder(topicRecords),
    outcomes: sortByOrder(outcomeRecords),
  };
}

async function loadDataset(force = false) {
  if (typeof window === "undefined" || typeof fetch === "undefined") {
    return;
  }

  if (datasetLoaded && !force) {
    return;
  }

  if (datasetPromise) {
    return datasetPromise;
  }

  datasetPromise = (async () => {
    const splitState = await fetchSplitDataset();
    const nextState = splitState ?? (await loadFromCombinedFile());
    state = nextState;

    datasetSnapshot = clone(state);
    datasetLoaded = true;
    console.info(
      "[curriculum] dataset loaded",
      `${state.subjects.length} subjects`,
      `${state.topics.length} topics`,
      `${state.outcomes.length} outcomes`,
    );
    persist();
    notify();
  })();

  try {
    await datasetPromise;
  } finally {
    datasetPromise = null;
  }
}

export const curriculum = {
  entities: {
    Subject: createEntityApi("Subject"),
    Topic: createEntityApi("Topic"),
    LearningOutcome: createEntityApi("LearningOutcome"),
  },
  async load(force = false) {
    try {
      await ensureDatasetReady(force);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  getState(): CurriculumState {
    return clone(state);
  },
  subscribe(listener: Subscriber) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },
  reset() {
    if (datasetSnapshot) {
      state = clone(datasetSnapshot);
    } else {
      state = clone(defaultState);
    }
    persist();
    notify();
  },
};

export type { CurriculumState };
