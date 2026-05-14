import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Droplets,
  Plus,
  RefreshCcw,
  ShoppingBasket,
  Sparkles,
  Utensils,
  X,
  ArrowRight,
  RotateCcw,
  ChefHat
} from "lucide-react";

import { getMealWindow } from "../lib/fitnessEngine";
import { getProfile } from "../services/profileService";
import { useWellnessStore } from "../services/wellnessStore";

const commonFoods = [
  "Oats", "Eggs", "Agege Bread", "Jollof Rice", "Brown Rice", "Beans", 
  "Chicken", "Beef", "Fish (Titus/Croaker)", "Pasta", "Ugwu/Spinach", 
  "Plantain (Dodo)", "Sweet Potatoes", "Pounded Yam", "Garri/Eba", 
  "Semovita", "Egusi Soup", "Okra Soup", "Moin Moin", "Akara", 
  "Avocado", "Garden Egg", "Greek Yogurt", "Turkey", "Cashew Nuts",
];

export default function MealPlanPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("meals"); // "market" or "meals"
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    availableFoods,
    generatedMeals,
    mealCompletion,
    waterIntake,
    macroTarget,
    generateMeals,
    addWater,
    resetWater,
    addMarketFood,
    removeMarketFood,
    toggleMealCompletion,
    regenerateMeal,
  } = useWellnessStore();

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);
  const meals = generatedMeals?.meals || [];
  const marketFoods = availableFoods.market || [];
  const hasMarketItems = marketFoods.length > 0;

  const totalMacro = useMemo(() => 
    meals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.macro?.calories || 0),
      protein: totals.protein + (meal.macro?.protein || 0),
    }), { calories: 0, protein: 0 }), [meals]
  );

  const handleGenerate = async () => {
    if (!profile) return;
    setIsGenerating(true);
    await generateMeals(profile);
    setIsGenerating(false);
    setActiveTab("meals");
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 font-sans text-slate-900">
      {/* --- STICKY HEADER --- */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button onClick={() => navigate(-1)} className="rounded-full p-2 active:bg-slate-100">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-black uppercase tracking-widest text-slate-800">Daily Fuel</h1>
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-6 space-y-6">
        
        {/* --- TAB NAVIGATION --- */}
        <div className="flex rounded-2xl bg-slate-200/50 p-1.5">
          <button 
            onClick={() => setActiveTab("meals")}
            className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'meals' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
          >
            Today's Plan
          </button>
          <button 
            onClick={() => setActiveTab("market")}
            className={`flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'market' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
          >
            Pantry {marketFoods.length > 0 && <span className="opacity-50">({marketFoods.length})</span>}
          </button>
        </div>

        {activeTab === "market" ? (
          /* --- PANTRY VIEW --- */
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                  <ShoppingBasket size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Market List</h2>
                  <p className="text-xs font-medium text-slate-500">What do you have in your kitchen?</p>
                </div>
              </div>

              <div className="mb-8 flex flex-wrap gap-2">
                {marketFoods.map(food => (
                  <button 
                    key={food}
                    onClick={() => removeMarketFood(food)}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    {food} <X size={12} />
                  </button>
                ))}
                <button 
                  onClick={() => setShowFoodSelector(true)}
                  className="flex items-center gap-2 rounded-full border-2 border-dashed border-slate-200 px-4 py-2 text-xs font-bold text-slate-400 active:bg-slate-50"
                >
                  <Plus size={12} /> Add Food
                </button>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={!hasMarketItems || isGenerating}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 font-black text-white transition-transform active:scale-[0.98] disabled:opacity-30"
              >
                {isGenerating ? "Cooking up a plan..." : "Generate Meal Plan"} <ArrowRight size={18} />
              </button>
            </div>
          </section>
        ) : (
          /* --- MEALS & HYDRATION VIEW --- */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Macro Summary Dashboard */}
            <div className="flex items-center justify-between rounded-[2.5rem] bg-slate-900 p-6 text-white shadow-xl">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Calories</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tabular-nums">{totalMacro.calories}</span>
                  <span className="text-xs text-slate-500">/ {macroTarget.calories}</span>
                </div>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Protein</p>
                <p className="text-lg font-bold">{totalMacro.protein}g</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                <ChefHat size={20} className="text-orange-500" />
                <span className="mt-1 text-[10px] font-bold uppercase text-slate-400">Tracked</span>
              </div>
            </div>

            {/* Visual Water Tracker */}
            <WaterTracker intake={waterIntake} onAdd={addWater} onReset={resetWater} />

            {/* Meal List */}
            <div className="space-y-4">
              <h3 className="px-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Today's Menu</h3>
              {meals.length > 0 ? (
                meals.map((meal) => (
                  <MealCard 
                    key={meal.key} 
                    meal={meal} 
                    isDone={!!mealCompletion[todayKey]?.[meal.key]}
                    onToggle={() => toggleMealCompletion(meal.key)}
                    onRegenerate={() => regenerateMeal(meal.key, profile)}
                  />
                ))
              ) : (
                <div className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white py-12 text-center">
                  <Sparkles className="mx-auto mb-4 text-slate-300" size={32} />
                  <p className="font-bold text-slate-400">Pantry is empty.</p>
                  <button onClick={() => setActiveTab("market")} className="mt-2 text-sm font-black text-orange-500">
                    Add ingredients first →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- FULLSCREEN PANTRY SELECTOR --- */}
      {showFoodSelector && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between border-b p-4">
            <button onClick={() => setShowFoodSelector(false)} className="rounded-full p-2 active:bg-slate-100"><X size={24} /></button>
            <h3 className="font-black">Common Items</h3>
            <button onClick={() => setShowFoodSelector(false)} className="font-black text-orange-600">Done</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3 pb-10">
              {commonFoods.map(food => {
                const isSelected = marketFoods.includes(food);
                return (
                  <button 
                    key={food}
                    onClick={() => isSelected ? removeMarketFood(food) : addMarketFood(food)}
                    className={`rounded-2xl p-4 text-left text-sm font-bold transition-all active:scale-95 ${isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {food}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function WaterTracker({ intake, onAdd, onReset }) {
  const goal = 8;
  const percentage = Math.min((intake / goal) * 100, 100);

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-200/50">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-black tracking-tight">Stay Hydrated</h3>
          <p className="text-xs font-medium text-blue-100">8 glasses daily goal</p>
        </div>
        <button onClick={onReset} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><RotateCcw size={14} /></button>
      </div>

      <div className="mt-6 flex items-center gap-6">
        {/* The Bottle Visual */}
        <div className="relative h-24 w-12 overflow-hidden rounded-2xl border-2 border-white/30 bg-white/10 backdrop-blur-md">
          <div 
            className="absolute bottom-0 w-full bg-white transition-all duration-1000 ease-out"
            style={{ height: `${percentage}%` }}
          >
            <div className="absolute top-0 h-1 w-full animate-pulse bg-blue-200/50" />
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-baseline gap-1">
            <span className="text-4xl font-black">{intake}</span>
            <span className="font-bold text-blue-200">/ {goal}</span>
          </div>
          <button 
            onClick={onAdd}
            disabled={intake >= goal}
            className={`w-full rounded-2xl py-3 text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95 ${intake >= goal ? 'bg-emerald-400 text-white' : 'bg-white text-blue-600'}`}
          >
            {intake >= goal ? "Hydrated! 🎉" : "+ Add Glass"}
          </button>
        </div>
      </div>
    </section>
  );
}

function MealCard({ meal, isDone, onToggle, onRegenerate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`overflow-hidden rounded-[2rem] border transition-all duration-300 ${isDone ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between p-5" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-inner">
            {getMealEmoji(meal.key)}
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
              <Clock size={12} /> {meal.timeRange}
            </div>
            <h4 className={`font-black ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{meal.title}</h4>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${isDone ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300 active:bg-slate-200'}`}
        >
          <CheckCircle2 size={22} />
        </button>
      </div>
      
      {expanded && (
        <div className="border-t border-slate-50 px-5 pb-5 pt-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] font-black uppercase text-orange-600">
                <Utensils size={12} /> Suggestion
              </span>
              <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                <RefreshCcw size={10} /> Shuffle
              </button>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-600">{meal.guidance}</p>
            <div className="flex flex-wrap gap-1.5">
              {meal.items.map((item, i) => (
                <span key={i} className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase text-slate-500">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMealEmoji(key) {
  const emojis = { morning: "☕", afternoon: "🍲", evening: "🥣" };
  return emojis[key] || "🍱";
}