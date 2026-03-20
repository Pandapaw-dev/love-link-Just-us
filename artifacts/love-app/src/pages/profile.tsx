import { useState } from "react";
import { useGetMe, useGetMyCouple } from "@workspace/api-client-react";
import { useAuthMutations } from "@/hooks/use-app-queries";
import { AppLayout } from "@/components/AppLayout";
import { User, LogOut, Clock, Heart, Copy, Check, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { data: user } = useGetMe();
  const { data: couple } = useGetMyCouple({ query: { enabled: !!user?.isPaired } });
  
  const { logout, updateMe } = useAuthMutations();
  
  const [copied, setCopied] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [time, setTime] = useState(user?.reminderTime || "09:00");

  const handleCopyPartnerId = () => {
    // We don't have the pairing code anymore once paired, but we can show something else or just their names.
    // Assuming the requirement meant showing the pair status.
    if (couple?.partnerUsername) {
      navigator.clipboard.writeText(couple.partnerUsername);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveTime = () => {
    updateMe.mutate({ data: { reminderTime: time } }, {
      onSuccess: () => setIsEditingTime(false)
    });
  };

  if (!user) return null;

  return (
    <AppLayout>
      <header className="mb-8 mt-2">
        <h1 className="text-3xl font-display font-bold text-foreground">Profile</h1>
      </header>

      <div className="space-y-6">
        {/* User Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2rem] p-6 flex items-center gap-5"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{user.displayName}</h2>
            <p className="text-muted-foreground text-sm">@{user.username}</p>
          </div>
        </motion.div>

        {/* Couple Card */}
        {couple && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-primary to-accent rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
          >
            <Heart className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 opacity-90">
                <Heart className="w-4 h-4 fill-white" />
                <span className="text-sm font-semibold uppercase tracking-wider">Paired With</span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{couple.partnerName}</h2>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span>@{couple.partnerUsername}</span>
                <button 
                  onClick={handleCopyPartnerId}
                  className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs text-white/60 mt-4">
                Together since {new Date(couple.pairedAt).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        )}

        {/* Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[2rem] p-2"
        >
          <div className="p-4 flex items-center gap-4 border-b border-border/50">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Daily Reminder</p>
              {isEditingTime ? (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-white border border-border rounded-lg px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleSaveTime}
                    disabled={updateMe.isPending}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{user.reminderTime || "Not set"}</p>
              )}
            </div>
            {!isEditingTime && (
              <button 
                onClick={() => setIsEditingTime(true)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-muted-foreground"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>

          <button 
            onClick={() => logout.mutate()}
            className="w-full p-4 flex items-center gap-4 hover:bg-destructive/5 transition-colors rounded-[1.5rem] group"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-destructive">Sign Out</p>
            </div>
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
