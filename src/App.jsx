import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import AuthGate from "./components/AuthGate";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LogsPage from "./pages/LogsPage";
import MealPlanPage from "./pages/MealPlanPage";
import NotificationsPage from "./pages/NotificationsPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import SignInPage from "./pages/SignInPage";
import WorkoutPage from "./pages/WorkoutPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SignInPage />} />
      <Route path="/auth" element={<SignInPage />} />
      <Route
        path="/app"
        element={
          <AuthGate>
            <AppLayout />
          </AuthGate>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="meals" element={<MealPlanPage />} />
        <Route path="workouts" element={<WorkoutPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}
