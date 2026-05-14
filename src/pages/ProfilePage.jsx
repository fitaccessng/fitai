import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Award,
  Bell,
  Camera,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Dumbbell,
  Flame,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Mail,
  Moon,
  Palette,
  Ruler,
  Scale,
  Settings2,
  Shield,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  UserCircle2,
  Users,
  Weight,
  X,
  Zap,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../services/profileService";
import { pollAndDisplayNotifications, requestBrowserNotificationPermission } from "../services/browserNotificationService";
import { sendTestNotification } from "../services/notificationService";
import { useWellnessStore } from "../services/wellnessStore";

const initialDraft = {
  full_name: "",
  weight: "",
  age: "",
  height: "",
  gender: "",
  target_weight: "",
  desired_body_type: "",
  daily_workout_minutes: "",
  dietary_habits: "",
  has_gym_access: false,
};

const statCardColors = {
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  blue: "bg-blue-50 text-blue-600",
  rose: "bg-rose-50 text-rose-600",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const sleepHours = useWellnessStore((state) => state.sleepHours);
  const recoveryNotes = useWellnessStore((state) => state.recoveryNotes);
  const fitnessLevel = useWellnessStore((state) => state.fitnessLevel);
  const measurements = useWellnessStore((state) => state.measurements);
  const streakDays = useWellnessStore((state) => state.streakDays);
  const notificationPreferences = useWellnessStore((state) => state.notificationPreferences);
  const uiPreferences = useWellnessStore((state) => state.uiPreferences);
  const setNotificationPreferences = useWellnessStore((state) => state.setNotificationPreferences);
  const setTheme = useWellnessStore((state) => state.setTheme);

  const [activeTab, setActiveTab] = useState("profile");
  const [activeSheet, setActiveSheet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(initialDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");
  const [isTestingNotifications, setIsTestingNotifications] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");
      try {
        const data = await getProfile();
        if (!active) return;
        setProfile(data);
        setProfileDraft(createDraftFromProfile(data));
      } catch (err) {
        if (!active) return;
        setError(readErrorMessage(err, "Unable to load your profile right now."));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!successMsg && !error) return undefined;
    const timeout = window.setTimeout(() => {
      setSuccessMsg("");
      setError("");
    }, 3200);
    return () => window.clearTimeout(timeout);
  }, [error, successMsg]);

  const avatarInitials = useMemo(() => {
    const name = profile?.full_name?.trim() || user?.full_name?.trim();
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [profile?.full_name, user?.full_name]);

  const goalProgress = useMemo(() => {
    const start = Number(profile?.weight);
    const target = Number(profile?.target_weight);
    const current = Number(profile?.weight);

    if (![start, target, current].every(Number.isFinite) || start === target) {
      return 0;
    }

    const totalChange = Math.abs(start - target);
    const completedChange = Math.abs(start - current);
    return Math.max(0, Math.min(100, Math.round((completedChange / totalChange) * 100)));
  }, [profile?.target_weight, profile?.weight]);

  const proteinNeed = useMemo(() => {
    const weight = Number(profile?.weight);
    if (!Number.isFinite(weight) || weight <= 0) return "--";
    return Math.round(weight * 1.8);
  }, [profile?.weight]);

  const sheetTitle = useMemo(() => {
    switch (activeSheet) {
      case "overview":
        return "Profile Overview";
      case "basics":
        return "Personal Basics";
      case "body":
        return "Body Metrics";
      case "training":
        return "Training Setup";
      case "nutrition":
        return "Diet & Nutrition";
      case "notifications":
        return "Notification Settings";
      case "theme":
        return "Theme Accent";
      default:
        return "";
    }
  }, [activeSheet]);

  const handleDraftChange = (field, value) => {
    setProfileDraft((current) => ({ ...current, [field]: value }));
  };

  const handleProfileSave = async ({ closeSheet = false } = {}) => {
    setIsSaving(true);
    setError("");

    try {
      const payload = {
        full_name: profileDraft.full_name.trim() || null,
        weight: toNumberOrNull(profileDraft.weight),
        age: toNumberOrNull(profileDraft.age),
        height: toNumberOrNull(profileDraft.height),
        gender: profileDraft.gender || null,
        target_weight: toNumberOrNull(profileDraft.target_weight),
        desired_body_type: profileDraft.desired_body_type || null,
        daily_workout_minutes: toNumberOrNull(profileDraft.daily_workout_minutes),
        dietary_habits: profileDraft.dietary_habits.trim() || null,
        has_gym_access: Boolean(profileDraft.has_gym_access),
      };

      const updated = await updateProfile(payload);
      setProfile(updated);
      setProfileDraft(createDraftFromProfile(updated));
      setSuccessMsg("Profile updated successfully.");

      if (setUser && user) {
        setUser({
          ...user,
          full_name: updated.full_name,
          email: updated.email,
        });
      }

      if (closeSheet) {
        setActiveSheet(null);
      }
    } catch (err) {
      setError(readErrorMessage(err, "Failed to save your profile."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSheetOpen = (sheet) => {
    if (profile) {
      setProfileDraft(createDraftFromProfile(profile));
    }
    setActiveSheet(sheet);
  };

  const handleSheetClose = () => {
    if (profile) {
      setProfileDraft(createDraftFromProfile(profile));
    }
    setActiveSheet(null);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
      navigate("/login");
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm("WARNING: This will permanently delete all your data. Are you sure?")) {
      window.alert("Account deletion requested. Please contact support.");
    }
  };

  const handlePushToggle = async () => {
    const nextEnabled = !notificationPreferences.pushEnabled;

    if (nextEnabled) {
      const permission = await requestBrowserNotificationPermission();
      await setNotificationPreferences({
        pushEnabled: permission === "granted",
        pushPermission: permission,
      });

      if (permission !== "granted") {
        setError("Push notification permission was not granted.");
        return;
      }

      setSuccessMsg("Push notifications enabled.");
      return;
    }

    await setNotificationPreferences({
      pushEnabled: false,
      pushPermission: notificationPreferences.pushPermission,
    });
    setSuccessMsg("Push notifications disabled.");
  };

  const handleEmailToggle = async () => {
    const nextValue = !notificationPreferences.emailEnabled;
    await setNotificationPreferences({ emailEnabled: nextValue });
    setSuccessMsg(nextValue ? "Email notifications enabled." : "Email notifications disabled.");
  };

  const handleAchievementToggle = async () => {
    const nextValue = !notificationPreferences.achievementAlerts;
    await setNotificationPreferences({ achievementAlerts: nextValue });
    setSuccessMsg(nextValue ? "Achievement alerts enabled." : "Achievement alerts disabled.");
  };

  const handleSendTestNotification = async () => {
    setIsTestingNotifications(true);
    setError("");
    try {
      await sendTestNotification();
      await pollAndDisplayNotifications().catch(() => undefined);
      setSuccessMsg("Test notification sent.");
    } catch (err) {
      setError(readErrorMessage(err, "Unable to send a test notification."));
    } finally {
      setIsTestingNotifications(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-10 font-sans text-stone-800">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button onClick={() => navigate(-1)} className="rounded-xl p-2 transition-all hover:bg-stone-100">
            <ChevronLeft size={24} className="text-stone-600" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-stone-800">Profile</h1>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">Backend Connected</p>
          </div>
          <button onClick={() => handleSheetOpen("overview")} className="rounded-xl p-2 transition-all hover:bg-stone-100">
            <Info size={20} className="text-stone-400" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-5 pt-8">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-3xl font-black text-white shadow-lg">
                {avatarInitials}
              </div>
              <button className="absolute -bottom-1 -right-1 rounded-lg border border-stone-200 bg-white p-1.5 text-stone-700 shadow-md active:scale-90">
                <Camera size={14} />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-stone-800">{profile?.full_name || user?.full_name || "Your profile"}</h2>
                <button
                  onClick={() => handleSheetOpen("basics")}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 transition hover:bg-emerald-100"
                >
                  Edit
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="rounded bg-stone-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-stone-600">Member</div>
                <div className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-700">Verified</div>
              </div>
              <p className="mt-2 text-sm text-stone-500">{profile?.email || user?.email}</p>
            </div>
          </div>
        </section>

        <nav className="flex rounded-xl border border-stone-200 bg-stone-100 p-1.5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "profile" ? "border border-stone-200 bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <UserCircle2 size={14} /> Profile
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "settings" ? "border border-stone-200 bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Settings2 size={14} /> Settings
          </button>
        </nav>

        {(successMsg || error) && (
          <div
            className={`fixed bottom-10 left-1/2 z-50 -translate-x-1/2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-xl ${
              successMsg ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {successMsg || error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-36" />
            <SkeletonBlock className="h-48" />
          </div>
        ) : null}

        {!isLoading && activeTab === "profile" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Activity} label="BMI" value={formatStat(profile?.bmi, 1)} color="emerald" />
              <StatCard icon={Flame} label="Daily Cal" value={formatInteger(profile?.daily_calorie_needs)} color="orange" />
              <StatCard icon={Scale} label="Current" value={formatMetric(profile?.weight, "kg")} color="blue" />
              <StatCard icon={Target} label="Target" value={formatMetric(profile?.target_weight, "kg")} color="rose" />
            </div>

            <button
              onClick={() => handleSheetOpen("body")}
              className="w-full rounded-[2rem] border border-stone-200 bg-stone-50 p-6 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Goal Progress</p>
                  </div>
                  <h4 className="mt-1 text-lg font-black text-stone-800">{profile?.projected_goal_weeks ?? "--"} weeks remaining</h4>
                  <p className="mt-1 text-sm text-stone-500">Tap to adjust your measurements and target weight.</p>
                </div>
                <ChevronRight size={18} className="mt-1 text-stone-400" />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-emerald-500 shadow-inner transition-all" style={{ width: `${goalProgress || 12}%` }} />
              </div>
              <div className="mt-3 flex justify-between text-xs font-bold text-stone-600">
                <span>Current: {formatMetric(profile?.weight, "kg")}</span>
                <span>Target: {formatMetric(profile?.target_weight, "kg")}</span>
              </div>
            </button>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InteractivePanel
                title="Body Measurements"
                eyebrow="Tracked"
                icon={Ruler}
                onClick={() => handleSheetOpen("body")}
                rows={[
                  ["Weight", formatMetric(profile?.weight, "kg")],
                  ["Height", formatMetric(profile?.height, "cm")],
                  ["Age", formatMetric(profile?.age, "yrs")],
                  ["Gender", profile?.gender ? capitalize(profile.gender) : "--"],
                  ["Waist", formatMetric(measurements?.waist, "cm")],
                  ["Chest", formatMetric(measurements?.chest, "cm")],
                  ["Arm", formatMetric(measurements?.arm, "cm")],
                ]}
              />

              <div className="space-y-6">
                <InteractivePanel
                  title="Training Profile"
                  eyebrow="Adaptive"
                  icon={Zap}
                  onClick={() => handleSheetOpen("training")}
                  rows={[
                    ["Fitness Level", capitalize(fitnessLevel || "beginner")],
                    ["Daily Workout", formatMetric(profile?.daily_workout_minutes, "min")],
                    ["Gym Access", profile?.has_gym_access ? "Yes" : "Home Only"],
                    ["Physique Goal", profile?.desired_body_type ? prettyBodyType(profile.desired_body_type) : "Not set"],
                  ]}
                />

                <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Moon size={16} className="text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Sleep & Recovery</span>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-700">Average Sleep</span>
                    <span className="text-lg font-black text-stone-800">{sleepHours || 0}h</span>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.max(8, Math.min(100, Math.round(((sleepHours || 0) / 8) * 100)))}%` }}
                    />
                  </div>
                  <div className="rounded-xl border border-stone-100 bg-white p-3">
                    <p className="text-xs text-stone-600">{recoveryNotes || "No recovery notes recorded yet. Keep using logs to improve this view."}</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSheetOpen("nutrition")}
              className="w-full rounded-[2rem] border border-stone-200 bg-stone-50 p-6 text-left shadow-sm transition hover:border-amber-200 hover:bg-amber-50/40"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Coffee size={18} className="text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Diet & Nutrition</span>
                </div>
                <ChevronRight size={18} className="text-stone-400" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoTile label="Dietary Habits" value={profile?.dietary_habits || "No preferences set"} />
                <InfoTile label="Daily Calorie Need" value={`${formatInteger(profile?.daily_calorie_needs)} kcal`} />
                <InfoTile label="Protein Need" value={proteinNeed === "--" ? "--" : `~${proteinNeed} g/day`} />
              </div>
            </button>

            <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Momentum</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <AchievementBadge icon={Flame} title="Streak" desc={`${streakDays || 0} day rhythm`} color="orange" />
                <AchievementBadge icon={Sparkles} title="Recovery" desc={`${sleepHours || 0}h average sleep`} color="indigo" />
                <AchievementBadge icon={Target} title="Target" desc={`${profile?.projected_goal_weeks ?? "--"} week projection`} color="emerald" />
                <AchievementBadge icon={Dumbbell} title="Training" desc={`${profile?.daily_workout_minutes || 0} min/day`} color="purple" />
              </div>
            </div>
          </div>
        ) : null}

        {!isLoading && activeTab === "settings" ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="ml-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <Shield size={12} /> Account Security
              </p>
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <SettingsLink
                  icon={<UserCircle2 size={18} />}
                  label="Profile Information"
                  detail={`${profile?.full_name || "Your account"} • ${profile?.gender ? capitalize(profile.gender) : "Not set"}`}
                  onClick={() => handleSheetOpen("basics")}
                />
                <SettingsLink icon={<Mail size={18} />} label="Email Address" detail={profile?.email || user?.email || "user@example.com"} onClick={() => handleSheetOpen("overview")} />
                <SettingsLink icon={<Lock size={18} />} label="Change Password" detail="Update your password" onClick={() => window.alert("Password change is coming soon.")} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="ml-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <Bell size={12} /> Notifications
              </p>
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <SettingsLink icon={<Bell size={18} />} label="Push Notifications" detail={notificationPreferences.pushPermission === "granted" ? "Browser permission granted" : "Permission required"} toggle toggled={notificationPreferences.pushEnabled} onToggle={handlePushToggle} />
                <SettingsLink icon={<Mail size={18} />} label="Email Digest" detail="SMTP via Brevo relay" toggle toggled={notificationPreferences.emailEnabled} onToggle={handleEmailToggle} />
                <SettingsLink icon={<Award size={18} />} label="Achievement Alerts" detail="Streaks and milestones" toggle toggled={notificationPreferences.achievementAlerts} onToggle={handleAchievementToggle} />
                <SettingsLink icon={<Info size={18} />} label="Notification Center" detail="Test delivery and permissions" onClick={() => handleSheetOpen("notifications")} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="ml-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <Dumbbell size={12} /> Training
              </p>
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <SettingsLink icon={<Dumbbell size={18} />} label="Workout Preferences" detail={profile?.has_gym_access ? "Gym enabled" : "Home setup"} onClick={() => handleSheetOpen("training")} />
                <SettingsLink icon={<Weight size={18} />} label="Body Metrics" detail={`${formatMetric(profile?.weight, "kg")} current`} onClick={() => handleSheetOpen("body")} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="ml-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <Coffee size={12} /> Diet & Nutrition
              </p>
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <SettingsLink icon={<Coffee size={18} />} label="Dietary Habits" detail={profile?.dietary_habits ? "Preferences saved" : "Not set yet"} onClick={() => handleSheetOpen("nutrition")} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="ml-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <Palette size={12} /> Appearance
              </p>
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <SettingsLink icon={<Palette size={18} />} label="Theme Accent" detail={capitalize(uiPreferences.theme || "emerald")} onClick={() => handleSheetOpen("theme")} />
              </div>
            </div>

            <div className="space-y-3">
              <p className="ml-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-500">
                <HelpCircle size={12} /> Support
              </p>
              <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <SettingsLink icon={<HelpCircle size={18} />} label="Help Center" onClick={() => window.open("#", "_blank")} />
                <SettingsLink icon={<Shield size={18} />} label="Privacy Policy" onClick={() => window.open("#", "_blank")} />
                <SettingsLink icon={<Mail size={18} />} label="Contact Support" detail="support@fitwell.com" onClick={() => window.alert("Contact: support@fitwell.com")} />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => handleProfileSave()}
                disabled={isSaving}
                className="w-full rounded-xl bg-stone-800 py-4 text-sm font-black uppercase tracking-wider text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save All Changes"}
              </button>

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-4 text-[10px] font-black uppercase tracking-wider text-red-600 transition-transform active:scale-[0.98]"
              >
                <LogOut size={14} /> Log Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-[9px] font-black uppercase tracking-wider text-stone-400 transition-transform active:scale-[0.98]"
              >
                <Trash2 size={12} /> Delete Account
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <BottomSheet isOpen={Boolean(activeSheet)} onClose={handleSheetClose} title={sheetTitle}>
        {activeSheet === "overview" ? (
          <div className="space-y-4">
            <SheetInfoCard icon={UserCircle2} label="Account Name" value={profile?.full_name || user?.full_name || "--"} />
            <SheetInfoCard icon={Mail} label="Email" value={profile?.email || user?.email || "--"} />
            <SheetInfoCard icon={Scale} label="Current Weight" value={formatMetric(profile?.weight, "kg")} />
            <SheetInfoCard icon={Target} label="Goal Weight" value={formatMetric(profile?.target_weight, "kg")} />
            <SheetInfoCard icon={Flame} label="Daily Calories" value={`${formatInteger(profile?.daily_calorie_needs)} kcal`} />
            <button
              onClick={() => setActiveSheet("basics")}
              className="mt-2 w-full rounded-[1.4rem] border border-emerald-200 bg-emerald-50 py-4 text-sm font-black uppercase tracking-[0.18em] text-emerald-700"
            >
              Edit Profile Details
            </button>
          </div>
        ) : null}

        {activeSheet === "basics" ? (
          <div className="space-y-4">
            <SheetTextInput label="Full Name" value={profileDraft.full_name} onChange={(value) => handleDraftChange("full_name", value)} />
            <div className="grid grid-cols-2 gap-3">
              <SheetTextInput label="Age" type="number" value={profileDraft.age} onChange={(value) => handleDraftChange("age", value)} />
              <SheetSelect label="Gender" value={profileDraft.gender} onChange={(value) => handleDraftChange("gender", value)} options={[["", "Select"], ["male", "Male"], ["female", "Female"], ["other", "Other"]]} />
            </div>
            <SheetActionRow onCancel={handleSheetClose} onSave={() => handleProfileSave({ closeSheet: true })} isSaving={isSaving} />
          </div>
        ) : null}

        {activeSheet === "body" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <SheetTextInput label="Current Weight (kg)" type="number" value={profileDraft.weight} onChange={(value) => handleDraftChange("weight", value)} />
              <SheetTextInput label="Target Weight (kg)" type="number" value={profileDraft.target_weight} onChange={(value) => handleDraftChange("target_weight", value)} />
            </div>
            <SheetTextInput label="Height (cm)" type="number" value={profileDraft.height} onChange={(value) => handleDraftChange("height", value)} />
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Live Summary</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SheetMiniStat label="BMI" value={formatStat(profile?.bmi, 1)} />
                <SheetMiniStat label="Projection" value={`${profile?.projected_goal_weeks ?? "--"} weeks`} />
              </div>
            </div>
            <SheetActionRow onCancel={handleSheetClose} onSave={() => handleProfileSave({ closeSheet: true })} isSaving={isSaving} />
          </div>
        ) : null}

        {activeSheet === "training" ? (
          <div className="space-y-4">
            <SheetSelect
              label="Physique Goal"
              value={profileDraft.desired_body_type}
              onChange={(value) => handleDraftChange("desired_body_type", value)}
              options={[
                ["", "Select goal"],
                ["lean", "Lean & Fast"],
                ["toned", "Toned & Defined"],
                ["muscular", "Muscle Growth"],
              ]}
            />
            <SheetTextInput
              label="Daily Workout Duration (minutes)"
              type="number"
              value={profileDraft.daily_workout_minutes}
              onChange={(value) => handleDraftChange("daily_workout_minutes", value)}
            />
            <div className="flex items-center justify-between rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
              <div>
                <p className="text-sm font-bold text-stone-800">Gym Access</p>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Affects workout recommendations</p>
              </div>
              <Toggle active={profileDraft.has_gym_access} onToggle={() => handleDraftChange("has_gym_access", !profileDraft.has_gym_access)} />
            </div>
            <SheetActionRow onCancel={handleSheetClose} onSave={() => handleProfileSave({ closeSheet: true })} isSaving={isSaving} />
          </div>
        ) : null}

        {activeSheet === "nutrition" ? (
          <div className="space-y-4">
            <SheetTextarea
              label="Dietary Habits & Restrictions"
              value={profileDraft.dietary_habits}
              onChange={(value) => handleDraftChange("dietary_habits", value)}
              placeholder="Allergies, preferences, restrictions, or goals..."
            />
            <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Nutrition Snapshot</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SheetMiniStat label="Calories" value={`${formatInteger(profile?.daily_calorie_needs)} kcal`} />
                <SheetMiniStat label="Protein" value={proteinNeed === "--" ? "--" : `${proteinNeed} g/day`} />
              </div>
            </div>
            <SheetActionRow onCancel={handleSheetClose} onSave={() => handleProfileSave({ closeSheet: true })} isSaving={isSaving} />
          </div>
        ) : null}

        {activeSheet === "notifications" ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Status</p>
              <div className="mt-3 space-y-3">
                <SheetStatusRow label="Push Notifications" value={notificationPreferences.pushEnabled ? "Enabled" : "Disabled"} />
                <SheetStatusRow label="Browser Permission" value={notificationPreferences.pushPermission || "default"} />
                <SheetStatusRow label="Email Digest" value={notificationPreferences.emailEnabled ? "Enabled" : "Disabled"} />
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              className="w-full rounded-[1.3rem] border border-stone-200 bg-white py-3 text-sm font-black uppercase tracking-[0.18em] text-stone-800"
            >
              {notificationPreferences.pushEnabled ? "Disable Push" : "Enable Push"}
            </button>
            <button
              onClick={handleSendTestNotification}
              disabled={isTestingNotifications}
              className="w-full rounded-[1.3rem] bg-stone-900 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
            >
              {isTestingNotifications ? "Sending..." : "Send Test Notification"}
            </button>
          </div>
        ) : null}

        {activeSheet === "theme" ? (
          <div className="space-y-3">
            {[
              ["emerald", "Emerald"],
              ["amber", "Amber"],
              ["ocean", "Ocean"],
              ["midnight", "Midnight"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={async () => {
                  await setTheme(value);
                  setSuccessMsg(`${label} theme applied.`);
                  setActiveSheet(null);
                }}
                className={`flex w-full items-center justify-between rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  uiPreferences.theme === value ? "border-emerald-400 bg-emerald-50" : "border-stone-200 bg-stone-50"
                }`}
              >
                <div>
                  <p className="text-sm font-black text-stone-900">{label}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{value}</p>
                </div>
                <ThemeSwatch theme={value} />
              </button>
            ))}
          </div>
        ) : null}
      </BottomSheet>

      <style>{`
        .profile-sheet-backdrop {
          transition: opacity 240ms ease;
        }
        .profile-sheet-panel {
          animation: profileSheetUp 280ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes profileSheetUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

function BottomSheet({ children, isOpen, onClose, title }) {
  return (
    <>
      <div
        className={`profile-sheet-backdrop fixed inset-0 z-40 bg-stone-950/55 backdrop-blur-sm ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div className={`fixed inset-x-0 bottom-0 z-50 flex justify-center transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="profile-sheet-panel w-full max-w-2xl rounded-t-[2.6rem] border-t border-stone-200 bg-white px-6 pb-10 pt-4 shadow-[0_-12px_40px_rgba(15,23,42,0.22)]">
          <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-200" />
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Edit Details</p>
              <h3 className="mt-1 text-2xl font-black text-stone-900">{title}</h3>
            </div>
            <button onClick={onClose} className="rounded-full border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100">
              <X size={18} />
            </button>
          </div>
          <div className="mx-auto max-w-lg">{children}</div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-center transition-shadow hover:shadow-md">
      <div className={`mb-2 inline-flex rounded-xl p-2 ${statCardColors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">{label}</p>
      <p className="text-base font-black text-stone-800">{value}</p>
    </div>
  );
}

function InteractivePanel({ title, eyebrow, icon: Icon, rows, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50 text-left transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-stone-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-600">{eyebrow}</span>
          <ChevronRight size={14} className="text-stone-400" />
        </div>
      </div>
      <div className="divide-y divide-stone-100">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-5 py-3">
            <span className="text-xs font-bold uppercase tracking-tight text-stone-600">{label}</span>
            <span className="text-sm font-black text-stone-800">{value}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function AchievementBadge({ icon: Icon, title, desc, color }) {
  const colors = {
    orange: "bg-orange-50 text-orange-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="min-w-[140px] rounded-xl border border-stone-100 bg-white p-3">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <p className="text-xs font-black text-stone-800">{title}</p>
      <p className="text-[9px] text-stone-500">{desc}</p>
    </div>
  );
}

function SettingsLink({ icon, label, detail, onClick, toggle, toggled, onToggle }) {
  if (toggle) {
    return (
      <div className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white">
        <div className="flex items-center gap-3">
          <div className="text-stone-500">{icon}</div>
          <div>
            <p className="text-sm font-bold text-stone-800">{label}</p>
            {detail ? <p className="text-[10px] font-black uppercase tracking-tighter text-stone-500">{detail}</p> : null}
          </div>
        </div>
        <Toggle active={toggled} onToggle={onToggle} />
      </div>
    );
  }

  return (
    <button onClick={onClick} className="group flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white">
      <div className="flex items-center gap-3">
        <div className="text-stone-500 transition-colors group-hover:text-stone-700">{icon}</div>
        <div className="text-left">
          <p className="text-sm font-bold text-stone-800">{label}</p>
          {detail ? <p className="text-[10px] font-black uppercase tracking-tighter text-stone-500">{detail}</p> : null}
        </div>
      </div>
      <ChevronRight size={16} className="text-stone-400 transition-all group-hover:text-stone-600" />
    </button>
  );
}

function Toggle({ active, onToggle }) {
  return (
    <button
      onClick={(event) => {
        event.stopPropagation();
        onToggle?.();
      }}
      className={`relative h-6 w-11 rounded-full transition-all ${active ? "bg-emerald-500" : "bg-stone-300"}`}
    >
      <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${active ? "left-6" : "left-1 shadow-sm"}`} />
    </button>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white p-4">
      <p className="text-[10px] font-bold uppercase text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-stone-700">{value}</p>
    </div>
  );
}

function SheetInfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-4">
      <div className="rounded-2xl bg-white p-3 text-emerald-600 shadow-sm">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{label}</p>
        <p className="text-sm font-bold text-stone-900">{value}</p>
      </div>
    </div>
  );
}

function SheetTextInput({ label, onChange, type = "text", value }) {
  return (
    <label className="block">
      <span className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.3rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-emerald-400 focus:bg-white"
      />
    </label>
  );
}

function SheetSelect({ label, onChange, options, value }) {
  return (
    <label className="block">
      <span className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.3rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-emerald-400 focus:bg-white"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={`${optionValue}-${optionLabel}`} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function SheetTextarea({ label, onChange, placeholder, value }) {
  return (
    <label className="block">
      <span className="mb-2 ml-1 block text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-28 w-full resize-none rounded-[1.3rem] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-900 outline-none transition focus:border-emerald-400 focus:bg-white"
      />
    </label>
  );
}

function SheetMiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-black text-stone-900">{value}</p>
    </div>
  );
}

function SheetStatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <span className="text-sm font-black text-stone-900">{value}</span>
    </div>
  );
}

function ThemeSwatch({ theme }) {
  const palettes = {
    emerald: ["#10b981", "#14b8a6", "#f4fbf8"],
    amber: ["#f59e0b", "#f97316", "#fff7ed"],
    ocean: ["#3b82f6", "#06b6d4", "#eef7ff"],
    midnight: ["#475569", "#0f172a", "#cbd5e1"],
  };

  return (
    <div className="flex items-center gap-1">
      {palettes[theme].map((color) => (
        <span key={color} className="h-4 w-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

function SheetActionRow({ isSaving, onCancel, onSave }) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      <button
        onClick={onCancel}
        className="rounded-[1.3rem] border border-stone-200 bg-white py-3 text-sm font-black uppercase tracking-[0.18em] text-stone-600"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="rounded-[1.3rem] bg-stone-900 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-[2rem] bg-stone-100 ${className}`} />;
}

function createDraftFromProfile(data) {
  return {
    full_name: data?.full_name || "",
    weight: data?.weight ?? "",
    age: data?.age ?? "",
    height: data?.height ?? "",
    gender: data?.gender || "",
    target_weight: data?.target_weight ?? "",
    desired_body_type: data?.desired_body_type || "",
    daily_workout_minutes: data?.daily_workout_minutes ?? "",
    dietary_habits: data?.dietary_habits || "",
    has_gym_access: Boolean(data?.has_gym_access),
  };
}

function readErrorMessage(err, fallback) {
  if (err?.code === "ERR_NETWORK") {
    return "Backend unreachable at http://localhost:8000.";
  }

  return err?.response?.data?.detail || fallback;
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function formatMetric(value, unit) {
  if (value === "" || value === null || value === undefined) return "--";
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function formatInteger(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
  return Number(value).toLocaleString();
}

function formatStat(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
  return Number(value).toFixed(decimals);
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function prettyBodyType(value) {
  if (!value) return "";
  if (value === "lean") return "Lean & Fast";
  if (value === "toned") return "Toned & Defined";
  if (value === "muscular") return "Muscle Growth";
  return capitalize(value);
}
