# CVF_UI.md
# TTC Project Material Manager — CVF UI Prototype Baseline

**UI baseline:** `Prototype V0`  
**Status date:** 2026-08-28  
**Design authority:** frozen/confirmed per module as recorded below  
**Implementation state:** Stage 1 not yet accepted  
**Production authority:** `NOT_AUTHORIZED`

> Protected by `CVF_GOVERNANCE.md`. Do not delete, rename, move, truncate, or silently redesign frozen UI semantics.

---

## 1. UI Purpose

The UI prototype exists to validate:

- navigation;
- screen structure;
- fields;
- tables;
- actions;
- interaction;
- permission UX;
- supplier-selection workflow;
- receiving workflow;
- user comprehension.

A screen that works does not automatically freeze the related business SPEC.

If prototype usage reveals a semantic issue, report `SPEC_REOPEN_REQUIRED`.

---

## 2. Platform & Technology Direction

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`  
**Implementation status:** `READY_TO_PROTOTYPE`

Platform:

- Web application.
- Desktop-first.
- Tablet usable.
- Mobile optimization out of scope V1.

Preferred prototype stack:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- Lucide React.
- Recharts.
- mock data/local state.
- LocalStorage.

Language:

- UI default = Vietnamese.
- architecture = i18n-ready for Vietnamese/English.

---

## 3. Visual System

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Style:

`Enterprise / Industrial Management`

Rules:

- clean;
- compact;
- data-first;
- workflow-first;
- minimal decoration;
- no e-commerce styling;
- no hero marketing content;
- no excessive gradients;
- no unnecessary animation;
- consistent spacing and typography;
- status color used purposefully.

Icon system:

- one Lucide icon set.
- Eye = View.
- Pencil = Edit.
- Trash2 = Delete.
- Plus = Add.
- Search = Search.
- Filter = Filter.
- Archive = Archive.
- Upload = Import.
- Save = Save.
- AlertTriangle = Warning.

Icon-only buttons require tooltip and accessible label.

---

## 4. App Identity

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

App name:

`TTC Project Material Manager`

Subtitle:

`Project Materials, Inventory & Supplier Management`

Prototype badge:

`PROTOTYPE V0 · MOCK DATA · NOT PRODUCTION`

---

## 5. Sidebar

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Behavior:

- fixed left;
- collapse/expand;
- expanded = icon + label;
- collapsed = icon + tooltip;
- permission-aware visibility using mock Role preview.

Structure:

```text
TTC Project Material Manager
Project Materials, Inventory & Supplier Management

Điều hành
├── Dashboard
└── Giám sát vật tư dự án

Dự án & Vật tư
├── Quản lý dự án
└── Danh mục vật tư

Quản lý kho
├── Nhập kho
├── Xuất kho
└── Lịch sử

Hệ thống
├── Danh mục hệ thống
└── Người dùng

────────────────────
<User/Login area>
<App version>
```

Acceptance:

- structure matches above;
- main content resizes when sidebar collapses;
- tooltips work in collapsed mode;
- prototype badge remains visible somewhere in shell.

---

## 6. Dashboard

**Design status:** `FROZEN_FOR_CUSTOMER_DEMO`  
**Implementation status:** `READY_TO_PROTOTYPE`  
**Data:** mock only.

Layout:

```text
[ KPI ][ KPI ][ KPI ][ KPI ]

[ Tình trạng dự án       ][ Tình trạng vật tư dự án ]

[ Biến động kho          ][ Biến động giá Supplier ]

