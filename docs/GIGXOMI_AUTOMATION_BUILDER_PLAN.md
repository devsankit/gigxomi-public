# GIGXOMI Automation Builder Plan

## Current Files (Audited)
- `src/app/super-admin/whatsapp-flows/page.tsx`
- `src/app/super-admin/whatsapp-flows/builder/[flowId]/page.tsx`
- `src/components/super-admin/super-admin-whatsapp-flow-builder.tsx`
- `src/app/api/super-admin/whatsapp-flows/route.ts`
- `src/lib/gigxomi/super-admin-whatsapp-flow-store.ts`
- `src/lib/gigxomi/whatsapp-flow-engine.ts`
- `src/app/globals.css`

## Current Limitations Found
- Builder UI was monolithic and tightly coupled.
- Node system was limited to a narrow subset.
- Validation was mostly basic and publish checks were partial.
- No channel compatibility model.
- Test/simulation mode shell was missing.
- Analytics panel lacked clear connected/empty runtime state.
- Several runtime-capable nodes in UI were not fully executable in backend engine.

## Architecture Applied In This Pass
- Kept routes/auth/sidebar unchanged.
- Preserved save/publish API path (`/api/super-admin/whatsapp-flows`).
- Introduced central node registry in builder component with:
  - category
  - description
  - channelSupport
  - defaultData
  - runtime status (`ready` / `backend_needed`)
- Added tabbed right panel:
  - Inspector
  - Validation
  - Test
  - Analytics
- Added channel selector model:
  - WhatsApp
  - Instagram DM (future)
  - Messenger (future)
  - Website Chat (future)
- Added validation severity model (`error`, `warning`, `info`) and publish blocking on `error`.
- Added simulation shell for local path preview and runtime-needed labeling.
- Upgraded theme surfaces to Gigxomi dark-gloss + lime accent token mapping.

## Implemented In This Pass
- Premium layout refresh (command bar + left library + large canvas + right tabs).
- Searchable grouped node library behavior.
- Expanded node catalog with runtime/planning visibility.
- Inspector controls for core node types (message, condition, API, wait).
- Validation panel with clickable issues.
- Test shell with local path simulation log.
- Analytics shell with explicit empty state.
- Responsive fallback note for mobile limited editing mode.

## Not Implemented Yet
- Full runtime execution for all planned nodes.
- True flow-version snapshot backend table/API.
- Full template gallery insertion modal for all business templates.
- Deep per-node form schemas for every planned node type.
- Node-level drag-drop from left panel (click-add currently active).

## Required Data Model (Backend)
- Flow:
  - id
  - tenant_id / agency_id
  - name
  - description
  - channel
  - status
  - version
  - nodes
  - edges
  - settings
  - created_by
  - updated_by
  - created_at
  - updated_at
  - published_at
- FlowVersion:
  - flow_id
  - version
  - snapshot_json
  - published_by
  - published_at
  - changelog
- FlowRun:
  - flow_id
  - contact_id
  - channel
  - current_node_id
  - status
  - started_at
  - completed_at
  - failed_at
  - error
- FlowEvent:
  - run_id
  - node_id
  - event_type
  - input
  - output
  - timestamp
  - metadata

## Backend/API Gaps
- No first-class multi-channel flow schema in API/store yet.
- No publish transaction with immutable version snapshot.
- No flow run/event persistence model for analytics.
- Missing execution primitives for many planned nodes (tagging, CRM updates, tasks, payment links, etc.).

## WhatsApp Cloud API Gaps
- Interactive list/template execution needs stricter runtime coverage.
- Message template enforcement currently lacks template-id validation lifecycle.
- Delivery/read/failure events are not persisted as flow events for analytics.

## Instagram/Messenger Future Notes
- Support should be added only through official Meta APIs.
- Node/channel gating is now in UI; backend routing and channel runners still needed.

## Final Runtime Statement
Builder UI is ready, runtime execution backend still needed.

