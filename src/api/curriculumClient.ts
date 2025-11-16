type BaseEntity = {
  id: string;
  created_at: number;
  updated_at: number;
};

export type Subject = BaseEntity & {
  title: string;
  description?: string;
  uri?: string;
  status?: "draft" | "published";
};

export type Topic = BaseEntity & {
  name: string;
  name_et?: string;
  description?: string;
  subject_id: string;
  parent_topic_id?: string | null;
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

export type SkillBit = BaseEntity & {
  label: string;
  outcome_id: string;
  manual_order?: number;
};

type CurriculumState = {
  subjects: Subject[];
  topics: Topic[];
  outcomes: LearningOutcome[];
  skillBits: SkillBit[];
};

const STORAGE_KEY = "curriculum-demo-state";

function resolvePublicAsset(pathname: string) {
  const base = import.meta.env?.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  return `${normalizedBase}${normalizedPath}`;
}

const defaultState: CurriculumState = {
  subjects: [
    makeSubject({
      id: "subj-math",
      title: "Mathematics",
      description: "Mathematics curriculum for Estonian schools",
      status: "published",
      uri: "https://oppekava.edu.ee/subjects/mathematics",
    }),
    makeSubject({
      id: "subj-prog",
      title: "Programming",
      description: "Core programming skills and software development processes",
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
  skillBits: [
    makeSkillBit({
      id: "skill-lo-1-1",
      outcome_id: "lo-1",
      label: "Identifies least common denominators for complex fractions",
      manual_order: 1,
    }),
    makeSkillBit({
      id: "skill-lo-1-2",
      outcome_id: "lo-1",
      label: "Performs multi-step fraction calculations without a calculator",
      manual_order: 2,
    }),
    makeSkillBit({
      id: "skill-lo-2-1",
      outcome_id: "lo-2",
      label: "Transforms verbal algebra problems into linear equations",
      manual_order: 1,
    }),
    makeSkillBit({
      id: "skill-lo-2-2",
      outcome_id: "lo-2",
      label: "Checks solutions by substitution",
      manual_order: 2,
    }),
    makeSkillBit({
      id: "skill-lo-3-1",
      outcome_id: "lo-3",
      label: "Uses shared templates when writing release notes",
      manual_order: 1,
    }),
    makeSkillBit({
      id: "skill-lo-3-2",
      outcome_id: "lo-3",
      label: "Publishes documentation updates in English within sprint cadence",
      manual_order: 2,
    }),
    makeSkillBit({
      id: "skill-lo-4-1",
      outcome_id: "lo-4",
      label: "Facilitates daily stand-ups with clear blockers",
      manual_order: 1,
    }),
    makeSkillBit({
      id: "skill-lo-4-2",
      outcome_id: "lo-4",
      label: "Prepares demo-ready increments for sprint reviews",
      manual_order: 2,
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

function makeSkillBit(data: Omit<SkillBit, keyof BaseEntity> & { id?: string }): SkillBit {
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
          return {
            ...stored,
            subjects: stored.subjects.map((subject) => {
              const legacy = subject as Subject & { name?: string; name_et?: string };
              return {
                ...legacy,
                title: legacy.title ?? legacy.name ?? legacy.name_et ?? "Untitled subject",
              };
            }),
            topics: stored.topics.map((topic) => ({
              ...topic,
              parent_topic_id: topic.parent_topic_id ?? undefined,
            })),
            skillBits: Array.isArray(stored.skillBits) ? stored.skillBits : [],
          };
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

function getOrderingValue(item: { order_index?: number; manual_order?: number }) {
  if (typeof item.order_index === "number") {
    return item.order_index;
  }
  if (typeof item.manual_order === "number") {
    return item.manual_order;
  }
  return Number.MAX_SAFE_INTEGER;
}

function sortByOrder<T extends { order_index?: number; manual_order?: number; created_at: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aIndex = getOrderingValue(a);
    const bIndex = getOrderingValue(b);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return b.created_at - a.created_at;
  });
}

function sortSkillBits(items: SkillBit[]): SkillBit[] {
  return [...items].sort((a, b) => {
    if (a.outcome_id !== b.outcome_id) {
      return a.outcome_id.localeCompare(b.outcome_id);
    }
    const aIndex = getOrderingValue(a);
    const bIndex = getOrderingValue(b);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return b.created_at - a.created_at;
  });
}

function getNextSkillBitOrder(outcomeId: string) {
  const siblings = state.skillBits.filter((skill) => skill.outcome_id === outcomeId);
  return siblings.length + 1;
}

function normalizeSkillBitOrders(outcomeId?: string) {
  if (!outcomeId) return;
  const siblings = state.skillBits.filter((skill) => skill.outcome_id === outcomeId);
  if (!siblings.length) {
    state = { ...state, skillBits: sortSkillBits(state.skillBits) };
    return;
  }
  const ordered = sortByOrder(siblings);
  const normalized = ordered.map((skill, index) => {
    const nextOrder = index + 1;
    if (skill.manual_order === nextOrder) {
      return skill;
    }
    return {
      ...skill,
      manual_order: nextOrder,
      updated_at: now(),
    };
  });
  const others = state.skillBits.filter((skill) => skill.outcome_id !== outcomeId);
  state = {
    ...state,
    skillBits: sortSkillBits([...others, ...normalized]),
  };
}

function buildTopicChildMap() {
  const map = new Map<string, string[]>();
  state.topics.forEach((topic) => {
    const parentId = topic.parent_topic_id ?? undefined;
    if (!parentId) return;
    const siblings = map.get(parentId);
    if (siblings) {
      siblings.push(topic.id);
    } else {
      map.set(parentId, [topic.id]);
    }
  });
  return map;
}

function collectDescendantTopicIds(topicId: string) {
  const descendants: string[] = [];
  const childMap = buildTopicChildMap();
  const queue = [...(childMap.get(topicId) ?? [])];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    descendants.push(currentId);
    const children = childMap.get(currentId);
    if (children?.length) {
      queue.push(...children);
    }
  }
  return descendants;
}

function topicHasAncestor(candidateId: string, ancestorId: string) {
  const visited = new Set<string>();
  let current = state.topics.find((topic) => topic.id === candidateId);
  while (current?.parent_topic_id) {
    const parentId = current.parent_topic_id;
    if (parentId === ancestorId) {
      return true;
    }
    if (visited.has(parentId)) {
      break;
    }
    visited.add(parentId);
    current = state.topics.find((topic) => topic.id === parentId);
  }
  return false;
}

function normalizeParentTopicId(value?: string | null) {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }
  return value;
}

function validateParentTopicAssignment(subjectId: string, rawParentId?: string | null, topicId?: string) {
  const parentId = normalizeParentTopicId(rawParentId);
  if (!parentId) {
    return undefined;
  }
  const parent = state.topics.find((topic) => topic.id === parentId);
  if (!parent) {
    throw new Error(`Parent topic with id "${parentId}" not found`);
  }
  if (parent.subject_id !== subjectId) {
    throw new Error("Parent topic must belong to the same subject");
  }
  if (topicId && parentId === topicId) {
    throw new Error("Topic cannot be its own parent");
  }
  if (topicId && topicHasAncestor(parentId, topicId)) {
    throw new Error("Cannot assign a descendant topic as the parent");
  }
  return parentId;
}

function deleteSkillBit(skillBitId: string) {
  const target = state.skillBits.find((skill) => skill.id === skillBitId);
  if (!target) {
    return;
  }
  state = {
    ...state,
    skillBits: state.skillBits.filter((skill) => skill.id !== skillBitId),
  };
  normalizeSkillBitOrders(target.outcome_id);
}

function moveSkillBit(skillBitId: string, delta: number): SkillBit | null {
  if (delta === 0) {
    return null;
  }
  const skill = state.skillBits.find((item) => item.id === skillBitId);
  if (!skill) {
    return null;
  }
  const siblings = sortByOrder(
    state.skillBits.filter((item) => item.outcome_id === skill.outcome_id),
  );
  const currentIndex = siblings.findIndex((item) => item.id === skillBitId);
  if (currentIndex === -1) {
    return null;
  }
  const targetIndex = Math.max(0, Math.min(siblings.length - 1, currentIndex + delta));
  if (currentIndex === targetIndex) {
    return skill;
  }

  const [moved] = siblings.splice(currentIndex, 1);
  siblings.splice(targetIndex, 0, moved);

  const updatedSiblings = siblings.map((item, index) => ({
    ...item,
    manual_order: index + 1,
    updated_at: now(),
  }));

  const others = state.skillBits.filter((item) => item.outcome_id !== skill.outcome_id);
  state = {
    ...state,
    skillBits: sortSkillBits([...others, ...updatedSiblings]),
  };
  return updatedSiblings.find((item) => item.id === skillBitId) ?? null;
}

function sortByCreated<T extends BaseEntity>(items: T[], direction: "asc" | "desc" = "desc"): T[] {
  const sorted = [...items].sort((a, b) => a.created_at - b.created_at);
  return direction === "desc" ? sorted.reverse() : sorted;
}

type EntityName = "Subject" | "Topic" | "LearningOutcome" | "SkillBit";

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
  SkillBit: { key: "skillBits", prefix: "skill", factory: makeSkillBit },
};

type EntityRecord<Name extends EntityName> = Name extends "Subject"
  ? Subject
  : Name extends "Topic"
    ? Topic
    : Name extends "LearningOutcome"
      ? LearningOutcome
      : SkillBit;

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

      if (entityName === "SkillBit") {
        items = sortSkillBits(items as SkillBit[]) as EntityRecord<Name>[];
      }

      return clone(items);
    },

    async create(data: EntityInput<Name>): Promise<EntityRecord<Name>> {
      await ensureDatasetReady();
      let preparedData = data;
      if (entityName === "SkillBit") {
        const skillBitInput = data as unknown as EntityInput<"SkillBit">;
        const manualOrder =
          typeof skillBitInput.manual_order === "number"
            ? skillBitInput.manual_order
            : getNextSkillBitOrder(skillBitInput.outcome_id);
        preparedData = {
          ...skillBitInput,
          manual_order: manualOrder,
        } as unknown as EntityInput<Name>;
      }

      if (entityName === "Topic") {
        const topicInput = data as unknown as EntityInput<"Topic">;
        const validatedParentId = validateParentTopicAssignment(
          topicInput.subject_id,
          topicInput.parent_topic_id,
        );
        preparedData = {
          ...topicInput,
          parent_topic_id: validatedParentId,
        } as unknown as EntityInput<Name>;
      }

      const id = preparedData.id ?? createId(config.prefix);
      const entity = config.factory({ ...preparedData, id }) as EntityRecord<Name>;

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

      if (entityName === "SkillBit") {
        state.skillBits = sortSkillBits(state.skillBits);
        normalizeSkillBitOrders((entity as SkillBit).outcome_id);
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

      const previousRecord = collection[index];
      let normalizedData = data;

      if (entityName === "Topic") {
        const topicInput = data as Partial<EntityInput<"Topic">>;
        const currentTopic = previousRecord as Topic;
        const nextSubjectId = (topicInput.subject_id ?? currentTopic.subject_id) as string;
        const hasParentInPayload = Object.prototype.hasOwnProperty.call(topicInput, "parent_topic_id");
        const nextParentCandidate = hasParentInPayload
          ? topicInput.parent_topic_id ?? undefined
          : currentTopic.parent_topic_id;
        const validatedParentId = validateParentTopicAssignment(nextSubjectId, nextParentCandidate, currentTopic.id);
        normalizedData = {
          ...data,
          parent_topic_id: validatedParentId,
        };
      }

      const updated: EntityRecord<Name> = {
        ...previousRecord,
        ...normalizedData,
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

      if (entityName === "SkillBit") {
        state.skillBits = sortSkillBits(state.skillBits);
        normalizeSkillBitOrders((updated as SkillBit).outcome_id);
        if ((previousRecord as SkillBit).outcome_id !== (updated as SkillBit).outcome_id) {
          normalizeSkillBitOrders((previousRecord as SkillBit).outcome_id);
        }
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
      } else if (entityName === "LearningOutcome") {
        cascadeDeleteOutcome(id);
      } else {
        deleteSkillBit(id);
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
  const outcomeIdsToDelete = state.outcomes
    .filter((outcome) => topicIdsToDelete.includes(outcome.topic_id))
    .map((outcome) => outcome.id);
  const remainingOutcomes = state.outcomes.filter((outcome) => !topicIdsToDelete.includes(outcome.topic_id));
  const remainingSkillBits = state.skillBits.filter((skill) => !outcomeIdsToDelete.includes(skill.outcome_id));

  state = {
    subjects: remainingSubjects,
    topics: remainingTopics,
    outcomes: remainingOutcomes,
    skillBits: remainingSkillBits,
  };
}

function cascadeDeleteTopic(topicId: string) {
  const descendantIds = collectDescendantTopicIds(topicId);
  const idsToDelete = new Set([topicId, ...descendantIds]);
  const remainingTopics = state.topics.filter((topic) => !idsToDelete.has(topic.id));
  const outcomeIdsToDelete = state.outcomes
    .filter((outcome) => idsToDelete.has(outcome.topic_id))
    .map((outcome) => outcome.id);
  const remainingOutcomes = state.outcomes.filter((outcome) => !idsToDelete.has(outcome.topic_id));
  const remainingSkillBits = state.skillBits.filter((skill) => !outcomeIdsToDelete.includes(skill.outcome_id));

  state = {
    ...state,
    topics: remainingTopics,
    outcomes: remainingOutcomes,
    skillBits: remainingSkillBits,
  };
}

function cascadeDeleteOutcome(outcomeId: string) {
  const remainingOutcomes = state.outcomes.filter((outcome) => outcome.id !== outcomeId);
  const remainingSkillBits = state.skillBits.filter((skill) => skill.outcome_id !== outcomeId);

  state = {
    ...state,
    outcomes: remainingOutcomes,
    skillBits: remainingSkillBits,
  };

  state.outcomes = state.outcomes.map((outcome) => ({
    ...outcome,
    expects: outcome.expects?.filter((id) => id !== outcomeId),
    consists_of: outcome.consists_of?.filter((id) => id !== outcomeId),
  }));
}

export type RawDataset = {
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
  skill_bits?: Array<{
    text?: string;
    label?: string;
    belongs_to?: string[];
    outcome?: string[];
    order?: number;
  }>;
  sub_skills?: Array<{
    text?: string;
    label?: string;
    belongs_to?: string[];
    outcome?: string[];
    order?: number;
  }>;
};

type SerializedSubject = {
  id: string;
  title?: string | null;
  name?: string | null;
  name_et?: string | null;
  description?: string | null;
  uri?: string | null;
  status?: "draft" | "published" | null;
};

type SerializedTopic = {
  id: string;
  subject_id?: string | null;
  name?: string | null;
  name_et?: string | null;
  description?: string | null;
  parent_topic_id?: string | null;
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

type SerializedSkillBit = {
  id: string;
  label?: string | null;
  outcome_id?: string | null;
  manual_order?: number | null;
};

async function fetchSplitDataset(): Promise<CurriculumState | null> {
  try {
    const [subjectsRes, topicsRes, outcomesRes] = await Promise.all([
      fetch(resolvePublicAsset("data/subjects.json"), { cache: "no-store" }),
      fetch(resolvePublicAsset("data/topics.json"), { cache: "no-store" }),
      fetch(resolvePublicAsset("data/outcomes.json"), { cache: "no-store" }),
    ]);
    const skillBitsRes = await fetch(resolvePublicAsset("data/skillbits.json"), {
      cache: "no-store",
    }).catch(() => null);

    if (!subjectsRes.ok || !topicsRes.ok || !outcomesRes.ok) {
      return null;
    }

    const [subjectsRaw, topicsRaw, outcomesRaw] = (await Promise.all([
      subjectsRes.json(),
      topicsRes.json(),
      outcomesRes.json(),
    ])) as [SerializedSubject[], SerializedTopic[], SerializedOutcome[]];
    let skillBitsRaw: SerializedSkillBit[] = [];
    if (skillBitsRes?.ok) {
      skillBitsRaw = (await skillBitsRes.json()) as SerializedSkillBit[];
    }

    const subjectRecords = subjectsRaw.map((record, index) =>
      makeSubject({
        id: record.id,
        title: record.title ?? record.name ?? record.name_et ?? `Õppeaine ${index + 1}`,
        description: record.description ?? undefined,
        uri: record.uri ?? undefined,
        status: (record.status as Subject["status"]) ?? "draft",
      }),
    );

    const fallbackSubjectId = subjectRecords[0]?.id ?? createId("subject");
    if (!subjectRecords.length) {
      subjectRecords.push(
        makeSubject({
          id: fallbackSubjectId,
          title: "Määramata",
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
        parent_topic_id: record.parent_topic_id ?? undefined,
        uri: record.uri ?? undefined,
        order_index: record.order_index ?? index,
        status: (record.status as Topic["status"]) ?? "draft",
      });
    });

    const topicSet = new Set(topicRecords.map((topic) => topic.id));
    const topicById = new Map(topicRecords.map((topic) => [topic.id, topic]));
    topicRecords.forEach((topic) => {
      const parentId = topic.parent_topic_id ?? undefined;
      if (!parentId) return;
      const parent = topicById.get(parentId);
      if (!parent || parent.subject_id !== topic.subject_id || parent.id === topic.id) {
        topic.parent_topic_id = undefined;
      }
    });
    const outcomeLookup = new Map<string, LearningOutcome>();
    const outcomeRecords = outcomesRaw.map((record, index) => {
      const topicId = topicSet.has(record.topic_id ?? "")
        ? (record.topic_id as string)
        : topicRecords[0]?.id ?? fallbackSubjectId;
      const outcomeRecord = makeOutcome({
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
      outcomeLookup.set(outcomeRecord.id, outcomeRecord);
      if (record.text) {
        outcomeLookup.set(record.text, outcomeRecord);
      }
      if (record.uri) {
        outcomeLookup.set(record.uri, outcomeRecord);
      }
      return outcomeRecord;
    });

    const skillBitRecords = skillBitsRaw
      .map((record, index) => {
        const parentOutcome =
          record.outcome_id && outcomeLookup.has(record.outcome_id)
            ? (outcomeLookup.get(record.outcome_id) as LearningOutcome)
            : null;
        if (!parentOutcome) {
          return null;
        }
        return makeSkillBit({
          id: record.id,
          label: record.label ?? `Skill-bit ${index + 1}`,
          outcome_id: parentOutcome.id,
          manual_order: record.manual_order ?? index + 1,
        });
      })
      .filter((skill): skill is SkillBit => Boolean(skill));

    const validOutcome = new Set(outcomeRecords.map((outcome) => outcome.id));
    outcomeRecords.forEach((outcome) => {
      outcome.expects = outcome.expects?.filter((id) => validOutcome.has(id)) ?? [];
      outcome.consists_of = outcome.consists_of?.filter((id) => validOutcome.has(id)) ?? [];
    });

    return {
      subjects: subjectRecords,
      topics: sortByOrder(topicRecords),
      outcomes: sortByOrder(outcomeRecords),
      skillBits: sortSkillBits(skillBitRecords),
    };
  } catch (error) {
    console.warn("[curriculum] Failed to load split dataset", error);
    return null;
  }
}

function buildStateFromCombinedDataset(raw: RawDataset): CurriculumState {
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
      title: name,
      status: "published",
    });
    subjectRecords.push(subject);
    subjectNameToId.set(name, subject.id);
  });

  const topicUsage = new Map<string, number>();
  const topicRecords: Topic[] = [];
  const topicLookup = new Map<string, string>();
  const pendingParentAssignments: Array<{
    record: Topic;
    parentRefs: string[];
  }> = [];

  raw.topics?.forEach((topic, index) => {
    const subjectName = topic.subject?.find((name) => subjectNameToId.has(name));
    if (!subjectName) {
      return;
    }
    const subjectId = subjectNameToId.get(subjectName)!;
    const name = topic.text?.trim() || topic.url?.trim() || `Teema ${index + 1}`;
    const id = ensureUniqueId("topic", name, index, topicUsage);
    const parentRefs =
      Array.isArray(topic.parent_topic) && topic.parent_topic.length
        ? topic.parent_topic.filter(
            (value): value is string => typeof value === "string" && Boolean(value.trim()),
          )
        : [];
    const record = makeTopic({
      id,
      subject_id: subjectId,
      name,
      name_et: name,
      description: topic.parent_topic?.join(", ") || undefined,
      parent_topic_id: undefined,
      uri: topic.url,
      order_index: index,
      status: "published",
    });
    topicRecords.push(record);
    pendingParentAssignments.push({
      record,
      parentRefs,
    });
    if (topic.text) {
      const trimmed = topic.text.trim();
      topicLookup.set(topic.text, id);
      if (trimmed && trimmed !== topic.text) {
        topicLookup.set(trimmed, id);
      }
    }
    if (topic.url) {
      const trimmedUrl = topic.url.trim();
      topicLookup.set(topic.url, id);
      if (trimmedUrl && trimmedUrl !== topic.url) {
        topicLookup.set(trimmedUrl, id);
      }
    }
  });

  const topicById = new Map(topicRecords.map((topic) => [topic.id, topic]));
  const createsCycle = (candidateParentId: string, childId: string) => {
    let cursor = topicById.get(candidateParentId);
    const visited = new Set<string>();
    while (cursor?.parent_topic_id) {
      if (cursor.parent_topic_id === childId) {
        return true;
      }
      if (visited.has(cursor.parent_topic_id)) {
        break;
      }
      visited.add(cursor.parent_topic_id);
      cursor = topicById.get(cursor.parent_topic_id);
    }
    return false;
  };
  pendingParentAssignments.forEach(({ record, parentRefs }) => {
    for (const ref of parentRefs) {
      const trimmedRef = ref.trim();
      const parentId = topicLookup.get(trimmedRef) ?? topicLookup.get(ref);
      if (!parentId || parentId === record.id) {
        continue;
      }
      const parentRecord = topicById.get(parentId);
      if (!parentRecord || parentRecord.subject_id !== record.subject_id) {
        continue;
      }
      if (createsCycle(parentId, record.id)) {
        continue;
      }
      record.parent_topic_id = parentId;
      break;
    }
  });

  const fallbackSubjectId = subjectRecords[0]?.id ?? ensureUniqueId("subject", "default", 0, idUsage);
  if (!subjectRecords.length) {
    const fallbackSubject = makeSubject({
      id: fallbackSubjectId,
      title: "Määramata",
      status: "draft",
    });
    subjectRecords.push(fallbackSubject);
    subjectNameToId.set("Määramata", fallbackSubjectId);
  }

  const outcomeUsage = new Map<string, number>();
  const skillBitUsage = new Map<string, number>();
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
    outcomeLookup.set(record.id, record);
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

  const skillBitRecords: SkillBit[] = [];
  const combinedSkillBits = raw.skill_bits ?? raw.sub_skills;
  combinedSkillBits?.forEach((skill, index) => {
    const label = skill.text?.trim() || skill.label?.trim() || `Skill-bit ${index + 1}`;
    const outcomeRef = skill.belongs_to?.[0] ?? skill.outcome?.[0];
    if (!outcomeRef || typeof outcomeRef !== "string") {
      return;
    }
    const normalizedOutcomeRef = outcomeRef.trim();
    const parentOutcome =
      outcomeLookup.get(normalizedOutcomeRef) ??
      outcomeLookup.get(outcomeRef) ??
      outcomeRecords.find((record) => record.uri === outcomeRef);
    if (!parentOutcome) {
      return;
    }
    const id = ensureUniqueId("skill", label, index, skillBitUsage);
    skillBitRecords.push(
      makeSkillBit({
        id,
        label,
        outcome_id: parentOutcome.id,
        manual_order: typeof skill.order === "number" ? skill.order : skillBitRecords.length + 1,
      }),
    );
  });

  return {
    subjects: subjectRecords,
    topics: sortByOrder(topicRecords),
    outcomes: sortByOrder(outcomeRecords),
    skillBits: sortSkillBits(skillBitRecords),
  };
}

async function loadFromCombinedFile(): Promise<CurriculumState> {
  const response = await fetch(resolvePublicAsset("data/oppekava.json"), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.status} ${response.statusText}`);
  }
  const raw = (await response.json()) as RawDataset;
  return buildStateFromCombinedDataset(raw);
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
      `${state.skillBits.length} skill-bits`,
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
    SkillBit: createEntityApi("SkillBit"),
  },
  skillBits: {
    async listForOutcome(outcomeId: string) {
      await ensureDatasetReady();
      const items = state.skillBits.filter((skill) => skill.outcome_id === outcomeId);
      return clone(sortByOrder(items));
    },
    async reorder(skillId: string, direction: "up" | "down") {
      await ensureDatasetReady();
      const delta = direction === "up" ? -1 : 1;
      const updated = moveSkillBit(skillId, delta);
      if (updated) {
        persist();
        notify();
        return clone(updated);
      }
      return null;
    },
    async countByOutcome() {
      await ensureDatasetReady();
      const counts: Record<string, number> = {};
      state.skillBits.forEach((skill) => {
        counts[skill.outcome_id] = (counts[skill.outcome_id] ?? 0) + 1;
      });
      return clone(counts);
    },
  },
  async importFromRaw(raw: RawDataset) {
    const nextState = buildStateFromCombinedDataset(raw);
    state = nextState;
    datasetSnapshot = clone(state);
    datasetLoaded = true;
    persist();
    notify();
    return clone(state);
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
