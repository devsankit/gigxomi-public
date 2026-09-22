import type { AppRole } from "@/lib/auth/types";
import { projectConversation, type DummyConversationView } from "@/lib/gigxomi/dummy-platform-store";
import { getConversationByIdFromFile, listConversationsForAudienceFromFile } from "@/lib/gigxomi/dummy-platform-file-store";

import { resolveConversationAudienceForSession, salesAgentCanAccessConversation } from "@/lib/api/conversation-access";

type ConversationSessionLike = {
  userId: string;
  role: AppRole;
  displayName: string;
  email: string | null;
  tenantId: string | null;
};

export async function getConversationViewForSession(
  session: ConversationSessionLike,
  conversationId: string,
  requestedAudience?: string | null,
): Promise<DummyConversationView | null> {
  const scope = resolveConversationAudienceForSession(session, requestedAudience);
  if (session.role === "SALES_AGENT") {
    if (!(await salesAgentCanAccessConversation(session.userId, conversationId))) return null;
    const conversation = await getConversationByIdFromFile(conversationId);
    return conversation ? projectConversation(conversation, "sales") : null;
  }
  const tenantId =
    session.role === "SUPER_ADMIN"
      ? undefined
      : session.tenantId?.trim();
  if ((scope.audience === "admin" || scope.audience === "manager") && session.role !== "SUPER_ADMIN" && !tenantId) {
    return null;
  }
  const payload = await listConversationsForAudienceFromFile(scope.audience, {
    freelancerId: scope.freelancerId,
    freelancerIds: scope.freelancerIds,
    freelancerNames: scope.freelancerNames,
    activeAgencyIds: scope.activeAgencyIds,
    tenantId,
    lightweight: false,
  });

  return payload.conversations.find((conversation) => conversation.id === conversationId) ?? null;
}
