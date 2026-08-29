# CVF_SPEC.md
# TTC Project Material Manager — CVF Application SPEC Baseline

**SPEC status:** `PARTIAL — ACTIVE BASELINE`  
**Status date:** 2026-08-28  
**Production authority:** `NOT_AUTHORIZED`  
**Current purpose:** Govern the interactive Product/UI Prototype and capture product semantics before Final SPEC.

> Protected by `CVF_GOVERNANCE.md`. Do not delete, rename, move, truncate, or silently change business semantics.

---

## 1. Product Intent

TTC Project Material Manager is an internal application for a technical services company.

Primary purpose:

- manage equipment/material master data;
- manage project BOM requirements;
- manage warehouse/inventory-related workflows;
- manage suppliers and supplier prices;
- support supplier comparison and project costing/quotation preparation;
- monitor whether project materials are not purchased, purchasing, partially received, or sufficiently received;
- track basic supplier invoice availability for project purchases.

Explicit non-goals for the current product baseline:

- e-commerce;
- retail/trading sales system;
- sales-order management;
- full Purchase Order system;
- full accounting/payment system.

The company uses equipment/materials to execute technical projects rather than sell them as merchandise.

---

## 2. Governance Boundary

The current executable work is a **UI Product Prototype**.

Allowed implementation is mock/local and must not be interpreted as production contract.

Production database, API, authentication, backend RBAC, inventory posting, accounting, backup, security architecture, and deployment remain outside current authority.

---

## 3. Authorization / RBAC

**Status:** `FROZEN_FOR_V1`

Initial system roles:

- Admin
- Quản lý kho
- Kỹ sư

Role model:

- Admin may create future roles.
- A User may have multiple Roles.
- Role permissions are modeled by resource + action.
- Effective permissions across multiple roles = union of allowed permissions.
- Policy = allow-only + default deny.
- No explicit deny in V1.

UI visibility:

- Sidebar/menu/module visibility is configured per Role.
- No per-user UI visibility override in V1.
- Effective visibility = union of visible capabilities from all user's roles.
- UI visibility is not security; production backend must enforce action authorization independently.

Protected Admin:

- system role;
- immutable full-access;
- automatically receives current/future permissions;
- cannot be deleted;
- cannot be disabled;
- cannot be demoted;
- system must retain at least one active Admin;
- operations removing the last active Admin must be blocked.

User:

- `username` required + unique.
- full name required.
- password required on Create only for the UI prototype form.
- Edit does not show existing password.
- Reset Password is a separate action.
- Roles use multi-select.
- status Active/Inactive.

Open UI item:

- final Role Management navigation location = `UI_PENDING`.

---

## 4. Material Master

### 4.1 Canonical identity

**Status:** `FROZEN_FOR_V1`

Canonical business identity:

`Manufacturer_ID + Manufacturer_Model`

Rules:

- Model may repeat across different manufacturers.
- Within one manufacturer, model must be unique.
- Uniqueness enforced on Create and Edit.
- Duplicate blocks Save.
- No Merge Material feature in V1.
- Revision/firmware/other optional metadata do not create a separate Material identity.
- Supplier-specific product name/code must not alter Material identity.

### 4.2 Material fields

Current semantic fields:

- Manufacturer.
- Manufacturer Model.
- Category.
- UOM.
- Description.
- Status.
- Optional secondary metadata.

Description:

- one free-text Description field;
- no Short Name;
- editable at any time;
- not part of duplicate detection.

Manufacturer/Model edit:

- allowed after use;
- requires explicit confirmation;
- resulting duplicate combination must be blocked;
- no material identity change-history required in V1.

### 4.3 Material lifecycle

**Status:** `FROZEN_FOR_V1`

Lifecycle:

`ACTIVE → ARCHIVED`

Hard delete:

- allowed only when dependency check PASS;
- blocked when references require preservation;
- when blocked, UI should recommend Archive.

No Merge Material.

No full material change-history in V1.

### 4.4 UOM relationship

One Material has one fixed UOM.

No UOM conversion in V1.

UOM:

