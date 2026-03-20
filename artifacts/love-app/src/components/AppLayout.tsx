import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { motion } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto bg-background relative overflow-x-hidden">
      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 pt-12 pb-32 min-h-full"
      >
        {children}
      </motion.main>
      {showNav && <BottomNav />}
    </div>
  );
}
