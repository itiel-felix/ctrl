# Ctrl

ERP para negocio de reparación de controles (PlayStation, Xbox, Switch).

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** API Routes (Next.js) + Sequelize
- **Base de datos:** MySQL

## Módulos

1. **Reparaciones** — Controles en taller, fallas estandarizadas (multi-select), repuestos usados, limpieza y estado.
2. **Ventas y gastos** — Ventas con ganancia (costo del control + repuestos) y gastos del negocio.
3. **Inventario** — Repuestos por nombre y consola (enum): sticks, micro switches, stock.

## Requisitos

- Node.js 20+
- MySQL 8+

## Configuración

```bash
cd Ctrl
cp .env.example .env
# Edita .env con tus credenciales MySQL

# Crea la base de datos en MySQL:
# CREATE DATABASE ctrl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

npm install
```

En `.env`, activa una sola vez para crear tablas:

```
SYNC_DB=true
```

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Después de la primera ejecución, quita `SYNC_DB=true` de `.env`.

Si actualizas el esquema (p. ej. campo `failures` JSON), vuelve a poner `SYNC_DB=true` un momento y reinicia.

## Fallas estandarizadas

En reparaciones se eligen con un multiselect ([Base UI Select](https://base-ui.com/react/components/select)): sticks, bumpers, gatillos, cruceta, botones X/Y/A/B, etc. Ver `FAILURE_CODES` en `src/lib/enums.ts`.

## Repuestos predeterminados

En **Inventario**, usa «Cargar repuestos predeterminados» para crear:

- Stick PS4 / PS5 / Xbox One / Xbox Series / Joy-Con
- Micro switch RB/LB (Xbox One y Xbox Series por separado)

## Consolas

Al registrar un control puedes elegir: **PS4**, **PS5**, **Xbox One**, **Xbox Series X|S** o **Switch**.

Si tenías registros con `XBOX_ONE_SERIES`, al arrancar con `SYNC_DB=true` se migran a **Xbox One**. Muévelos manualmente a Series si corresponde.

Cada repuesto tiene **nombre** + **consola** (enum) + **categoría** (stick, micro switch, otro).
