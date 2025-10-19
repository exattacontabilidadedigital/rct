# Calendar integration plan

## Goals

- Replace the current `react-big-calendar` usage with the richer calendar experience referenced by the user (multi-view, drag-and-drop, filters, working hours, live timeline).
- Keep the calendar fully client-side while persisting updates (drag, edit, create) back through the existing checklist task update flow.
- Reuse shadcn/ui components and Tailwind design tokens so the calendar matches the rest of the RTC platform.

## Data mapping

| Calendar concept | RTC source | Notes |
| --- | --- | --- |
| `IEvent.id` | `ChecklistTask.id` | Maintain a stable identifier. |
| `title` | `ChecklistTask.title` | Already normalized through `sanitizeTask`. |
| `description` | `ChecklistTask.description ?? task.notes` | Fall back to notes if description is missing. |
| `startDate` | derived from `ChecklistTask.dueDate` | Store as ISO date-time string; default to 09:00 local time when the task only has a date. |
| `endDate` | `startDate + defaultDuration` | Start with 60 minutes; allow users to extend inside the edit dialog. |
| `color` | from `ChecklistTask.severity` | Map: vermelho → red, laranja → orange, verde → green, default → blue. |
| `user` | task owner lookup | Build users list from board members; default to "Sem responsável" bucket when missing. |

When dragging an event, update the underlying task `dueDate` (and optional `dueTime`) via the existing Supabase mutation (`updateChecklistTask`).

## Architecture

1. **Calendar module**
   - Add `src/calendar/` with ported context, helpers, types, and view components from the reference project.
   - Trim features that rely on Next.js routing (e.g., URL navigation between views) and expose a `view` prop so the checklist page keeps its own tab switcher.
   - Replace mock fetches with props passed in from the checklist board page.

2. **Provider wiring**
   - Wrap the calendar view inside the checklist calendar tab with `CalendarProvider`.
   - Feed `events` and `users` from the current board data (`board.tasks`, `board.members`).
   - Inject callbacks (`onCreate`, `onUpdate`, `onDelete`) that call the existing context methods to mutate tasks and refetch board data as needed.

3. **UI components**
   - Port only the shadcn primitives that are missing in RTC: `form`, `scroll-area`, `time-input`, `single-calendar`, `single-day-picker`, `avatar-group`, plus the `use-disclosure` hook.
   - Keep everything under `src/components/ui/` to match current structure.

4. **Styles**
   - Extend Tailwind config with `bg-calendar-disabled-hour` and required font sizes/spacings from the reference calendar.
   - Add any utility classes (e.g., `.event-dot`) to a dedicated stylesheet (`src/styles/calendar.css`) and import it alongside the existing globals for the calendar view.

5. **Checklist integration**
   - Replace `ChecklistTaskCalendar` implementation to render the new `ClientContainer` with the desired initial view.
   - Translate firebase board filters (owner, severity) into the calendar’s user filter and color scheme.
   - Ensure that deactivated drag targets skip weekends/closed hours according to working-hour settings.

## Dependencies

Add the following packages (matching versions used in the reference repo or latest compatible with React 19):

- `react-dnd`
- `react-dnd-html5-backend`
- `react-day-picker`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `react-aria-components`

## Implementation phases

1. **Scaffold calendar module** (todo #2)
   - Copy context, types, helpers, DnD layer, and views.
   - Adjust imports to RTC paths and remove unused demo pieces (mock requests, Next.js pages, analytics header, etc.).

2. **Wire into checklist** (todo #3)
   - Map tasks to events and members to users.
   - Plug persistence callbacks into auth context mutations.
   - Replace existing calendar component rendering.

3. **Polish and validate** (todo #4)
   - Tailor colors/labels to Portuguese copy.
   - Validate drag/drop, live timeline, and filtering with real tasks.
   - Update README or internal docs if necessary.

## Assumptions & open questions

- Tasks only store one timestamp (`dueDate`). Time-of-day granularity will be new: default to 09:00–10:00 but persist new times when users interact with the calendar.
- Multi-day events will be treated as tasks whose duration extends beyond one day once end times differ from start times.
- Board members array includes the avatars and names required for the calendar header filter; otherwise we fall back to initials.
- Mobile support: week view is desktop only (same as reference) and will display a helper message on small screens.

This plan aligns the RTC app with the feature set shown in the provided reference while keeping the checklist domain as the source of truth for events.
