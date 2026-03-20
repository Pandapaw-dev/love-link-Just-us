import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthMutations } from "@/hooks/use-app-queries";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
});

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuthMutations();
  const [, setLocation] = useLocation();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
    defaultValues: {
      username: "",
      password: "",
      displayName: "",
    },
  });

  const onSubmit = (data: z.infer<typeof registerSchema>) => {
    if (isLogin) {
      login.mutate({ data: { username: data.username, password: data.password } }, {
        onSuccess: () => setLocation("/")
      });
    } else {
      register.mutate({ data }, {
        onSuccess: () => setLocation("/onboarding")
      });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Romantic gradient background" 
          className="w-full h-full object-cover opacity-60 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
      </div>

      <div className="w-full max-w-md px-6 py-12 z-20 flex flex-col items-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 1 }}
          className="w-20 h-20 bg-white/40 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 rotate-3"
        >
          <Heart className="w-10 h-10 text-primary fill-primary/20 animate-pulse" />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-display font-bold text-foreground mb-2">Us.</h1>
          <p className="text-muted-foreground text-lg">Your private space for love.</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full glass-card rounded-[2.5rem] p-8 relative overflow-hidden"
        >
          {/* Tab Switcher */}
          <div className="flex bg-secondary/50 rounded-2xl p-1 mb-8 relative">
            <button
              type="button"
              onClick={() => { setIsLogin(true); form.reset(); }}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-xl z-10 transition-colors",
                isLogin ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); form.reset(); }}
              className={cn(
                "flex-1 py-3 text-sm font-semibold rounded-xl z-10 transition-colors",
                !isLogin ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create Account
            </button>
            
            <motion.div 
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-xl z-0 shadow-lg shadow-primary/25"
              animate={{ left: isLogin ? "4px" : "calc(50%)" }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: "auto", scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-foreground mb-2 ml-1">What should your partner call you?</label>
                  <input
                    {...form.register("displayName")}
                    className="w-full px-5 py-4 bg-white/50 border border-white/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-muted-foreground/60"
                    placeholder="E.g. Honey, Babe, Alex"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-destructive text-xs mt-2 ml-1">{form.formState.errors.displayName.message}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 ml-1">Username</label>
              <input
                {...form.register("username")}
                autoCapitalize="none"
                autoComplete="off"
                className="w-full px-5 py-4 bg-white/50 border border-white/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-muted-foreground/60"
                placeholder="Choose a unique username"
              />
              {form.formState.errors.username && (
                <p className="text-destructive text-xs mt-2 ml-1">{form.formState.errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2 ml-1">Password</label>
              <input
                type="password"
                {...form.register("password")}
                className="w-full px-5 py-4 bg-white/50 border border-white/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-muted-foreground/60"
                placeholder="••••••••"
              />
              {form.formState.errors.password && (
                <p className="text-destructive text-xs mt-2 ml-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            {(login.error || register.error) && (
              <p className="text-destructive text-sm text-center bg-destructive/10 py-3 rounded-xl border border-destructive/20">
                {login.error?.error || register.error?.error || "An error occurred"}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending || register.isPending}
              className="w-full mt-8 py-4 px-6 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {(login.isPending || register.isPending) ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? "Sign In to Us" : "Start Our Journey"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