[ Việc cần xử lý / cảnh báo — full width ]
```

Content groups:

- Project overview.
- Project Material status.
- Inventory overview.
- Supplier Price overview.
- Action Required.

Production KPI formulas = not frozen.

Acceptance:

- dashboard is operational, not decorative;
- mock-data badge/tooltip exists where needed;
- action rows can navigate to relevant screens/tabs;
- no production KPI formula is implied.

---

## 7. Cross-Project Material Monitoring

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Purpose:

Cross-project overview only.

Toolbar:

- Search Project code/name.
- Project status filter.
- Material condition filter.
- Refresh.

Table:

| Dự án | Tổng Material | Chưa mua | Đang mua | Nhận một phần | Đã đủ | Hóa đơn còn thiếu | Action |
|---|---:|---:|---:|---:|---:|---:|---|

Click Project → Project operational detail.

No Create/Edit Project on this screen.

Final production status enum remains open.

---

## 8. System Catalog

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

One screen with tabs:

1. Dự án — default.
2. Khách hàng.
3. Nhóm vật tư.
4. Đơn vị tính.
5. Hãng sản xuất.
6. Nhà cung cấp.

Common pattern:

- search/filter upper area;
- Add button;
- data table or tree;
- Eye/Pencil/Trash2 actions;
- shared Create/Edit form when applicable.

### 8.1 Project Master Tab

Columns:

- Mã dự án.
- Tên dự án.
- Khách hàng.
- Ngày bắt đầu.
- Trạng thái.
- Actions.

Form:

- Mã dự án *.
- Tên dự án *.
- Khách hàng * searchable dropdown.
- Ngày bắt đầu.
- Trạng thái.
- Mô tả/Ghi chú.

UI rules:

- duplicate Project Code blocked;
- Project Status shows review/prototype semantics;
- Delete interaction must disclose `Chờ chốt SPEC` because final delete contract is open.

### 8.2 Customer Tab

Columns:

- Mã KH.
- Tên KH.
- Địa chỉ.
- Actions.

Form mirrors those fields.

Duplicate Customer Code blocks save.

Referenced Customer mock delete blocks.

### 8.3 Material Category Tab

Layout:

- Category Tree left.
- Detail panel right.
- Search.
- Add Group.

Form:

- Tên nhóm.
- Nhóm cha.
- Trạng thái.

### 8.4 UOM Tab

Columns:

- Mã ĐVT.
- Trạng thái.
- Actions.

No separate UOM Name/Symbol fields.

### 8.5 Manufacturer Tab

Columns:

- Mã hãng.
- Tên hãng.
- Trạng thái.
- Actions.

### 8.6 Supplier Tab

Columns:

- Mã số thuế.
- Tên NCC.
- Địa chỉ.
- Trạng thái.
- Actions.

Eye → Supplier Detail.

---

## 9. Material List

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Toolbar:

- Search Model/Description.
- Manufacturer filter.
- Category filter.
- Status filter.
- Import button.
- Add Material button.

Table column order MUST remain:

1. Nhóm vật tư.
2. Hãng.
3. Model.
4. Mô tả.
5. Tồn kho.
6. ĐVT.
7. Trạng thái.
8. Thao tác.

Do not add Preferred Supplier or Cheapest Price to the main Material list.

`Tồn kho` may be mock until Inventory SPEC is frozen.

Actions:

- Eye.
- Pencil.
- Trash2.
- Archive/Restore may be secondary/overflow.

Delete behavior:

- dependency check simulation;
- PASS → mock delete;
- FAIL → block and recommend Archive.

Import button:

- placeholder only;
- no import schema may be invented.

---

## 10. Material Create/Edit

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Same page/form for Create and Edit.

Desktop two-column form.

Fields:

- Category selector.
- Manufacturer selector.
- Model.
- UOM selector.
- Description.
- Status.

Behavior:

- Category/Manufacturer/UOM come from master data.
- Manufacturer + Model duplicate blocks save.
- Edit Manufacturer/Model requires confirmation.
- Referenced Material UOM is read-only.
- Description remains editable.
- Category remains editable.
- Inactive master values not selectable for new Material.

---

## 11. Material Detail

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Separate page.

Header:

- Manufacturer | Model.
- Category.
- Status.

Tabs exactly:

1. `Thông tin chung`
2. `Nhà cung cấp & Giá`

### General

- Category.
- Manufacturer.
- Model.
- Description.
- UOM.
- Status.
- Current Inventory mock.

### Supplier & Price

Columns:

- Supplier.
- Supplier Name/Code.
- Previous Price.
- Current Price.
- Change.
- Current Price Date.
- Preferred.
- Actions.

Price formatting = VND.

No VAT.

---

## 12. Supplier Detail

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Separate page.

Tabs exactly:

1. `Thông tin chung`
2. `Vật tư & Giá`

General:

- Tax Code.
- Supplier Name.
- Address.
- Status.

Materials & Price table:

- Category.
- Manufacturer.
- Model.
- Description.
- Previous Price.
- Current Price.
- Change.
- Updated Date.
- Preferred.
- Action.

Buttons:

- Import.
- Chỉnh sửa giá.

### Manual Bulk Price Edit

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Edit mode:

- Current Price editable.
- Preferred editable.
- Save only changed rows in mock state.
- old Current → Previous.
- new value → Current.
- date updated.
- delta/trend recalculated.

Changing Preferred when another Supplier is preferred requires confirmation.

### Supplier Price Import

**Status:** `PLACEHOLDER`

Only button + explanatory dialog.

Detailed schema/workflow is deferred.

---

## 13. User Management

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

User table:

- Tài khoản.
- Họ tên.
- Roles as multiple badges.
- Trạng thái.
- Actions.

Form:

- Tài khoản *.
- Họ tên *.
- Mật khẩu * on Create only.
- Role * multi-select.
- Trạng thái.

Rules:

- username required + unique;
- Edit never shows current password;
- Reset Password separate action.

---

## 14. Role & Permission

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Role list:

- Role Name.
- User Count.
- Status.
- Actions.

Role Detail tabs:

1. `Quyền giao diện`
2. `Quyền thao tác`

UI Visibility:

- tree/checkbox layout matching sidebar modules.

Action Permissions:

- resource/action matrix.

Admin:

- full access;
- read-only;
- cannot delete/deactivate.

### Role Management Navigation

**Status:** `UI_PENDING`

Prototype may place:

`Người dùng | Vai trò & Phân quyền`

as tabs on the Administration screen for initial review.

This placement is not final.

---

## 15. Project Operational Detail

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Persistent Project header:

- Project Code + Name.
- Customer.
- Start Date.
- Status.
- Edit Project action.

Four tabs exactly:

1. `Tổng quan`
2. `BOM & Nhà cung cấp`
3. `Nhận hàng`
4. `Hóa đơn`

---

## 16. Project Overview Tab

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Layout:

```text
[ Tổng Material ] [ Đã đủ ] [ Đang mua ] [ Còn thiếu ]

