# SPIDER Docker Stack

This repository contains a Dockerized setup for:
- Next.js 14 App Router (web, port 3000)
- NestJS API with Prisma (api, port 3001)
- PostgreSQL 16 (db, port 5432)
- Redis 7 (redis, port 6379)

## Prerequisites
- Docker Desktop (Windows)
- Enough disk space for images and a local Postgres volume

## Start the stack

PowerShell:

```
# From the project root
docker compose up -d --build
```

- Web: http://localhost:3000
- API health: http://localhost:3001/api/health
- API root: http://localhost:3001/

On first run, the API container runs `prisma migrate deploy` to sync the DB schema.

## Project Structure

- apps/web: Next.js frontend with Tailwind
- apps/api: NestJS backend with Prisma ORM
- docker-compose.yml: Orchestrates services

## Environment Variables

These are configured in `docker-compose.yml` for convenience:
- DATABASE_URL: postgresql://spider:spiderpass@db:5432/spiderdb?schema=public
- REDIS_URL: redis://redis:6379
- NEXT_PUBLIC_API_URL: http://localhost:3001

For local customization, you can create a `.env` and reference it from compose if desired.

## Common Commands

Rebuild after changes to Dockerfiles or dependencies:
```
docker compose build --no-cache
```

View logs:
```
docker compose logs -f api
```

Stop the stack:
```
docker compose down
```

Reset database (removes data!):
```
docker compose down -v
```

## Next steps
- Implement endpoints and business logic per requirements (Random Match, Milestones, etc.)
- Add CI (GitHub Actions) for building and testing
- Add seed data scripts with Prisma if needed
