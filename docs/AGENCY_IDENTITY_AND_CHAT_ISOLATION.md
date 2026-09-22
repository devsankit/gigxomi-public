# Agency identity and chat isolation

## Reserved Super Admin identity

- Email login: `hello.ankitrathore@gmail.com`
- OTP login phones: `7974063067`, `7566208079`
- Main WhatsApp business/chat phone: `9981807309`
- Main chat tenant: `tenant-gigxomi`

The WhatsApp business phone is not a Super Admin login alias. Public OTP and the Super Admin inbox must use only `tenant-gigxomi`; they must never fall back to another agency's WhatsApp connection.

## Agency registration rule

Every new agency registration receives a generated `tenant-agency-*` tenant ID. Its authentication identity, WhatsApp connection, and conversations remain scoped to that tenant. Freelancer registrations remain freelancer identities and are not removed by agency resets.

## 2026-06-22 reset

Migration `20260622193000_reset_agency_identity_isolation` backs up and removes existing agency authentication identities, conversations, and agency team links. It preserves freelancer/editor users, freelancer workspaces, services, portfolios, and videos. A full compressed PostgreSQL backup is also created on the VPS before migrations.

The legacy seeded agency for `6267605079` was removed from application bootstrap. If that old number remains in the legacy platform snapshot, it is cleared and replaced with an unregistered `9981807309` draft so Embedded Signup can capture the new WABA, phone ID, and token cleanly.

Legacy conversations are not imported into an empty production conversation table. A deliberate recovery import requires `ENABLE_LEGACY_CONVERSATION_IMPORT=true`.

Migration `20260622203000_restore_previous_chats_to_main_agency` restores the conversations captured by the reset backup and remaps them to `tenant-gigxomi`. They therefore appear in the Super Admin inbox connected to `9981807309`, while conversations created by future agency tenants remain isolated.
