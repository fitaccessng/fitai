import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../services/planService";
import { 
  Bell, Activity, Utensils, 
  Dumbbell, Flame, Plus, 
  LayoutGrid, User, Sparkles, ChevronRight, X, ChevronRightCircle
} from "lucide-react"; 

/** 
 * --- CONSTANTS & FALLBACKS ---
 */
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fallbackAnalytics = {
  consistencyScore: 0,
  goalPrediction: "--",
  weeklySummary: "Loading your insights...",
  achievements: [],
  missedWorkoutAlert: null
};

const fallbackWellness = {
  water_intake: 0,
  sleep_hours: 0,
  streak_days: 0,
  meal_completion: {},
  workout_queue: null,
  generated_meals: { meals: [] }
};

const dailyTips = [
  "Hydration boosts your metabolism.", 
  "Stretching prevents injuries.", 
  "Protein is key for muscle recovery."
];

/** 
 * --- HELPER FUNCTIONS ---
 */
const getCurrentWindow = () => {
  const hour = new Date().getHours();
  if (hour < 11) return { key: "breakfast", label: "Morning Fuel" };
  if (hour < 16) return { key: "lunch", label: "Mid-day Power" };
  return { key: "dinner", label: "Evening Recovery" };
};

const getDailyCompletion = (mealPct, waterPct, workoutDone) => {
  const workoutScore = workoutDone ? 100 : 0;
  return Math.round((mealPct + waterPct + workoutScore) / 3);
};

const countCompletedTodayMeals = (mealCompletion) => {
  if (!mealCompletion) return 0;
  return Object.values(mealCompletion).filter(v => v === true).length;
};

const buildRecoveryScore = (sleep, consistency) => {
  const sleepScore = Math.min((sleep / 8) * 100, 100);
  return Math.round((sleepScore + consistency) / 2) || 0;
};

const getDayEmoji = (index) => ["⚡", "🥗", "💧", "🔥", "🧘", "🏆", "😴"][index] || "✨";

const getUnreadNotifications = (analytics, wellness) => {
  const messages = [];
  if (wellness.water_intake < 4) messages.push("Stay hydrated! You're below your water goal.");
  if (analytics.consistencyScore < 50) messages.push("Consistency is key. Try to log a meal!");
  return messages;
};

/** 
 * --- REUSABLE UI COMPONENTS ---
 */
const ProgressRing = ({ percentage, size = 160, strokeWidth = 12 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r={radius} className="fill-none stroke-white/10" strokeWidth={strokeWidth} />
        <circle 
          cx="50%" cy="50%" r={radius} 
          className="fill-none stroke-orange-500 transition-all duration-1000 ease-out" 
          strokeWidth={strokeWidth} strokeLinecap="round" 
          strokeDasharray={circumference} strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tighter text-white">{percentage}%</span>
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">Score</span>
      </div>
    </div>
  );
};

