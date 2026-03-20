import { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useGetMe, useGetMyCouple, useGetChatMessages } from "@workspace/api-client-react";
import { Send, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ChatPage() {
  const { data: user } = useGetMe();
  const { data: couple } = useGetMyCouple({ query: { enabled: !!user?.isPaired } });
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  // Initial fetch using React Query
  const { data: initialMessagesData, isLoading } = useGetChatMessages({
    query: {
      enabled: !!user?.isPaired,
    }
  });

  useEffect(() => {
    if (initialMessagesData?.messages) {
      // API returns newest first typically, or oldest first. Let's assume oldest first or sort just in case.
      const sorted = [...initialMessagesData.messages].sort((a, b) => a.id - b.id);
      setMessages(sorted);
    }
  }, [initialMessagesData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling
  useEffect(() => {
    if (!user?.isPaired) return;

    const pollInterval = setInterval(async () => {
      try {
        const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0;
        const res = await fetch(`/api/chat?since=${lastMessageId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(prev => {
              const newMsgs = data.messages.filter((m: any) => !prev.some(p => p.id === m.id));
              const combined = [...prev, ...newMsgs].sort((a, b) => a.id - b.id);
              return combined;
            });
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [user?.isPaired, messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      // Optimistic update
      const tempId = Date.now();
      setMessages(prev => [...prev, {
        id: tempId,
        text: textToSend,
        senderId: user?.id,
        senderName: user?.displayName,
        isFromMe: true,
        sentAt: new Date().toISOString()
      }]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });
      
      if (!res.ok) {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Send error", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AppLayout showNav={true}>
      <div className="flex flex-col h-[calc(100vh-140px)] w-full">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border/50 mx--6 px-6 -mt-12 pt-12 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">
              {couple?.partnerName ? `💬 ${couple.partnerName}` : "💬 Chat"}
            </h2>
            <p className="text-xs text-muted-foreground">Always connected ❤️</p>
          </div>
        </div>

        {/* Messages Area */}
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
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isFromMe = msg.isFromMe;
                const showSender = !isFromMe && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col w-full",
                      isFromMe ? "items-end" : "items-start"
                    )}
                  >
                    {showSender && (
                      <span className="text-[10px] text-muted-foreground ml-1 mb-1 font-medium">
                        {msg.senderName}
                      </span>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 relative",
                      isFromMe 
                        ? "bg-primary text-primary-foreground rounded-br-sm shadow-md shadow-primary/20" 
                        : "bg-card text-card-foreground border border-border/50 rounded-bl-sm shadow-sm"
                    )}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className={cn(
                        "text-[9px] mt-1 block text-right opacity-80",
                        isFromMe ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {format(new Date(msg.sentAt), "HH:mm")}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="fixed bottom-[88px] left-0 right-0 z-30 px-6">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSend} className="flex items-center gap-2 bg-background/90 backdrop-blur-xl p-2 rounded-full border border-border shadow-lg shadow-black/5">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-transparent px-4 py-2 outline-none text-sm placeholder:text-muted-foreground/60"
              />
              <button 
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-50 transition-transform active:scale-95"
              >
                <Send className="w-4 h-4 ml-1" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}