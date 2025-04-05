// Create a new file for the Chat component

import { useState, useEffect, useRef } from "react";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

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
}

export default function Chat({ isOpen, onClose }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: "other",
      text: "Hello! How can I help you with your project?",
      timestamp: new Date(Date.now() - 3600000),
      isRead: true,
    },
    {
      id: "2",
      senderId: "self",
      text: "I'm wondering if you could provide an update on the current status?",
      timestamp: new Date(Date.now() - 1800000),
      isRead: true,
    },
    {
      id: "3",
      senderId: "other",
      text: "Sure! I've completed the frontend implementation and I'm currently working on the backend API integration.",
      timestamp: new Date(Date.now() - 900000),
      isRead: true,
    },
  ]);
  
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "John Developer", unreadCount: 0 },
    { id: "2", name: "Alice Designer", unreadCount: 2 },
    { id: "3", name: "Bob Engineer", unreadCount: 0 },
  ]);
  
  const [activeContact, setActiveContact] = useState<Contact>(contacts[0]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        senderId: "self",
        text: newMessage,
        timestamp: new Date(),
        isRead: false,
      };
      
      setMessages([...messages, message]);
      setNewMessage("");
      
      // Simulate response after 1 second
      setTimeout(() => {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          senderId: "other",
          text: "Thanks for your message! I'll get back to you as soon as possible.",
          timestamp: new Date(),
          isRead: false,
        };
        
        setMessages(prev => [...prev, response]);
      }, 1000);
    }
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
          {contacts.map(contact => (
            <div
              key={contact.id}
              className={`p-3 hover:bg-muted cursor-pointer ${
                activeContact.id === contact.id ? "bg-muted" : ""
              }`}
              onClick={() => setActiveContact(contact)}
            >
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-2 truncate flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {contact.name}
                    </span>
                    {contact.unreadCount ? (
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {contact.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.senderId === "self" ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.senderId !== "self" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{activeContact.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`p-3 rounded-lg ${
                      message.senderId === "self"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="border-t p-3 flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}