const BentoCard = ({ children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-stone-100 rounded-[2.5rem] p-5 shadow-sm transition-transform active:scale-[0.98] ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
  >
    {children}
  </div>
);

/** 
 * --- MAIN PAGE COMPONENT ---
 */
export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [showNotifications, setShowNotifications] = useState(false);
  const [dailyTipIndex, setDailyTipIndex] = useState(0);
  const [activeBottomSheet, setActiveBottomSheet] = useState(null);

  useEffect(() => {
    getDashboard().then(setDashboard).catch(() => setDashboard(null));

    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    
    setDailyTipIndex(Math.floor(Math.random() * dailyTips.length));
  }, []);

  const profile = dashboard?.profile;
  const analytics = dashboard?.analytics ?? fallbackAnalytics;
  const wellness = dashboard?.wellness ?? fallbackWellness;
  const weeklyStats = dashboard?.weekly_stats ?? {};
  const mealCards = Array.isArray(wellness.generated_meals?.meals) ? wellness.generated_meals.meals : [];
  const currentWindow = getCurrentWindow();
  const activeMeal = mealCards.find((meal) => meal.key === currentWindow.key) ?? mealCards[0];
  const currentWorkout = wellness.workout_queue;
  const recoveryScore = buildRecoveryScore(wellness.sleep_hours, analytics.consistencyScore);
  const currentDayIndex = (new Date().getDay() + 6) % 7;
  const todayKey = new Date().toISOString().slice(0, 10);
  
  const todayLogs = (dashboard?.recent_logs || []).filter(log => 
    new Date(log.logged_at).toDateString() === new Date().toDateString()
  );

  const macros = useMemo(() => {
    return mealCards.reduce(
      (totals, meal) => ({
        calories: totals.calories + (meal.macro?.calories ?? 0),
        protein: totals.protein + (meal.macro?.protein ?? 0),
        carbs: totals.carbs + (meal.macro?.carbs ?? 0),
        fat: totals.fat + (meal.macro?.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [mealCards]);

  const mealCompletionPercent = mealCards.length > 0 
    ? Math.round((countCompletedTodayMeals(wellness.meal_completion) / mealCards.length) * 100) : 0;
  const waterCompletionPercent = Math.round(((wellness.water_intake || 0) / 8) * 100);
  const workoutCompleted = todayLogs.some(log => log.log_type === "workout");
  const overallScore = getDailyCompletion(mealCompletionPercent, waterCompletionPercent, workoutCompleted);

  const statDetails = useMemo(() => ({
    consistency: { title: "Consistency Details", items: [
        { label: "Weekly Score", value: `${analytics.consistencyScore}%`, icon: "📊" },
        { label: "Logs This Week", value: `${weeklyStats.logs_this_week ?? 0} logs`, icon: "📝" },
        { label: "Status", value: analytics.consistencyScore >= 70 ? "On Track ✅" : "Needs Attention ⚡", icon: "📈" },
    ]},
    goalPace: { title: "Goal Projection", items: [
        { label: "Weeks to Target", value: `${analytics.goalPrediction} weeks`, icon: "🎯" },
        { label: "Target Weight", value: `${profile?.target_weight || "--"} kg`, icon: "⚖️" },
    ]},
    streak: { title: "Streak & Discipline", items: [
        { label: "Current Streak", value: `${wellness.streak_days ?? 0} days`, icon: "🔥" },
        { label: "Workout Done", value: workoutCompleted ? "Yes ✅" : "Not yet ❌", icon: "💪" },
    ]},
    recovery: { title: "Recovery & Wellness", items: [
        { label: "Sleep Hours", value: `${wellness.sleep_hours || 0} hours`, icon: "😴" },
        { label: "Water Intake", value: `${wellness.water_intake || 0}/8 glasses`, icon: "💧" },
    ]},
    // NEW GOAL AND LOG BOTTOM SHEET CONTENT
    goal: { title: "Current Objectives", items: [
        { label: "Primary Goal", value: profile?.goal_type || "Weight Management", icon: "🎯" },
        { label: "Daily Calories", value: `${profile?.daily_calorie_target || 2000} kcal`, icon: "🔥" },
        { label: "Activity Level", value: profile?.activity_level || "Moderate", icon: "⚡" },
    ]},
    log: { title: "Daily Activity Log", items: [
        { label: "Total Logs Today", value: `${todayLogs.length} entries`, icon: "📝" },
        { label: "Last Activity", value: todayLogs[0]?.note || "Meal Entry", icon: "🕒" },
        { label: "Recent Performance", value: "85% Accurate", icon: "✅" },
    ]}
  }), [analytics, wellness, weeklyStats, profile, workoutCompleted, todayLogs]);

  const quickActionItems = [
    { icon: "🍽️", label: "Meal", link: "/app/meals" },
    { icon: "💪", label: "Workout", link: "/app/workouts" },
    { icon: "💧", label: "Water", link: "/app/meals" },
    { icon: "⚖️", label: "Weight", link: "/app/profile" },
    { icon: "📝", label: "Log", action: "log" }, // Changed to trigger sheet
    { icon: "🎯", label: "Goal", action: "goal" }, // Changed to trigger sheet
    { icon: "📊", label: "Stats", link: "/app/logs" },
  ];

  const unreadNotifications = getUnreadNotifications(analytics, wellness);

  return (
    <div className="flex min-h-screen flex-col bg-[#FDFCFB] text-[#1A1513] font-sans pb-32">
      
      {/* MAIN CONTENT */}
      <main className="px-5 pt-4 flex-1 space-y-6">
        
        {/* HERO PROGRESS */}
        <section className="relative bg-[#1A1513] rounded-[3rem] p-8 text-white overflow-hidden shadow-xl shadow-stone-200">
          <div className="relative z-10 flex flex-col items-center">
            <ProgressRing percentage={overallScore} />
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full grid grid-cols-3 gap-2 text-center border border-white/5">
              <div><p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">Workout</p><p className="font-bold text-sm">{workoutCompleted ? "Done" : "Off"}</p></div>
              <div><p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">Water</p><p className="font-bold text-sm">{wellness.water_intake}/8</p></div>
              <div><p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">Meals</p><p className="font-bold text-sm">{mealCompletionPercent}%</p></div>
            </div>
          </div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        </section>

        {/* QUICK ACTIONS SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-lg">Quick Actions</h3>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Single Tap Log</span>
          </div>
          <div className="grid grid-cols-4 gap-3 bg-white border border-stone-100 p-5 rounded-[2.5rem] shadow-sm">
            {quickActionItems.map((action) => (
              action.link ? (
                <Link key={action.label} to={action.link} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 bg-stone-50 group-active:bg-stone-200 group-active:scale-90 transition-all rounded-2xl flex items-center justify-center text-2xl">
                    {action.icon}
                  </div>
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tight">{action.label}</span>
                </Link>
              ) : (
                <button key={action.label} onClick={() => setActiveBottomSheet(action.action)} className="flex flex-col items-center gap-2 group">
                   <div className="w-12 h-12 bg-stone-50 group-active:bg-stone-200 group-active:scale-90 transition-all rounded-2xl flex items-center justify-center text-2xl">
                    {action.icon}
                  </div>
                  <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tight">{action.label}</span>
                </button>
              )
            ))}
          </div>
        </section>

        {/* HORIZONTAL STATS */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <MiniBentoStat onClick={() => setActiveBottomSheet("consistency")} icon="📊" label="Consistency" value={`${analytics.consistencyScore}%`} color="bg-blue-50 text-blue-600" />
          <MiniBentoStat onClick={() => setActiveBottomSheet("goalPace")} icon="🎯" label="Goal Pace" value={`${analytics.goalPrediction}w`} color="bg-emerald-50 text-emerald-600" />
          <MiniBentoStat onClick={() => setActiveBottomSheet("streak")} icon="🔥" label="Streak" value={`${wellness.streak_days}d`} color="bg-orange-50 text-orange-600" />
          <MiniBentoStat onClick={() => setActiveBottomSheet("recovery")} icon="💤" label="Recovery" value={`${recoveryScore}%`} color="bg-indigo-50 text-indigo-600" />
        </div>

        {/* ACTIVE MEAL BENTO */}
        <BentoCard className="flex flex-row items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl">🍽️</div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{currentWindow.label}</p>
              <Link to="/app/meals"><ChevronRightCircle size={20} className="text-orange-500" /></Link>
            </div>
            <h4 className="font-bold text-lg leading-tight mt-1">{activeMeal?.title || "Plan Your Next Meal"}</h4>
            <p className="text-[11px] font-bold text-stone-400 mt-1">{macros.calories} kcal estimated today</p>
          </div>
        </BentoCard>

        {/* WORKOUT CARD */}
        <BentoCard className="bg-stone-900 text-white overflow-hidden relative">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell size={16} className="text-stone-400" />
                <span className="text-[10px] font-black uppercase text-stone-400">Training Session</span>
              </div>
              <h3 className="font-bold text-lg">{currentWorkout ? currentWorkout.focusLabel : "Rest & Recover"}</h3>
            </div>
            <Link to="/app/workouts" className="bg-white text-stone-900 px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg active:scale-95 transition-transform">
              {workoutCompleted ? "Review" : "Start"}
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        </BentoCard>

        {/* DAILY TIP */}
        <BentoCard className="bg-amber-50/50 border-amber-100">
          <p className="text-[10px] font-black text-amber-600 uppercase mb-2 flex items-center gap-1"><Sparkles size={12}/> AI Insight</p>
          <p className="text-sm font-bold text-stone-700 leading-snug">{dailyTips[dailyTipIndex]}</p>
        </BentoCard>

        {/* WEEKLY CALENDAR */}
        <section className="space-y-4 pb-12">
          <h3 className="font-bold text-lg px-1">Weekly Pulse</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {weekDays.map((day, index) => (
              <div key={day} className={`flex-shrink-0 w-16 p-4 rounded-3xl flex flex-col items-center border transition-all ${index === currentDayIndex ? "bg-stone-900 border-stone-900 text-white shadow-lg scale-105" : "bg-white border-stone-100 text-stone-400"}`}>
                <span className="text-[9px] font-black uppercase mb-3">{day}</span>
                <span className="text-2xl">{getDayEmoji(index)}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* BOTTOM SHEET MODAL */}
      {activeBottomSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveBottomSheet(null)} />
          <div className="relative w-full bg-white rounded-t-[3rem] p-8 shadow-2xl animate-slide-up">
            <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-6">{statDetails[activeBottomSheet].title}</h3>
            <div className="space-y-4">
              {statDetails[activeBottomSheet].items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-stone-50 p-5 rounded-[2rem] border border-stone-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">{item.icon}</div>
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase">{item.label}</p>
                    <p className="text-base font-black text-stone-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveBottomSheet(null)} className="mt-8 w-full py-5 bg-stone-900 text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-transform">
                Got it
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL STYLES */}
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function MiniBentoStat({ icon, label, value, color, onClick }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 w-32 bg-white border border-stone-100 rounded-[2rem] p-5 text-left shadow-sm active:scale-95 transition-transform hover:shadow-md">
      <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center text-xl mb-4 shadow-sm`}>{icon}</div>
      <p className="text-[10px] font-black text-stone-400 uppercase tracking-tighter mb-1">{label}</p>
      <p className="text-xl font-black text-stone-900">{value}</p>
    </button>
  );
}