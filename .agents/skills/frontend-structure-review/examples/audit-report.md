# Frontend Structural Review Report

**Audit Target**: `frontend/src`
**Focus**: Component Architecture, State Management, and Modularization.

---

## 1. Component Health Report

| Metric                    | Assessment | Observations                                                                                                                                                                      |
| ------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monolithic Components** | SEVERE     | `App.jsx` (322 lines), `ResidenteDashboard.jsx` (~350 lines), and `GestionUsuarios.jsx` (~300 lines) handle too many responsibilities (routing, state, API calls, sub-rendering). |
| **SFC Responsibility**    | POOR       | Smart components (Views) are mixed with inline subcomponents (e.g., `UsuariosCardsMobile` inside `GestionUsuarios.jsx`) and complex local state.                                  |
| **Directory Uniformity**  | GOOD       | Clear role-based separation (`roles/Admin`, `roles/Residente`) is a strong architectural choice for this project type.                                                            |

---

## 2. Structural Bottlenecks

### 🚨 Prop Drilling Hell

- **Issue**: The `token`, `nombre`, and `rol` props are passed from `App.jsx` -> `AdminDashboard.jsx` -> `GestionUsuarios.jsx` -> `Table/Component`.
- **Impact**: Any change in the notification or auth flow requires manual updates in dozens of intermediate components. It makes components hard to test in isolation.

### 🔄 Coupled Logic (API + View)

- **Issue**: Views like `GestionUsuarios.jsx` and `AdminDashboard.jsx` perform raw `api.get/post` calls directly.
- **Impact**: Logic for data fetching cannot be reused. If the API endpoint changes, multiple views must be updated.

---

## 3. State Management Audit

- **Current State**: Fragmented local state with manual persistence in `localStorage`.
- **Analysis**: The project uses a "manual global state" pattern in `App.jsx`. There is a lack of a unified source of truth for the session.
- **Decision**: Implementing `React.Context` for `AuthContext` and `UIContext` (notifications) would eliminate 80% of current prop drilling.

---

## 4. Refactoring Suggestions

### ✅ Implementation of AuthContext

Move `token`, `user`, and `roles` to a central Provider.
**Target**: Remove `token` and `rol` props from all dashboard and view signatures.

### ✅ View/Component Separation

Extract inline components like `UsuariosCardsMobile` and dashboard sections into separate files. Avoid defining multiple functional components in a single `.jsx` file.

### ✅ Custom Hooks for Data Persistence

Extract the pagination and filtering logic into a custom hook (e.g., `usePaginatedData`).

```javascript
// Example abstraction:
const { data, loading, error, setPage } = usePaginatedData("/usuarios/admin", {
  limit: 15,
});
```

### ✅ Thin Views, Fat Hooks

Move the `cargarUsuarios` and `eliminarUsuario` logic out of `GestionUsuarios.jsx` and into a specialized hook or service layer.
