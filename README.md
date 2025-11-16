# EduFlex RDF Curriculum Manager — Front-end Prototype

## Overview

The **EduFlex RDF Curriculum Manager** is a lightweight web-based tool for managing and publishing national curriculum data in machine-readable RDF/JSON-LD format. It enables curriculum editors and educational technologists to define subjects, topics, learning outcomes, and skill-bits, visualize semantic relationships, and export data in interoperable formats.

This front-end prototype implements a comprehensive feature set for curriculum management with a focus on usability, semantic structure, and API-ready data export—all running client-side with localStorage persistence.

> **Note:** Although information is originally sourced from https://oppekava.edu.ee/, there is no direct connection to the original dataset. The service extends it based on input from Tallinn University's Centre for Educational Technology researchers.

---

## Goals

- Enable the semantic representation of curriculum data following the **EduSchema** RDF model.
- Allow the **import, management, and export** of structured curriculum information.
- Provide a **machine-readable API specification** for integration with e-learning platforms and educational tools.
- Offer a clear **visual and textual interface** for exploring relationships between learning outcomes.

---

## Key Features

### A. Dashboard with Quick Actions
**Location:** `src/pages/Dashboard.tsx`

- **At-a-glance statistics** showing total counts for Subjects, Topics, and Learning Outcomes
- **Quick action cards** providing guided pathways to common tasks (add subject, add topic, add outcome, export data)
- **Explanatory copy** welcoming users and describing the tool's purpose and capabilities
- **Visual stat cards** with icons and direct links to each management section

### B. Curriculum Management (CRUD Operations)
Complete CRUD interfaces for all curriculum entities:

- **Subjects** (`src/pages/Subjects.tsx`)
  - Create, edit, delete subjects
  - Inline skill-bit management for outcomes within each subject
  - Status tracking (draft/published)
  
- **Topics** (`src/pages/Topics.tsx`)
  - Hierarchical topic management with parent-child relationships
  - Subject association
  - Order indexing for custom sequencing
  - Pagination for large datasets

- **Learning Outcomes** (`src/pages/Outcomes.tsx`)
  - Full outcome management with bilingual support (English/Estonian)
  - School level and grade range assignment
  - Topic association
  - Semantic relationship definition (`expects` and `consistsOf`)
  - Pagination support

### C. Skill-Bit Management System
**Locations:** `src/components/skillbits/SkillBitPanel.tsx`, `src/components/skillbits/SkillBitManagerDialog.tsx`

Each learning outcome can contain granular skill-bits (osaoskused):
- **Inline editors** embedded throughout the application
- **Add, edit, delete, and reorder** skill-bits with manual ordering
- **Visual badges** showing order values
- **Drag-and-drop style controls** (up/down arrows) for reordering
- **Read-only display** in the Browse view
- **Full RDF export** with `eduschema:SkillBit` resources and bidirectional links

### D. Browse & Explore
**Location:** `src/pages/Browse.tsx`

- **Hierarchical tree view** of the entire curriculum (Subject → Topic → Outcome → Skill-bit)
- **Expandable/collapsible sections** for easy navigation
- **Visual icons** distinguishing entity types
- **Status badges** showing draft vs. published state
- **Inline skill-bit viewing** for each outcome
- **Direct navigation** to relationship graphs via external link buttons

### E. Relationship Visualization
**Location:** `src/pages/Relations.tsx`

- **Interactive graph view** of semantic relationships between learning outcomes
- **Color-coded edges:**
  - Blue → *expects* (prerequisite relationships)
  - Green → *consistsOf* (compositional relationships)
- **Textual summary panels** listing prerequisites and sub-outcomes
- **Clickable nodes** for navigation between related outcomes
- **Subject and topic filters** to scope the view
- **URL-based deep linking** (e.g., `?outcome=OUTCOME_ID`)

### F. Search & Discovery
**Location:** `src/pages/Search.tsx`

- **Full-text search** across subjects, topics, and learning outcomes
- **Type filters** (all / subjects / topics / outcomes)
- **School level filters** (I, II, III, Gymnasium, University)
- **Real-time filtering** as you type
- **Highlighted results** showing entity type, associated subject/topic, and status
- **URI display** for semantic web integration

