# roadmap.md
# TTC Project Material Manager — CVF Roadmap

**Status date:** 2026-08-28  
**Current governance phase:** `Phase 2 — AI Studio Product Prototype`  
**Production authority:** `NOT_AUTHORIZED`  
**Prototype promotion default:** `PARTIAL_REUSE`

> This file is protected by `CVF_GOVERNANCE.md`. Do not delete, rename, move, truncate, or silently rewrite it.

---

## 1. Product Delivery Lifecycle

The project follows:

`Product Discovery → AI Studio Product Prototype → Antigravity Handoff Demo → Customer Demo/UAT → Customer Product Acceptance + Final SPEC → Prototype Promotion Review → Developer Work Orders & Production Build → Review / Freeze`

Phase 1 and Phase 2 currently run in parallel:

`SPEC refinement ↔ UI Prototype ↔ Operator Review`

The current prototype is evidence for requirement validation. It is not build authority.

---

## 2. Phase Status

| Phase | Status | Current meaning | Next allowed move |
|---|---|---|---|
| Phase 1 — Product Discovery | `IN_PROGRESS` | Core material/supplier/RBAC/receiving rules established; BOM/Inventory/Import/Invoice/Technical areas still partial | Continue SPEC refinement from prototype evidence |
| Phase 2 — AI Studio Product Prototype | `IN_PROGRESS` | CVF UI baseline is ready; staged UI implementation is about to begin | Build and review Prototype V0 stage by stage |
| Phase 3 — Antigravity Handoff Demo | `NOT_STARTED` | Engineering cleanup/verification has not started | Only after Prototype V0 operator review |
| Phase 4 — Customer Demo / UAT | `NOT_STARTED` | No customer UAT yet | Only after stable handoff demo |
| Phase 5 — Customer Product Acceptance + Final SPEC | `NOT_STARTED` | Final business/technical SPEC not approved | Only after customer feedback disposition |
| Phase 6 — Prototype Promotion Review | `NOT_STARTED` | Reuse/rebuild decision not performed | Only after Final SPEC |
| Phase 7 — Developer Work Orders & Production Build | `NOT_STARTED` | Production build not authorized | Requires Final SPEC + Work Orders + explicit authority |

---

## 3. Prototype V0 Stage Plan

### Stage 0 — Governance Bootstrap

**Status:** `READY_FOR_REVIEW`

Scope:

- Create and preserve `CVF_GOVERNANCE.md`.
- Create and preserve `roadmap.md`.
- Create and preserve `CVF_SPEC.md`.
- Create and preserve `CVF_UI.md`.
- Configure AI work to read these files before code changes.
- Keep production authority `NOT_AUTHORIZED`.

Acceptance gate:

- All four files exist in the project.
- AI confirms it will not delete/rename/truncate them.
- AI reads them before implementation.
- No production backend/database/auth is introduced.

Only Product Owner/CVF reviewer may mark Stage 0 `UI_REVIEW_PASS`.

---

### Stage 1 — Foundation: App Shell, Sidebar, Routing, Visual System

**Status:** `READY_TO_PROTOTYPE`

Scope:

- React + TypeScript + Vite foundation.
- Enterprise/Industrial visual baseline.
- Fixed collapsible sidebar.
- Top bar, breadcrumb, prototype badge.
- React Router.
- Shared common components.
- Mock data structure and LocalStorage boundary.
- Vietnamese default, i18n-ready structure.

Critical acceptance:

- App renders without backend.
- Sidebar contains all frozen navigation groups.
- Collapse/expand works.
- Collapsed items expose tooltips.
- Route changes do not break the shell.
- Desktop layout works at 1366×768 and larger.
- `PROTOTYPE V0 · MOCK DATA · NOT PRODUCTION` is visible.
- Protected CVF files remain untouched unless explicitly authorized.

Gate to Stage 2: all critical items PASS or have an explicit accepted deferment.

---

### Stage 2 — System Catalog / Master Data

