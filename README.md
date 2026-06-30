# Hotel Employee Management System

Hotel Employee Management System is a full-stack internal hotel admin platform built with Vue.js, Node.js, Express.js, and MongoDB.

## Features

- Secure employee authentication with JWT and bcrypt
- Role-based access for admin and receptionist users
- Dashboard with room, revenue, occupancy, and check-in metrics
- Customer search by phone or name with repeat-guest history
- Room CRUD with auto status updates
- Stay and expense tracking with invoice generation
- Customer history, revenue reports, occupancy reports, and recent activity
- Dark/light mode, responsive layout, PDF/print invoice support

## Project Structure

- `backend` - Express API, MongoDB models, controllers, routes, and middleware
- `frontend` - Vue 3 app with Vue Router, Pinia, Axios, and reusable UI components

## Setup

1. Install dependencies in both apps.
2. Copy `.env.example` to `.env` in `backend` and `frontend`.
3. Set `backend/.env` `MONGODB_URI` to your MongoDB Atlas connection string, replacing `<db_username>` and `<db_password>` with real credentials.
4. Run the backend and frontend dev servers.

## Environment Variables

Backend:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

Frontend:

- `VITE_API_BASE_URL`

## Notes

- Customer duplication is prevented by normalized phone numbers.
- Repeat customer lookup uses phone as the primary identifier and name as a fallback search.
- Room availability updates automatically when stays are checked in or checked out.
