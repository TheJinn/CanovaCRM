# CanovaCRM (Admin + Employee)

Full-stack Sales Management System

- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend:
  - Admin site: React + Vite (desktop)
  - Employee site: React + Vite (mobile portrait locked)

## Folder structure

```
CanovaCRM/
  server/
  admin/
  employee/
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Quick start (Windows-friendly)

Open a terminal in the project root and run:

```bash
npm install
npm run setup

# optional: seed sample data (admin + demo employees/leads)
npm run seed

# start all 3 apps
npm run dev
```

Then open:
- Admin: http://localhost:5173
- Employee: http://localhost:5174
- API: http://localhost:5000

## Run each app separately (optional)

### Backend

Create `server/.env` (copy from `server/.env.example`), then:

```bash
cd server
npm install
npm run seed   # optional
npm run dev
```

Backend runs on `http://localhost:5000`.

### Admin

```bash
cd admin
npm install
npm run dev
```

Admin runs on `http://localhost:5173`

Create `admin/.env` if needed:
```
VITE_API_URL=http://localhost:5000
```

### Employee

```bash
cd employee
npm install
npm run dev
```

Employee runs on `http://localhost:5174`

Create `employee/.env` if needed:
```
VITE_API_URL=http://localhost:5000
```

## Seeded Admin

- Email: `admin@canova.com`
- Password: `Admin@123`

## Employee Login

- Email: employee's email
- Default password: same as email (until changed in Profile)

## Lead auto-assignment rules

- Assign only to employees with same `language` as lead
- Each employee can have max **3 ongoing** leads
- Prioritize employees with **least number of ongoing** leads
- If no eligible employee found, lead remains **Unassigned**
- When lead is closed, it is removed from ongoing and added to closed leads
