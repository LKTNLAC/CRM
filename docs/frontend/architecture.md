# Frontend Architecture

## Stack

- **React 18** + **TypeScript**
- **Vite** — build tool
- **Tailwind CSS** — utility-first styling
- **Radix UI** + shadcn-style components
- **TanStack Query** — server state
- **Zustand** — global state
- **React Hook Form** + **Zod** — form + validation
- **Recharts** — charts
- **Framer Motion** — animation (nhẹ)
- **Lucide React** — icons
- **Sonner** — toast

## Folder Structure
src/
├── app/ # App root + providers
│ ├── App.tsx
│ └── providers.tsx
├── assets/
├── components/
│ ├── ui/ # shadcn-style base components
│ ├── layout/ # Sidebar, Topbar, MobileNav
│ ├── shared/ # DataTable, PageHeader, ExportButton, ...
│ ├── ThemeProvider.tsx
│ └── ErrorBoundary.tsx
├── layouts/
│ ├── AuthLayout.tsx
│ └── DashboardLayout.tsx
├── pages/
│ ├── LoginPage.tsx
│ ├── DashboardPage.tsx
│ └── NotFoundPage.tsx
├── features/ # 15 feature modules
│ ├── auth/
│ ├── leads/
│ ├── students/
│ ├── guardians/
│ ├── tasks/
│ ├── courses/
│ ├── classes/
│ ├── enrollments/
│ ├── attendance/
│ ├── exams/
│ ├── notifications/
│ ├── communications/
│ ├── workflows/
│ ├── reports/
│ ├── users/
│ └── portal/
├── services/ # API client + query client
├── stores/ # Zustand stores
├── permissions/ # RBAC UI helpers
├── routes/ # React Router config
├── hooks/ # Custom hooks
├── utils/ # Helpers (cn, download, format)
├── types/ # Shared types
└── styles/
└── globals.css


## Feature Module Structure
features/<name>/
├── types.ts # TypeScript interfaces
├── services.ts # TanStack Query hooks
├── pages/ # Page components
│ ├── <Name>ListPage.tsx
│ ├── <Name>DetailPage.tsx
│ └── <Name>CreatePage.tsx
└── components/ # Feature-specific components


## Navigation

### Desktop

- **Sidebar** (w-60): nav theo section, filter theo permission.
- **Topbar**: search (⌘K placeholder), theme toggle, notification bell, user menu.
- **Breadcrumb**: hiển thị vị trí.

### Mobile

- **Bottom nav**: 3-5 action chính.
- **Drawer**: menu đầy đủ, mở từ hamburger.
- **Touch target:** ≥ 44px.

### Tablet

- **Collapsible sidebar**: hybrid desktop/mobile.

## Design System

### Tokens

- **Spacing:** 4px base (4, 8, 12, 16, 24, 32, 48, 64)
- **Typography:** Inter font, 6 levels (display, h1-h3, body, caption)
- **Color:** semantic tokens (primary, success, warning, danger, muted)
- **Radius:** sm (4), md (8), lg (12)
- **Shadow:** sm, md, lg
- **Breakpoints:** 640, 1024, 1440

### Components

- Button (primary, secondary, ghost, danger, outline)
- Input, Select, Checkbox, Radio, DatePicker, Textarea
- Table (desktop) / Card (mobile)
- Modal, Drawer
- Toast, Alert
- EmptyState, LoadingState, ErrorState
- Pagination, Breadcrumb
- Badge, Avatar, Tooltip, Separator, Skeleton, Tabs
- Switch, Dialog, DropdownMenu, Sheet

### Accessibility

- WCAG 2.1 AA
- Keyboard navigation
- Focus visible
- ARIA labels
- Contrast ratio ≥ 4.5:1
- Touch target ≥ 44px mobile

## State Management

### Server State (TanStack Query)

- Cache: `staleTime: 30s`
- Retry: 1 lần
- Refetch on window focus: không
- Invalidate sau mutation

### Global State (Zustand)

- `authStore`: user, access token, refresh token
- Persist user qua reload
- Clear khi logout

### Local State

- Form state: React Hook Form
- UI state: useState
- Không dùng global cho local

## Routing

### Route Structure
/login → LoginPage
/ → DashboardPage (protected)
/leads → LeadsListPage
/leads/new → LeadCreatePage
/leads/:id → LeadDetailPage
/students → StudentsListPage
... (30+ routes)
/portal → PortalRouter (Student/Parent)


### Protected Route

- Kiểm tra token + user.
- Redirect `/login` nếu chưa auth.
- Loading state khi đang fetch user.

### Lazy Loading

- Mỗi feature dùng `lazy(() => import(...))`.
- Suspense fallback: spinner.
- Code split theo feature.

## Permissions

```tsx
const { can } = usePermission();
{can("student.create") && <Button>Thêm học viên</Button>}
```
FE chỉ dùng để ẩn/hiện UI.

BE luôn kiểm tra lại.

## Error Handling
ErrorBoundary wrap Providers → bắt lỗi React.

Toast cho lỗi API.

Empty state cho list rỗng.

Loading state cho fetch.

## Theme
Light / Dark mode.

ThemeProvider lưu vào localStorage.

Đọc prefers-color-scheme lần đầu.

Class dark trên <html>.

## Performance
Lazy load routes.

Debounce search (300ms).

Virtual list nếu >100 rows (Phase sau).

React.memo cho component nặng.

## Testing
Vitest + Testing Library.

npm run test / test:run / test:coverage.

Chi tiết: docs/frontend/testing.md.

## Build & Deploy
npm run build → static files dist/.

Serve qua Nginx (trong frontend container).

Nginx proxy /api/ → backend.

Chi tiết: docs/deployment/model.md.
