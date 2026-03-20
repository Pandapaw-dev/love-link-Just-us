import { useState, useEffect } from "react";
import { 
  useGetMe, 
  useGetMyCouple, 
  useGetTodayCheckin, 
  useGetStreak,
  useGetNotificationStatus
} from "@workspace/api-client-react";
import { useActionMutations } from "@/hooks/use-app-queries";
import { AppLayout } from "@/components/AppLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Flame, BellRing, Smile, Meh, Frown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data: user } = useGetMe();
  const { data: couple } = useGetMyCouple({ query: { enabled: !!user?.isPaired } });
  const { data: checkin } = useGetTodayCheckin({ query: { enabled: !!user?.isPaired } });
  const { data: streak } = useGetStreak({ query: { enabled: !!user?.isPaired } });
  const { data: notifications } = useGetNotificationStatus({ query: { enabled: !!user?.isPaired, refetchInterval: 10000 } });
  
  const { doCheckin, sendMissYou, setMood } = useActionMutations();
  
  const [showHeartPoppers, setShowHeartPoppers] = useState(false);

  const handleCheckin = () => {
    if (checkin?.myCheckin) return;
    setShowHeartPoppers(true);
    doCheckin.mutate(undefined, {
      onSettled: () => setTimeout(() => setShowHeartPoppers(false), 2000)
    });
  };

  const handleMissYou = () => {
    sendMissYou.mutate();
    // Optimistic UI feedback
  };

  if (!user || !couple) return <AppLayout><div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div></AppLayout>;

  return (
    <AppLayout>
      {/* Header */}
      <header className="mb-10 text-center mt-4">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md shadow-sm border border-white/40 mb-4"
        >
          <span className="font-medium text-foreground">{user.displayName}</span>
          <Heart className="w-4 h-4 text-primary fill-primary/50" />
          <span className="font-medium text-foreground">{couple.partnerName}</span>
        </motion.div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          {checkin?.bothDone ? "Love is in the air ✨" : "Good morning, love."}
        </h1>
      </header>

      {/* Miss You Notification Banner */}
      <AnimatePresence>
        {notifications?.partnerMissesYou && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-4 border-primary rounded-r-2xl p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-primary animate-bounce" />
            </div>
            <div>
              <p className="font-medium text-foreground">{couple.partnerName} misses you! 🥺</p>
              <p className="text-sm text-muted-foreground">Why not send a message?</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Heart Check-in */}
      <section className="flex flex-col items-center justify-center my-12 relative">
        {/* Floating background hearts when checked in */}
        {showHeartPoppers && (
          <div className="absolute inset-0 pointer-events-none z-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0, x: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 0, 
                  y: -150 - Math.random() * 100, 
                  x: (Math.random() - 0.5) * 200,
                  scale: 1.5
                }}
                transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
                className="absolute top-1/2 left-1/2"
              >
                <Heart className="w-8 h-8 text-primary fill-primary" />
              </motion.div>
            ))}
          </div>
        )}

        <motion.button
          onClick={handleCheckin}
          disabled={checkin?.myCheckin || doCheckin.isPending}
          whileHover={!checkin?.myCheckin ? { scale: 1.05 } : {}}
          whileTap={!checkin?.myCheckin ? { scale: 0.95 } : {}}
          className={cn(
            "relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 z-10",
            checkin?.myCheckin 
              ? checkin?.bothDone 
                ? "bg-gradient-to-tr from-primary to-accent heart-glow-active" 
                : "bg-white shadow-xl shadow-primary/10 border-4 border-primary/20"
              : "bg-white shadow-2xl shadow-primary/20 heart-glow group cursor-pointer"
          )}
        >
          {/* Subtle noise texture */}
          <div 
            className="absolute inset-0 rounded-full opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/heart-texture.png)`, backgroundSize: 'cover' }}
          />

          <Heart 
            className={cn(
              "w-20 h-20 transition-all duration-700",
              checkin?.myCheckin
                ? checkin?.bothDone ? "text-white fill-white" : "text-primary fill-primary/30"
                : "text-primary fill-primary/10 group-hover:fill-primary/30"
            )} 
          />
          
          {!checkin?.myCheckin && (
            <span className="absolute bottom-8 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Tap to say it
            </span>
          )}
        </motion.button>
        
        <p className="mt-8 text-center text-muted-foreground font-medium h-6">
          {checkin?.myCheckin 
            ? checkin?.bothDone 
              ? "You both said 'I love you' today ❤️" 
              : "You said it! Waiting for them..." 
            : "Say 'I love you' today"}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Streak Card */}
        <div className="glass-card rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-3">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-3xl font-display font-bold text-foreground mb-1">
            {streak?.currentStreak || 0}
          </p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Day Streak</p>
          <p className="text-[10px] text-muted-foreground/70 mt-2">Best: {streak?.longestStreak || 0}</p>
        </div>

        {/* Miss You Card */}
        <button 
          onClick={handleMissYou}
          disabled={sendMissYou.isPending}
          className="glass-card rounded-[1.5rem] p-5 flex flex-col items-center justify-center text-center hover:bg-white/80 transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <p className="text-base font-bold text-foreground mb-1 leading-tight">
            I miss<br/>you
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-2">Send a nudge</p>
        </button>
      </div>

      {/* Mood Section */}
      <section className="glass-card rounded-[1.5rem] p-6 mb-8">
        <h3 className="font-semibold text-foreground mb-4">How are you feeling?</h3>
        <div className="flex justify-between gap-3">
          {[
            { id: "happy", icon: Smile, color: "text-green-500", bg: "bg-green-100 hover:bg-green-200 dark:bg-green-950 dark:hover:bg-green-900" },
            { id: "neutral", icon: Meh, color: "text-blue-500", bg: "bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900" },
            { id: "sad", icon: Frown, color: "text-purple-500", bg: "bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 dark:hover:bg-purple-900" }
          ].map((mood) => {
            const Icon = mood.icon;
            const isSelected = notifications?.myMood === mood.id;
            
            return (
              <button
                key={mood.id}
                onClick={() => setMood.mutate({ data: { mood: mood.id as any } })}
                className={cn(
                  "flex-1 py-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300",
                  mood.bg,
                  isSelected ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-105 shadow-md" : "opacity-70 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
                )}
              >
                <Icon className={cn("w-8 h-8 mb-2", mood.color)} />
                <span className="text-xs font-medium capitalize text-foreground/80">{mood.id}</span>
              </button>
            );
          })}
        </div>
        
        {notifications?.partnerMood && (
          <div className="mt-6 p-4 rounded-xl bg-secondary/50 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">{couple.partnerName}</span> is feeling {notifications.partnerMood} today.
            </p>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
