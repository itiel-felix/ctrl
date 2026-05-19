# Ctrl

ERP for a game controller repair business (PlayStation, Xbox, Switch).

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** API Routes (Next.js) + Sequelize
- **Database:** MySQL

## Modules

1. **Repairs** — Controllers in the workshop, standardized failures (multi-select), used parts, cleaning, and status.
2. **Sales and expenses** — Sales with profit tracking (controller cost + parts) and business expenses.
3. **Inventory** — Parts by name and console (enum): sticks, micro switches, stock.

## Requirements

- Node.js 20+
- MySQL 8+

## Setup

```bash
cd Ctrl
cp .env.example .env
# Edit .env with your MySQL credentials

# Create the database in MySQL:
# CREATE DATABASE ctrl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

npm install
```

In `.env`, enable this once to create the tables:

```
SYNC_DB=true
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

After the first run, remove `SYNC_DB=true` from `.env`.

If you update the schema (for example, the JSON `failures` field), temporarily enable `SYNC_DB=true` again and restart.

## Standardized Failures

In repairs, failures are selected with a multi-select ([Base UI Select](https://base-ui.com/react/components/select)): sticks, bumpers, triggers, D-pad, X/Y/A/B buttons, etc. See `FAILURE_CODES` in `src/lib/enums.ts`.

## Default Parts

In **Inventory**, use “Load default parts” to create:

- Stick PS4 / PS5 / Xbox One / Xbox Series / Joy-Con
- RB/LB micro switch (Xbox One and Xbox Series separately)

## Consoles

When registering a controller, you can choose: **PS4**, **PS5**, **Xbox One**, **Xbox Series X|S**, or **Switch**.

If you had records with `XBOX_ONE_SERIES`, they are migrated to **Xbox One** when starting with `SYNC_DB=true`. Move them manually to Series if needed.

Each part has a **name** + **console** (enum) + **category** (stick, micro switch, other).