- selectable/changeable only before business use;
- once referenced by BOM/business data, UOM becomes immutable;
- backend production must eventually enforce the same rule.

### 4.5 Category relationship

- exactly one Category per Material at a time;
- Category may be changed by permitted users;
- no category change history required.

---

## 5. Material Category Master

**Status:** `FROZEN_FOR_V1`

Category is:

- hierarchical;
- configurable;
- not hard-coded;
- Active/Inactive;
- assignable one-at-a-time to Material.

Permitted users may reclassify Material.

No `changed_by`, `changed_at`, `reason`, or history required for category changes in V1.

Category delete/reference behavior beyond Active/Inactive is not fully frozen and must not be invented if a production semantic decision is required.

---

## 6. UOM Master

**Status:** `FROZEN_FOR_V1`

Fields:

- `Mã ĐVT`
- `Trạng thái`

Rules:

- `Mã ĐVT` required + unique.
- No separate UOM Name.
- No separate Symbol.
- Active/Inactive.
- Unused UOM may be deleted.
- Referenced UOM delete is blocked.
- Inactive UOM remains visible on historical/existing Material but is not selectable for new Material.

---

## 7. Manufacturer Master

**Status:** `FROZEN_FOR_V1`

Fields:

- `Mã hãng`
- `Tên hãng`
- `Trạng thái`

Rules:

- Manufacturer Code required + unique.
- Manufacturer Name required.
- Names may duplicate.
- Active/Inactive.
- Unused Manufacturer may be deleted.
- Referenced Manufacturer delete is blocked.
- Inactive Manufacturer remains visible on existing Material but is unavailable for new Material.

---

## 8. Customer Master

**Status:** `FROZEN_FOR_V1`

Fields:

- `Mã KH`
- `Tên KH`
- `Địa chỉ`

Rules:

- Customer Code required + unique.
- Name and Address may duplicate.
- One Customer may have many Projects.
- Referenced Customer cannot be deleted.
- Unused Customer may be deleted.
- No change history required in V1.

---

## 9. Project Master

**Status:** `BASELINE_CONFIRMED`

Fields:

- Project Code.
- Project Name.
- Customer.
- Start Date.
- Status.
- Description/Notes.

Rules:

- Project Code required + unique.
- Customer must be selected from Customer Master via searchable selector.
- Project Create/Edit share one form.

Open decisions:

- final Project Status enum = `NEEDS_DECISION`;
- Project delete conditions = `NEEDS_DECISION`;
- full Project lifecycle = not yet frozen.

Do not infer final production lifecycle from prototype status labels.

---

## 10. Supplier Master

**Status:** `FROZEN_CORE`

Fields:

- `Mã số thuế`
- `Tên NCC`
- `Địa chỉ`
- `Trạng thái`

Rules:

- Tax Code required + unique.
- Supplier Name required; may duplicate.
- Address may duplicate.
- Active/Inactive.
- Unused Supplier may be deleted.
- Supplier referenced by business data cannot be hard-deleted.

Relevant references include:

- Material Price;
- Preferred Supplier;
- BOM Final Selected Supplier;
- Project monitoring;
- Goods Receipt.

Inactive Supplier remains visible in existing data but is not selectable for new business operations.

---

## 11. Material + Supplier Price

**Status:** `FROZEN_FOR_V1`

Purpose:

Fast project/BOM costing and supplier comparison.

Not procurement optimization.

Per Material + Supplier relationship:

- optional supplier-specific product name/code;
- Previous Price;
- Previous Price Date;
- Current Price;
- Current Price Date;
- Preferred flag.

Rules:

- one Current Price per Material + Supplier;
- currency = VND only;
- price excludes VAT;
- application does not store/calculate VAT;
- no lead time;
- no MOQ;
- no volume discount;
- no quantity price tiers;
- no logistics cost.

### Rolling price snapshot

No full price history.

On price update:

- old Current → Previous;
- new price → Current;
- current date updated;
- older value beyond Previous discarded.

UI may calculate:

- absolute delta;
- percentage change;
- trend up/down/equal.

---

## 12. Preferred Supplier

**Status:** `FROZEN_FOR_V1`

