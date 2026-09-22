import { NextResponse } from "next/server";

import { getConversationViewForSession } from "@/lib/api/conversation-view-response";
import { requireSessionRole } from "@/lib/api/require-session-role";
import { updateConversationLeadStatusFromFile } from "@/lib/gigxomi/dummy-platform-file-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await requireSessionRole(["SUPER_ADMIN", "ADMIN", "MANAGER", "FREELANCER"]);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await context.params;
  const body = await request.json();
  if (!(await getConversationViewForSession(authorization.session, id))) {
    return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
  }

  const notes = typeof body.notes === "string" ? body.notes : typeof body.internalNotes === "string" ? body.internalNotes : undefined;
  const conversation = await updateConversationLeadStatusFromFile(id, body.leadStatusId, notes);

  if (!conversation) {
    return NextResponse.json({ ok: false, error: "Unable to update lead status" }, { status: 404 });
  }

  const conversationView = await getConversationViewForSession(authorization.session, id);

  return NextResponse.json({
    ok: true,
    conversation: conversationView,
  });
}
