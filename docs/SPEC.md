# Functional Specification: Expense Tracker Web App

## 1. Overview & Problem Statement
A fast, intuitive, client-side expense tracking web application allowing individuals to track their daily expenditures, organize them by category, and visualize their monthly total spending without requiring any account registration or login. All data persists locally in the browser (`localStorage`).

## 2. Tech Stack & Architecture
- **Framework & Language:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Toolchain:** Node LTS (v20+) + npm
- **Styling:** Clean modern CSS with accessible contrast and responsive card layout
- **State Management & Persistence:** React hooks (`useState`, `useEffect`) backed by browser `localStorage`
- **Testing:** Unit & component test suite verifying calculation logic, monthly grouping, and persistence

## 3. Core Features & Given/When/Then Acceptance Criteria

### Feature 1: Project Skeleton & Configuration (Ticket 1)
- **Given** a clean workspace clone,
- **When** the developer runs `npm install`, `npm test`, `npm run lint`, and `npm run build`,
- **Then** all toolchain commands exit 0 and produce a functional empty shell with base styles and TypeScript types.

### Feature 2: Expense Creation & Category Assignment
- **Given** the expense entry form,
- **When** a user enters an amount (positive number), description, category (Food, Transport, Housing, Entertainment, Utilities, Other), and date,
- **Then** the expense is validated, added to the expense list, and saved to `localStorage`.
- **Given** invalid input (negative amount, empty description, or invalid date),
- **When** the user attempts to submit,
- **Then** an inline validation error is shown and no expense is recorded.

### Feature 3: Expense List & Filtering
- **Given** an existing list of expenses,
- **When** a user views the list,
- **Then** expenses are displayed in reverse chronological order showing date, description, category badge, and formatted currency amount.
- **Given** an expense item in the list,
- **When** the user clicks "Delete",
- **Then** the item is removed from the list and `localStorage` is updated immediately.

### Feature 4: Monthly Total & Category Breakdown Calculations
- **Given** a set of expenses spanning one or more months,
- **When** viewing the dashboard,
- **Then** the total expenditures for the selected month are calculated accurately as the sum of all matching expenses.
- **Given** expenses across multiple categories in a selected month,
- **When** viewing category summaries,
- **Then** each category displays its total dollar amount and percentage of that month's overall spend.

## 4. Phased Feature Breakdown
1. **Ticket 1 (Skeleton):** Project structure, build configuration (Vite, React, TypeScript), `factory.project.json`, and smoke test. (Complexity: Low)
2. **Ticket 2 (Expense Engine):** Pure calculation functions for monthly aggregation, category totals, and currency formatting with comprehensive unit tests. (Complexity: Medium)
3. **Ticket 3 (UI & Storage):** Responsive React interface with expense form, category selection, monthly summary dashboard, expense table, and localStorage persistence. (Complexity: Medium)

## 5. Non-Goals
- User authentication, multi-tenant accounts, or cloud backend servers.
- Complex multi-currency conversion or exchange rate APIs.
- Bank account synchronization or receipt OCR scanning.