Preferred Supplier is a property of Material + Supplier relation.

Rules:

- one Material has 0..1 Preferred Supplier;
- user controls Preferred;
- price update must not auto-change Preferred;
- replacing Preferred A with B requires explicit user action + confirmation;
- replacement is atomic from a business-rule perspective.

---

## 13. Supplier Recommendation in BOM

**Status:** `FROZEN_CORE`

Each BOM line has three distinct Supplier concepts:

### Cheapest Supplier

System advisory.

Defined as the Supplier with the lowest valid `Current Price` for the Material.

### Preferred Supplier

User-configured advisory from the Material + Supplier relationship.

A Material may have:

`0..1 Preferred Supplier`

### Final Selected Supplier

The Supplier explicitly selected by the user for this Project BOM line.

Final Selected Supplier may be:

- Cheapest Supplier;
- Preferred Supplier;
- neither Cheapest nor Preferred.

The system supports the decision.

The system does NOT make the final Supplier decision automatically.

No scoring algorithm, lead-time optimization, or auto-procurement logic in current scope.

---

## 14. BOM

**Status:** `PARTIAL`

### Final Supplier and Final Unit Price

**Rule status:** `CONFIRMED`

When a Final Supplier is selected:

Final Unit Price initially defaults to:

`Supplier Current Price at the time of selection`

The user may change the Final Unit Price to represent the negotiated Project-specific purchase price.

Therefore:

`Supplier Current Price != necessarily Project Final Unit Price`

Final Unit Price belongs to the Project BOM decision.

Supplier Current Price belongs to the Material + Supplier price master relationship.

Updating Supplier Current Price in the future MUST NOT automatically change an already confirmed Project BOM Final Unit Price.

Example:

At selection:

Supplier Current Price = 8,100,000 VND

Negotiated Final Unit Price = 7,950,000 VND

Later Supplier Current Price becomes 8,300,000 VND.

The existing BOM Final Unit Price remains:

7,950,000 VND

unless the user explicitly changes the Project BOM decision.

Calculation:

`Amount = BOM Required Qty × Final Unit Price`

### BOM Procurement Status Model

**Rule status:** `CONFIRMED_FOR_PROTOTYPE_V0`

The BOM `Trạng thái` represents:

`Procurement / Delivery Progress`

It does NOT represent Supplier-selection status.

Prototype display states:

1. `Kiểm tra nội bộ`
2. `Đang chờ báo giá`
3. `Chờ thanh toán`
4. `Đã đặt hàng`
5. `Đã nhận x / y`
6. `Đã nhận đủ`
7. `Đang trả hàng / đổi hàng`

Suggested implementation tokens may map 1:1 as:

- `INTERNAL_REVIEW`
- `AWAITING_QUOTATION`
- `AWAITING_PAYMENT`
- `ORDERED`
- `PARTIALLY_RECEIVED`
- `FULLY_RECEIVED`
- `RETURN_OR_EXCHANGE`

These token names are implementation-facing identifiers for the prototype.

The Vietnamese business labels above are authoritative for current UI.

### Procurement Status Semantics

#### Kiểm tra nội bộ

The BOM line is being internally reviewed before Supplier procurement progresses.

#### Đang chờ báo giá

Supplier quotation/pricing is still being collected or reviewed.

Final Supplier may still be unset.

#### Chờ thanh toán

A Supplier may already be selected and the purchase is waiting for a payment/deposit-related step where applicable.

This state exists in the procurement model.

However:

`AWAITING_PAYMENT` is NOT a mandatory state for every Supplier/order.

Do NOT enforce a universal transition:

`AWAITING_QUOTATION → AWAITING_PAYMENT → ORDERED`

because payment terms may differ. Examples may include:

- advance payment;
- deposit;
- credit terms;
- payment after delivery.

The production payment-term transition policy remains not fully frozen.

#### Đã đặt hàng

The user has recorded that an actual order has been placed with the selected Supplier outside this application.

Selecting Final Supplier alone MUST NOT automatically set:

`Đã đặt hàng`

#### Đã nhận x / y

Derived from Goods Receiving.

