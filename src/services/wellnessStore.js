import { create } from "zustand";

import { buildDailyMeals, buildMealFromItems, buildSuggestedMarketList, regenerateMealForSlot } from "../lib/fitnessEngine";
import { generateDailyMeals, generateGuidedWorkout, getWellness, updateWellness } from "./wellnessService";

const defaultState = {
  id: null,
  availableFoods: { market: [], morning: [], afternoon: [], evening: [] },
  fitnessLevel: "beginner",
  generatedMeals: null,
  mealCompletion: {},
  waterIntake: 0,
  macroTarget: { protein: 140, carbs: 180, fat: 55, calories: 2100 },
  workoutQueue: null,
  workoutSessions: [],
  streakDays: 0,
  sleepHours: 7,
  recoveryNotes: "",
  progressPhotos: [],
  measurements: { waist: "", chest: "", arm: "" },
  bodyScans: [],
  weightEntries: [],
  notificationPreferences: {
    pushEnabled: false,
    pushPermission: "default",
    emailEnabled: true,
    achievementAlerts: true,
  },
  uiPreferences: {
    theme: "emerald",
  },
  analytics: {
    weightSeries: [],
    plateau: "Not enough data yet.",
    consistencyScore: 0,
    goalPrediction: 0,
    weeklySummary: "",
    missedWorkoutAlert: "",
    timeline: [],
    achievements: [],
  },
  hydrated: false,
};

function mapResponse(data) {
  return {
    id: data.id,
    availableFoods: {
      ...defaultState.availableFoods,
      ...(data.available_foods || {}),
    },
    fitnessLevel: data.fitness_level || "beginner",
    generatedMeals: data.generated_meals || null,
    mealCompletion: data.meal_completion || {},
    waterIntake: data.water_intake || 0,
    macroTarget: data.macro_target || defaultState.macroTarget,
    workoutQueue: data.workout_queue || null,
    workoutSessions: data.workout_sessions || [],
    streakDays: data.streak_days || 0,
    sleepHours: data.sleep_hours || 0,
    recoveryNotes: data.recovery_notes || "",
    progressPhotos: data.progress_photos || [],
    measurements: data.measurements || defaultState.measurements,
    bodyScans: data.body_scans || [],
    weightEntries: data.weight_entries || [],
    notificationPreferences: {
      pushEnabled: Boolean(data.notification_preferences?.push_enabled),
      pushPermission: data.notification_preferences?.push_permission || "default",
      emailEnabled: data.notification_preferences?.email_enabled ?? true,
      achievementAlerts: data.notification_preferences?.achievement_alerts ?? true,
    },
    uiPreferences: {
      theme: data.ui_preferences?.theme || "emerald",
    },
    analytics: data.analytics || defaultState.analytics,
    hydrated: true,
  };
}

