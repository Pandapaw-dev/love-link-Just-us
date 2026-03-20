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
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.12]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="app-doodle-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 20 30 C 20 20, 35 20, 35 30 C 35 40, 20 50, 20 50 C 20 50, 5 40, 5 30 C 5 20, 20 20, 20 30 Z" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" transform="scale(0.5) translate(20, 20)" />
              <path d="M 50 10 L 53 20 L 63 20 L 55 26 L 58 36 L 50 30 L 42 36 L 45 26 L 37 20 L 47 20 Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-primary" transform="scale(0.4) translate(140, 40)" />
              <path d="M 80 70 C 80 60, 90 60, 90 70 C 90 80, 75 80, 75 65 C 75 50, 95 50, 95 75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" transform="scale(0.5) translate(80, 80)" />
              <circle cx="20" cy="80" r="1.5" fill="currentColor" className="text-primary" />
              <path d="M 70 20 L 76 26 M 76 20 L 70 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" />
              <path d="M 40 80 L 46 80 M 43 77 L 43 83" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-primary" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#app-doodle-pattern)" />
        </svg>
      </div>

      <motion.main 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="px-6 pt-12 pb-32 min-h-full relative z-10"
      >
        {children}
      </motion.main>
      {showNav && <BottomNav />}
    </div>
  );
}