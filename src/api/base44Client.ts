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

type Base44State = {
  subjects: Subject[];
  topics: Topic[];
  outcomes: LearningOutcome[];
};

const STORAGE_KEY = "base44-demo-state";

const defaultState: Base44State = {
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

let state: Base44State = loadInitialState();

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

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

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadInitialState(): Base44State {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Base44State;
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
    key: keyof Base44State;
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

export const base44 = {
  entities: {
    Subject: createEntityApi("Subject"),
    Topic: createEntityApi("Topic"),
    LearningOutcome: createEntityApi("LearningOutcome"),
  },
  getState(): Base44State {
    return clone(state);
  },
  subscribe(listener: Subscriber) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },
  reset() {
    state = clone(defaultState);
    persist();
    notify();
  },
};

export type { Base44State };
