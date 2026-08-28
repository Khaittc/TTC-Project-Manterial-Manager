# CVF_GOVERNANCE.md
# TTC Project Material Manager — CVF Governance Contract

**Status:** ACTIVE  
**Effective date:** 2026-08-28  
**Current lifecycle:** Product Discovery ↔ AI Studio Product Prototype  
**Production authority:** `NOT_AUTHORIZED`  
**Prototype promotion default:** `PARTIAL_REUSE`

---

## 1. Purpose

This file is the mandatory governance entrypoint for any AI agent, developer, reviewer, or automation working inside this project.

The current project is an **interactive product/UI prototype workstream** used to validate and refine the application SPEC. It is not yet authorized as a production build.

The governed lifecycle is:

`INTAKE → DESIGN → SPEC → WORK ORDER → BUILD → REVIEW → FREEZE`

During the current phase, an inner discovery loop is allowed:

`SPEC v0.x ↔ UI PROTOTYPE ↔ REVIEW / FEEDBACK`

A UI prototype is evidence for SPEC refinement. A working screen is **not** proof that the underlying business rule is approved.

---

## 2. Mandatory Read Order

Before creating, editing, deleting, moving, or refactoring application code, the AI MUST read these files in this order:

1. `CVF_GOVERNANCE.md`
2. `roadmap.md`
3. `CVF_SPEC.md`
4. `CVF_UI.md`

If any required governance file is missing, stop the affected work and report:

`CVF_GOVERNANCE_FILE_MISSING`

Do not silently recreate a missing authoritative file from memory.

---

## 3. Authority Order

When requirements conflict, use this precedence:

1. Explicit current instruction from the Product Owner that clearly authorizes the change.
2. `CVF_GOVERNANCE.md` for process, authority, file protection, and stop conditions.
3. `CVF_SPEC.md` for business semantics, invariants, validation, domain rules, and scope.
4. `CVF_UI.md` for screen structure, layout, interaction, prototype behavior, and UI acceptance.
5. `roadmap.md` for sequence, stage status, gates, and next allowed work.
6. Existing implementation code and mock data.

Existing code must never override SPEC.

A prompt that conflicts with an authoritative CVF file must not be implemented silently. Report:

`CVF_CONFLICT_REQUIRES_REVIEW`

---

## 4. Protected Governance Files

The following files are **PROTECTED ARTIFACTS**:

- `CVF_GOVERNANCE.md`
- `roadmap.md`
- `CVF_SPEC.md`
- `CVF_UI.md`

The AI MUST NOT:

- delete these files;
- rename them;
- move them to another folder;
- replace them with empty or shorter placeholder content;
- truncate their history or open-item sections;
- overwrite them with generated boilerplate;
- remove a rule merely because implementation does not match it;
- automatically promote a status to `FROZEN`, `APPROVED_FOR_BUILD`, or `UI_REVIEW_PASS`;
- mark an open decision as resolved without an explicit Product Owner/CVF reviewer decision.

If a requested code change would require changing a protected file, stop the semantic part of the change and report the exact impacted section.

Protected files may only be modified when the Product Owner explicitly authorizes a CVF update. A valid authorized update instruction should clearly identify the file/section or state that the CVF baseline is being updated.

---

## 5. Status Governance

### SPEC statuses

- `FROZEN_FOR_V1`
- `CONFIRMED`
- `BASELINE_CONFIRMED`
- `FROZEN_CORE`
- `PARTIAL`
- `NEEDS_DECISION`
- `NEEDS_EVIDENCE`
- `DEFERRED_TO_PROTOTYPE_REVIEW`
- `BLOCKED`
- `NOT_STARTED`

### UI statuses

- `FROZEN_FOR_PROTOTYPE_V0`
- `FROZEN_FOR_CUSTOMER_DEMO`
- `READY_TO_PROTOTYPE`
- `READY_TO_FREEZE`
- `IN_PROGRESS`
- `READY_FOR_REVIEW`
- `UI_REVIEW_PASS`
- `SPEC_REOPEN_REQUIRED`
- `PLACEHOLDER`
- `UI_PENDING`
- `DEFERRED_TO_PROTOTYPE_REVIEW`
- `NOT_STARTED`

### Production authority

Current value:

`NOT_AUTHORIZED`

The AI must not change production authority without explicit Product Owner/CVF authorization.

---

## 6. Ambiguity Rules

If implementation requires a business decision not present in `CVF_SPEC.md`:

- do not invent the rule;
- do not infer a production contract from mock data;
- do not make an irreversible semantic choice;
- use a reviewable placeholder where UI work is still permitted;
- label the UI `Chờ chốt SPEC` when appropriate;
- record/report the item as `NEEDS_DECISION`, `NEEDS_EVIDENCE`, or `DEFERRED_TO_PROTOTYPE_REVIEW`.

Required stop/report token for unresolved business semantics:

`SPEC_DECISION_REQUIRED`

If UI interaction reveals that an existing SPEC rule should change, report:

`SPEC_REOPEN_REQUIRED`

Do not change the SPEC silently to match the prototype.

---

## 7. Current Prototype Authority

### Allowed

- React + TypeScript UI.
- App shell, sidebar, top bar, routing.
- Forms, tables, tabs, drawers, dialogs.
- Search, filter, sort, pagination.
- Mock data and local state.
- LocalStorage persistence for demo data.
- Mock validation for rules already defined in `CVF_SPEC.md`.
- Mock permissions and role preview.
- Mock supplier prices.
- Mock BOM supplier selection.
- Mock partial receiving and allocation.
- Charts using mock data.
- Explicit placeholders for deferred domains.
- UI confirmation/error/toast behavior.

### Not authorized

- Production database.
- Firebase/Supabase or other production persistence.
- Production APIs.
- Production authentication.
- Real backend RBAC enforcement.
- Real purchase-order system.
- Real accounting/payment.
- Real inventory posting.
- Production deployment architecture.
- Production backup/security claims.
- Business automation whose semantics are not frozen.
- Any claim that the prototype is feature-complete or production-ready.

---

## 8. Change Discipline

Before making a stage-level UI change, the AI must determine which CVF files/sections govern that work.

After implementation, the AI should report:

- files changed;
- UI scope implemented;
- acceptance criteria believed satisfied;
- acceptance criteria not verified;
- deferred SPEC items encountered;
- any `SPEC_REOPEN_REQUIRED` finding.

The AI may mark implementation work `READY_FOR_REVIEW`, but only the Product Owner/CVF reviewer can mark it `UI_REVIEW_PASS`.

---

## 9. No Silent Production Promotion

The prototype may later be reviewed with one disposition:

- `ADOPT_AS_PRODUCTION_BASE`
- `PARTIAL_REUSE`
- `REFERENCE_ONLY_REBUILD`

Current default:

`PARTIAL_REUSE`

No disposition is granted by the existence or quality of prototype code.

---

## 10. Current Source of Truth

Business truth: `CVF_SPEC.md`  
UI truth: `CVF_UI.md`  
Execution order/status: `roadmap.md`  
Process and file authority: `CVF_GOVERNANCE.md`

**End of governance contract.**