**Status:** `NOT_STARTED`

Scope:

- System Catalog tabs.
- Project Master.
- Customer Master.
- Material Category.
- UOM.
- Manufacturer.
- Supplier.
- Shared CRUD patterns.

Critical acceptance:

- Default tab = Dự án.
- All six frozen tabs exist.
- Search/filter/action patterns are consistent.
- Project Code unique validation works.
- Customer Code unique validation works.
- UOM Code unique validation works.
- Manufacturer Code unique validation works.
- Supplier Tax Code unique validation works.
- Reference-safe mock delete behavior works where SPEC defines it.
- Unresolved Project delete lifecycle remains labeled `Chờ chốt SPEC`.

Gate to Stage 3: master-data CRUD pattern is accepted.

---

### Stage 3 — Material & Supplier Pricing

**Status:** `NOT_STARTED`

Scope:

- Material List.
- Material Create/Edit.
- Material Detail.
- Supplier Detail.
- Supplier pricing.
- Previous/Current price.
- Preferred Supplier.
- Manual bulk price editing.
- Import placeholders.

Critical acceptance:

- Material table column order matches `CVF_UI.md`.
- Manufacturer + Model duplicate detection works.
- Manufacturer/Model edit confirmation appears.
- UOM locks for referenced Material.
- Material Detail has exactly two frozen tabs.
- Supplier Detail has exactly two frozen tabs.
- Previous/Current rolling price behavior is simulated correctly.
- Preferred Supplier is max 0..1 per Material.
- Changing Preferred requires confirmation if another exists.
- Import actions stay placeholders and do not invent file contracts.

Gate to Stage 4: Material identity, price, and Preferred workflows accepted.

---

### Stage 4 — Users, Roles & Permission UX

**Status:** `NOT_STARTED`

Scope:

- User Management.
- Unique username.
- Multi-role assignment.
- Role list/detail.
- UI Visibility tab.
- Action Permission tab.
- Protected Admin representation.
- Demo persona/permission preview.

Critical acceptance:

- Username required + unique.
- User may hold multiple roles.
- Role permissions combine by allow-only union.
- Admin role is visibly protected/read-only/full-access.
- UI visibility is not presented as backend security.
- Role navigation question remains `UI_PENDING` until reviewer decides.

Gate to Stage 5: permission UX accepted.

---

### Stage 5 — Dashboard & Cross-Project Monitoring

**Status:** `NOT_STARTED`

Scope:

- Dashboard KPI cards/charts.
- Action Required table.
- Cross-project material monitoring.
- Project drill-down.
- Mock status labels.

Critical acceptance:

- Dashboard is operational, not decorative.
- KPI values clearly indicate mock/prototype semantics.
- Cross-project table exposes procurement/receiving/invoice status.
- Clicking Project opens Project operational detail.
- Final production KPI formulas are not invented.
- Final production Project/material status enums are not silently frozen.

Gate to Stage 6: reviewer can identify which Project/material needs attention without external explanation.

---

### Stage 6 — Project Shell + BOM & Supplier

**Status:** `NOT_STARTED`

Scope:

- Persistent Project header.
- Four tabs.
- Project Overview.
- BOM & Supplier.
- Cheapest Supplier.
- Preferred Supplier.
- Final Selected Supplier.
- Final price and amount.
- BOM totals.
- Import/Edit BOM placeholders where applicable.

Critical acceptance:

- Four tabs are exactly: Tổng quan, BOM & Nhà cung cấp, Nhận hàng, Hóa đơn.
- Cheapest, Preferred, and Final Supplier are visually distinct.
- Final Supplier can differ from both recommendations.
- Final price/amount update from the selected supplier's mock Current Price.
- BOM change after purchasing displays `Chờ chốt SPEC`.
- BOM versioning is not invented.

Gate to Stage 7: BOM supplier decision UX accepted or SPEC reopened.

---

### Stage 7 — Goods Receiving & Allocation

