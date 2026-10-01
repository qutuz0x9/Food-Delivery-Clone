# Database Design Learning Plan

A personal learning plan, written after reviewing the Food Delivery schema end to end (identity, customer,
restaurant, driver, reviews: 43 tables). It has three parts: the mistakes found in the design, a study plan,
and practical exercises. Read the first part as a map of where you were, not as a grade.

## Read this first

Almost every issue below is a normal beginner pattern. Many professional schemas have the same ones. What matters
is that you found most of them yourself through audits and fixed them. You also made good decisions that many
beginners miss (listed in the next section). The goal of this plan is to move your checking earlier: instead of
finding these problems in an audit, you catch them while you draw the table.

A few things that looked like mistakes were really tool limits, not your errors: enums stored as text plus a CHECK
(Prisma 8 cannot create native Postgres enums), no `smallint` type, and no deferrable foreign keys. Do not spend
study time on those.

## What you did well

- **Snapshots.** Keeping `delivery_address` (a frozen copy) separate from `delivery_addresses` (editable), and
  copying option names into `order_item_options`. This protects history from later edits. It is a senior-level
  habit.
- **Status history.** `order_status_history` as the source of truth, with cached timestamp columns on `orders`.
- **Separating similar concepts.** `menu_categories` vs `restaurant_categories`, earnings vs payouts, assignment
  status vs order status.
- **Tracing to requirements.** Using FR ids to ask "does a table back this requirement?" This is how the missing
  `admins` table was found.
- **Willingness to question your own design.** Asking "why is this relation here?" about `audit_log` led to the
  actor snapshot decision.

## The mistakes, grouped by theme

Each item says what happened, why it matters, and the rule to remember.

### 1. Rules written in words but not in the database

This was the biggest theme. The requirements said "one", "positive", "after", but the schema allowed anything.

| What happened | Why it matters | Rule |
| --- | --- | --- |
| `user_id` on `admins`, `customers`, `restaurants`, `drivers` had no `UNIQUE` | "One profile per user" was only a hope; two profiles could exist | Every one-to-one relationship needs `UNIQUE` on the foreign key |
| Nothing stopped two reviews per order, two hours rows per day, two active vehicles per driver, two default addresses, two carts per customer | Each is a "one per X" rule that the app would have to defend alone | Write each "one per X" rule as a unique constraint, or a partial unique index when it only applies to some rows |
| No `CHECK` on prices, quantities, ratings, discount ranges, date ranges, coordinates | A bug could store a negative price or a rating of 47 | Ask "what values are impossible?" for every number and date column and add a `CHECK` |
| The order total formula was in the requirements but not enforced | Totals could silently disagree with their parts | Constraints can enforce arithmetic, such as `total = subtotal + fee + tax - discount` |

### 2. Keys and relationships

| What happened | Why it matters | Rule |
| --- | --- | --- |
| `user_tokens` primary key was `(login_provider, token_name)`, missing `user_id` | Only one user in the whole system could hold a given token name | A composite key must include everything that makes a row unique. Test it by asking "can two different users have this?" |
| Foreign key columns had no index | Postgres indexes the referenced side, not the referencing side. Lookups like "all tokens of this user" scanned the table | Add an index to every foreign key column unless another index already starts with it |
| An item could point at another restaurant's category; a reply could name a different restaurant than its review; an earning could reference another driver's payout | Each foreign key was valid on its own, but the rows disagreed with each other | When two rows must share an owner, use a composite foreign key that includes the owner column |
| `ON DELETE` behavior was never decided | Deleting a parent could fail or cascade by accident | Choose delete behavior per relationship on purpose, and write down why |
| `delivery_addresses` vs `delivery_address`: near-identical names for different ideas | Hard to read and easy to mix up | Name tables by their role, such as `delivery_address_snapshots` |

### 3. Data types and consistency

| What happened | Why it matters | Rule |
| --- | --- | --- |
| `bollean` and `inet6` are not real types; a constraint name had a stray space; one primary key line was malformed | The script would not have run | Run your DDL against a real database early, and often |
| `currency` was a bare `char`, which means one character | "USD" would not fit | `char` without a length is `char(1)`. Prefer `char(3)` with a check, or a currency table |
| Money was sometimes `decimal(10,2)` and sometimes bare `decimal` | Inconsistent precision and rounding behavior | Pick one money type and use it everywhere |
| Timestamps had no time zone | Times become ambiguous across regions or daylight-saving changes | Use `timestamptz` for real moments in time |
| Some columns were nullable or had no default for no clear reason, such as `restaurants.status` and `created_at` | A null status can silently hide a row from a filter, and a null skips CHECKs | Default to `NOT NULL` and justify every nullable column |
| Some ids had `gen_random_uuid()` defaults and others did not | Two different policies in one schema | Decide the id policy once and apply it everywhere |
| Names like `isActive` and `update_at` broke the naming convention | Mapping errors and confusion | Pick a naming convention first, and lint against it |