Where:

`x = cumulative Project Received / Allocated Qty`

`y = Current BOM Required Qty`

This status is not manually editable in Supplier Drawer.

#### Đã nhận đủ

Derived from Goods Receiving when Project received/allocated quantity satisfies the current BOM requirement.

This status is not manually editable in Supplier Drawer.

#### Đang trả hàng / đổi hàng

Exception state used when received goods are being returned or exchanged.

It is not a mandatory sequential stage.

Entry should require explicit user action.

Return/exchange detailed transaction semantics remain outside current frozen scope.

### Supplier Selection vs Procurement Status

These are separate dimensions.

Example:

Final Selected Supplier:

`Supplier A`

Procurement Status:

`Chờ thanh toán`

The Supplier answers:

`Mua từ ai?`

The status answers:

`Việc mua/giao hàng đang ở bước nào?`

Changing Final Supplier does not automatically determine procurement status.

### BOM Business Fields

A BOM line may contain/use:

- Project.
- Material.
- Required Qty.
- UOM.
- Cheapest Supplier advisory.
- Preferred Supplier advisory.
- Final Selected Supplier.
- Final Unit Price.
- Amount.
- Procurement Status.
- cumulative Project Received Qty.
- Remaining Qty.
- Notes where applicable.

The main UI does not need to display every field.

UI presentation is governed by `CVF_UI.md`.

### Existing Open BOM Rules Remain Open

DO NOT resolve the following through this update:

#### BOM edit after purchasing begins

Status remains:

`DEFERRED_TO_PROTOTYPE_REVIEW`

#### BOM version/revision

Status remains:

`PARTIAL`

#### BOM Import contract

Still not frozen.

#### Detailed return/exchange transaction workflow

Still not frozen.

---

## 15. Project Material Monitoring

**Status:** `BASELINE_CONFIRMED`

Two distinct surfaces:

### Cross-project monitoring

Purpose:

- summarize multiple Projects;
- show material procurement/receiving/invoice attention state;
- drill into a Project.

### Project operational detail

Project detail uses four tabs:

1. Tổng quan.
2. BOM & Nhà cung cấp.
3. Nhận hàng.
4. Hóa đơn.

Final procurement/receiving status enum is still `PARTIAL`.

Prototype labels such as `Chưa mua`, `Đang mua`, `Nhận một phần`, `Đã đủ` are allowed for review but are not final production enums.

---

## 16. Goods Receiving & Allocation

**Status:** `FROZEN_CORE`

Partial receiving is allowed.

A supplier may deliver the same BOM Material in multiple batches.

Core operation:

`Received Qty → Project Allocation + Warehouse Allocation`

Invariant 1:

`Project Allocation + Warehouse Allocation = Received Qty`

Invariant 2:

`Project Allocation <= Current BOM Remaining Qty`

Rules:

- same received quantity cannot count for both Project and Warehouse;
- Project received/allocated quantity is cumulative;
- Remaining = current requirement minus project allocated/received quantity;
- Project Allocation must not exceed the current BOM requirement.

### Goods Receiving Integration & Status Derivation

Receiving activity is authoritative for these procurement status displays:

- `Đã nhận x / y`
- `Đã nhận đủ`

If:

`0 < Project Received Qty < BOM Required Qty`

display:

`Đã nhận x / y`

If:

`Project Received Qty >= BOM Required Qty`

display:

`Đã nhận đủ`

Do not allow Supplier Drawer to manually override these receiving-derived states.

---

## 17. BOM Change vs Warehouse Movement

**Status:** `FROZEN_CORE`

Core principle:

**BOM defines project requirement. Inventory movement is a separate user-confirmed transaction.**

When BOM increases:

- calculate additional requirement;
- check mock/production Warehouse availability when that capability exists;
- system may propose Warehouse → Project allocation;
- do not move stock automatically;
- user confirms before movement.

When BOM decreases below already allocated quantity:

- determine excess;
- system may propose Project → Warehouse return;
- do not move automatically;
- user confirms before movement.

---

## 18. Invoice Monitoring

**Status:** `PARTIAL`

