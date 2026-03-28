# Task Manager Application

A simple full-stack Task Manager built for the Intern Software Engineer coding assignment.

## Project Structure

- `task_manager_backend/task_manager` - Spring Boot backend (Java 17, Maven, MySQL)
- `task_manager_Frontend/task-manager-ui` - React frontend (Vite, Axios, React Router v6)

## Tech Stack

- Backend: Java 17, Spring Boot 3, Spring Data JPA, Maven
- Database: MySQL
- Frontend: React (functional components), React Router v6, Axios
- Styling: Tailwind CSS

## Local Setup (Fresh Checkout)

### 1. Clone repository

```bash
git clone https://github.com/yasith-tharuka/Task_Manager_2026.git
cd Task_Manager_2026
```

### 2. Setup MySQL

1. Create database:

```sql
CREATE DATABASE yasith_task_manager;
```

2. Backend DB config is in:

`task_manager_backend/task_manager/src/main/resources/application.properties`

Update credentials if needed:

- `spring.datasource.username`
- `spring.datasource.password`

### 3. Run backend

```bash
cd task_manager_backend/task_manager
./mvnw spring-boot:run
```

Backend base URL:

`http://localhost:5001/api/v1`

### 4. Run frontend

```bash
cd task_manager_Frontend/task-manager-ui
npm install
npm run dev
```

Frontend default URL:

`http://localhost:5173`

Optional frontend API override (`task_manager_Frontend/task-manager-ui/.env`):

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1/tasks
```

## Database Choice and Reason

I used **MySQL + Spring Data JPA**.

Reason:

- The task data is structured and fits well with a relational model.
- JPA with enums and date fields keeps implementation clean and readable.

## API Endpoints

Base path: `/api/v1/tasks`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/tasks` | Get all tasks |
| GET | `/api/v1/tasks?assigneeEmail=user@mail.com` | Get tasks filtered by assignee email |
| POST | `/api/v1/tasks` | Create task |
| PUT | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |

### Request body (POST/PUT)

```json
{
	"title": "Finish report",
	"description": "Complete final report",
	"assigneeEmail": "user@mail.com",
	"status": "TODO",
	"priority": "MEDIUM",
	"dueDate": "2026-04-02"
}
```

### Response format

Success and error responses follow a common structure:

```json
{
	"success": true,
	"message": "Task created successfully",
	"data": {},
	"errors": null,
	"timestamp": "2026-03-29T00:00:00"
}
```

## Assumptions and Design Decisions

- Authentication is intentionally not included (as allowed by assignment).
- Assignee is represented by email only (`assigneeEmail`).
- `completedAt` is set automatically when status changes to `DONE`.
- Backend uses global exception handling for consistent error responses.
- Frontend keeps UI simple and focused on required features.
- GitHub Copilot was used as a development assistant for parts of the frontend implementation and Backend Error Handling

## Known Limitations

- No authentication/authorization.
- No pagination in task list.
- No task search endpoint yet.
- CORS is open for development (`@CrossOrigin(origins = "*")`).

## Future Improvements

- Add JWT authentication with role-based access.
- Add pagination and keyword search.
- Add dashboard analytics by status and priority.
- Add unit/integration tests for API and frontend flows.
