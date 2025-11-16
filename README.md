# RDF Curriculum Manager (prototype)

This repository contains a prototype UI for managing the Estonian national curriculum as RDF/JSON-LD data. The app focuses on quick editorial workflows for subjects, topics, and learning outcomes, with English-language UI copy throughout.

## Key features

- **Dashboard overview** with published counts and guided quick actions.
- **CRUD tooling** for Subjects, Topics, and Learning Outcomes backed by React Query and a local in-browser dataset (`src/api/curriculumClient.ts`).
- **Pagination** for Topics and Learning Outcomes to keep the UI responsive on larger datasets.
- **RDF-focused export page** with JSON-LD, Turtle, and simple JSON previews, plus schema reference and one-click download/copy actions.
- **Skillbit (osaoskus) editing** directly inside outcome dialogs, subject drill-downs, and the browse tree with manual ordering and RDF links.
- **Static prototype data** persisted via `localStorage` so edits stick between refreshes without a backend.
- **JSON import workflow** on the `/import` page where you select a schema-aligned export (e.g., `public/data/oppekava.json`) and immediately replace the active curriculum dataset for further editing.

## Import schema sample

The import accepts the same JSON schema that the export page produces. A minimal payload looks like this:

```json
{
  "subjects": ["Mathematics", "Programming"],
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
}
```

## Prototype vision

If this were a fully working service, it would let curriculum authors and administrators—

- Audit and edit every Subject, Topic, Learning Outcome, and Skillbit through secure CRUD APIs with validation and approval workflows.
- Track versions per agency or publication date, compare drafts visually, and revert or publish changes with tagging and release notes.
- Manage permissions so editors, reviewers, and viewers only see the actions appropriate for their role plus an audit trail of who changed what.
- Schedule curriculum publications, notify downstream systems (e.g., SIS or content platforms), and keep RDF exports aligned with the latest published release.
- Provide rich reporting: overall health dashboards, topic coverage maps, and export previews (JSON-LD, Turtle, CSV) with schema guidance and download/copy helpers.

These scenarios inform the prototype flows even though the current implementation stays frontend-only with in-memory/localStorage data.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 7](https://vite.dev/) for dev/build tooling
- [React Router](https://reactrouter.com/) for client-side routing
- [@tanstack/react-query](https://tanstack.com/query/latest) for client-side data access and caching
- [Tailwind CSS v4](https://tailwindcss.com/) (via the official Vite plugin)
- [lucide-react](https://lucide.dev/) icon set

## Getting started

```bash
npm install
npm run dev
```

The app starts on http://localhost:5173 by default. Use the sidebar to navigate between sections. All data is seeded from `curriculumClient` and stored in localStorage; use your browser devtools to clear it if you want a fresh start.

### Build & preview

```bash
npm run build
npm run preview
```

## Project structure

- `src/pages/*` – Feature pages (Dashboard, Subjects, Topics, Outcomes, Export, etc.)
- `src/layout/Layout.tsx` – Sidebar shell shared by all routes
- `src/api/curriculumClient.ts` – In-memory/localStorage curriculum dataset and helper functions
- `src/components/*` – Reusable UI widgets

### Dataset utilities

- `npm run data:enrich-topics` – replays `public/data/oppekava.json` to backfill `parent_topic_id` fields into `public/data/topics.json` so split datasets keep the topic hierarchy without fetching the large combined file at runtime.

### Skillbit / Osaoskused model

Each learning outcome can now contain a flat list of skill-bits (osaoskused). They have a required label plus an optional manual order value and are stored in `curriculumClient` alongside the other entities. Inline editors on the Outcomes and Subjects pages let you add, edit, delete, and reorder these entries; the Browse view shows them read-only. The export page emits `eduschema:SkillBit` resources with `eduschema:hasSkillBit` / `eduschema:belongsToLearningOutcome` links so RDF consumers can traverse the hierarchy.

## Roadmap ideas

- Hook the CRUD flows up to a real API
- Implement role-based auth and audit trails
- Expand export options (filters, version history)

Feel free to fork and adapt this prototype for your own curriculum management experiments. Suggestions and contributions are welcome!
