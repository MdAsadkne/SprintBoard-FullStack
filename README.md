# SprintBoard | Team sprint planner

SprintBoard is a portfolio project for planning a small team's sprint. It combines a responsive React Kanban board with a Spring Boot REST API and H2 persistence. Move work through the sprint, filter by priority, search tasks, and create, edit, or remove task cards.

> **Demo data only.** SprintBoard is a sample project planner and does not connect to a real team workspace.

## Live demo

**[Open SprintBoard](https://mdasadkne.github.io/SprintBoard-FullStack/)**. The GitHub Pages build uses browser storage, so demo edits stay in that browser. The Spring Boot API is included for local development and is not hosted by GitHub Pages.

## Highlights

- Four-column Kanban board: Backlog, In progress, In review, and Done.
- Drag cards between columns or change status from the keyboard-accessible card control.
- Search by task title or assignee and filter by priority.
- Create, edit, and delete tasks with validated fields.
- Spring REST API with task CRUD, status transitions, and H2 persistence.
- Responsive layout, loading and error states, and reduced-motion support.

## Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite 8, CSS |
| Backend | Java 17, Spring Boot 4.1, Spring Web MVC, Spring Data JPA, Validation |
| Database | H2 |
| Delivery | GitHub Actions build and Pages deploy workflows |

## Run the demo UI

Requirements: Node.js 20+ and npm.

```bash
cd frontend
npm ci
npm run dev
```

Vite prints the local URL. With no `VITE_API_BASE_URL` configured, the UI uses sample tasks stored in browser `localStorage`.

## Run with the Spring API

Requirements: Java 17+ and Maven 3.9+.

```bash
cd backend
mvn spring-boot:run
```

Create `frontend/.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

Then start the frontend with `npm run dev`. The H2 console runs at `http://localhost:8080/h2-console` (JDBC URL `jdbc:h2:file:./data/sprintboard`, username `sa`, blank password).

## REST API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks; optional `search` and `priority` filters |
| `GET` | `/api/tasks/{id}` | Read one task |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/{id}` | Update a task |
| `PATCH` | `/api/tasks/{id}/status?status=IN_PROGRESS` | Move a task to a workflow column |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

Example task:

```json
{
  "title": "Review onboarding flow",
  "description": "Check the first-run experience on mobile.",
  "assignee": "A. Khan",
  "status": "IN_REVIEW",
  "priority": "MEDIUM",
  "dueDate": "2026-12-04"
}
```

## Project structure

```text
frontend/    React application and GitHub Pages build
backend/     Spring Boot API and H2 configuration
.github/     CI and Pages workflows
```

## Scope

This is a portfolio demo, not a hosted collaboration product. It has no accounts, permissions, notifications, or real-time synchronization. The H2 console is for local development only. Do not put private company or customer information in the public demo.

## License

MIT. See [LICENSE](LICENSE).