### 4. Modeling choices

| What happened | Why it matters | Rule |
| --- | --- | --- |
| `suspended` existed in three status enums | Three places to update, and they could disagree | One concept, one home. Do not copy a status into several tables |
| The `admins` table was missing | Nothing marked a user as an admin | After drawing the schema, walk every requirement and ask "which table stores this?" |
| Claims, logins, tokens and role-claims tables were copied from a framework pattern with no requirement behind them | Extra tables nobody uses, and confusion later | Add a table only when a requirement needs it |
| The cart had no lifecycle: how many carts, what happens at checkout | Ambiguity moved into app code | Decide lifecycle rules before drawing the table |
| Cart items had no way to hold options but order items did | The checkout flow would need a workaround | Draw the user flow end to end and check every step has a home in the schema |
| Order items had no item-name snapshot while options did | Renaming a menu item would rewrite history | Anything that must stay true after the source changes needs a snapshot |
| Cached columns (`rating`, `total_deliveries`) had no note saying they were caches | Someone might treat them as the source of truth | Comment every denormalized column and name its source |

### 5. Process mistakes

- **Two sources of truth.** The SQL file and the Prisma contract both claimed to be canonical, then drifted. Keep
  one.
- **Designing before writing the rules.** The constraints above would have appeared naturally if you had listed
  business rules first. The audits were doing that work after the fact.
- **No running database during design.** Most type errors would have shown up in the first minute of a real
  `CREATE TABLE`.
- **Testing only the happy path.** A schema is good when bad data is rejected, not only when good data is
  accepted.

## The study plan

Suggested pace: five to six hours a week for about twelve weeks. Spend about a third of each session reading and
two thirds typing real SQL. If a phase is easy, skip ahead. If it is hard, repeat it. Do the exercises in a
scratch database, never in your project database.

### Phase 0: Set up a place to experiment (half a day)

- Install PostgreSQL locally (or run it in Docker) and learn `psql`: `\d table`, `\di`, `\dt`, `\x`, `\timing`.
- Create a scratch database that you can wipe at any time.
- Keep a file called `scratch.sql` where you save every experiment.

### Phase 1: Relational foundations (weeks 1 and 2)

**Topics:**

- Tables, rows, primary keys, candidate keys, surrogate vs natural keys.
- Relationships: one-to-one, one-to-many, many-to-many, and how each is built with keys.
- Normalization: 1NF, 2NF, 3NF, and why BCNF exists. Also learn when to break it on purpose.
- Entity-relationship diagrams and cardinality notation.

**Exercises:**

1. Take any spreadsheet you own and normalize it to 3NF by hand.
2. Draw an ERD on paper for a library (books, copies, members, loans, fines) before writing any SQL.
3. Reread your own schema and, for every table, write the primary key and ask "what makes two rows the same?"
4. Find three places in this project where you broke normalization on purpose (for example `Order.subtotal`) and
   write one sentence defending each.

### Phase 2: Constraints as design tools (weeks 3 and 4)

This phase fixes the biggest theme from your mistakes.

**Topics:**

- `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT`, `PRIMARY KEY`, `FOREIGN KEY`.
- Foreign key actions: `RESTRICT`, `CASCADE`, `SET NULL`, `NO ACTION`.
- Partial unique indexes (unique only `WHERE` something is true).
- Composite foreign keys and why they enforce "same owner."
- Exclusion constraints for "no overlapping ranges" (needs the `btree_gist` extension).
- Deferrable constraints and when circular references need them.

**Exercises:**

1. Build the "one default address per customer" rule with a partial unique index, then try to break it with two
   `INSERT` statements.
2. Build "a booking cannot overlap another booking for the same room" with an exclusion constraint.
3. Create a `restaurants`, `categories`, `items` trio and show that without a composite key an item can point at
   another restaurant's category. Then fix it.
4. For ten columns in this project, write the `CHECK` you would add, then try to insert one value that violates it.
5. **Break your schema.** For each constraint in this project, write an `INSERT` that should fail and run it.
   If it succeeds, the constraint is missing.

### Phase 3: Data types, money and time (week 5)

**Topics:**

