import { useState, useEffect } from "react";
import { useGetMe, useGeneratePairingCode } from "@workspace/api-client-react";
import { useCoupleMutations } from "@/hooks/use-app-queries";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Copy, Check, HeartHandshake, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";

export default function OnboardingPage() {
  const { data: user, isLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"choose" | "generate" | "enter">("choose");
  
  const generateCode = useGeneratePairingCode();
  const { pair } = useCoupleMutations();
  
  const [partnerCode, setPartnerCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Redirect if already paired
  useEffect(() => {
    if (user?.isPaired) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (isLoading || user?.isPaired) return null;

  const handleCopy = () => {
    if (generateCode.data?.code) {
      navigator.clipboard.writeText(generateCode.data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerate = () => {
    setMode("generate");
    generateCode.mutate();
  };

  const handlePair = () => {
    if (!partnerCode.trim()) return;
    pair.mutate({ data: { code: partnerCode.trim().toUpperCase() } });
  };

  return (
    <AppLayout showNav={false}>
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8"
        >
          <HeartHandshake className="w-12 h-12 text-primary" />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">
            Welcome, {user?.displayName}
          </h1>
          <p className="text-muted-foreground px-4">
            "Just us" is a private space for just two people. Let's connect you with your partner.
          </p>
        </motion.div>

        <motion.div 
          className="w-full glass-card p-8 rounded-[2rem]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {mode === "choose" && (
            <div className="space-y-4">
              <button 
                onClick={handleGenerate}
                className="w-full p-6 bg-white/50 hover:bg-white/80 border border-primary/10 rounded-2xl flex flex-col items-center text-center transition-all group"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="font-bold text-lg mb-1">I need a code</h3>
                <p className="text-sm text-muted-foreground">Generate a pairing code to share with your partner</p>
              </button>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">or</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <button 
                onClick={() => setMode("enter")}
                className="w-full p-6 bg-primary text-primary-foreground rounded-2xl flex flex-col items-center text-center shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="font-bold text-lg mb-1">I have a code</h3>
                <p className="text-sm text-primary-foreground/80">Enter the code your partner sent you</p>
              </button>
            </div>
          )}

          {mode === "generate" && (
            <div className="flex flex-col items-center text-center">
              <p className="text-muted-foreground mb-6">Send this unique code to your partner so they can join you.</p>
              
              {generateCode.isPending ? (
                <div className="w-full h-32 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="w-full bg-secondary/50 border border-primary/20 rounded-2xl p-8 mb-6 relative group">
                    <span className="text-5xl font-mono tracking-widest font-bold text-primary">
                      {generateCode.data?.code}
                    </span>
                    <button 
                      onClick={handleCopy}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-8">
                    Waiting for your partner to enter this code...
                  </p>
                  
                  <button 
                    onClick={() => setMode("choose")}
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    Go back
                  </button>
                </>
              )}
            </div>
          )}

          {mode === "enter" && (
            <div className="flex flex-col">
              <p className="text-muted-foreground text-center mb-6">Enter the code your partner shared with you.</p>
              
              <input
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                className="w-full text-center text-3xl tracking-[0.5em] font-mono font-bold uppercase px-6 py-6 bg-white/50 border-2 border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-muted-foreground/30 mb-2"
                maxLength={6}
              />
              
              {pair.error && (
                <p className="text-destructive text-sm text-center mt-2 bg-destructive/10 py-2 rounded-lg">
                  {pair.error.error}
                </p>
              )}

              <button
                onClick={handlePair}
                disabled={partnerCode.length < 4 || pair.isPending}
                className="w-full mt-8 py-4 px-6 bg-primary text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 transition-all"
              >
                {pair.isPending ? "Connecting..." : "Connect Profiles"}
                {!pair.isPending && <ArrowRight className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={() => setMode("choose")}
                className="text-sm text-muted-foreground font-medium hover:text-primary mt-6 text-center w-full"
              >
                Go back
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
