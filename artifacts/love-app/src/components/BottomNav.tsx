import { Link, useLocation } from "wouter";
import { Home, MessageSquareHeart, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Us" },
    { path: "/timeline", icon: MessageSquareHeart, label: "Timeline" },
    { path: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <nav className="glass rounded-[2rem] px-2 py-2 flex items-center justify-between shadow-xl shadow-primary/5">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path} className="relative flex-1">
                <div className="flex flex-col items-center justify-center w-full py-3 cursor-pointer group">
                  <div className={cn(
                    "relative z-10 transition-colors duration-300",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                  )}>
                    <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/10 rounded-3xl -z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <span className={cn(
                    "text-[10px] font-medium mt-1 transition-all duration-300",
                    isActive ? "text-primary opacity-100 translate-y-0" : "text-muted-foreground opacity-0 translate-y-2"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
