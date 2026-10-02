# Food Delivery Clone

## Summary

A backend platform for a food delivery service (similar to Uber Eats / Talabat), built with **TypeScript**, **Node.js/Express**, and **Prisma (PostgreSQL)**. It serves four types of actors:

- **Customers** — browse restaurants and menus, manage delivery addresses, order through a shopping cart, track orders, and leave reviews.
- **Restaurants** — manage menus, operating hours, availability, promotions, and incoming orders.
- **Delivery Drivers** — manage vehicles and documents, receive order assignments, update location/availability, and track payouts.
- **Administrators** — oversee accounts, orders, refunds, and platform activity, with all mutating actions recorded in an audit log.

The system covers the full order lifecycle (cart → order → payment → delivery → status history), JWT-based authentication with role-based access control, and a REST API versioned under `/api/v1`.

Project scope and behavior follow from the data model in [contract.prisma](src/prisma/contract.prisma), which is the only source of truth (`docs/dbdesign/` and `docs/requirements/Functional-Requirements.md` are older drafts kept for history). The API surface is documented in [openapi.yaml](docs/api/openapi.yaml), and every route is listed in [APIs-Endpoints.md](docs/requirements/APIs-Endpoints.md).

## Current Status

This project is in the design/documentation phase — the data model and API documentation are complete enough to build against, but no business logic has been implemented yet.

- **App scaffold**: a minimal Express + TypeScript app (`src/app.ts`, `src/index.ts`) that serves the bundled OpenAPI spec via Swagger UI at `/api-docs`.
- **Database**: the full relational schema is defined in the Prisma 8 data contract `src/prisma/contract.prisma` (identity/auth, customers, restaurants and branches, menus, cities, carts, orders, payments, drivers and dispatch, reviews, audit logging). Its migrations are in `migrations/`, and `npm run db:seed` inserts the reference cities.
- **OpenAPI documentation**: split into `docs/api/paths/`, `docs/api/schemas/`, and `docs/api/responses/` per domain, following the conventions in `.claude/rules/open-api-rules.md`. It covers all four actors:
  - **Customers** — registration and login, email and phone verification, profile, delivery addresses, cart, orders and tracking, payments, and reviews, plus public browsing of restaurants, menus, cities, cuisines and reviews.
  - **Restaurants** — registration and profile, branches with their own hours and availability, menu categories, items, images and options, incoming orders, promotions, cuisine tags, review replies, and a dashboard.
  - **Drivers** — registration with a working city, vehicles and documents, availability and location, delivery requests, deliveries including cash confirmation, earnings, payouts, statistics, and reviews.
  - **Administrators** — account management for administrators, cities, customers, restaurants and drivers, orders and dispatch monitoring (with manual assignment), payments and refunds, driver payouts, review moderation, an audit log, a dashboard, and reports.
  - Still to document: roles and claims, session management, a live map of driver positions, and a few administrator oversight views (promotions, menu items, platform-wide earnings).

Run `npm run dev` and open `http://localhost:3000/api-docs` to browse the current API documentation interactively.
