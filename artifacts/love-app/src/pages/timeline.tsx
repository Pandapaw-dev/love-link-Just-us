import { useState } from "react";
import { useGetMe, useGetMessages } from "@workspace/api-client-react";
import { useActionMutations } from "@/hooks/use-app-queries";
import { AppLayout } from "@/components/AppLayout";
import { format, isToday, isYesterday } from "date-fns";
import { Send, MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TimelinePage() {
  const { data: user } = useGetMe();
  const { data: messagesData, isLoading } = useGetMessages({ limit: 50 }, { query: { enabled: !!user?.isPaired } });
  const { sendMessage } = useActionMutations();
  
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    sendMessage.mutate({ data: { text: text.trim() } }, {
      onSuccess: () => {
        setText("");
        setIsComposing(false);
      }
    });
  };

  const messages = messagesData?.messages || [];

  // Determine if user already sent a message today
  const hasSentToday = messages.some(m => m.isFromMe && isToday(new Date(m.sentAt)));

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Group messages by day
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateLabel = formatDateLabel(msg.sentAt);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  return (
    <AppLayout>
      <header className="mb-8 mt-2 sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 border-b border-border/50">
        <h1 className="text-3xl font-display font-bold text-foreground">Timeline</h1>
        <p className="text-muted-foreground text-sm mt-1">Your shared memory jar.</p>
      </header>

      {/* Compose Section */}
      <AnimatePresence>
        {!hasSentToday && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="mb-8"
          >
            {!isComposing ? (
              <button 
                onClick={() => setIsComposing(true)}
                className="w-full glass-card p-6 rounded-2xl border-dashed border-2 border-primary/20 flex flex-col items-center justify-center text-muted-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all group"
              >
                <MessageSquareHeart className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="font-medium">Write today's message</span>
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card p-5 rounded-2xl shadow-lg shadow-primary/10">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  I love you because...
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={500}
                  rows={4}
                  autoFocus
                  placeholder="Share a thought, a memory, or an appreciation..."
                  className="w-full bg-white/50 border border-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl p-4 outline-none resize-none transition-all text-foreground placeholder:text-muted-foreground/50"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-muted-foreground font-medium">
                    {text.length}/500
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsComposing(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!text.trim() || sendMessage.isPending}
                      className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-md shadow-primary/20 hover:shadow-lg disabled:opacity-50 flex items-center gap-2 transition-all"
                    >
                      {sendMessage.isPending ? "Sending..." : "Send"}
                      {!sendMessage.isPending && <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline Feed */}
      <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {Object.entries(groupedMessages).map(([dateLabel, dayMessages]) => (
          <div key={dateLabel} className="relative z-10">
            <div className="flex items-center justify-center mb-6 sticky top-24 z-10">
              <span className="px-4 py-1.5 bg-background border border-border rounded-full text-xs font-bold text-muted-foreground shadow-sm uppercase tracking-wider">
                {dateLabel}
              </span>
            </div>
            
            <div className="space-y-6">
              {dayMessages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  className={cn(
                    "flex flex-col relative",
                    msg.isFromMe ? "items-end pl-12" : "items-start pr-12"
                  )}
                >
                  {/* Timeline Node */}
                  <div className={cn(
                    "absolute top-5 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                    msg.isFromMe 
                      ? "right-0 translate-x-[21px] md:right-1/2 md:translate-x-1.5 bg-primary" 
                      : "left-0 translate-x-[15px] md:left-1/2 md:-translate-x-1.5 bg-secondary border-primary/20"
                  )} />

                  <div className={cn(
                    "max-w-[85%] rounded-[1.5rem] p-5 shadow-sm relative group transition-all duration-300 hover:shadow-md",
                    msg.isFromMe 
                      ? "bg-primary text-primary-foreground rounded-tr-sm" 
                      : "bg-white border border-border/50 text-foreground rounded-tl-sm"
                  )}>
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px]">
                        • {format(new Date(msg.sentAt), "h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-20 bg-white/40 rounded-3xl border border-dashed border-border mt-8">
            <MessageSquareHeart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No messages yet.</p>
            <p className="text-sm text-muted-foreground/70">Be the first to share a thought today.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