- `numeric(p,s)` vs `float`: why money never uses floating point.
- `timestamp` vs `timestamptz`, and storing time in UTC.
- `uuid` vs `bigint` identity ids: storage, ordering, and when each fits.
- `text` vs `varchar(n)` vs `char(n)` (and why bare `char` is a trap).
- Native enums vs lookup tables vs text plus CHECK: the trade-offs.
- `jsonb`: when it is the right tool and when it hides a missing table.
- Soft delete vs hard delete: `deleted_at`, unique indexes that ignore deleted rows, and legal reasons to delete.

**Exercises:**

1. Prove floating point is wrong for money: add `0.1 + 0.2` in `float8` and in `numeric`.
2. Insert the same moment into a `timestamp` and a `timestamptz` column from two session time zones and compare.
3. Re-model order status as a lookup table instead of an enum, then list what you gained and lost.
4. Write down this project's id policy in three sentences, then check every table follows it.

### Phase 4: Indexes and query performance (weeks 6 and 7)

**Topics:**

- How a B-tree index works at a high level, and what the planner chooses.
- Composite index column order (the leftmost-prefix rule).
- Partial, covering (`INCLUDE`) and expression indexes.
- Why foreign keys need their own index.
- Reading `EXPLAIN` and `EXPLAIN (ANALYZE, BUFFERS)`: sequential scan vs index scan, estimated vs actual rows.
- The cost of indexes: slower writes and more storage.

**Exercises:**

1. Generate a million rows of fake orders (`generate_series` works well) and time "orders of one customer" with
   and without an index.
2. For the query "active orders of a restaurant, newest first", design the best composite index, then check that
   `EXPLAIN` uses it. Try the columns in the wrong order and compare.
3. Take your list of API endpoints and write the SQL behind each one. For each query, say which index serves it.
4. Drop an index you think is useless and check what slows down.

### Phase 5: Transactions and concurrency (weeks 8 and 9)

This is where checkout, payments and reviews become correct under load.

**Topics:**

- ACID, and what a transaction really guarantees.
- Isolation levels, with `READ COMMITTED` (the default) first, then `REPEATABLE READ` and `SERIALIZABLE`.
- Race conditions: lost updates, double submits, write skew.
- Row locks: `SELECT ... FOR UPDATE`, `SKIP LOCKED` for job queues.
- Idempotency keys for payments and retries.
- Handling a unique-violation error as a normal outcome, not a crash.

**Exercises:**

1. Open two `psql` windows and reproduce a double "set as default address" race. Then fix it with a constraint, and
   again with a lock. Compare.
2. Simulate two customers buying the last item in stock. Make it correct three ways.
3. Write the checkout transaction for this project as pseudo-code: copy cart to order, order items, options,
   status history, payment, delete cart. Mark every place it could fail and what happens then.
4. Add an idempotency key to a payment table so a retried request cannot charge twice.

### Phase 6: Modeling patterns (weeks 9 and 10)

**Topics:**

- Snapshot tables and "copy the facts you need to remember."
- Append-only history and audit tables.
- State machines: allowed transitions, and storing them in the database vs in code.
- Ledgers for money: balances computed from entries instead of one editable number.
- Denormalized caches: how to keep them correct, and how to mark them.
- Polymorphic references (like `audit_log.entity_name` and `entity_id`) and their costs.
- Many-to-many join tables with their own attributes.
- Multi-tenancy in one paragraph: what changes when many businesses share one schema.

**Exercises:**

1. Design a wallet with a ledger table, then prove the balance equals the sum of entries.
2. Add a state machine to orders: a table of allowed transitions, and a trigger or check that rejects an illegal one.
3. For each cached column in this project, write the exact transaction that keeps it correct.
4. Pick three tables in a real open-source app you like and find where it uses a snapshot or history table.

### Phase 7: Migrations and schema evolution (week 11)

**Topics:**

- Why you never edit a table by hand in production.
- The expand and contract pattern: add the new thing, backfill, switch the code, remove the old thing.
- Adding a `NOT NULL` column safely, and what locks a table.
- Backfilling data in batches.
- Renames and drops, and why they are the dangerous ones.
- Reading a generated migration before applying it.

**Exercises:**

1. In a scratch database, change a column from `timestamp` to `timestamptz` and read the plan Prisma generates.
2. Rename a column using expand and contract across three migrations.
3. Add a `NOT NULL` column with a default to a table of a million rows and time it.
4. Restore a database from a backup you took. If you have never restored one, the backup is only a hope.

### Phase 8: Process and review habits (week 12, then forever)

**Topics:**

- Turning requirements into a rule list before drawing tables.
- Reading and drawing ERDs, and keeping them current.
- Writing a short decision record for each non-obvious choice.
- Code review for schemas.

**Exercises:**

