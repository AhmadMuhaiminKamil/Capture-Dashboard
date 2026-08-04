# Modern Desktop Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace desktop top navigation with a fixed modern sidebar, preserve mobile hamburger navigation, and show the authenticated account with logout.

**Architecture:** Keep `components/NavBar.tsx` as the shared client component. It renders a fixed desktop sidebar at `sm` and above, and the existing top-bar/dropdown navigation below `sm`. Add `sm:pl-60` to the four page roots so content clears the sidebar.

**Tech Stack:** Next.js, React, Tailwind CSS, existing Supabase client/auth guard.

## Global Constraints

- Mobile hamburger/dropdown behavior must remain.
- No new dependencies.
- No database changes.
- No secret values rendered in the UI.
- Build and fresh `.next` restart required.

---

### Task 1: Replace shared desktop navigation

**Files:**
- Modify: `components/NavBar.tsx`

**Interfaces:**
- Consumes: `usePathname`, existing `supabase` client, `React.ReactNode` `right` prop.
- Produces: desktop fixed sidebar and unchanged mobile navigation.

- [ ] Add the four existing links with inline SVG icon paths and active matching using `path === href || path.startsWith(`${href}/`)`.
- [ ] Read the existing auth session through `supabase.auth.getSession()` in an effect; store only the returned `user.email` and initials in component state.
- [ ] Render sidebar at `hidden sm:flex fixed inset-y-0 left-0 z-50 w-60 flex-col`, with dark glass styling, logo, nav links, account footer, and logout button.
- [ ] Logout handler calls `await supabase.auth.signOut()` and `window.location.assign('/login')`.
- [ ] Keep the current mobile header/dropdown under `sm:hidden`; keep `right` slot behavior.

### Task 2: Offset page content on desktop

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `app/table_detail/page.tsx`
- Modify: `app/kategori_binding/page.tsx`
- Modify: `app/storage/page.tsx`

**Interfaces:**
- Consumes: shared sidebar width `w-60`.
- Produces: page content that does not sit beneath the fixed sidebar.

- [ ] Add `sm:pl-60` to each page's outer full-width wrapper.
- [ ] Do not alter page-specific mobile padding or data logic.

### Task 3: Verify

**Files:**
- No test file required; this is a shared visual component change.

- [ ] Run `npm run build`; expected output includes `Compiled successfully` and no TypeScript error.
- [ ] Run `fuser -k 3000/tcp; rm -rf .next; npm run dev` in background and wait for `Ready in`.
- [ ] Run `curl -s -o /dev/null -w '%{http_code}'` for `/dashboard`, `/table_detail`, `/kategori_binding`, and `/storage`; each must return `200` or the existing auth redirect behavior must be confirmed.
- [ ] Inspect source to confirm desktop sidebar classes and `sm:pl-60` exist in all four pages.
