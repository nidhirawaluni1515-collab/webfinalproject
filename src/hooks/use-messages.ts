import { useState, useEffect, useCallback } from "react";

export interface DirectMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  timestamp: string;
  read: boolean;
  // optional trip share payload
  tripShare?: { tripId: string; tripName: string; description: string; cityFlags: string[] };
}

const MESSAGES_KEY = "atlashub_messages";
function generateId() { return Math.random().toString(36).substring(2, 10); }

function loadMessages(): DirectMessage[] {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveMessages(msgs: DirectMessage[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
}

export function useMessages(currentUserId: string | undefined) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);

  const reload = useCallback(() => { setMessages(loadMessages()); }, []);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 2000);
    return () => clearInterval(interval);
  }, [reload]);

  const getConversations = useCallback(() => {
    if (!currentUserId) return [];
    const userMsgs = messages.filter((m) => m.fromUserId === currentUserId || m.toUserId === currentUserId);
    const partnerIds = new Set<string>();
    userMsgs.forEach((m) => { partnerIds.add(m.fromUserId === currentUserId ? m.toUserId : m.fromUserId); });
    return Array.from(partnerIds).map((partnerId) => {
      const convoMsgs = userMsgs
        .filter((m) => (m.fromUserId === partnerId && m.toUserId === currentUserId) || (m.fromUserId === currentUserId && m.toUserId === partnerId))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const lastMsg = convoMsgs[convoMsgs.length - 1];
      const unread = convoMsgs.filter((m) => m.toUserId === currentUserId && !m.read).length;
      return { partnerId, lastMessage: lastMsg, messages: convoMsgs, unreadCount: unread };
    }).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [messages, currentUserId]);

  const getThread = useCallback((partnerId: string) => {
    if (!currentUserId) return [];
    return messages
      .filter((m) => (m.fromUserId === currentUserId && m.toUserId === partnerId) || (m.fromUserId === partnerId && m.toUserId === currentUserId))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, currentUserId]);

  const sendMessage = useCallback((toUserId: string, text: string, tripShare?: DirectMessage["tripShare"]) => {
    if (!currentUserId || !text.trim()) return;
    const msg: DirectMessage = {
      id: generateId(), fromUserId: currentUserId, toUserId,
      text: text.trim(), timestamp: new Date().toISOString(), read: false,
      ...(tripShare ? { tripShare } : {}),
    };
    const all = [...loadMessages(), msg];
    saveMessages(all); setMessages(all);
  }, [currentUserId]);

  const markRead = useCallback((partnerId: string) => {
    if (!currentUserId) return;
    const all = loadMessages().map((m) =>
      m.fromUserId === partnerId && m.toUserId === currentUserId && !m.read ? { ...m, read: true } : m
    );
    saveMessages(all); setMessages(all);
  }, [currentUserId]);

  const totalUnread = currentUserId
    ? messages.filter((m) => m.toUserId === currentUserId && !m.read).length : 0;

  return { messages, getConversations, getThread, sendMessage, markRead, totalUnread, reload };
}