**Status:** `NOT_STARTED`

Scope:

- Partial receiving.
- Actual Received Qty.
- Project Allocation.
- Warehouse Allocation.
- Cumulative Project received.
- Remaining qty.
- BOM increase/decrease proposal dialogs.

Critical acceptance:

- `Project Allocation + Warehouse Allocation = Received Qty`.
- `Project Allocation <= Remaining BOM Qty`.
- Partial receiving can occur in multiple mock receipts.
- Excess quantity can go to Warehouse.
- Warehouse↔Project movement is never automatic.
- BOM increase/decrease movement requires explicit confirmation.

Gate to Stage 8: receiving invariants accepted.

---

### Stage 8 — Invoice + Deferred Inventory/Import Screens

**Status:** `NOT_STARTED`

Scope:

- Simple invoice monitoring.
- Stock In placeholder.
- Stock Out placeholder.
- Inventory History placeholder.
- Import Material placeholder.
- Supplier Price Import placeholder.
- BOM Import placeholder.

Critical acceptance:

- Invoice remains simple monitoring; no payment/accounting module is invented.
- Deferred screens remain reviewable placeholders.
- Inventory topology is not invented.
- Physical/available/reserved stock formulas are not invented.
- Placeholder dialogs explicitly state `Chờ chốt SPEC`.

Gate to Stage 9: no deferred domain has been silently converted into production semantics.

---

### Stage 9 — Prototype V0 Integrated Review

**Status:** `NOT_STARTED`

Scope:

- Navigation review.
- Cross-screen data consistency.
- Critical interaction review.
- Permission preview.
- Responsive desktop review.
- Placeholder/deferred audit.
- CVF file integrity audit.

Acceptance disposition:

- `UI_REVIEW_PASS`
- `PASS_WITH_NOTES`
- `UI_FIX_REQUIRED`
- `SPEC_REOPEN_REQUIRED`

Exit criteria for Phase 2:

- Prototype V0 is interactive.
- Critical UI acceptance has reviewer disposition.
- SPEC reopen items are recorded.
- Deferred items remain explicit.
- Production authority remains `NOT_AUTHORIZED`.
- Prototype is stable enough for Antigravity handoff preparation.

---

## 4. Current Open Gates

| ID | Topic | Status | Review trigger |
|---|---|---|---|
| OPEN-001 | BOM edit after purchase | `DEFERRED_TO_PROTOTYPE_REVIEW` | BOM prototype review |
| OPEN-002 | BOM version/revision | `PARTIAL` | Customer workflow review |
| OPEN-003 | Project status enum | `NEEDS_DECISION` | Project UI review |
| OPEN-004 | Project delete conditions | `NEEDS_DECISION` | Project lifecycle review |
| OPEN-005 | One warehouse vs multi-warehouse | `NOT_STARTED` | Inventory SPEC |
| OPEN-006 | Physical/available/reserved stock | `NOT_STARTED` | Inventory SPEC |
| OPEN-007 | Import Material contract | `DEFERRED_TO_PROTOTYPE_REVIEW` | Import UI review |
| OPEN-008 | Supplier Price Import contract | `DEFERRED_TO_PROTOTYPE_REVIEW` | Supplier UI review |
| OPEN-009 | Advanced invoice lifecycle | `PARTIAL` | Customer demo |
| OPEN-010 | Dashboard production KPI formulas | `PARTIAL` | Production SPEC |
| OPEN-011 | Role Management navigation | `UI_PENDING` | First prototype review |
| OPEN-012 | API/DB/Auth/Security/Backup/Deployment/NFR | `NOT_STARTED` | Final technical SPEC |
| OPEN-013 | Final procurement/receiving status enum | `PARTIAL` | Project monitoring review |

---

## 5. Current Next Action

`Start Stage 0/1 in Google AI Studio using the governed files, then submit the Foundation UI for manual acceptance before Stage 2.`

**Production build remains prohibited.**
