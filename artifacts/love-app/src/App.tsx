import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGetMe } from "@workspace/api-client-react";

import LoginPage from "./pages/login";
import OnboardingPage from "./pages/onboarding";
import HomePage from "./pages/home";
import TimelinePage from "./pages/timeline";
import ProfilePage from "./pages/profile";
import ChatPage from "./pages/chat";
import NotFound from "./pages/not-found";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Don't retry on 401s
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function AuthGuard({ children, requirePaired = true }: { children: React.ReactNode, requirePaired?: boolean }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, error } = useGetMe();

  useEffect(() => {
    if (!isLoading) {
      if (error || !user) {
        if (location !== '/login') setLocation('/login');
      } else if (!user.isPaired && location !== '/onboarding') {
        setLocation('/onboarding');
      } else if (user.isPaired && (location === '/login' || location === '/onboarding')) {
        setLocation('/');
      }
    }
  }, [user, isLoading, error, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Prevent rendering protected content while redirecting
  if (!user || (requirePaired && !user.isPaired)) {
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <LoginPage />
      </Route>
      <Route path="/onboarding">
        <AuthGuard requirePaired={false}>
          <OnboardingPage />
        </AuthGuard>
      </Route>
      <Route path="/">
        <AuthGuard>
          <HomePage />
        </AuthGuard>
      </Route>
      <Route path="/timeline">
        <AuthGuard>
          <TimelinePage />
        </AuthGuard>
      </Route>
      <Route path="/chat">
        <AuthGuard>
          <ChatPage />
        </AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard>
          <ProfilePage />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
