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
  "Oats",
  "Eggs",
  "Agege Bread",
  "Jollof Rice",
  "Brown Rice",
  "Beans",
  "Chicken",
  "Beef",
  "Fish (Titus/Croaker)",
  "Pasta",
  "Ugwu/Spinach",
  "Plantain (Dodo)",
  "Sweet Potatoes",
  "Pounded Yam",
  "Garri/Eba",
  "Semovita",
  "Egusi Soup",
  "Okra Soup",
  "Moin Moin",
  "Akara",
  "Avocado",
  "Garden Egg",
  "Greek Yogurt",
  "Turkey",
  "Cashew Nuts",
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
      <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/80 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 transition-all active:scale-75 hover:bg-stone-100"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-stone-800">Market to Meals</h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">
                Editable shopping list and daily menu
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateMeals}
            disabled={!profile || !marketFoods.length || isGeneratingMeals}
            className="group relative overflow-hidden rounded-2xl bg-stone-900 p-3 text-white shadow-xl shadow-stone-200 transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
            <Sparkles size={20} className="text-amber-400" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-8 px-5 pt-6">
        <section className="relative overflow-hidden rounded-[3rem] bg-stone-900 p-8 shadow-2xl">
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/20 blur-[80px]" />
          <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-stone-500">Daily Meal Load</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-6xl font-black tracking-tighter text-white tabular-nums">{totalMacro.calories}</h2>
                <span className="text-lg font-bold text-stone-500">/ {macroTarget.calories}</span>
              </div>
              <p className="mt-3 max-w-sm text-sm text-stone-400">
                Build your market list first, then spin breakfast, lunch, and dinner from what you actually plan to buy.
              </p>
            </div>
            <div className="grid w-full grid-cols-3 gap-3 md:w-auto">
              <CompactMacro label="Prot" val={totalMacro.protein} color="bg-orange-500" />
              <CompactMacro label="Carb" val={totalMacro.carbs} color="bg-blue-400" />
              <CompactMacro label="Fats" val={totalMacro.fat} color="bg-amber-400" />
            </div>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-stone-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                <Droplets size={20} />
              </div>
              <h3 className="font-bold text-stone-800">Hydration Status</h3>
            </div>
            <button
              onClick={resetWater}
              className="p-2 text-stone-300 transition-colors hover:text-orange-500"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 flex-1 gap-1.5">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-lg transition-all duration-700 ${
                    index < waterIntake ? "bg-blue-500 shadow-md shadow-blue-100" : "bg-stone-100"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={addWater}
              className="flex h-10 w-12 items-center justify-center rounded-xl bg-stone-900 text-white transition-transform active:scale-90"
            >
              <Plus size={20} />
            </button>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-orange-100 bg-orange-50/70 p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-orange-500 shadow-sm">
                <ShoppingBasket size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-stone-900">Market List</h3>
                <p className="text-xs font-medium text-orange-700/70">
                  Generate what to buy from your onboarding preferences, then edit it freely.
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateMarket}
              disabled={!profile || isGeneratingMarket}
              className="rounded-2xl bg-stone-900 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-white transition-transform disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              {isGeneratingMarket ? "Building..." : "Build List"}
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            <input
              value={customMarketFood}
              onChange={(event) => setCustomMarketFood(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddCustomMarketFood();
                }
              }}
              placeholder="Add an item to buy from the market"
              className="flex-1 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition-all focus:border-orange-300 focus:ring-4 focus:ring-orange-200/50"
            />
            <button
              onClick={handleAddCustomMarketFood}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white transition-transform active:scale-95"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setShowFoodSelector(true)}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm transition-transform active:scale-95"
            >
              <PencilLine size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {marketFoods.length ? (
              marketFoods.map((food) => (
                <button
                  key={food}
                  onClick={() => removeMarketFood(food)}
                  className="flex items-center gap-2 rounded-xl border border-orange-100/80 bg-white px-3 py-2 text-[11px] font-bold text-stone-600 shadow-sm transition-colors hover:text-red-500"
                >
                  {food}
                  <X size={12} />
                </button>
              ))
            ) : (
              <p className="text-sm italic text-stone-400">Build a market list to start planning your meals.</p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight">Today&apos;s Menu</h3>
              <p className="text-xs font-medium text-stone-500">
                Each meal can be edited item by item or regenerated from your market list.
              </p>
            </div>
            <div className="flex gap-2">
              {getMealWindows().map((slot) => (
                <button
                  key={slot.key}
                  onClick={() => setActiveSlot(slot.key)}
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeSlot === slot.key
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-200"
                      : "bg-stone-200 text-stone-500 hover:bg-stone-300"
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
                  className={`cursor-pointer transition-all duration-500 ${
                    isActive ? "scale-[1.02]" : "grayscale-[0.4] opacity-75 hover:grayscale-0 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`rounded-[2.5rem] border-2 p-6 transition-all duration-500 ${
                      isActive ? "border-orange-200 bg-white shadow-xl" : "border-transparent bg-stone-100/60"
                    }`}
                  >
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner transition-colors duration-500 ${
                            isActive ? "bg-orange-100" : "bg-white"
                          }`}
                        >
                          {getMealEmoji(meal.key)}
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <Clock size={12} className="text-stone-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                              {meal.timeRange}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold leading-tight text-stone-900">{meal.title}</h4>
                        </div>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleMealCompletion(meal.key);
                        }}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${
                          isDone
                            ? "bg-emerald-500 text-white"
                            : "bg-white text-stone-300 shadow-sm hover:text-stone-500"
                        }`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    </div>

                    <div
                      className={`overflow-hidden transition-all duration-700 ease-in-out ${
                        isActive ? "mt-4 max-h-[700px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="space-y-4 rounded-3xl border border-stone-100 bg-stone-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-orange-600">
                            <Utensils size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Meal Guidance</span>
                          </div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRegenerateMeal(meal.key);
                            }}
                            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[11px] font-bold text-stone-500 shadow-sm transition-colors hover:text-orange-500"
                          >
                            <RefreshCcw size={13} className={regeneratingSlot === meal.key ? "animate-spin" : ""} />
                            Regenerate
                          </button>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-stone-600">{meal.guidance}</p>

                        <div className="flex flex-wrap gap-2">
                          {meal.items.length ? (
                            meal.items.map((item, index) => (
                              <button
                                key={`${item}-${index}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleRemoveMealItem(meal.key, item);
                                }}
                                className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-500 shadow-sm transition-colors hover:text-red-500"
                              >
                                {item}
                                <X size={10} />
                              </button>
                            ))
                          ) : (
                            <p className="text-xs italic text-stone-400">No items in this meal yet.</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <input
                            value={customMealItems[meal.key] || ""}
                            onChange={(event) =>
                              setCustomMealItems((current) => ({ ...current, [meal.key]: event.target.value }))
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleAddMealItem(meal.key);
                              }
                            }}
                            placeholder={`Add an item to ${meal.label.toLowerCase()}`}
                            className="flex-1 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition-all focus:border-orange-200 focus:ring-4 focus:ring-orange-100"
                          />
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleAddMealItem(meal.key);
                            }}
                            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white transition-transform active:scale-95"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 pt-1">
                          <MealStat label="Cal" value={meal.macro?.calories || 0} />
                          <MealStat label="P" value={meal.macro?.protein || 0} />
                          <MealStat label="C" value={meal.macro?.carbs || 0} />
                          <MealStat label="F" value={meal.macro?.fat || 0} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="space-y-4 py-20 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
                <Sparkles size={32} className="text-stone-300" />
              </div>
              <p className="font-bold text-stone-400">Build a market list, then generate your breakfast, lunch, and dinner.</p>
            </div>
          )}
        </section>
      </main>

      {showFoodSelector && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/60 p-4 backdrop-blur-sm"
          onClick={() => setShowFoodSelector(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[3rem] bg-white p-8 shadow-2xl animate-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Add Market Items</h3>
                <p className="mt-1 text-xs font-black uppercase tracking-widest text-orange-500">
                  Tap to add or remove
                </p>
              </div>
              <button
                onClick={() => setShowFoodSelector(false)}
                className="rounded-2xl bg-stone-100 p-3 transition-colors hover:bg-stone-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="no-scrollbar mb-8 grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto pr-2">
              {commonFoods.map((food) => {
                const isSelected = marketFoods.includes(food);
                return (
                  <button
                    key={food}
                    onClick={() => (isSelected ? removeMarketFood(food) : addMarketFood(food))}
                    className={`flex items-center justify-between rounded-2xl px-4 py-4 text-left text-xs font-bold transition-all ${
                      isSelected
                        ? "scale-[0.98] bg-stone-900 text-white shadow-xl"
                        : "bg-stone-50 text-stone-500 hover:bg-stone-100"
                    }`}
                  >
                    {food}
                    {isSelected && <CheckCircle2 size={14} className="text-amber-400" />}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowFoodSelector(false)}
              className="w-full rounded-[2rem] bg-orange-500 py-5 font-black text-white shadow-lg shadow-orange-200 transition-transform active:scale-95"
            >
              Save Market List
            </button>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}

function CompactMacro({ label, val, color }) {
  return (
    <div className="min-w-[80px] rounded-2xl border border-white/5 bg-white/10 p-3 backdrop-blur-md">
      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-stone-400">{label}</p>
      <div className="flex items-center gap-1.5">
        <div className={`h-3 w-1 rounded-full ${color}`} />
        <p className="text-base font-bold tracking-tight text-white">
          {val}
          <span className="ml-0.5 text-[10px] opacity-50">g</span>
        </p>
      </div>
    </div>
  );
}

function MealStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-stone-700">{value}</p>
    </div>
  );
}

function getMealEmoji(key) {
  const emojis = { morning: "☕", afternoon: "🍲", evening: "🥣" };
  return emojis[key] || "🍱";
}
