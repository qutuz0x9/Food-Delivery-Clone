# Food Delivery Clone

## Summary

A backend platform for a food delivery service (similar to Uber Eats / Talabat), built with **TypeScript**, **Node.js/Express**, and **Prisma (PostgreSQL)**. It serves four types of actors:

- **Customers** — browse restaurants and menus, manage delivery addresses, order through a shopping cart, track orders, and leave reviews.
- **Restaurants** — manage menus, operating hours, availability, promotions, and incoming orders.
- **Delivery Drivers** — manage vehicles and documents, receive order assignments, update location/availability, and track payouts.
- **Administrators** — oversee accounts, orders, refunds, and platform activity, with all mutating actions recorded in an audit log.

The system covers the full order lifecycle (cart → order → payment → delivery → status history), JWT-based authentication with role-based access control, and a REST API versioned under `/api/v1`.

Project scope and behavior are defined in [Functional-Requirements.md](docs/requirements/Functional-Requirements.md), the full REST endpoint index in [APIs-Endpoints.md](docs/requirements/APIs-Endpoints.md), the relational data model in [Food-Delivery-System-sqldiagram.sql](docs/dbdesign/Food-Delivery-System-sqldiagram.sql) (with an ERD companion PDF in the same folder), and the API surface (work in progress) in [openapi.yaml](docs/api/openapi.yaml).

## Current Status

This project is in the design/documentation phase — no business logic or database layer has been implemented yet.

- **App scaffold**: a minimal Express + TypeScript app (`src/app.ts`, `src/index.ts`) that serves the bundled OpenAPI spec via Swagger UI at `/api-docs`.
- **Database design**: the full relational schema is finalized in `docs/dbdesign/Food-Delivery-System-sqldiagram.sql`, covering identity/auth, customers, restaurants, menus, orders, payments, drivers, and audit logging.
- **OpenAPI documentation**: split into `docs/api/paths/`, `docs/api/schemas/`, and `docs/api/responses/` per domain, following the conventions in `.claude/rules/open-api-rules.md`. Documented so far, tagged by resource domain (`Auth`, `Customers`, `Restaurants`, `Menu`):
  - **Auth** — customer and restaurant registration, login, logout, and password recovery.
  - **Customers** — profile management and delivery address CRUD.
  - **Restaurants** — public browsing/search/filtering, restaurant self-service profile, logo upload, operating hours, and availability status.
  - **Menu** — public menu/menu-item browsing and search, plus restaurant-side menu category management.
  - Still to document: menu item CRUD (images, options), restaurant order management, promotions, reviews, dashboard, driver API, and admin API.

Run `npm run dev` and open `http://localhost:3000/api-docs` to browse the current API documentation interactively.
