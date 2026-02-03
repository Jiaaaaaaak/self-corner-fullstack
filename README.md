# AI Classroom

> An AI-powered interactive classroom system  
> Built with FastAPI, React, LangGraph, and Docker

---

## 📌 Project Overview

AI Classroom is an intelligent interactive teaching system integrating:

- 🎯 Real-time classroom interaction
- 🤖 LLM-based agent orchestration (LangGraph)
- 🔐 Authentication & session management
- 🎙️ STT / TTS voice interaction
- 🗄️ Postgres + Redis data layer
- 📖 [專案分工對照表 (點此查看)](./docs/WBS.md)
- 📖 [專案開發規則 (點此查看)](./docs/TEAM_RULES.md)

---

## 🏗️ Project Structure

```
project-root/
├── backend/            # FastAPI backend application
├── DB/                 # PostgreSQL
├── frontend/           # React frontend application
├── infrastructure/     # Docker & deployment configuration
├── docs/               # Documentation & development logs
├── prototypes/         # Experimental MVP prototypes
│
├── .env.example        # Environment variable template
├── Makefile            # Project command shortcuts
└── README.md
```

---

## 📂 Folder Description

### 🔹 backend/

Core backend system built with FastAPI.

Contains:

- API routes
- Authentication module
- LangGraph agent orchestration
- Service layer (LLM / STT / TTS integration)
- Database models & migration
- Unit & integration tests

This folder represents the **core business logic layer**.

---

### 🔹 frontend/

React-based client application.

Contains:

- UI components
- Hooks
- API service layer
- Classroom interaction interface

This is the **user interaction layer**.

---

### 🔹 infrastructure/

Infrastructure-as-Code related files.

Contains:

- docker-compose.yml
- Dockerfiles
- Deployment configuration

This ensures the project is:

- Reproducible
- Environment-consistent
- Easy to deploy

---

### 🔹 docs/

Project documentation.

Contains:

- Architecture design
- API specifications
- Development logs
- Meeting notes

This folder represents the **knowledge layer** of the project.

---

### 🔹 prototypes/

Experimental or MVP features.

Used for:

- Streamlit experiments
- Rapid LLM testing
- Temporary research validation

⚠️ Not production code.

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/AIPE02-team04/ai-classroom.git
cd ai-classroom
```

### 2️⃣ Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

- Database credentials
- OpenAI / LLM API key
- Redis config

---

### 3️⃣ Start with Docker

```bash
docker-compose up --build
```

Frontend:  
```
http://localhost:3000
```

Backend API docs:  
```
http://localhost:8000/docs
```

---

## 🧪 Running Tests

```bash
cd backend
pytest
```

---

## 🔐 Branch Strategy

- `main` → stable version
- `feature/*` → feature branches
- All changes require Pull Request & Code Review

---

## 👥 Team Responsibility

| Area | Responsible Team |
|------|------------------|
| Frontend | frontend-team |
| Backend API | backend-team |
| Database | database-team |
| Infrastructure | backend-team |
| Documentation | project-lead |

---

## 📖 Development Philosophy

- Clear layer separation
- Configuration over hardcoding
- Infrastructure as Code
- Testable service architecture
- Clean Pull Request workflow

---

## 🛠 Tech Stack

**Backend**
- FastAPI
- LangGraph
- SQLAlchemy / SQLModel
- Redis
- Alembic

**Frontend**
- React
- TypeScript

**Infrastructure**
- Docker
- docker-compose

---

## 📌 Future Roadmap

- [ ] Complete authentication flow
- [ ] Integrate voice interaction
- [ ] Improve agent orchestration logic
- [ ] Add CI/CD pipeline

---

## 📜 License

Academic / Internal Use
