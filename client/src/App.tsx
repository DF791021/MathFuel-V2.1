import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TeacherPortal from "./pages/TeacherPortal";
import LeaderboardPage from "./pages/LeaderboardPage";
import VerifyCertificate from "./pages/VerifyCertificate";
import TemplateLibrary from "./pages/TemplateLibrary";
import { NutritionRoulette } from "./pages/NutritionRoulette";
import GameAnalyticsDashboard from "./pages/GameAnalyticsDashboard";
import StudentGoalPortal from "./pages/StudentGoalPortal";
import { TrialExpirationBanner } from "./components/TrialExpirationBanner";
import { useTrialExpiration } from "./hooks/useTrialExpiration";
import { useAuth } from "./_core/hooks/useAuth";
import { Toaster } from "sonner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/teacher" component={TeacherPortal} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route path="/templates" component={TemplateLibrary} />
      <Route path="/roulette" component={NutritionRoulette} />
      <Route path="/analytics" component={GameAnalyticsDashboard} />
      <Route path="/goals" component={StudentGoalPortal} />
      <Route path="/verify/:id" component={VerifyCertificate} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { user } = useAuth();
  const schoolCode = typeof window !== 'undefined' ? localStorage.getItem('schoolCode') || '' : '';
  const { isExpired, daysRemaining, trialEndDate } = useTrialExpiration(schoolCode);
  const [bannerDismissed, setBannerDismissed] = React.useState(false);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {!bannerDismissed && (
            <TrialExpirationBanner
              isExpired={isExpired}
              daysRemaining={daysRemaining}
              trialEndDate={trialEndDate || undefined}
              onDismiss={() => setBannerDismissed(true)}
              onUpgradeClick={() => {
                window.location.href = '/contact-sales';
              }}
            />
          )}
          <Toaster richColors position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
