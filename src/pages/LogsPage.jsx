import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom"; // Added for back navigation
import {
  Activity,
  ArrowLeft, // Added for back button
  Bell,      // Added for notification
  CheckCircle2,
  Droplets,
  Dumbbell,
  Moon,
  Sparkles,
  Utensils,
  XCircle,
  ChevronRight,
} from "lucide-react";

import { createLog, getLogs } from "../services/planService";
import { useWellnessStore } from "../services/wellnessStore";

// --- CONSTANTS & CONFIGURATION ---

const LOG_TYPES = {
  meal: {
    label: "Meal",
    icon: Utensils,
    iconClass: "text-amber-600",
    softClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  water: {
    label: "Water",
    icon: Droplets,
    iconClass: "text-sky-600",
    softClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  workout: {
    label: "Workout",
    icon: Dumbbell,
    iconClass: "text-emerald-600",
    softClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner"];
const WATER_AMOUNTS = [250, 500, 750, 1000];
const WORKOUT_DIFFICULTIES = ["Easy", "Balanced", "Hard", "Too difficult"];

const initialForm = {
  log_type: "workout",
  mealSlot: "Breakfast",
  mealStatus: "completed",
  mealPortion: 1,
  waterAmount: 500,
  workoutStatus: "completed",
  workoutDifficulty: "Balanced",
  workoutDuration: 30,
  workoutEnergy: 8,
  note: "",
};

// --- HELPER FUNCTIONS ---

function isToday(value) {
  return new Date(value).toDateString() === new Date().toDateString();
}

function buildPayload(form) {
  const note = form.note.trim();
  if (form.log_type === "meal") {
    const statusCopy = { completed: "Meal completed", skipped: "Meal skipped", swapped: "A different meal was eaten" };
    return {
      log_type: "meal",
      title: `${form.mealSlot} ${statusCopy[form.mealStatus]}`,
      details: [`${form.mealSlot} check-in recorded.`, note ? `Feedback: ${note}.` : ""].join(" "),
      quantity: Number(form.mealPortion),
    };
  }
  if (form.log_type === "water") {
    return { log_type: "water", title: `Hydration ${form.waterAmount}ml`, quantity: Number(form.waterAmount) };
  }
  return {
    log_type: "workout",
    title: `Workout ${form.workoutStatus}`,
    details: `Status: ${form.workoutStatus}. Difficulty: ${form.workoutDifficulty}.`,
    quantity: Number(form.workoutDuration),
  };
}

function buildSuccessMessage(form) {
  if (form.log_type === "meal") return "Meal progress saved!";
  if (form.log_type === "water") return `${form.waterAmount}ml logged. Stay hydrated!`;
  return "Workout recorded. Great job!";
}

// --- SUB-COMPONENTS ---

function SummaryCard({ label, value, icon, color, bg }) {
  return (
    <div className="min-w-[110px] p-4 bg-white rounded-[2rem] border border-stone-100 shadow-sm">
      <div className={`w-8 h-8 ${bg} ${color} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tighter">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}

function MobileFieldLabel({ children }) {
  return <p className="text-[11px] font-black uppercase tracking-widest text-stone-400 mb-3 ml-1">{children}</p>;
}

// --- MAIN COMPONENT ---

export default function LogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const analytics = useWellnessStore((state) => state.analytics);
  const refreshAnalytics = useWellnessStore((state) => state.refreshAnalytics);
  const sleepHours = useWellnessStore((state) => state.sleepHours);

  const load = async () => {
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (err) {
      setError("Failed to load logs");
    }
  };

  useEffect(() => {
    load();
    refreshAnalytics().catch(console.error);
  }, [refreshAnalytics]);

  const todayLogs = useMemo(() => logs.filter((log) => isToday(log.logged_at)), [logs]);
  const waterMlToday = useMemo(() => 
    todayLogs.filter((log) => log.log_type === "water")
    .reduce((sum, log) => sum + (Number(log.quantity) || 0), 0)
  , [todayLogs]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createLog(buildPayload(form));
      setSuccessMessage(buildSuccessMessage(form));
      setForm((prev) => ({ ...initialForm, log_type: prev.log_type }));
      await load();
      await refreshAnalytics();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to save log.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 font-sans text-stone-900">
      {/* IMPROVED MOBILE HEADER */}
      <header className="sticky top-0 z-20 bg-stone-50/80 px-5 pt-4 pb-4 backdrop-blur-md border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 rounded-full hover:bg-stone-200/50 transition-colors"
            >
              <ArrowLeft size={24} className="text-stone-700" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-tight">Today's Log</h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 relative rounded-full hover:bg-stone-200/50 transition-colors">
              <Bell size={22} className="text-stone-700" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-stone-50"></span>
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white shadow-sm">
              <Activity size={18} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6 pt-4">
        {/* PROGRESS CAROUSEL */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <SummaryCard 
            label="Hydration" 
            value={`${(waterMlToday / 1000).toFixed(1)}L`} 
            icon={<Droplets size={16}/>} 
            color="text-sky-600"
            bg="bg-sky-100"
          />
          <SummaryCard 
            label="Meals" 
            value={`${todayLogs.filter(l => l.log_type === 'meal').length}/3`} 
            icon={<Utensils size={16}/>} 
            color="text-amber-600"
            bg="bg-amber-100"
          />
          <SummaryCard 
            label="Sleep" 
            value={`${sleepHours || 0}h`} 
            icon={<Moon size={16}/>} 
            color="text-indigo-600"
            bg="bg-indigo-100"
          />
        </div>

        {/* LOGGING FORM CARD */}
        <section className="rounded-[2.5rem] bg-white p-2 shadow-xl shadow-stone-200/50 border border-stone-100">
          <div className="flex p-1 bg-stone-100 rounded-[2rem]">
            {Object.entries(LOG_TYPES).map(([type, config]) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(prev => ({...prev, log_type: type}))}
                className={`flex flex-1 items-center justify-center gap-2 py-3 rounded-[1.8rem] transition-all ${
                  form.log_type === type ? "bg-white shadow-sm text-stone-900" : "text-stone-500"
                }`}
              >
                <config.icon size={18} className={form.log_type === type ? config.iconClass : ""} />
                <span className="text-sm font-bold">{config.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="px-4 pt-6 pb-4 space-y-6">
            {form.log_type === "meal" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <MobileFieldLabel>Which Meal?</MobileFieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {MEAL_SLOTS.map(slot => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setForm(prev => ({...prev, mealSlot: slot}))}
                        className={`py-3 rounded-2xl text-sm font-semibold border-2 transition-all ${
                          form.mealSlot === slot ? "border-amber-500 bg-amber-50 text-amber-700" : "border-stone-100 bg-stone-50"
                        }`}
                      >{slot}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {form.log_type === "water" && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {WATER_AMOUNTS.map(amt => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setForm(prev => ({...prev, waterAmount: amt}))}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center transition-all ${
                      form.waterAmount === amt ? "border-sky-500 bg-sky-50" : "border-stone-100 bg-stone-50"
                    }`}
                  >
                    <span className="text-lg font-black">{amt}ml</span>
                    <span className="text-[10px] uppercase text-sky-600 font-bold">Quick Add</span>
                  </button>
                ))}
              </div>
            )}

            {form.log_type === "workout" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <MobileFieldLabel>Workout Difficulty</MobileFieldLabel>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_DIFFICULTIES.map(d => (
                    <button
                      type="button"
                      key={d}
                      onClick={() => setForm(prev => ({...prev, workoutDifficulty: d}))}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                        form.workoutDifficulty === d ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-600"
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <MobileFieldLabel>Notes</MobileFieldLabel>
              <textarea
                value={form.note}
                onChange={(e) => setForm(prev => ({...prev, note: e.target.value}))}
                placeholder="How's your energy?"
                className="w-full rounded-3xl border-none bg-stone-100 p-4 text-sm focus:ring-2 focus:ring-stone-200"
                rows={2}
              />
            </div>

            <button
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 bg-stone-900 py-5 rounded-[2rem] text-white font-black text-lg shadow-lg active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : <>Save Check-in <ChevronRight size={20}/></>}
            </button>
          </form>
        </section>

        {/* RECENT FEED */}
        <section>
           <h3 className="px-1 mb-4 text-lg font-black">Today's Feed</h3>
           <div className="space-y-3">
             {todayLogs.length === 0 ? (
               <p className="text-center py-10 text-stone-400 text-sm italic">No logs yet today. Start your streak!</p>
             ) : (
               todayLogs.slice(0, 5).map((log, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-white rounded-[1.5rem] border border-stone-100 animate-in fade-in duration-500">
                   <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl ${LOG_TYPES[log.log_type]?.softClass || "bg-stone-100"}`}>
                       {(() => {
                         const Icon = LOG_TYPES[log.log_type]?.icon || Activity;
                         return <Icon size={18} />;
                       })()}
                     </div>
                     <div>
                       <p className="text-sm font-bold">{log.title}</p>
                       <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                         {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                     </div>
                   </div>
                   <CheckCircle2 size={18} className="text-emerald-500" />
                 </div>
               ))
             )}
           </div>
        </section>
      </main>

      {/* FEEDBACK OVERLAYS */}
      {successMessage && (
        <div className="fixed bottom-6 left-5 right-5 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <Sparkles size={20} />
            <p className="text-sm font-bold leading-tight">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-6 left-5 right-5 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <XCircle size={20} />
            <p className="text-sm font-bold leading-tight">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}