### G. Data Import
**Location:** `src/pages/Import.tsx`

- **JSON file upload** following the standard export schema
- **Client-side parsing** and validation
- **Immediate dataset replacement** with confirmation summary
- **Import statistics** showing counts of imported entities
- **Schema documentation** with highlights and sample payload
- **Visual consistency** matching the Export page design

### H. Data Export & API Specification
**Location:** `src/pages/Export.tsx`

This is the most comprehensive export interface, featuring:

#### Export Formats
- **JSON-LD** (recommended for API integrations) with full RDF context
- **Turtle (RDF)** for compact, human-readable RDF notation
- **Simple JSON** for lightweight integrations without semantics

#### Export Features
- **Live preview** with syntax highlighting (first 100 lines)
- **One-click copy to clipboard** with success feedback
- **Direct download** with timestamped filenames
- **Format tabs** for easy switching between export types
- **Comprehensive metadata** including generation timestamps and entity counts

#### RDF Schema Documentation
- **Built-in schema viewer** with the complete EduSchema ontology in Turtle format
- **Copy schema button** for easy reference
- **Schema explanation** describing classes and properties
- **Context reference:** `https://oppekava.edu.ee/schema/`
  > *This is a temporary reference. The RDF schema will ultimately be hosted under the EduFlex domain (e.g. `https://eduflex.tlu.ee/schema/`).*

#### API Endpoint Reference
Complete REST API specification with:
- **GET /api/subjects** — List all subjects
- **GET /api/topics** — List all topics (with optional `?subject_id` filter)
- **GET /api/outcomes** — List all learning outcomes (with optional `?topic_id` filter)
- **GET /api/outcomes/:id** — Single learning outcome with relations
- **GET /api/skillbits** — List skill-bits (with optional `?outcome_id` filter)
- **GET /api/export.jsonld** — Full export in JSON-LD format
- **GET /api/export.ttl** — Full export in Turtle format

**Query parameters:**
- `?include=expects,consistsOf` — Include relation identifiers

**Accept headers:**
- `application/ld+json` or `text/turtle`

#### Format Comparison Guide
- Side-by-side format details explaining use cases
- Notes on versioning and timestamps
- Semantic structure explanations

### I. Integration Guide
**Location:** `src/pages/IntegrationGuide.tsx`

- **Detailed API integration documentation** for external systems
- **Use case examples** for form builders and digital tools
- **Endpoint reference** with purposes explained
- **Best practices** for maintaining curriculum alignment
- **Warning notices** about the prototype nature of the tool

---

## Data Model

### Core Entities

- **Subject**
  - `id`, `title`, `description`, `code`, `uri`, `status`, `created_at`
  
- **Topic**
  - `id`, `name`, `name_et`, `description`, `subject_id`, `parent_topic_id`, `order_index`, `status`, `uri`, `created_at`
  
- **Learning Outcome**
  - `id`, `text`, `text_et`, `topic_id`, `school_level`, `grade_range`, `order_index`, `status`, `uri`, `created_at`
  - Relationships: `expects` (prerequisites), `consists_of` (sub-outcomes)

- **Skill-Bit**
  - `id`, `label`, `outcome_id`, `manual_order`, `created_at`

### Semantic Relationships

- **expects** — prerequisite (A expects B → B must be achieved before A)
- **consistsOf** — composition (A consists of B → A includes B as a sub-outcome)

### Metadata

All exports include:
- `version` — Schema version
- `generatedAtTime` — ISO 8601 timestamp
- Entity counts (`totalSubjects`, `totalTopics`, `totalOutcomes`, `totalSkillBits`)
- Full URIs for linked data compatibility

---

## Tech Stack

