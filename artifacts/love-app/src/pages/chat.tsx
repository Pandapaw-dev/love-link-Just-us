import { useState, useEffect, useRef, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useGetMe, useGetMyCouple, useGetChatMessages } from "@workspace/api-client-react";
import { Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useSocket } from "@/hooks/useSocket";

type Message = {
  id: number;
  senderId: number;
  senderName: string;
  text: string;
  sentAt: string;
  readAt: string | null;
  isFromMe: boolean;
};

export default function ChatPage() {
  const { data: user } = useGetMe();
  const { data: couple } = useGetMyCouple({ query: { enabled: !!user?.isPaired } });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [seenByPartner, setSeenByPartner] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const socketRef = useSocket(!!user?.isPaired);

  const { data: initialMessagesData, isLoading } = useGetChatMessages({
    query: { enabled: !!user?.isPaired },
  });

  useEffect(() => {
    if (initialMessagesData?.messages) {
      const sorted = [...(initialMessagesData.messages as Message[])].sort((a, b) => a.id - b.id);
      setMessages(sorted);
      const anyRead = sorted.some(m => m.isFromMe && m.readAt);
      if (anyRead) setSeenByPartner(true);
    }
  }, [initialMessagesData]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user?.isPaired) return;

    const handleNewMessage = (data: {
      forSender: Message;
      forReceiver: Message;
      senderId: number;
    }) => {
      const isFromMe = data.senderId === user?.id;
      const msg = isFromMe ? data.forSender : data.forReceiver;

      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (!isFromMe) {
        socket.emit("mark_seen");
      }
    };

    const handlePartnerTyping = ({ typing }: { typing: boolean }) => {
      setPartnerTyping(typing);
    };

    const handleMessageSeen = () => {
      setSeenByPartner(true);
      setMessages(prev =>
        prev.map(m => (m.isFromMe && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m))
      );
    };

    socket.on("new_message", handleNewMessage);
    socket.on("partner_typing", handlePartnerTyping);
    socket.on("message_seen", handleMessageSeen);

    socket.emit("mark_seen");

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("partner_typing", handlePartnerTyping);
      socket.off("message_seen", handleMessageSeen);
    };
  }, [socketRef, user?.isPaired, user?.id]);

  const emitTypingStop = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return;
    isTypingRef.current = false;
    socket.emit("typing_stop");
  }, [socketRef]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
      const socket = socketRef.current;
      if (!socket) return;

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socket.emit("typing_start");
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTypingStop();
      }, 2000);
    },
    [socketRef, emitTypingStop],
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);
    emitTypingStop();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setSeenByPartner(false);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend }),
      });
    } catch (err) {
      console.error("Send error", err);
    } finally {
      setIsSending(false);
    }
  };

  const lastMyMessageIdx = messages.reduce(
    (last, msg, i) => (msg.isFromMe ? i : last),
    -1,
  );

  return (
    <AppLayout showNav={true}>
      <div className="flex flex-col h-[calc(100vh-140px)] w-full">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50 mx--6 px-6 -mt-12 pt-12 mb-4">
          <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">
              {couple?.partnerName ? `💬 ${couple.partnerName}` : "💬 Chat"}
            </h2>
            <AnimatePresence mode="wait">
              {partnerTyping ? (
                <motion.p
                  key="typing"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-xs text-primary font-medium"
                >
                  typing…
                </motion.p>
              ) : (
                <motion.p
                  key="connected"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-xs text-muted-foreground"
                >
                  Always connected ❤️
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-20 px-2 hide-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">Send your first message ❤️</p>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {messages.map((msg, idx) => {
                const isFromMe = msg.isFromMe;
                const prevMsg = messages[idx - 1];
                const showSender =
                  !isFromMe && (!prevMsg || prevMsg.senderId !== msg.senderId);
                const isLastFromMe = isFromMe && idx === lastMyMessageIdx;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={cn(
                      "flex flex-col w-full",
                      isFromMe ? "items-end" : "items-start",
                      idx > 0 && prevMsg?.senderId === msg.senderId ? "mt-0.5" : "mt-3",
                    )}
                  >
                    {showSender && (
                      <span className="text-[10px] text-muted-foreground ml-1 mb-1 font-medium">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-4 py-2",
                        isFromMe
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20"
                          : "bg-card text-card-foreground border border-border/50 rounded-bl-sm shadow-sm",
                      )}
                    >
                      <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                      <span
                        className={cn(
                          "text-[9px] mt-0.5 block text-right opacity-70",
                          isFromMe ? "text-primary-foreground" : "text-muted-foreground",
                        )}
                      >
                        {format(new Date(msg.sentAt), "HH:mm")}
                      </span>
                    </div>

                    {isLastFromMe && (
                      <AnimatePresence>
                        {seenByPartner ? (
                          <motion.span
                            key="seen"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[9px] text-primary font-medium mt-0.5 mr-1"
                          >
                            Seen ✓
                          </motion.span>
                        ) : (
                          <motion.span
                            key="delivered"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[9px] text-muted-foreground mt-0.5 mr-1"
                          >
                            Sent
                          </motion.span>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.div>
                );
              })}

              {/* Typing bubble */}
              <AnimatePresence>
                {partnerTyping && (
                  <motion.div
                    key="typing-bubble"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start mt-3"
                  >
                    <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(i => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
                            animate={{ y: [0, -4, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="fixed bottom-[88px] left-0 right-0 z-30 px-6">
          <div className="max-w-md mx-auto">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 bg-background/90 backdrop-blur-xl p-2 rounded-full border border-border shadow-lg shadow-black/5"
            >
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Message..."
                className="flex-1 bg-transparent px-4 py-2 outline-none text-sm placeholder:text-muted-foreground/60"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
