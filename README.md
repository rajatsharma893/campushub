# CampusHub

A full-stack College Management System with role-based access for Admin, Faculty and Student.

Created by **Rajat Sharma**.

## Features

- JWT login with three roles: Admin, Faculty, Student
- Students, Faculty, Departments and Courses management (add, edit, delete, search, filter, pagination)
- Attendance: faculty marks daily attendance, students see their percentage with a low-attendance warning (below 75%)
- Marks and results: internal and external marks, automatic grade and CGPA, student report card
- Notices board for admin and faculty
- Dashboard with live statistics
- Tested with 1000 students and 100 faculty records

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, React Router, Axios
- Backend: Node.js, Express
- Database: PostgreSQL (Neon) with Prisma ORM
- Auth: JWT and bcrypt

## Project Structure

- `backend/` Express API, Prisma schema and seed script
- `frontend/` React application

## Run Locally

1. Clone the repository.
2. Backend setup:
   - `cd backend`
   - `npm install`
   - Create a `.env` file with `DATABASE_URL` (your PostgreSQL connection string) and `JWT_SECRET`
   - `npx prisma migrate dev`
   - `node prisma/seed.js`
   - `npm run dev` (runs on http://localhost:5000)
3. Frontend setup:
   - `cd frontend`
   - `npm install`
   - `npm run dev` (runs on http://localhost:5173)

## Demo Logins (after seeding)

- Admin: `admin@college.com`
- Faculty: `faculty1@college.com`
- Student: `student1@college.com`
- Password for all demo accounts: `password123`

These are demo credentials only. Change them before any real deployment.

## API Overview

- `POST /api/auth/login`
- `/api/students`, `/api/faculty`, `/api/departments`, `/api/courses`
- `/api/attendance`, `/api/marks`, `/api/notices`

## Author

Rajat Sharma
