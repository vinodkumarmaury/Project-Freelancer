// Create a new file for the Chat component

import { useState, useEffect, useRef, useMemo } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useProjectStore } from "@/lib/store";

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isRead: boolean;
};

type Contact = {
  id: string;
  name: string;
  avatar?: string;
  lastSeen?: Date;
  unreadCount?: number;
};

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "client" | "freelancer";
}

const loadMessages = (): Record<string, Message[]> => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("chat-messages");
    return saved ? JSON.parse(saved) : {};
  }
  return {};
};

const saveMessages = (messages: Record<string, Message[]>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("chat-messages", JSON.stringify(messages));
  }
};

export default function Chat({ isOpen, onClose, userRole }: ChatProps) {
  const { projects, bids } = useProjectStore();
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(loadMessages());
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getChatId = (contactId: string) => {
    return userRole === "client"
      ? `client-current-user-id_freelancer-${contactId}`
      : `client-${contactId}_freelancer-current-freelancer-id`;
  };

  const countUnreadMessages = (contactId: string) => {
    const chatId = getChatId(contactId);
    const msgs = allMessages[chatId] || [];
    return msgs.filter(
      (m) => !m.isRead && m.senderId !== (userRole === "client" ? "client" : "freelancer")
    ).length;
  };

  const contacts: Contact[] = useMemo(() => {
    if (userRole === "client") {
      const clientProjects = projects.filter((p) => p.clientId === "current-user-id");
      const relevantBids = bids.filter((b) =>
        clientProjects.some((p) => p.id === b.projectId)
      );

      const freelancerIds = Array.from(new Set(relevantBids.map((b) => b.freelancerId)));
      return freelancerIds.map((id) => ({
        id,
        name: id === "current-freelancer-id" ? "John Developer" : `Freelancer ${id.substring(0, 4)}`,
        unreadCount: countUnreadMessages(id),
      }));
    } else {
      const freelancerBids = bids.filter((b) => b.freelancerId === "current-freelancer-id");
      const relevantProjects = projects.filter((p) =>
        freelancerBids.some((b) => b.projectId === p.id)
      );

      const clientIds = Array.from(new Set(relevantProjects.map((p) => p.clientId || "")));
      return clientIds.map((id) => ({
        id,
        name: id === "current-user-id" ? "Project Client" : `Client ${id.substring(0, 4)}`,
        unreadCount: countUnreadMessages(id),
      }));
    }
  }, [projects, bids, userRole, allMessages]);

  useEffect(() => {
    if (contacts.length > 0 && !activeContact) {
      setActiveContact(contacts[0]);
    }
  }, [contacts, activeContact]);

  const messages = useMemo(() => {
    if (!activeContact) return [];
    const chatId = getChatId(activeContact.id);
    return allMessages[chatId] || [];
  }, [activeContact, allMessages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      if (activeContact) {
        const chatId = getChatId(activeContact.id);
        const updatedMessages = { ...allMessages };

        if (updatedMessages[chatId]) {
          updatedMessages[chatId] = updatedMessages[chatId].map((msg) => {
            if (msg.senderId !== (userRole === "client" ? "client" : "freelancer")) {
              return { ...msg, isRead: true };
            }
            return msg;
          });

          setAllMessages(updatedMessages);
          saveMessages(updatedMessages);
        }
      }
    }
  }, [messages, isOpen, activeContact]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !newMessage.trim()) return;

    const chatId = getChatId(activeContact.id);

    const message: Message = {
      id: Date.now().toString(),
      senderId: userRole === "client" ? "client" : "freelancer",
      text: newMessage,
      timestamp: new Date(),
      isRead: false,
    };

    const updatedMessages = { ...allMessages };
    updatedMessages[chatId] = [...(updatedMessages[chatId] || []), message];

    setAllMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage("");
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] bg-background border rounded-lg shadow-lg flex flex-col z-50 overflow-hidden"
    >
      <div className="p-4 border-b flex items-center justify-between bg-primary/5">
        <h3 className="font-medium">Messages</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contacts list */}
        <div className="w-1/3 border-r overflow-y-auto">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 hover:bg-muted cursor-pointer ${
                  activeContact?.id === contact.id ? "bg-muted" : ""
                }`}
                onClick={() => setActiveContact(contact)}
              >
                <div className="flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-2 truncate flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{contact.name}</span>
                      {(contact.unreadCount ?? 0) > 0 && (
                        <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">No contacts yet</div>
          )}
        </div>

        {/* Chat area */}
        {activeContact ? (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 flex ${
                      message.senderId === (userRole === "client" ? "client" : "freelancer")
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {message.senderId !== (userRole === "client" ? "client" : "freelancer") && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`p-3 rounded-lg ${
                          message.senderId === (userRole === "client" ? "client" : "freelancer")
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}