- **[React 19](https://react.dev/)** + **[TypeScript](https://www.typescriptlang.org/)**
- **[Vite 7](https://vite.dev/)** for dev/build tooling
- **[React Router v7](https://reactrouter.com/)** for client-side routing
- **[@tanstack/react-query](https://tanstack.com/query/latest)** for client-side data access and caching
- **[Tailwind CSS v4](https://tailwindcss.com/)** (via the official Vite plugin)
- **[lucide-react](https://lucide.dev/)** icon set

---

## Getting Started

```bash
npm install
npm run dev
```

The app starts on **http://localhost:5173** by default. Use the sidebar to navigate between sections. All data is seeded from `curriculumClient` and stored in localStorage; use your browser devtools to clear it if you want a fresh start.

### Build & Preview

```bash
npm run build
npm run preview
```

---

## Project Structure

```
src/
├── pages/                    # Feature pages
│   ├── Dashboard.tsx         # Overview with stats and quick actions
│   ├── Subjects.tsx          # Subject CRUD
│   ├── Topics.tsx            # Topic CRUD with hierarchy
│   ├── Outcomes.tsx          # Learning outcome CRUD
│   ├── Browse.tsx            # Tree view of entire curriculum
│   ├── Relations.tsx         # Graph visualization of relationships
│   ├── Search.tsx            # Full-text search and filtering
│   ├── Import.tsx            # JSON import workflow
│   ├── Export.tsx            # Multi-format export with API docs
│   └── IntegrationGuide.tsx  # API integration documentation
├── layout/
│   └── Layout.tsx            # Sidebar shell shared by all routes
├── components/
│   ├── skillbits/            # Skill-bit management components
│   │   ├── SkillBitPanel.tsx
│   │   └── SkillBitManagerDialog.tsx
│   ├── relations/
│   │   └── RelationGraph.tsx # Graph visualization component
│   └── ui/                   # Reusable UI components (buttons, cards, etc.)
├── api/
│   └── curriculumClient.ts   # In-memory/localStorage dataset and CRUD helpers
├── lib/
│   ├── topicHierarchy.ts     # Topic tree building utilities
│   └── simpleQuery.tsx       # Query helper functions
└── entities/                 # JSON schema definitions
```

### Dataset Utilities

- **`npm run data:enrich-topics`** — Replays `public/data/oppekava.json` to backfill `parent_topic_id` fields into `public/data/topics.json` so split datasets keep the topic hierarchy without fetching the large combined file at runtime.

---

## Import Schema Sample

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

---

## Non-Functional Characteristics

- **Technology:** Web-based implementation with React and Tailwind CSS
- **Data format compliance:** JSON-LD 1.1 and Turtle (RDF 1.1)
- **Usability:** Clear and comprehensible for teachers and curriculum experts, not only developers
- **Accessibility:** Interface readable without technical background knowledge
- **Performance:** Handles 100+ learning outcomes with immediate filtering and graph rendering
- **Persistence:** Client-side localStorage maintains state across sessions
- **No backend required:** Fully functional as a static site

---

## Out of Scope (Post-MVP Enhancements)

The current prototype focuses on demonstrating UI/UX and RDF export capabilities. Future enhancements could include:

- User roles and authentication
- Backend API with database persistence
- Version control and history tracking
- Advanced analytics or curriculum comparison tools
- Multi-language editing interface
- Integration with external LMS or content repositories
- Approval workflows and change notifications
- Scheduled curriculum publications
- Audit trails and change tracking
- Export filtering and partial exports

---

## Prototype Vision

If this were a fully working service, it would let curriculum authors and administrators:

- **Audit and edit** every Subject, Topic, Learning Outcome, and Skill-bit through secure CRUD APIs with validation and approval workflows
- **Track versions** per agency or publication date, compare drafts visually, and revert or publish changes with tagging and release notes
- **Manage permissions** so editors, reviewers, and viewers only see the actions appropriate for their role plus an audit trail of who changed what
- **Schedule curriculum publications**, notify downstream systems (e.g., SIS or content platforms), and keep RDF exports aligned with the latest published release
- **Provide rich reporting**: overall health dashboards, topic coverage maps, and export previews (JSON-LD, Turtle, CSV) with schema guidance and download/copy helpers

These scenarios inform the prototype flows even though the current implementation stays frontend-only with in-memory/localStorage data.

---

## Roadmap Ideas

- Hook the CRUD flows up to a real API
- Implement role-based auth and audit trails
- Expand export options (filters, version history, partial exports)
- Add visual curriculum analytics and coverage reports
- Integrate with external educational platforms