[ Tình trạng vật tư / chart ]

[ Tình trạng nhận hàng ][ Tình trạng hóa đơn ]

[ Việc cần xử lý — full width ]
```

Mock status labels may include:

- Chưa chọn NCC.
- Đã chọn NCC.
- Đang mua.
- Nhận một phần.
- Đã đủ.

These are prototype labels, not frozen production enums.

---

## 17. BOM & Nhà cung cấp

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

### Purpose

The main BOM table is an operational overview.

Its purpose is to let users quickly answer:

1. Project cần những vật tư nào?
2. Số lượng bao nhiêu?
3. Đã chốt mua từ Nhà cung cấp nào?
4. Tiến độ mua và giao hàng hiện đang ở đâu?

Price comparison and Supplier selection MUST NOT make the main BOM table excessively wide.

The previous wide BOM table containing Cheapest Price, Preferred Price, Final Price and Amount columns is:

`SUPERSEDED`

---

### Toolbar

Provide:

- Search by Model / Description.
- Material Category filter.
- Manufacturer filter.
- Procurement Status filter.
- `Import BOM`.
- `Chỉnh sửa BOM`.

`Import BOM` remains a placeholder until its import contract is frozen.

---

### Main BOM Table

The table MUST contain exactly these primary columns, in this order:

1. `Hãng`
2. `Model`
3. `Mô tả`
4. `Số lượng`
5. `ĐVT`
6. `Nhà cung cấp`
7. `Trạng thái`
8. `Thao tác`

`Nhóm vật tư` is intentionally not displayed as a primary table column.

Material Category remains available through the toolbar Category filter and underlying Material data.

### Description Presentation

The `Mô tả` column MUST display the full `Material.description`.

The description:

- may wrap to multiple lines;
- must not be truncated;
- must not use ellipsis;
- must not use line-clamp;
- must expand the BOM row height as needed.

The user must be able to read the complete Material description directly from the Main BOM Table.

Do NOT display the following as main-table columns:

- Cheapest Supplier.
- Cheapest Price.
- Preferred Supplier.
- Preferred Price.
- Final Unit Price.
- Amount.
- Supplier price trend.

These belong inside the Supplier & Price Drawer.

---

### Nhà cung cấp Column

`Nhà cung cấp` means:

`Final Selected Supplier`

It does NOT mean Cheapest Supplier or Preferred Supplier.

If no Final Supplier has been confirmed:

display:

`Chưa chọn NCC`

After confirmation:

display the Final Selected Supplier name.

Supplier selection and procurement status are separate concepts.

Example:

`ABC Automation | Chờ thanh toán`

means:

- Supplier = ABC Automation.
- Procurement progress = Chờ thanh toán.

---

### Supplier & Price Right Drawer

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

From the BOM line `Thao tác` column, provide an action:

`Xem / Chọn NCC & Giá`

This opens a Drawer from the RIGHT side.

The user remains on the BOM table and does not navigate to another page.

Recommended desktop width:

approximately 520–640 px.

#### Drawer Header

Show BOM context:

- Manufacturer | Model.
- Description.
- BOM Quantity.
- UOM.
- Current Procurement Status.

Example:

`Siemens | 6ES7214-1AG40-0XB0`

`SL BOM: 10 pcs`

`Trạng thái: Đang chờ báo giá`

#### Supplier Comparison Area

Show all available Supplier Price records for the Material.

Each Supplier row/card must show:

- Supplier Name.
- Previous Price.
- Current Price.
- Price Change.
- `Preferred` badge when applicable.
- `Cheapest` badge when applicable.
- Final Selected indication when applicable.

Currency:

`VND`

No VAT.

Do not show lead time, MOQ, quantity tier or logistics scoring.

#### Supplier Selection

User may select a Supplier by clicking its row/card or equivalent explicit selector.

Selecting a Supplier does NOT immediately save it.

The user must explicitly confirm the decision.

The system MUST NOT automatically choose the Cheapest or Preferred Supplier.

#### Purchase Decision Area

After a Supplier is selected, show:

- `NCC cuối cùng`
- `Giá hiện tại của NCC`
- `Đơn giá chốt`
- `Số lượng BOM`
- `Thành tiền`

Calculation:

`Amount = BOM Quantity × Final Unit Price`

#### Final Unit Price UX

When a Supplier is selected:

`Final Unit Price`

defaults to:

`Supplier Current Price`

But the user may manually change Final Unit Price to reflect the actual negotiated Project purchase price.

Example:

Supplier Current Price:

`8.100.000 VND`

Final Unit Price:

`7.950.000 VND`

The Drawer must clearly distinguish these values.

Changing Final Unit Price MUST NOT automatically update Supplier Current Price.

#### Procurement Status in Drawer

The Drawer may allow manual selection of applicable PRE-RECEIVING procurement states:

- `Kiểm tra nội bộ`
- `Đang chờ báo giá`
- `Chờ thanh toán`
- `Đã đặt hàng`

Selecting Final Supplier does NOT automatically mean:

`Đã đặt hàng`

Supplier selection and purchasing progress remain separate.

#### Receiving-derived Statuses

The following statuses MUST NOT be manually selected in Supplier & Price Drawer:

- `Đã nhận x / y`
- `Đã nhận đủ`

They are derived from Goods Receiving activity.

Where:

`x / y = Project Received Qty / Current BOM Required Qty`

Examples:

- `Đã nhận 2 / 10`
- `Đã nhận 7 / 10`
- `Đã nhận đủ`

#### Return / Exchange Exception

`Đang trả hàng / đổi hàng`

is an exception state.

It is NOT part of the mandatory linear procurement sequence.

Provide a separate action such as:

`Đánh dấu trả / đổi hàng`

The action should:

- require confirmation;
- allow an optional note;
- show current received quantity where relevant.

After the issue is resolved, the BOM line may return to the appropriate procurement/receiving status.

Do not invent a complete return transaction workflow in Prototype V0.

#### Drawer Footer

Use a sticky footer:

`Hủy`

`Xác nhận NCC & Giá`

Confirm action saves the mock BOM decision:

- Final Selected Supplier.
- Final Unit Price.
- calculated Amount.
- manually selected eligible procurement status, when changed.

Then update the BOM row.

### Final Supplier Lock Presentation

When the BOM line is:

- Đã đặt hàng
- Đã nhận x / y
- Đã nhận đủ
- Đang trả hàng / đổi hàng

Final Supplier is read-only and must display a locked indication.

Supplier comparison remains visible but other Supplier rows are not selectable.

`Đơn giá chốt` remains editable for authorized users.

In locked states, the primary save action should clearly represent price-only persistence, for example:

`Lưu giá mua thực tế`

The action updates only Final Unit Price and Amount.

It must not change Supplier or Procurement Status.

---

### Edit BOM Boundary

Existing open rule remains:

If purchasing has already started, changing BOM quantity is still:

`DEFERRED_TO_PROTOTYPE_REVIEW`

Display the existing warning/placeholder.

Do not invent BOM versioning or post-purchase reconciliation.

---

### Import BOM Boundary

`Import BOM`

remains a placeholder.

Do not define:

- Excel schema.
- mapping.
- preview contract.
- append/replace behavior.
- Material creation behavior.
- error contract.

unless separately authorized.

---

## 18. Goods Receiving Tab

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Toolbar:

- Search Material.
- Receive status filter.
- Supplier filter.
- Receive action.

Table:

- Manufacturer.
- Model.
- Supplier.
- BOM Qty.
- Project Received.
- Remaining.
- Status.
- Action.

Receiving modal fields:

- Actual Received Qty.
- Project Allocation.
- Warehouse Allocation.

Required validation:

`Project Allocation + Warehouse Allocation = Received Qty`

`Project Allocation <= Remaining BOM Qty`

Partial receipt must be supported in mock state.

BOM increase proposal:

- propose Warehouse → Project;
- require confirmation.

BOM decrease proposal:

- propose Project → Warehouse;
- require confirmation.

No automatic movement.

---

## 19. Invoice Tab

**Design status:** `FROZEN_FOR_PROTOTYPE_V0`

Scope = simple supplier invoice monitoring.

Toolbar:

- Search Supplier.
- Invoice status filter.
- Add/Record invoice.

Table:

- Supplier.
- Tax Code.
- Goods Value.
- Receiving Status.
- Invoice Status.
- Invoice Number.
- Invoice Date.
- Note.
- Action.

Prototype statuses:

- Chưa có.
- Đã có.

Do not add payment/accounting semantics.

---

## 20. Warehouse Screens

### Stock In

`PLACEHOLDER`

### Stock Out

`PLACEHOLDER`

### Inventory History

`PLACEHOLDER`

Required placeholder message:

`Cấu trúc kho và các quy tắc physical/available/reserved stock chưa được chốt. Chờ chốt Inventory SPEC.`

No production transaction contract.

---

## 21. Global UX Rules

- Search/filter must work on mock data.
- Tables use clear headers.
- Sticky headers for long tables where useful.
- Use in-app modal/toast instead of browser alert when practical.
- Required fields use `*`.
- Date format = `dd/MM/yyyy`.
- Currency = VND.
- Status = badges.
- Page titles and breadcrumbs consistent.
- Empty/no-result states exist.
- LocalStorage may preserve demo changes.
- Demo reset action requires confirmation.
- Any deferred feature opens a meaningful explanatory placeholder instead of a dead button.

---

## 22. Mock Data Requirements

Prototype should have sufficient cross-linked mock data for realistic interaction:

- at least 3 Customers;
- at least 3 Projects;
- at least 4 Manufacturers;
- UOM examples: pcs, m, set;
- hierarchical Categories;
- at least 4 Suppliers;
- at least 10 Materials;
- 2–3 supplier offers for many Materials;
- examples where Cheapest = Preferred;
- examples where Cheapest ≠ Preferred;
- examples with no Preferred;
- price increase/decrease/no-change cases;
- multiple Users and Roles;
- BOM lines with unselected Final Supplier, partial receiving, complete receiving, and missing invoice examples.

Mock data must not create new business semantics.

---

## 23. UI Acceptance Dispositions

Reviewer may use:

- `UI_REVIEW_PASS`
- `PASS_WITH_NOTES`
- `UI_FIX_REQUIRED`
- `SPEC_REOPEN_REQUIRED`

AI implementation may self-report only up to:

`READY_FOR_REVIEW`

It must not self-award `UI_REVIEW_PASS`.

---

## 24. Protected Open UX/SPEC Items

- Role Management navigation = `UI_PENDING`.
- Project Status enum = `NEEDS_DECISION`.
- Project delete rule = `NEEDS_DECISION`.
- BOM edit after purchase = `DEFERRED_TO_PROTOTYPE_REVIEW`.
- BOM versioning = `PARTIAL`.
- Material Import detail = `DEFERRED_TO_PROTOTYPE_REVIEW`.
- Supplier Price Import detail = `DEFERRED_TO_PROTOTYPE_REVIEW`.
- BOM Import detail = not frozen.
- Inventory topology = `NOT_STARTED`.
- Physical/available/reserved stock = `NOT_STARTED`.
- Advanced invoice lifecycle = `PARTIAL`.
- Production Dashboard KPI formulas = `PARTIAL`.
- API/DB/Auth/Security/Backup/Deployment/NFR = `NOT_STARTED`.

Do not silently resolve any item above.

---

## 25. Current Implementation Status

| UI area | Design status | Prototype implementation |
|---|---|---|
| App Identity / Platform / Visual | `FROZEN_FOR_PROTOTYPE_V0` | `READY_TO_PROTOTYPE` |
| Sidebar / Shell | `FROZEN_FOR_PROTOTYPE_V0` | `READY_TO_PROTOTYPE` |
| Dashboard | `FROZEN_FOR_CUSTOMER_DEMO` | `READY_TO_PROTOTYPE` |
| System Catalog | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Material | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Supplier Detail / Price | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| User / Role | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Cross-project Monitoring | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Project 4-tab Shell | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| BOM & Supplier | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Goods Receiving | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Invoice | `FROZEN_FOR_PROTOTYPE_V0` | `NOT_STARTED` |
| Import screens | `PLACEHOLDER` | `NOT_STARTED` |
| Stock In / Out / History | `PLACEHOLDER` | `NOT_STARTED` |
| Mobile optimization | `NOT_STARTED` | `NOT_STARTED / OUT_OF_SCOPE_V1` |

Current next UI action:

`Implement Stage 1 Foundation, then submit for manual UI acceptance before Stage 2.`
