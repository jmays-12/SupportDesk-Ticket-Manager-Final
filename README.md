# SupportDesk

A full-stack customer support ticketing app built with React and Flask. Businesses can use it to track customer issues, assign tickets to team members, and manage support requests from one central place instead of scattered across emails and messages.

## Tech Stack

**Frontend:** React, React Router, Tailwind CSS, Vite

**Backend:** Flask, SQLAlchemy, Flask-Bcrypt, Flask-JWT-Extended, Flask-Migrate, Flask-CORS

**Database:** PostgreSQL (SQLite works for local development)

## Features

- User signup and login with hashed passwords
- JWT-based authentication with protected routes on both frontend and backend
- Create, edit, and delete customer records
- Create and manage support tickets
- Assign tickets to team members, with a "claim ticket" shortcut for unassigned tickets
- Filter tickets by status and toggle resolved tickets on/off
- Sort tickets by date, priority, or status
- Paginate the ticket list (10 / 25 / 50 per page)
- Add notes to tickets to track progress
- Only the author of a note can edit or delete it
- Dashboard showing open, critical, and resolved ticket counts
- Color-coded status and priority badges for quick scanning

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL

### Backend Setup

1. Clone the repo and navigate to the server folder

```
cd server
```

2. Create and activate a virtual environment

```
python -m venv venv
source venv/bin/activate
```


3. Install dependencies

```
pip install -r requirements.txt
```

4. Create a `.env` file in the server folder using `.env.example` as a reference

```
DATABASE_URL=postgresql://your_user:your_password@localhost/supportdesk
JWT_SECRET_KEY=replace_me_with_a_long_random_string
JWT_ACCESS_TOKEN_EXPIRES_HOURS=8
```

5. Create the PostgreSQL database

```
createdb supportdesk
```

6. Run migrations

```
flask db upgrade
```

7. (Optional) Seed the database with sample data

```
python seed.py
```

This creates test accounts, customers, tickets, and ticket notes.

> **Warning:** `seed.py` deletes all existing users, customers, tickets, and notes before inserting sample data. Do not run it against a database you want to keep.

The seed script creates two test accounts:

| Email | Password |
| --- | --- |
| test@test.com | test |
| admin@supportdesk.com | test |

8. Start the Flask server

```
python app.py
```

The backend will be running at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the client folder

```
cd client
```

2. Install dependencies

```
npm install
```

3. (Optional) Point the frontend at a different backend by creating a `.env` file in the client folder

```
VITE_API_URL=http://localhost:5000
```

If unset, the frontend defaults to `http://localhost:5000`.

4. Start the dev server

```
npm run dev
```

The frontend will be running at `http://localhost:5173`.

## API Endpoints

Protected endpoints require a valid JWT access token in the `Authorization` header (`Bearer <token>`).

### Auth

- `POST /api/signup` - create a new user account
- `POST /api/login` - log in with email and password

### Users

- `GET /api/users` - get all users (used for the assign ticket dropdown)

### Customers

- `GET /api/customers` - get all customers
- `POST /api/customers` - create a customer
- `PATCH /api/customers/<id>` - update a customer
- `DELETE /api/customers/<id>` - delete a customer

### Tickets

- `GET /api/tickets` - get all tickets. Supports pagination and filtering via query params: `page`, `limit`, `status`, `sort_by` (`dateold`, `datenew`, `priority`, `status`), and `show_resolved`
- `GET /api/tickets/<id>` - get a single ticket with its notes
- `POST /api/tickets` - create a ticket
- `PATCH /api/tickets/<id>` - update a ticket
- `DELETE /api/tickets/<id>` - delete a ticket
- `GET /api/tickets/stats` - counts of open, resolved, and unresolved critical tickets (used by the dashboard)

### Ticket Notes

- `POST /api/tickets/<id>/notes` - add a note to a ticket
- `PATCH /api/notes/<id>` - update a note (author only)
- `DELETE /api/notes/<id>` - delete a note (author only)

## Project Structure

```
supportdesk/
  client/                 React frontend
    components/
      Navbar.jsx          Navigation bar
    pages/
      Auth.jsx            Login and signup
      Customers.jsx       Customer list and management
      Dashboard.jsx       Overview stats and recent tickets
      TicketDetail.jsx    Single ticket view with notes
      Tickets.jsx         Ticket list and management
    utils/
      dateUtils.js        Date formatting helpers
    api.js                Fetch helper (attaches JWT, handles 401s)
    App.jsx               Routes and auth bootstrap
    main.jsx              React entry point
    index.css             Tailwind entry
  server/                 Flask backend
    app.py                API routes
    models.py             SQLAlchemy models
    seed.py               Sample data for testing
    requirements.txt
    .env.example
    migrations/           Alembic migration files
```