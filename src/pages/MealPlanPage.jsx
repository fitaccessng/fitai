import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Droplets,
  PencilLine,
  Plus,
  RefreshCcw,
  RotateCcw,
  ShoppingBasket,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";

import { getMealWindow, getMealWindows } from "../lib/fitnessEngine";
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
  const [activeSlot, setActiveSlot] = useState(getMealWindow().key);
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [customMarketFood, setCustomMarketFood] = useState("");
  const [customMealItems, setCustomMealItems] = useState({ morning: "", afternoon: "", evening: "" });
  const [isGeneratingMarket, setIsGeneratingMarket] = useState(false);
  const [isGeneratingMeals, setIsGeneratingMeals] = useState(false);
  const [regeneratingSlot, setRegeneratingSlot] = useState("");

  const {
    availableFoods,
    generatedMeals,
    mealCompletion,
    waterIntake,
    macroTarget,
    generateMarketList,
    generateMeals,
    updateGeneratedMeals,
    toggleMealCompletion,
    addWater,
    resetWater,
    addMarketFood,
    removeMarketFood,
    addMealItem,
    removeMealItem,
    regenerateMeal,
  } = useWellnessStore();

  useEffect(() => {
    getProfile().then(setProfile).catch(() => setProfile(null));
  }, []);

  const todayKey = new Date().toISOString().slice(0, 10);
  const meals = generatedMeals?.meals || [];
  const marketFoods = availableFoods.market || [];
  const hasMarketList = marketFoods.length > 0;

  const totalMacro = useMemo(
    () =>
      meals.reduce(
        (totals, meal) => ({
          calories: totals.calories + (meal.macro?.calories || 0),
          protein: totals.protein + (meal.macro?.protein || 0),
          carbs: totals.carbs + (meal.macro?.carbs || 0),
          fat: totals.fat + (meal.macro?.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [meals],
  );

  const handleGenerateMarket = async () => {
    if (!profile) return;
    setIsGeneratingMarket(true);
    try {
      await generateMarketList(profile);
    } finally {
      setIsGeneratingMarket(false);
    }
  };

  const handleGenerateMeals = async () => {
    if (!profile) return;
    setIsGeneratingMeals(true);
    try {
      await generateMeals(profile);
    } finally {
      setIsGeneratingMeals(false);
    }
  };

  const handleAddCustomMarketFood = async () => {
    if (!customMarketFood.trim()) return;
    await addMarketFood(customMarketFood);
    setCustomMarketFood("");
  };

  const handleAddMealItem = async (slot) => {
    const value = customMealItems[slot]?.trim();
    if (!value || !profile) return;
    await addMealItem(slot, value, profile);
    setCustomMealItems((current) => ({ ...current, [slot]: "" }));
  };

  const handleRemoveMealItem = async (slot, food) => {
    if (!profile) return;
    const targetMeal = meals.find((meal) => meal.key === slot);
    const nextItems = targetMeal?.items?.filter((item) => item.toLowerCase() !== food.toLowerCase()) || [];
    await removeMealItem(slot, food, profile);
    if (!nextItems.length) {
      const nextMeals = (generatedMeals?.meals || []).map((meal) =>
        meal.key === slot
          ? {
              ...meal,
              items: [],
              macro: { calories: 0, protein: 0, carbs: 0, fat: 0 },
              guidance: "Add items from your market list or regenerate this meal to get a fresh suggestion.",
            }
          : meal,
      );
      await updateGeneratedMeals({
        ...(generatedMeals || {}),
        generatedAt: new Date().toISOString(),
        meals: nextMeals,
      });
    }
  };

  const handleRegenerateMeal = async (slot) => {
    if (!profile) return;
    setRegeneratingSlot(slot);
    try {
      await regenerateMeal(slot, profile);
    } finally {
      setRegeneratingSlot("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] pb-32 font-sans text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/80 px-4 py-4 backdrop-blur-xl md:px-6 md:py-5">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 transition-all active:scale-75 hover:bg-stone-100"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-stone-800 md:text-2xl">Market to Meals</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-orange-500 md:text-[11px] md:tracking-[0.2em]">
                Shopping list & daily menu
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateMeals}
            disabled={!profile || !marketFoods.length || isGeneratingMeals}
            className="group relative overflow-hidden rounded-xl bg-stone-900 p-2.5 text-white shadow-lg shadow-stone-200 transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 md:rounded-2xl md:p-3"
          >
            <Sparkles size={18} className="text-amber-400 md:size-[20px]" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-6 md:space-y-8 md:px-5">
        {/* Stats Section */}
        <section className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 p-6 shadow-2xl md:rounded-[3rem] md:p-8">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/20 blur-[80px]" />
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Daily Load</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-5xl font-black tracking-tighter text-white tabular-nums md:text-6xl">{totalMacro.calories}</h2>
                <span className="text-base font-bold text-stone-500 md:text-lg">/ {macroTarget.calories}</span>
              </div>
              <p className="mt-2 max-w-xs text-xs text-stone-400 md:mt-3 md:text-sm">
                Build your market list first, then spin meals from your ingredients.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:w-auto md:gap-3">
              <CompactMacro label="Prot" val={totalMacro.protein} color="bg-orange-500" />
              <CompactMacro label="Carb" val={totalMacro.carbs} color="bg-blue-400" />
              <CompactMacro label="Fats" val={totalMacro.fat} color="bg-amber-400" />
            </div>
          </div>
        </section>

        {/* Hydration */}
        <section className="rounded-[2rem] border border-stone-100 bg-white p-5 shadow-sm md:rounded-[2.5rem] md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Droplets size={18} />
              </div>
              <h3 className="text-sm font-bold text-stone-800 md:text-base">Hydration</h3>
            </div>
            <button onClick={resetWater} className="p-2 text-stone-300 hover:text-orange-500">
              <RotateCcw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 flex-1 gap-1 md:h-10 md:gap-1.5">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-md transition-all duration-700 ${
                    index < waterIntake ? "bg-blue-500 shadow-sm" : "bg-stone-100"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={addWater}
              className="flex h-8 w-10 items-center justify-center rounded-lg bg-stone-900 text-white active:scale-90 md:h-10 md:w-12 md:rounded-xl"
            >
              <Plus size={18} />
            </button>
          </div>
        </section>

        {/* Market List */}
        <section className="rounded-[2rem] border border-orange-100 bg-orange-50/70 p-5 md:rounded-[2.5rem] md:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2.5 text-orange-500 shadow-sm md:rounded-2xl md:p-3">
                <ShoppingBasket size={20} />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-stone-900 md:text-lg">Market List</h3>
                <p className="text-[10px] font-medium text-orange-700/70 md:text-xs">
                  What to buy from the market.
                </p>
              </div>
            </div>
            <button
              onClick={hasMarketList ? () => setShowFoodSelector(true) : handleGenerateMarket}
              disabled={!profile || isGeneratingMarket}
              className="w-full rounded-xl bg-stone-900 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-40 sm:w-auto sm:px-4"
            >
              {isGeneratingMarket ? "Building..." : hasMarketList ? "Go To Market" : "Build List"}
            </button>
          </div>

          {hasMarketList ? (
            <button
              onClick={() => setShowFoodSelector(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-100 bg-white px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm active:scale-[0.99]"
            >
              <ShoppingBasket size={16} />
              Go To Market
            </button>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <input
                  value={customMarketFood}
                  onChange={(event) => setCustomMarketFood(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && handleAddCustomMarketFood()}
                  placeholder="Add item..."
                  className="min-w-0 flex-1 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddCustomMarketFood} className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white active:scale-95">
                    <Plus size={18} />
                  </button>
                  <button onClick={() => setShowFoodSelector(true)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm active:scale-95">
                    <PencilLine size={18} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <p className="text-xs italic text-stone-400">List is empty.</p>
              </div>
            </>
          )}
        </section>

        {/* Menu Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black tracking-tight md:text-xl">Today&apos;s Menu</h3>
            </div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {getMealWindows().map((slot) => (
                <button
                  key={slot.key}
                  onClick={() => setActiveSlot(slot.key)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                    activeSlot === slot.key
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                      : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {slot.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {meals.length ? (
            meals.map((meal) => {
              const isDone = Boolean(mealCompletion[todayKey]?.[meal.key]);
              const isActive = meal.key === activeSlot;

              return (
                <div
                  key={meal.key}
                  onClick={() => setActiveSlot(meal.key)}
                  className={`transition-all duration-300 ${isActive ? "scale-[1.01]" : "opacity-70"}`}
                >
                  <div className={`rounded-[2rem] border-2 p-5 transition-all md:rounded-[2.5rem] md:p-6 ${isActive ? "border-orange-200 bg-white shadow-lg" : "border-transparent bg-stone-100/60"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl shadow-inner md:h-14 md:w-14 ${isActive ? "bg-orange-100" : "bg-white"}`}>
                          {getMealEmoji(meal.key)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 text-stone-400">
                            <Clock size={10} />
                            <span className="text-[9px] font-black uppercase tracking-widest">{meal.timeRange}</span>
                          </div>
                          <h4 className="text-base font-bold text-stone-900 md:text-lg">{meal.title}</h4>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleMealCompletion(meal.key); }}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all md:h-12 md:w-12 ${isDone ? "bg-emerald-500 text-white" : "bg-white text-stone-300 shadow-sm"}`}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>

                    {isActive && (
                      <div className="mt-5 space-y-4 animate-slide-up">
                        <div className="rounded-2xl bg-stone-50 p-4 space-y-4 border border-stone-100">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-orange-600">
                                <Utensils size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Guide</span>
                             </div>
                             <button onClick={(e) => { e.stopPropagation(); handleRegenerateMeal(meal.key); }} className="text-[10px] font-bold flex items-center gap-1 text-stone-500">
                                <RefreshCcw size={12} className={regeneratingSlot === meal.key ? "animate-spin" : ""} /> Spin
                             </button>
                          </div>
                          <p className="text-xs font-medium text-stone-600">{meal.guidance}</p>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {meal.items.map((item, i) => (
                              <span key={i} className="flex items-center gap-1 rounded-lg bg-white border border-stone-200 px-2 py-1 text-[10px] font-bold text-stone-500">
                                {item} <X size={8} onClick={(e) => { e.stopPropagation(); handleRemoveMealItem(meal.key, item); }} />
                              </span>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              value={customMealItems[meal.key] || ""}
                              onChange={(e) => setCustomMealItems({...customMealItems, [meal.key]: e.target.value})}
                              placeholder="Add food..."
                              className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none"
                            />
                            <button onClick={(e) => { e.stopPropagation(); handleAddMealItem(meal.key); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-stone-900 text-white shrink-0">
                                <Plus size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            <MealStat label="Cal" value={meal.macro?.calories || 0} />
                            <MealStat label="P" value={meal.macro?.protein || 0} />
                            <MealStat label="C" value={meal.macro?.carbs || 0} />
                            <MealStat label="F" value={meal.macro?.fat || 0} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
             <div className="py-12 text-center text-stone-400 font-bold">No meals yet.</div>
          )}
        </section>
      </main>

      {showFoodSelector && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-0 sm:p-4 backdrop-blur-sm" onClick={() => setShowFoodSelector(false)}>
          <div className="w-full max-w-xl rounded-t-[2.5rem] bg-white p-6 shadow-2xl animate-slide-up sm:rounded-[3rem] md:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black">Market Pantry</h3>
                <button onClick={() => setShowFoodSelector(false)} className="rounded-full bg-stone-100 p-2"><X size={20} /></button>
            </div>
            <div className="no-scrollbar mb-6 grid grid-cols-2 gap-2 overflow-y-auto max-h-[50vh]">
              {commonFoods.map((food) => {
                const isSelected = marketFoods.includes(food);
                return (
                  <button key={food} onClick={() => isSelected ? removeMarketFood(food) : addMarketFood(food)} className={`rounded-xl px-4 py-3 text-left text-[10px] font-bold transition-all ${isSelected ? "bg-stone-900 text-white" : "bg-stone-50 text-stone-500"}`}>
                    {food}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowFoodSelector(false)} className="w-full rounded-2xl bg-orange-500 py-4 font-black text-white shadow-lg">Save Changes</button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

function CompactMacro({ label, val, color }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/10 p-2 md:rounded-2xl md:p-3">
      <p className="mb-0.5 text-[8px] font-black uppercase tracking-widest text-stone-400 md:mb-1 md:text-[9px]">{label}</p>
      <div className="flex items-center gap-1">
        <div className={`h-2.5 w-1 rounded-full ${color}`} />
        <p className="text-xs font-bold text-white md:text-base">{val}<span className="text-[8px] opacity-50">g</span></p>
      </div>
    </div>
  );
}

function MealStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-2 text-center shadow-sm border border-stone-100">
      <p className="text-[8px] font-black uppercase text-stone-400">{label}</p>
      <p className="text-xs font-bold text-stone-700">{value}</p>
    </div>
  );
}

function getMealEmoji(key) {
  const emojis = { morning: "☕", afternoon: "🍲", evening: "🥣" };
  return emojis[key] || "🍱";
}
