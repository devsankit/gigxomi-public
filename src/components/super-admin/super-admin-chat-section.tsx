import { ChatWorkspace } from "@/components/chat/chat-workspace";

export function SuperAdminChatSection() {
  return (
    <ChatWorkspace
      audience="admin"
      listLabel="Official Gigxomi line"
      mode="inbox"
      tenantId="tenant-gigxomi"
    />
  );
}

