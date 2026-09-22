"use client";

import { Instagram, MessageCircleMore, Send } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const channels = {
  whatsapp: {
    label: "WhatsApp",
    unread: 4,
    openLabel: "4 open",
    composer: "Type a message",
    threads: [
      { initials: "RS", name: "Rhea Studio", detail: "12-reel monthly package", time: "2m", status: "online", message: "Can your team deliver 12 reels every month?" },
      { initials: "AC", name: "Arjun Creatives", detail: "Documentary edit enquiry", time: "18m", status: "last seen 8m ago", message: "I am sharing the documentary footage link now." },
      { initials: "NC", name: "Nirvana Coaches", detail: "Podcast production", time: "1h", status: "online", message: "Can we schedule the next four podcast edits?" },
    ],
  },
  instagram: {
    label: "Instagram",
    unread: 2,
    openLabel: "2 new",
    composer: "Message…",
    threads: [
      { initials: "AF", name: "Anaya Films", detail: "Replied to your reel", time: "3m", status: "Active now", message: "Hey! Can you edit a launch reel in this style?" },
      { initials: "FC", name: "Framecraft Co.", detail: "Shared a post", time: "24m", status: "Active 12m ago", message: "We love this pacing. Could your team create five edits?" },
      { initials: "KM", name: "Karan Media", detail: "Brand collaboration", time: "2h", status: "Active today", message: "Are you taking on monthly social content packages?" },
    ],
  },
} as const;

type ChannelId = keyof typeof channels;

const channelOrder: ChannelId[] = ["whatsapp", "instagram"];

export function HomepageChannelInbox() {
  const [activeChannel, setActiveChannel] = useState<ChannelId>("whatsapp");
  const [activeThreadIndex, setActiveThreadIndex] = useState(0);
  const channel = channels[activeChannel];
  const activeThread = channel.threads[activeThreadIndex] ?? channel.threads[0];

  function selectChannel(channelId: ChannelId) {
    setActiveChannel(channelId);
    setActiveThreadIndex(0);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, channelId: ChannelId) {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = channelOrder.indexOf(channelId);
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    const nextChannel = channelOrder[(currentIndex + direction + channelOrder.length) % channelOrder.length];
    selectChannel(nextChannel);
    document.getElementById(`gx-channel-${nextChannel}`)?.focus();
  }

  return (
    <div className={`gx-v3-inbox-ui is-${activeChannel}`} data-channel={activeChannel}>
      <div aria-label="Choose inbox channel" className="gx-v3-channel-rail" role="tablist" aria-orientation="vertical">
        {channelOrder.map((channelId) => {
          const item = channels[channelId];
          const isActive = activeChannel === channelId;
          return (
            <button
              aria-controls="gx-client-inbox-panel"
              aria-label={`${item.unread} unread in ${item.label}. Open inbox`}
              aria-selected={isActive}
              className={isActive ? "is-active" : undefined}
              id={`gx-channel-${channelId}`}
              key={channelId}
              onClick={() => selectChannel(channelId)}
              onKeyDown={(event) => handleTabKeyDown(event, channelId)}
              role="tab"
              title={item.label}
              type="button"
            >
              {channelId === "whatsapp" ? <MessageCircleMore size={18} /> : <Instagram size={18} />}
              <b>{item.unread}</b>
            </button>
          );
        })}
      </div>

      <div
        aria-labelledby={`gx-channel-${activeChannel}`}
        className="gx-v3-thread-list"
        id="gx-client-inbox-panel"
        role="tabpanel"
      >
        <header><strong>{channel.label} inbox</strong><span>{channel.openLabel}</span></header>
        <div className="gx-v3-thread-track">
          {channel.threads.map((thread, index) => (
            <button
              aria-pressed={activeThreadIndex === index}
              className={`gx-v3-thread-row${activeThreadIndex === index ? " is-active" : ""}`}
              key={thread.name}
              onClick={() => setActiveThreadIndex(index)}
              type="button"
            >
              <i>{thread.initials}</i><p><strong>{thread.name}</strong><small>{thread.detail}</small></p><em>{thread.time}</em>
            </button>
          ))}
          {channel.threads.map((thread) => (
            <div aria-hidden="true" className="gx-v3-thread-row gx-v3-thread-copy" key={`${thread.name}-copy`}>
              <i>{thread.initials}</i><p><strong>{thread.name}</strong><small>{thread.detail}</small></p><em>{thread.time}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="gx-v3-chat-preview">
        <header>
          <span>{activeThread.initials}</span>
          <p><strong>{activeThread.name}</strong><small>{activeThread.status}</small></p>
          {activeChannel === "whatsapp" ? <MessageCircleMore aria-hidden="true" size={16} /> : <Instagram aria-hidden="true" size={16} />}
        </header>
        <blockquote>{activeThread.message}</blockquote>
        <div><span>{channel.composer}</span><button aria-label={`Send ${channel.label} message`} type="button"><Send size={15} /></button></div>
      </div>
    </div>
  );
}
