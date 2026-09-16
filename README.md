# Athenaeum Book Platform

This project is split into two folders:

- `frontend` - the existing React frontend app.
- `backend` - the Express API for the book recommendation platform.

## Run The Frontend

```bash
cd frontend
npm install
npm run dev
```

## Run The Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

## Main Backend Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/books`
- `GET /api/genres`
- `GET /api/books/genres`
- `GET /api/books/featured`
- `GET /api/books/:id`
- `POST /api/books`
- `PUT /api/books/:id`
- `DELETE /api/books/:id`
- `POST /api/books/:id/rate`
- `POST /api/books/:id/save`
- `GET /api/recommendations`
- `GET /api/users/me/profile`
- `PUT /api/users/me/profile`
- `PUT /api/users/me/preferences`
- `POST /api/users/me/change-password`
- `GET /api/users/me/export`
- `DELETE /api/users/me`
- `GET /api/users/me/dashboard`
- `GET /api/users/me/activity`
- `GET /api/users/me/genre-mix`
- `GET /api/users/me/reading-list`
- `POST /api/users/me/reading-list`
- `PATCH /api/users/me/reading-list/:id`
- `DELETE /api/users/me/reading-list/:id`
- `GET /api/reviews`
- `POST /api/books/:id/reviews`
- `GET /api/admin/overview`
- `GET /api/admin/activity`
- `GET /api/admin/books`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `PATCH /api/admin/users/:id/deactivate`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/reviews`
- `PATCH /api/admin/reviews/:id/status`
- `PATCH /api/admin/reviews/:id/approve`
- `PATCH /api/admin/reviews/:id/hide`
- `DELETE /api/admin/reviews/:id`
- `GET /api/admin/recommendations/health`
