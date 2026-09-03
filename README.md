# Food Delivery Clone

## Summary

A backend platform for a food delivery service (similar to Uber Eats / Talabat), built with **TypeScript**, **Node.js/Express**, and **Prisma (PostgreSQL)**. It serves four types of actors:

- **Customers** — browse restaurants and menus, manage delivery addresses, order through a shopping cart, track orders, and leave reviews.
- **Restaurants** — manage menus, operating hours, availability, promotions, and incoming orders.
- **Delivery Drivers** — manage vehicles and documents, receive order assignments, update location/availability, and track payouts.
- **Administrators** — oversee accounts, orders, refunds, and platform activity, with all mutating actions recorded in an audit log.

The system covers the full order lifecycle (cart → order → payment → delivery → status history), JWT-based authentication with role-based access control, and a REST API versioned under `/api/v1`.

Project scope and behavior are defined in [Functional-Requirements.md](docs/requirements/Functional-Requirements.md), the relational data model in `docs/dbdesign/`, and the API surface (work in progress) in [openapi.yaml](docs/api/openapi.yaml).
