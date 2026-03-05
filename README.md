# WorkMetrics

A time tracking and productivity management system for teams.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Zustand
- **Backend**: NestJS 10, Prisma, PostgreSQL
- **Authentication**: JWT with Passport.js

## Getting Started

### Prerequisites

- Node.js 20.x
- Docker and Docker Compose
- PostgreSQL 16 (or use Docker)

### Installation

1. Clone the repository
2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Start the database:
   ```bash
   docker-compose up -d
   ```

4. Install dependencies:
   ```bash
   # Frontend
   cd frontend && npm install

   # Backend
   cd backend && npm install
   ```

5. Generate Prisma client and run migrations:
   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. Start development servers:

   **Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Environment Variables

See `.env.example` for all required environment variables.

### API Documentation

Once the backend is running, visit `http://localhost:3001/api` for Swagger documentation.

## Project Structure

```
workmetrics/
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/
│   │   ├── lib/
│   │   └── styles/
├── backend/           # NestJS application
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── time-entries/
│   │   └── teams/
├── prisma/
│   └── schema.prisma
└── docker-compose.yml
```

## License

MIT
