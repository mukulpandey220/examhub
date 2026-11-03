# Production Deployment Guide

## 1. Containerized Multi-Service Deployment (Docker Compose)

The entire proctoring platform can be deployed in a single command using Docker Compose:

```bash
docker compose up --build -d
```

This launches:
- `aiproctor-postgres` on port `5432` with automatic database migrations and initial seed data.
- `aiproctor-ai` (FastAPI) on port `8000`.
- `aiproctor-backend` (Node.js + Socket.IO) on port `3001`.
- `aiproctor-frontend` (Nginx + React) on port `5173` (mapped from port 80).

### Verification
```bash
docker compose ps
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

---

## 2. Independent Microservice Deployment

For large institutional deployments, services can be hosted across independent instances:

### A. Python AI Inference Cluster
- Deploy on a GPU-enabled instance (e.g. AWS `g4dn.xlarge` or Google Cloud `n1-standard-4` with T4 GPU).
- Set `AI_SERVICE_API_KEY` for internal authentication.
- Run:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
  ```

### B. Node.js Core Backend
- Deploy on a container runtime or VPS (e.g., Render, Railway, AWS ECS).
- Set `AI_SERVICE_URL=http://ai-internal-host:8000`.
- Set `DATABASE_URL=postgresql://user:pass@postgres-host:5432/db`.

### C. React Frontend
- Deploy on Vercel, Cloudflare Pages, or AWS S3 + CloudFront.
- Configure `VITE_BACKEND_URL` and `VITE_AI_SERVICE_URL`.

---

## 3. Database Backup & Disaster Recovery
To back up the PostgreSQL database:
```bash
pg_dump -U postgres -h localhost -d aiproctor > aiproctor_backup_$(date +%F).sql
```
To restore:
```bash
psql -U postgres -h localhost -d aiproctor < aiproctor_backup_2026-10-28.sql
```

