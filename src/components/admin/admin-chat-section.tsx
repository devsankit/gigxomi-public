"use client";

import dynamic from "next/dynamic";

const ChatWorkspace = dynamic(
  () => import("@/components/chat/chat-workspace").then((mod) => mod.ChatWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="chat-workspace-loading-skeleton" aria-busy="true" aria-label="Loading agency chat inbox...">
        <div className="chat-loading-sidebar-skeleton" />
        <div className="chat-loading-stage-skeleton" />
      </div>
    ),
  },
);

export function AdminChatSection() {
  return (
    <ChatWorkspace
      audience="admin"
      listLabel="Agency inbox"
      listTitle="Agency owner can inspect the same inbox managers use before routing work to masked editor seats."
      mode="inbox"
    />
  );
}
