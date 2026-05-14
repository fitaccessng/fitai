import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/notificationService";
import { useWellnessStore } from "../services/wellnessStore";
import { pollAndDisplayNotifications } from "../services/browserNotificationService";
import { 
  LayoutDashboard, 
  UserCircle, 
  Utensils, 
  Dumbbell, 
  ClipboardList, 
  LogOut 
} from "lucide-react"; // Modern icon set

const navItems = [
  { to: "/app/dashboard", label: "Home", icon: <LayoutDashboard size={20} /> },
  { to: "/app/meals", label: "Meals", icon: <Utensils size={20} /> },
  { to: "/app/workouts", label: "Train", icon: <Dumbbell size={20} /> },
  { to: "/app/logs", label: "Logs", icon: <ClipboardList size={20} /> },
  { to: "/app/profile", label: "Profile", icon: <UserCircle size={20} /> },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const headerlessRoutes = new Set([
    "/app/onboarding",
    "/app/meals",
    "/app/workouts",
    "/app/profile",
    "/app/logs",
  ]);
  const isOnboardingRoute = location.pathname === "/app/onboarding";
  const hideShellHeader = headerlessRoutes.has(location.pathname);
  const hydrateWellness = useWellnessStore((state) => state.hydrate);
  const notificationPreferences = useWellnessStore((state) => state.notificationPreferences);
  const uiPreferences = useWellnessStore((state) => state.uiPreferences);

  useEffect(() => {
    hydrateWellness().catch(() => undefined);
  }, [hydrateWellness]);

  useEffect(() => {
    const theme = uiPreferences?.theme || "emerald";
    document.documentElement.dataset.theme = theme;
  }, [uiPreferences?.theme]);

  useEffect(() => {
    if (!notificationPreferences?.pushEnabled && !notificationPreferences?.emailEnabled) return undefined;

    const runNotificationSync = () => {
      if (notificationPreferences?.pushEnabled) {
        return pollAndDisplayNotifications();
      }
      return getNotifications();
    };

    runNotificationSync().catch(() => undefined);
    const interval = window.setInterval(() => {
      runNotificationSync().catch(() => undefined);
    }, 60000);

    return () => window.clearInterval(interval);
  }, [notificationPreferences?.emailEnabled, notificationPreferences?.pushEnabled]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F9F9] font-sans selection:bg-black/5">
      {!hideShellHeader ? (
        <header className="z-30 flex items-center justify-between bg-white/80 px-6 py-4 backdrop-blur-xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ember">FitAi</span>
            <h2 className="text-sm font-semibold text-ink">
              Hello, {user?.full_name?.split(" ")[0] || "there"}
            </h2>
          </div>

          <button
            onClick={logout}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-ink transition-active active:scale-90"
          >
            <LogOut size={18} />
          </button>
        </header>
      ) : null}

      <main className={`flex-1 overflow-y-auto ${isOnboardingRoute ? "" : "pb-20"}`}> 
        <div className={isOnboardingRoute ? "" : "mx-auto max-w-md px-5 py-4"}>
          <Outlet />
        </div>
      </main>

      {!hideShellHeader ? (
        <nav className="fixed bottom-6 left-1/2 z-50 flex w-[90%] -translate-x-1/2 items-center justify-between rounded-[32px] border border-white/20 bg-ink/95 px-4 py-3 shadow-2xl backdrop-blur-lg">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 px-3 py-1 transition-all duration-300 ${
                  isActive ? "text-ember" : "text-white/40 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "scale-100"}`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-medium tracking-wide">
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-ember shadow-[0_0_8px_#FF4D00]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      ) : null}

      {!isOnboardingRoute ? <div className="h-[env(safe-area-inset-bottom)] bg-white" /> : null}
    </div>
  );
}