export const useWellnessStore = create((set, get) => ({
  ...defaultState,
  async hydrate() {
    const data = await getWellness();
    set(mapResponse(data));
  },
  async savePatch(patch) {
    const data = await updateWellness(patch);
    set(mapResponse(data));
    return data;
  },
  async setAvailableFoods(slot, foods) {
    const availableFoods = {
      ...get().availableFoods,
      [slot]: foods,
    };
    set({ availableFoods });
    await get().savePatch({ available_foods: availableFoods });
  },
  async setFitnessLevel(level) {
    set({ fitnessLevel: level });
    await get().savePatch({ fitness_level: level });
  },
  async generateMarketList(profile) {
    const foods = buildSuggestedMarketList({
      profile,
      existingFoods: get().availableFoods.market || [],
    });
    const availableFoods = {
      ...get().availableFoods,
      market: foods,
    };
    set({ availableFoods });
    await get().savePatch({ available_foods: availableFoods });
    return foods;
  },
  async generateMeals(profile) {
    const generatedMeals = buildDailyMeals({
      availableFoods: get().availableFoods,
      profile,
      previousMeals: get().generatedMeals?.meals || [],
    });
    set({ generatedMeals });
    await get().savePatch({ generated_meals: generatedMeals });
    return generatedMeals;
  },
  async refreshMealsFromServer() {
    const data = await generateDailyMeals();
    set(mapResponse(data));
    return data.generated_meals;
  },
  async updateGeneratedMeals(generatedMeals) {
    set({ generatedMeals });
    await get().savePatch({ generated_meals: generatedMeals });
    return generatedMeals;
  },
  async addMarketFood(food) {
    const trimmed = food?.trim();
    if (!trimmed) return;
    const current = get().availableFoods.market || [];
    if (current.some((entry) => entry.toLowerCase() === trimmed.toLowerCase())) return;
    await get().setAvailableFoods("market", [...current, trimmed]);
  },
  async removeMarketFood(food) {
    const current = get().availableFoods.market || [];
    await get().setAvailableFoods(
      "market",
      current.filter((entry) => entry.toLowerCase() !== food.toLowerCase()),
    );
  },
  async addMealItem(slot, food, profile) {
    const trimmed = food?.trim();
    if (!trimmed) return;
    const meals = get().generatedMeals?.meals || [];
    const updatedMeals = meals.map((meal) =>
      meal.key === slot
        ? buildMealFromItems({
            slot,
            items: [...meal.items, trimmed],
            profile,
            title: meal.title,
          })
        : meal,
    );
    await get().updateGeneratedMeals({
      ...(get().generatedMeals || {}),
      generatedAt: new Date().toISOString(),
      meals: updatedMeals,
    });
  },
  async removeMealItem(slot, food, profile) {
    const meals = get().generatedMeals?.meals || [];
    const updatedMeals = meals.map((meal) =>
      meal.key === slot
        ? buildMealFromItems({
            slot,
            items: meal.items.filter((entry) => entry.toLowerCase() !== food.toLowerCase()),
            profile,
            title: meal.title,
          })
        : meal,
    );
    await get().updateGeneratedMeals({
      ...(get().generatedMeals || {}),
      generatedAt: new Date().toISOString(),
      meals: updatedMeals,
    });
  },
  async regenerateMeal(slot, profile) {
    const generatedMeals = regenerateMealForSlot({
      slot,
      generatedMeals: get().generatedMeals,
      availableFoods: get().availableFoods,
      profile,
    });
    await get().updateGeneratedMeals(generatedMeals);
    return generatedMeals;
  },
  async toggleMealCompletion(slot) {
    const today = new Date().toISOString().slice(0, 10);
    const mealCompletion = {
      ...get().mealCompletion,
      [today]: {
        ...(get().mealCompletion[today] || {}),
        [slot]: !(get().mealCompletion[today] || {})[slot],
      },
    };
    set({ mealCompletion });
    await get().savePatch({ meal_completion: mealCompletion });
  },
  async addWater() {
    const next = Math.min(12, (get().waterIntake || 0) + 1);
    set({ waterIntake: next });
    await get().savePatch({ water_intake: next });
  },
  async resetWater() {
    set({ waterIntake: 0 });
    await get().savePatch({ water_intake: 0 });
  },
  async prepareWorkout() {
    const data = await generateGuidedWorkout();
    set(mapResponse(data));
    return data.workout_queue;
  },
  async completeWorkoutExercise(exerciseId) {
    const workoutQueue = get().workoutQueue
      ? {
          ...get().workoutQueue,
          exercises: get().workoutQueue.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, completed: true } : exercise,
          ),
        }
      : null;
    set({ workoutQueue });
    await get().savePatch({ workout_queue: workoutQueue });
  },
  async skipWorkoutExercise(exerciseId) {
    const workoutQueue = get().workoutQueue
      ? {
          ...get().workoutQueue,
          exercises: get().workoutQueue.exercises.map((exercise) =>
            exercise.id === exerciseId ? { ...exercise, skipped: true } : exercise,
          ),
        }
      : null;
    const workoutSessions = [
      {
        id: `${exerciseId}-${Date.now()}`,
        type: "skip",
        skippedAt: new Date().toISOString(),
      },
      ...get().workoutSessions,
    ];
    set({ workoutQueue, workoutSessions });
    await get().savePatch({ workout_queue: workoutQueue, workout_sessions: workoutSessions });
  },
  async finishWorkoutSession(summary) {
    const workoutSessions = [
      {
        id: `session-${Date.now()}`,
        completedAt: new Date().toISOString(),
        ...summary,
      },
      ...get().workoutSessions,
    ];
    const streakDays = (get().streakDays || 0) + 1;
    set({ workoutSessions, streakDays });
    await get().savePatch({ workout_sessions: workoutSessions, streak_days: streakDays });
  },
  async setSleepHours(hours) {
    set({ sleepHours: hours });
    await get().savePatch({ sleep_hours: hours });
  },
  async setRecoveryNotes(notes) {
    set({ recoveryNotes: notes });
    await get().savePatch({ recovery_notes: notes });
  },
  async addProgressPhoto(photo) {
    const progressPhotos = [{ id: `photo-${Date.now()}`, createdAt: new Date().toISOString(), ...photo }, ...get().progressPhotos];
    set({ progressPhotos });
    await get().savePatch({ progress_photos: progressPhotos });
  },
  async setMeasurements(measurements) {
    set({ measurements });
    await get().savePatch({ measurements });
  },
  async addBodyScan(scan) {
    const bodyScans = [{ id: `scan-${Date.now()}`, createdAt: new Date().toISOString(), ...scan }, ...get().bodyScans];
    set({ bodyScans });
    await get().savePatch({ body_scans: bodyScans });
  },
  async addWeightEntry(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return;
    const weightEntries = [...get().weightEntries, { label: new Date().toLocaleDateString(), value: number }].slice(-12);
    set({ weightEntries });
    await get().savePatch({ weight_entries: weightEntries });
  },
  async refreshAnalytics() {
    const data = await getWellness();
    set(mapResponse(data));
    return data.analytics;
  },
  async setNotificationPreferences(patch) {
    const notificationPreferences = {
      ...get().notificationPreferences,
      ...patch,
    };
    set({ notificationPreferences });
    await get().savePatch({
      notification_preferences: {
        push_enabled: notificationPreferences.pushEnabled,
        push_permission: notificationPreferences.pushPermission,
        email_enabled: notificationPreferences.emailEnabled,
        achievement_alerts: notificationPreferences.achievementAlerts,
      },
    });
  },
  async setTheme(theme) {
    const uiPreferences = {
      ...get().uiPreferences,
      theme,
    };
    set({ uiPreferences });
    await get().savePatch({
      ui_preferences: {
        theme,
      },
    });
  },
}));