Current product purpose:

Track whether supplier invoice documentation has been provided for Project-related supplier activity.

Prototype baseline:

- `Chưa có`
- `Đã có`
- optional Invoice Number;
- optional Invoice Date;
- optional Note.

This is not an accounting module.

Open:

- partial invoice;
- adjustment;
- payment status;
- advanced invoice lifecycle.

Do not add these as production semantics without SPEC update.

---

## 19. Import Capabilities

### Import Material

**Status:** `DEFERRED_TO_PROTOTYPE_REVIEW`

Confirmed only:

- separate from Supplier Price Import;
- UI must expose an Import entrypoint/placeholder.

Not yet defined:

- file schema;
- mapping;
- preview;
- duplicate handling contract;
- error model.

### Import Supplier Price

**Status:** `DEFERRED_TO_PROTOTYPE_REVIEW`

Confirmed direction:

- bulk update;
- Excel/CSV direction;
- downloadable template direction;
- bulk linking existing Material to Supplier.

For Prototype V0:

- show Import button;
- do not invent detailed workflow/schema.

### Import BOM

Current UI may show placeholder entrypoint.

Detailed contract is not frozen.

---

## 20. Inventory / Stock In / Stock Out

**Status:** `PARTIAL / NOT_STARTED`

Known:

- sidebar contains Nhập kho, Xuất kho, Lịch sử;
- Project receiving allocation concept exists.

Not frozen:

- one warehouse vs multiple warehouses;
- physical stock;
- available stock;
- reserved stock;
- standalone Stock In contract;
- standalone Stock Out contract;
- inventory history schema.

Prototype must use placeholders/mock values and label these areas `Chờ chốt SPEC`.

---

## 21. Dashboard

**Status:** `PARTIAL`

Dashboard structure is frozen for prototype/customer demo.

Production KPI formulas are not frozen.

Prototype may use mock KPI and chart data.

Do not derive production formulas from sample numbers.

---

## 22. Production Technical Contracts

**Status:** `NOT_STARTED`

The following remain outside current build authority:

- production API;
- production database schema;
- authentication architecture;
- backend RBAC enforcement;
- security controls;
- backup;
- deployment;
- performance NFR;
- observability;
- production test strategy.

These are required before final production Work Orders.

---

## 23. Open Decision Register

| ID | Domain | Question | Status |
|---|---|---|---|
| OPEN-001 | BOM | Edit after purchase and delta handling | `DEFERRED_TO_PROTOTYPE_REVIEW` |
| OPEN-002 | BOM | Version/revision model | `PARTIAL` |
| OPEN-003 | Project | Final status enum | `NEEDS_DECISION` |
| OPEN-004 | Project | Delete conditions | `NEEDS_DECISION` |
| OPEN-005 | Inventory | One or multiple warehouses | `NOT_STARTED` |
| OPEN-006 | Inventory | Physical/available/reserved stock | `NOT_STARTED` |
| OPEN-007 | Import | Material import contract | `DEFERRED_TO_PROTOTYPE_REVIEW` |
| OPEN-008 | Import | Supplier Price import contract | `DEFERRED_TO_PROTOTYPE_REVIEW` |
| OPEN-009 | Invoice | Advanced invoice lifecycle | `PARTIAL` |
| OPEN-010 | Dashboard | Production KPI formulas | `PARTIAL` |
| OPEN-011 | Authorization UI | Role Management navigation | `UI_PENDING` |
| OPEN-012 | Technical | API/DB/Auth/Security/Backup/Deployment/NFR | `NOT_STARTED` |
| OPEN-013 | Project Monitoring | Final procurement/receiving status enum | `PARTIAL` |
| OPEN-014 | BOM / Procurement | Payment-term rules and mandatory/optional transition behavior around Chờ thanh toán will be defined how for production? | `PARTIAL` |

---

## 24. Current Claim Boundary

This file defines the current business/product baseline only.

It does **not** claim:

- Final SPEC approval;
- production architecture approval;
- production readiness;
- customer acceptance;
- Work Order authorization.

Current production authority remains:

`NOT_AUTHORIZED`
