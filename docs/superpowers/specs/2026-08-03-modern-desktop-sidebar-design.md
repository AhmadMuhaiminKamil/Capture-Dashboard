# Modern Desktop Sidebar Design

## Goal
Replace desktop top navigation with a modern fixed sidebar while preserving the existing mobile hamburger navigation and current dark-blue visual theme.

## Scope
- Desktop breakpoint: `sm` and above.
- Mobile: existing hamburger/dropdown behavior remains unchanged.
- Shared component: `components/NavBar.tsx` remains the single navigation component.
- Pages using navigation: dashboard, table_detail, kategori_binding, storage.
- No new dependency, database change, or auth flow change.

## Design
- Desktop sidebar width: 240px, fixed to the left, full viewport height.
- Sidebar surface: dark glass background, subtle blue border, shadow, rounded right edge.
- Header: Binding logo mark and product name.
- Navigation: Dashboard, Table Detail, Kategori Binding, Storage. Each item has a simple inline SVG icon, active blue gradient/background, and a blue active indicator.
- Footer account card: avatar built from the first character of the logged-in email, email text truncated safely, and Logout action.
- Main page content receives desktop left padding (`sm:pl-60`) so it never sits under the sidebar.
- Mobile retains current top bar, hamburger, dropdown, and no desktop sidebar.

## Data and behavior
- Read authenticated user from the existing Supabase auth session used by `useAuthGuard`.
- Logout calls the existing Supabase client `auth.signOut()` then routes to `/login`.
- Active route uses `usePathname`; nested routes are active when their pathname matches the link.
- Navigation links close the mobile menu after selection.

## Verification
- `npm run build` must pass.
- Run fresh local server after deleting `.next`.
- Verify HTTP 200 for `/dashboard`, `/table_detail`, `/kategori_binding`, and `/storage`.
- Verify desktop sidebar is present and mobile hamburger remains present at narrow viewport.
- Verify account email and logout control render without exposing secrets.
