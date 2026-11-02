# Graph Report - copy-of-versiory-store---transformando-ideias-em-sucesso  (2026-11-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 532 nodes · 1248 edges · 30 communities (17 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5bc09e84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AdminDashboard.tsx
- react
- firebase.ts
- types.ts
- package.json
- deploy.yml
- LabelGenerator.tsx
- Product
- compilerOptions
- billingConfig.ts
- planConfig.ts
- totp.ts
- find_brace.cjs
- CashRegisterReport.tsx
- mercadolivre.ts
- permissions.ts
- InfoPages.tsx
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `AdminDashboard()` - 71 edges
2. `react` - 45 edges
3. `Product` - 30 edges
4. `App()` - 24 edges
5. `Order` - 20 edges
6. `AdminApp()` - 20 edges
7. `Account()` - 18 edges
8. `Customer` - 16 edges
9. `CustomerOrders()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `clearUserSession()`  [EXTRACTED]
  App.tsx → services/firebase.ts
- `App()` --calls--> `getCart()`  [EXTRACTED]
  App.tsx → services/firebase.ts
- `AdminDashboardProps` --references--> `Customer`  [EXTRACTED]
  components/AdminDashboard.tsx → types.ts
- `AdminDashboardProps` --references--> `Order`  [EXTRACTED]
  components/AdminDashboard.tsx → types.ts
- `AdminDashboardProps` --references--> `Product`  [EXTRACTED]
  components/AdminDashboard.tsx → types.ts

## Import Cycles
- None detected.

## Communities (30 total, 13 thin omitted)

### Community 0 - "AdminDashboard.tsx"
Cohesion: 0.05
Nodes (71): AdminDashboard(), BASE_CATEGORIES, BEDDING_SIZES, formatCurrency(), formatDate(), formatOrderId(), OrderStatus, STATUS_COLORS (+63 more)

### Community 1 - "react"
Cohesion: 0.07
Nodes (50): App(), AppContent(), PrivateRoute(), PrivateRoute(), Account(), ChatMessage, ChatWidget(), CustomerOrders() (+42 more)

### Community 2 - "firebase.ts"
Cohesion: 0.06
Nodes (55): AdminApp(), BASE_CATEGORIES, AdminDashboardProps, Tracking(), PRODUCTS, AdminSession, app, AuditLogEntry (+47 more)

### Community 3 - "types.ts"
Cohesion: 0.10
Nodes (43): Checkout(), CheckoutProps, Checkout(), CheckoutProps, CustomerOrdersProps, DanfePreview(), DanfePreviewProps, FiscalConfigModal() (+35 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (45): root, rootElement, CouponManagement(), IconEdit(), IconPlus(), IconSave(), IconTimes(), IconTrash() (+37 more)

### Community 5 - "deploy.yml"
Cohesion: 0.07
Nodes (31): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+23 more)

### Community 6 - "LabelGenerator.tsx"
Cohesion: 0.13
Nodes (26): FiscalFields(), formatCurrency(), LabelGenerator(), LabelLayout, LabelPreview(), LabelSize, LAYOUTS, SIZES (+18 more)

### Community 7 - "Product"
Cohesion: 0.12
Nodes (14): COLORS, CurvaAbcAnalysis(), CurvaAbcAnalysisProps, ProductAnalysis, ProductRevenue, FiscalFieldsProps, LabelGeneratorProps, MarketplaceFields() (+6 more)

### Community 8 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 9 - "billingConfig.ts"
Cohesion: 0.21
Nodes (11): AdminLogin(), AdminLoginProps, BillingStatus, dayDiff(), fmt(), getBillingConfig(), getBillingDueAmount(), getBillingStatus() (+3 more)

### Community 10 - "planConfig.ts"
Cohesion: 0.19
Nodes (10): PlanGuard(), PlanGuardProps, PLAN_HIERARCHY, PLAN_LABELS, PLAN_MODULES, PLAN_PRICES, PlanId, SubscriptionData (+2 more)

### Community 11 - "totp.ts"
Cohesion: 0.29
Nodes (9): RFC-6238, base32Decode(), base32Encode(), generateTotp(), generateTotpSecret(), hmacSha1(), intToBytes(), sha1() (+1 more)

### Community 12 - "find_brace.cjs"
Cohesion: 0.18
Nodes (7): code, fs, lines, content, fs, content, fs

### Community 13 - "CashRegisterReport.tsx"
Cohesion: 0.29
Nodes (8): CashRegisterReport(), CashRegisterReportProps, formatCurrency(), CashRegister, CashMovement, CashRegisterData, formatCurrency(), generateCashReportHTML()

### Community 14 - "mercadolivre.ts"
Cohesion: 0.38
Nodes (8): MarketplaceSettings(), callMlApi(), exchangeMlCodeForToken(), getMlAuthUrl(), getValidAccessToken(), refreshMlToken(), updateMlStock(), MarketplaceConfig

### Community 15 - "permissions.ts"
Cohesion: 0.22
Nodes (6): ADMIN, ALL, MATRIX, Permission, Role, SELLER

### Community 16 - "InfoPages.tsx"
Cohesion: 0.40
Nodes (3): CONTENT, InfoPagesProps, InfoPageType

## Knowledge Gaps
- **1 isolated node(s):** `RFC-6238`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 174 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `AdminDashboard.tsx`, `firebase.ts`, `types.ts`, `package.json`, `LabelGenerator.tsx`, `Product`, `billingConfig.ts`, `planConfig.ts`, `CashRegisterReport.tsx`, `mercadolivre.ts`, `InfoPages.tsx`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **What connects `RFC-6238` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `AdminDashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051490514905149054 - nodes in this community are weakly interconnected._
- **Why does `AdminDashboard()` connect `AdminDashboard.tsx` to `react`, `firebase.ts`, `types.ts`, `package.json`, `LabelGenerator.tsx`, `Product`, `billingConfig.ts`, `CashRegisterReport.tsx`, `mercadolivre.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06630630630630631 - nodes in this community are weakly interconnected._
- **Why does `Product` connect `Product` to `AdminDashboard.tsx`, `react`, `firebase.ts`, `types.ts`, `LabelGenerator.tsx`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `firebase.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06247086247086247 - nodes in this community are weakly interconnected._