1. Use the review checklist below on this project from scratch and compare what you find with the audits.
2. Write a one-page decision record for three choices in this project (for example the one-cart rule).
3. Review a friend's schema, or an open-source one, and write five findings with fixes.

## Practical projects (do them in order)

Each project is small and teaches one cluster of ideas. Aim for a working schema with seed data and ten
queries.

| # | Project | What it forces you to learn |
| --- | --- | --- |
| 1 | Library: books, copies, members, loans, fines | Keys, normalization, one-to-many, a simple state |
| 2 | Hotel booking with no double booking | Exclusion constraints, date ranges, transactions |
| 3 | Wallet and payments with a ledger | Numeric money, append-only data, idempotency, concurrency |
| 4 | Blog with tags, comments and soft delete | Many-to-many, soft delete, unique indexes that ignore deleted rows |
| 5 | Ride sharing: drivers, live locations, assignments | High-volume writes, partial indexes, race conditions on assignment |
| 6 | **Rebuild this Food Delivery schema from scratch** | Everything. See below |

**Project 6 in detail.** Close the contract file. Read only the functional requirements. List every business rule
as a sentence. Draw the ERD. Write the SQL with constraints. Then compare your result with this project's
contract and write down each difference: which is better, and why. Do this once at the end of Phase 5 and again
at the end of the plan, and compare your two attempts.

## The design review checklist

Run this on every new table. When you can answer these without looking, you have the habit.

1. What requirement or flow needs this table? (If none, do not add it.)
2. What is the primary key, and what makes two rows the same?
3. Is every relationship's cardinality (one, many) enforced by a key or a unique constraint?
4. Which "one per X" rules exist, and is each one a constraint?
5. Which values are impossible for each numeric, date and text column, and is there a `CHECK`?
6. Is every column `NOT NULL` unless I can say why it may be empty?
7. Does every foreign key column have an index?
8. What happens on delete for each relationship, and is that deliberate?
9. If a related row is edited later, should this row keep the old value (snapshot)?
10. Is any value stored twice? If so, which copy is the source, and where is it documented?
11. Are all rows that must share an owner tied together with a composite key?
12. Are money, time and id types the same as everywhere else in the schema?
13. Which queries will run most, and which index serves each?
14. What two requests at the same moment could break this table?
15. How will I change this table later without downtime?

## Weekly routine

- **Two sessions of reading and typing** (about 90 minutes each): the phase topics, with every example run in
  `psql`.
- **One session of exercises** (about 90 minutes): the phase exercises, saved in `scratch.sql`.
- **One short review** (30 minutes): pick one table from this project and run the checklist. Write down one finding.
- **Keep a mistakes log.** One line per mistake, with the rule it taught. Review it monthly. This is the most
  valuable file you will keep.

## Milestones

| After | You should be able to |
| --- | --- |
| Phase 2 | Turn any "one per X" sentence into a constraint, and break your own schema with a failing `INSERT` |
| Phase 4 | Explain why a query is slow from its `EXPLAIN` output, and design the index that fixes it |
| Phase 5 | Name the race condition in a flow and fix it with a constraint or a lock |
| Phase 7 | Change a column's type safely and read a migration plan critically |
| Phase 8 | Review a schema you have never seen and give useful findings in thirty minutes |

## Reading list

Pick one book per phase group and use the PostgreSQL official documentation as your reference for everything.

- **PostgreSQL official documentation**: the chapters on data types, constraints, indexes, concurrency control
  and `EXPLAIN`. It is excellent and free.
- **SQL Antipatterns** by Bill Karwin: short chapters on common schema mistakes. Many of your mistakes appear in it.
- **Database Design for Mere Mortals** by Michael Hernandez: gentle introduction to modeling and normalization.
- **Designing Data-Intensive Applications** by Martin Kleppmann: read the chapters on data models, transactions
  and consistency. Slow reading, large payoff.
- **The Art of PostgreSQL** by Dimitri Fontaine: modern, practical SQL and modeling in Postgres.
- **Use The Index, Luke** (a free web book): the best explanation of how indexes work.
- **PG Exercises**: free interactive SQL practice to build query fluency.

## How to apply this to this project

1. Settle the two open decisions from the final review: cart options, and which identity tables to keep.
2. Apply the "cheap now, costly later" items from the final review while the tables are empty.
3. Before implementing each module, write its rules as a list (checklist step 4 and 5), then compare with the
   contract. Add any missing constraint first.
4. When you hit a bug during implementation, ask "which constraint would have stopped this?" and add it.
5. Do the Phase 5 exercises before building checkout. It is the most concurrency-sensitive flow in the project.
