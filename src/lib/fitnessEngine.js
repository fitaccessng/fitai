const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MEAL_WINDOWS = [
  { key: "morning", label: "Morning meal", start: 5, end: 11, slotLabel: "Morning" },
  { key: "afternoon", label: "Afternoon meal", start: 12, end: 16, slotLabel: "Afternoon" },
  { key: "evening", label: "Evening meal", start: 17, end: 23, slotLabel: "Evening" },
];

const macroDefaults = {
  oats: { calories: 280, protein: 10, carbs: 48, fat: 5 },
  eggs: { calories: 155, protein: 13, carbs: 1, fat: 11 },
  bread: { calories: 160, protein: 5, carbs: 28, fat: 2 },
  rice: { calories: 205, protein: 4, carbs: 45, fat: 0 },
  beans: { calories: 180, protein: 12, carbs: 32, fat: 1 },
  chicken: { calories: 220, protein: 35, carbs: 0, fat: 6 },
  beef: { calories: 250, protein: 26, carbs: 0, fat: 15 },
  fish: { calories: 200, protein: 30, carbs: 0, fat: 8 },
  pasta: { calories: 260, protein: 9, carbs: 50, fat: 3 },
  vegetables: { calories: 80, protein: 4, carbs: 14, fat: 1 },
  fruits: { calories: 95, protein: 1, carbs: 25, fat: 0 },
  milk: { calories: 120, protein: 8, carbs: 12, fat: 5 },
  yogurt: { calories: 140, protein: 12, carbs: 8, fat: 4 },
  potatoes: { calories: 160, protein: 4, carbs: 37, fat: 0 },
  nuts: { calories: 180, protein: 6, carbs: 6, fat: 15 },
  avocado: { calories: 160, protein: 2, carbs: 9, fat: 15 },
  plantain: { calories: 180, protein: 2, carbs: 47, fat: 0 },
  turkey: { calories: 190, protein: 29, carbs: 0, fat: 7 },
  salad: { calories: 70, protein: 2, carbs: 9, fat: 3 },
};

const MARKET_SEEDS = {
  lean: ["Oats", "Eggs", "Greek Yogurt", "Ugwu/Spinach", "Sweet Potatoes", "Fish (Titus/Croaker)"],
  muscular: ["Brown Rice", "Chicken", "Eggs", "Greek Yogurt", "Plantain (Dodo)", "Avocado"],
  toned: ["Beans", "Fish (Titus/Croaker)", "Sweet Potatoes", "Ugwu/Spinach", "Avocado", "Moin Moin"],
};

const SLOT_MEAL_TEMPLATES = {
  morning: [
    { title: "Protein breakfast", picks: ["oat", "egg", "fruit"] },
    { title: "Morning market plate", picks: ["bread", "egg", "avocado"] },
    { title: "Smooth start bowl", picks: ["yogurt", "fruit", "nut"] },
    { title: "Naija breakfast boost", picks: ["plantain", "egg", "bean"] },
  ],
  afternoon: [
    { title: "Power lunch", picks: ["rice", "chicken", "vegetable"] },
    { title: "Midday balance plate", picks: ["bean", "fish", "vegetable"] },
    { title: "Market bowl lunch", picks: ["pasta", "turkey", "salad"] },
    { title: "Hearty lunch combo", picks: ["yam", "beef", "vegetable"] },
  ],
  evening: [
    { title: "Recovery dinner", picks: ["fish", "vegetable", "potato"] },
    { title: "Light close-out plate", picks: ["chicken", "salad", "avocado"] },
    { title: "Comfort dinner", picks: ["bean", "plantain", "vegetable"] },
    { title: "Family dinner bowl", picks: ["rice", "turkey", "soup"] },
  ],
};

const EXERCISE_LIBRARY = {
  lean: {
    upper: ["Push-ups", "Incline dumbbell press", "Resistance band row", "Shoulder taps", "Plank"],
    lower: ["Bodyweight squats", "Walking lunges", "Step-ups", "Glute bridges", "Calf raises"],
    full: ["Burpees", "Mountain climbers", "Jump rope", "Bear crawl", "Dead bug"],
  },
  toned: {
    upper: ["Bench press", "Seated row", "Arnold press", "Cable fly", "Russian twists"],
    lower: ["Goblet squats", "Romanian deadlift", "Bulgarian split squat", "Leg press", "Hamstring curl"],
    full: ["Kettlebell swings", "Battle ropes", "Sled push", "High knees", "Bicycle crunches"],
  },
  muscular: {
    upper: ["Bench press", "Pull-ups", "Overhead press", "Bent-over row", "Weighted dips"],
    lower: ["Barbell squat", "Deadlift", "Leg press", "Hip thrust", "Leg extension"],
    full: ["Thrusters", "Farmer carry", "Box jumps", "Medicine ball slams", "Hanging knee raises"],
  },
};

export function getTodayName(date = new Date()) {
  return DAY_NAMES[date.getDay()];
}

export function getMealWindow(hour = new Date().getHours()) {
  return MEAL_WINDOWS.find((window) => hour >= window.start && hour <= window.end) ?? MEAL_WINDOWS[2];
}

export function getMealWindows() {
  return MEAL_WINDOWS;
}

export function normaliseFoodList(items) {
  return items
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

export function buildSuggestedMarketList({ profile, existingFoods = [] }) {
  const preferences = parseDietaryPreferences(profile?.dietary_habits);
  const goal = determineGoal(profile);
  const bodyType = profile?.desired_body_type || "toned";
  const seeds = MARKET_SEEDS[bodyType] || MARKET_SEEDS.toned;
  const merged = uniqueDisplayFoods([
    ...existingFoods,
    ...preferences.regularFoods,
    ...seeds,
    ...buildGoalFoods(goal),
  ]);

  return applyRestrictions(merged, preferences.restrictions).slice(0, 14);
}

export function buildDailyMeals({ availableFoods = {}, profile, date = new Date(), previousMeals = null }) {
  const today = getTodayName(date);
  const marketFoods = uniqueDisplayFoods([
    ...(availableFoods.market || []),
    ...(availableFoods.morning || []),
    ...(availableFoods.afternoon || []),
    ...(availableFoods.evening || []),
  ]);
  const preferences = parseDietaryPreferences(profile?.dietary_habits);
  const windows = getMealWindows().map((window) =>
    buildMealForWindow({
      window,
      marketFoods,
      slotFoods: availableFoods[window.key] || [],
      previousMeal: previousMeals?.find((meal) => meal.key === window.key) || null,
      profile,
      preferences,
    }),
  );

  return {
    day: today,
    generatedAt: new Date().toISOString(),
    marketFoods,
    meals: windows,
  };
}

export function regenerateMealForSlot({ slot, generatedMeals, availableFoods = {}, profile }) {
  const existingMeals = generatedMeals?.meals || [];
  const targetWindow = getMealWindows().find((window) => window.key === slot);
  if (!targetWindow) {
    return generatedMeals;
  }

  const nextMeal = buildMealForWindow({
    window: targetWindow,
    marketFoods: uniqueDisplayFoods([
      ...(availableFoods.market || []),
      ...(availableFoods[targetWindow.key] || []),
    ]),
    slotFoods: availableFoods[targetWindow.key] || [],
    previousMeal: existingMeals.find((meal) => meal.key === slot) || null,
    profile,
    preferences: parseDietaryPreferences(profile?.dietary_habits),
  });

  return {
    ...(generatedMeals || {
      day: getTodayName(),
      generatedAt: new Date().toISOString(),
      meals: [],
    }),
    generatedAt: new Date().toISOString(),
    meals: getMealWindows().map(
      (window) => existingMeals.find((meal) => meal.key === window.key) || nextMeal,
    ).map((meal) => (meal.key === slot ? nextMeal : meal)),
  };
}

export function buildMealFromItems({ slot, items = [], profile, title = null }) {
  const window = getMealWindows().find((entry) => entry.key === slot) || getMealWindows()[0];
  const cleanItems = uniqueDisplayFoods(items);
  const goal = determineGoal(profile);

  return {
    key: window.key,
    title: title || buildMealTitle(window.slotLabel, goal),
    label: window.label,
    day: getTodayName(),
    timeRange: getTimeRange(window.key),
    items: cleanItems,
    macro: calculateMacro(cleanItems),
    guidance: buildMealGuidance(goal, parseDietaryPreferences(profile?.dietary_habits)),
    completed: false,
  };
}

function getTimeRange(slot) {
  if (slot === "morning") return "6:00 AM - 11:00 AM";
  if (slot === "afternoon") return "12:00 PM - 4:00 PM";
  return "5:00 PM - 9:00 PM";
}

export function buildWorkoutQueue(profile, durationMinutes = 30) {
  const bodyType = profile?.desired_body_type || "toned";
  const gymAccess = Boolean(profile?.has_gym_access);
  const library = EXERCISE_LIBRARY[bodyType] || EXERCISE_LIBRARY.toned;
  const splitOrder = ["upper", "lower", "full"];
  const dayIndex = new Date().getDay();
  const focus = dayIndex % 3 === 1 ? "lower" : splitOrder[dayIndex % splitOrder.length];
  const focusLabel = focus === "lower" ? "Leg day" : focus === "upper" ? "Upper body" : "Conditioning";
  const examples = library[focus];
  const secondsPerExercise = durationMinutes <= 25 ? 45 : 60;

  return {
    focus,
    focusLabel,
    note: `${gymAccess ? "Gym" : "Home"} session based on your onboarding picks. One move at a time.`,
    exercises: examples.map((exercise, index) => ({
      id: `${focus}-${index}-${exercise}`.toLowerCase().replace(/\s+/g, "-"),
      exercise_name: exercise,
      duration_seconds: secondsPerExercise,
      sets: focus === "full" ? 3 : 4,
      reps: focus === "full" ? "40 sec" : focus === "lower" ? "10-12" : "8-12",
      example: getExerciseExample(exercise, gymAccess),
      skipped: false,
      completed: false,
    })),
  };
}

function getExerciseExample(exercise, gymAccess) {
  const equipmentLine = gymAccess ? "Control the lowering phase and use clean form." : "Use bodyweight or a backpack/band if you need resistance.";
  return `${exercise}: keep your chest proud, brace your core, and move through a full range. ${equipmentLine}`;
}

function buildMealForWindow({ window, marketFoods, slotFoods, previousMeal, profile, preferences }) {
  const goal = determineGoal(profile);
  const restrictionSafeFoods = applyRestrictions(uniqueDisplayFoods([...slotFoods, ...marketFoods]), preferences.restrictions);
  const templates = SLOT_MEAL_TEMPLATES[window.key];
  const rankedTemplates = rotateTemplates(templates, previousMeal);
  const selectedTemplate =
    rankedTemplates.find((template) => template.picks.some((pick) => restrictionSafeFoods.some((food) => matchesFoodPick(food, pick)))) ||
    rankedTemplates[0];

  const pickedItems = uniqueDisplayFoods(
    selectedTemplate.picks
      .map((pick) => restrictionSafeFoods.find((food) => matchesFoodPick(food, pick)))
      .filter(Boolean),
  );

  const fallbackPool = buildFallbackPool(window.key, restrictionSafeFoods, preferences.regularFoods);
  const finalItems = uniqueDisplayFoods([...(pickedItems.length ? pickedItems : fallbackPool.slice(0, 3)), ...fallbackPool]).slice(0, 4);

  return {
    key: window.key,
    title: `${window.slotLabel} ${selectedTemplate.title.toLowerCase()}`,
    label: window.label,
    day: getTodayName(),
    timeRange: getTimeRange(window.key),
    items: finalItems,
    macro: calculateMacro(finalItems),
    guidance: buildMealGuidance(goal, preferences),
    completed: false,
  };
}

function parseDietaryPreferences(habits = "") {
  const regularFoodsMatch = habits.match(/Regular foods:\s*([^|]+)/i);
  const restrictionsMatch = habits.match(/Restrictions:\s*([^|]+)/i);

  return {
    regularFoods: regularFoodsMatch ? splitPreferenceList(regularFoodsMatch[1]) : [],
    restrictions: restrictionsMatch ? splitPreferenceList(restrictionsMatch[1]) : [],
  };
}

function splitPreferenceList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

function buildGoalFoods(goal) {
  if (goal === "gain") {
    return ["Brown Rice", "Chicken", "Sweet Potatoes", "Avocado"];
  }
  if (goal === "lose") {
    return ["Ugwu/Spinach", "Fish (Titus/Croaker)", "Greek Yogurt", "Beans"];
  }
  return ["Eggs", "Plantain (Dodo)", "Moin Moin", "Garden Egg"];
}

function applyRestrictions(items, restrictions = []) {
  const normalizedRestrictions = restrictions.map((entry) => entry.toLowerCase());
  if (!normalizedRestrictions.length || normalizedRestrictions.includes("none")) {
    return items;
  }

  return items.filter((item) => {
    const normalized = item.toLowerCase();
    if (normalizedRestrictions.includes("vegetarian")) {
      return !/(chicken|beef|fish|turkey)/.test(normalized);
    }
    if (normalizedRestrictions.includes("vegan")) {
      return !/(egg|yogurt|milk|chicken|beef|fish|turkey)/.test(normalized);
    }
    if (normalizedRestrictions.includes("low carb")) {
      return !/(bread|rice|pasta|yam|potato|plantain|garri|eba|semovita)/.test(normalized);
    }
    return true;
  });
}

function uniqueDisplayFoods(items) {
  return items
    .map((item) => item?.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index);
}

function rotateTemplates(templates, previousMeal) {
  if (!previousMeal?.items?.length) {
    return templates;
  }

  const previous = previousMeal.items.map((item) => item.toLowerCase());
  return [...templates].sort((left, right) => {
    const leftScore = left.picks.filter((pick) => previous.some((item) => item.includes(pick))).length;
    const rightScore = right.picks.filter((pick) => previous.some((item) => item.includes(pick))).length;
    return leftScore - rightScore;
  });
}

function buildFallbackPool(slot, marketFoods, regularFoods) {
  const combined = uniqueDisplayFoods([...marketFoods, ...regularFoods]);
  const slotMatchers = {
    morning: ["egg", "oat", "bread", "yogurt", "fruit", "plantain", "bean", "moin"],
    afternoon: ["rice", "bean", "chicken", "fish", "vegetable", "pasta", "yam", "beef"],
    evening: ["fish", "vegetable", "salad", "avocado", "bean", "turkey", "rice", "soup"],
  };
  const matches = combined.filter((food) => slotMatchers[slot].some((pick) => matchesFoodPick(food, pick)));
  return matches.length ? matches : combined;
}

function matchesFoodPick(food, pick) {
  const normalized = food.toLowerCase();
  const matchers = {
    oat: /(oat)/,
    egg: /(egg|akara|moin)/,
    fruit: /(fruit|avocado|garden egg)/,
    bread: /(bread)/,
    yogurt: /(yogurt|milk)/,
    nut: /(nut|cashew)/,
    plantain: /(plantain|dodo)/,
    bean: /(bean|moin|akara)/,
    rice: /(rice|jollof)/,
    chicken: /(chicken)/,
    vegetable: /(spinach|ugwu|okra|salad|garden egg|vegetable)/,
    fish: /(fish|croaker|titus)/,
    pasta: /(pasta)/,
    turkey: /(turkey)/,
    salad: /(salad|avocado|garden egg)/,
    yam: /(yam|sweet potato|potato)/,
    beef: /(beef)/,
    potato: /(potato|sweet potato)/,
    soup: /(soup|egusi|okra)/,
  };
  return (matchers[pick] || new RegExp(pick)).test(normalized);
}

function calculateMacro(items) {
  return items.reduce(
    (totals, food) => {
      const unit = resolveMacro(food);
      return {
        calories: totals.calories + unit.calories,
        protein: totals.protein + unit.protein,
        carbs: totals.carbs + unit.carbs,
        fat: totals.fat + unit.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function resolveMacro(food) {
  const normalized = food.toLowerCase();
  const aliasMap = [
    ["oats", "oats"],
    ["egg", "eggs"],
    ["bread", "bread"],
    ["rice", "rice"],
    ["bean", "beans"],
    ["chicken", "chicken"],
    ["beef", "beef"],
    ["fish", "fish"],
    ["croaker", "fish"],
    ["titus", "fish"],
    ["pasta", "pasta"],
    ["spinach", "vegetables"],
    ["ugwu", "vegetables"],
    ["okra", "vegetables"],
    ["fruit", "fruits"],
    ["garden egg", "fruits"],
    ["milk", "milk"],
    ["yogurt", "yogurt"],
    ["potato", "potatoes"],
    ["yam", "potatoes"],
    ["cashew", "nuts"],
    ["nut", "nuts"],
    ["avocado", "avocado"],
    ["plantain", "plantain"],
    ["turkey", "turkey"],
    ["salad", "salad"],
  ];
  const alias = aliasMap.find(([matcher]) => normalized.includes(matcher))?.[1];
  return macroDefaults[alias] || { calories: 120, protein: 6, carbs: 12, fat: 4 };
}

function determineGoal(profile) {
  if (profile?.target_weight && profile?.weight) {
    if (profile.target_weight > profile.weight) return "gain";
    if (profile.target_weight < profile.weight) return "lose";
  }
  return "maintain";
}

function buildMealTitle(slotLabel, goal) {
  if (goal === "gain") return `${slotLabel} fuel`;
  if (goal === "lose") return `${slotLabel} lean plate`;
  return `${slotLabel} balance plate`;
}

function buildMealGuidance(goal, preferences) {
  const restrictionLine =
    preferences.restrictions.length && !preferences.restrictions.includes("None")
      ? ` Built around your ${preferences.restrictions.join(", ").toLowerCase()} preference.`
      : "";

  if (goal === "gain") {
    return `Push protein and carbs a little higher to support training.${restrictionLine}`;
  }
  if (goal === "lose") {
    return `Keep the plate high-volume and protein-forward.${restrictionLine}`;
  }
  return `Aim for a steady plate you can repeat consistently.${restrictionLine}`;
}

export function buildAnalytics({ logs = [], profile, state }) {
  const today = new Date();
  const weightSeries = state.weightEntries?.length
    ? state.weightEntries
    : buildFallbackWeights(profile?.weight, profile?.target_weight);

  const completedWorkouts = state.workoutSessions?.filter((session) => session.completedAt).length || 0;
  const skippedWorkouts = state.workoutSessions?.filter((session) => session.skippedAt).length || 0;
  const mealCompletions = Object.values(state.mealCompletion?.[getISODate(today)] || {}).filter(Boolean).length;
  const consistencyScore = Math.min(
    100,
    Math.round(completedWorkouts * 12 + mealCompletions * 6 + Math.min(state.waterIntake || 0, 8) * 2),
  );
  const plateau = detectPlateau(weightSeries);
  const weeksRemaining = estimateWeeksRemaining(weightSeries, profile);

  return {
    weightSeries,
    plateau,
    consistencyScore,
    goalPrediction: weeksRemaining,
    weeklySummary: `At your current consistency, you may reach your target in ${weeksRemaining} weeks.`,
    missedWorkoutAlert:
      skippedWorkouts >= 2 ? `You skipped ${skippedWorkouts} workouts this week.` : "You are staying close to plan.",
    timeline: buildTimeline(logs, state),
  };
}

function buildFallbackWeights(currentWeight, targetWeight) {
  const start = Number(currentWeight) || 80;
  const target = Number(targetWeight) || start - 5;
  const delta = (target - start) / 5;
  return Array.from({ length: 6 }, (_, index) => ({
    label: `W${index + 1}`,
    value: Number((start + delta * index).toFixed(1)),
  }));
}

function detectPlateau(weightSeries) {
  if (weightSeries.length < 3) return "Not enough data yet.";
  const lastThree = weightSeries.slice(-3).map((entry) => entry.value);
  const spread = Math.max(...lastThree) - Math.min(...lastThree);
  return spread < 0.4 ? "Plateau detected. Consider changing calories, sleep, or training intensity." : "No plateau detected.";
}

function estimateWeeksRemaining(weightSeries, profile) {
  const target = Number(profile?.target_weight);
  const current = weightSeries.at(-1)?.value;
  const previous = weightSeries.at(-3)?.value ?? weightSeries[0]?.value ?? current;

  if (!target || !current || current === target) return 0;
  const pace = Math.max(Math.abs((current - previous) / 3), 0.2);
  return Math.max(1, Math.ceil(Math.abs(current - target) / pace));
}

function buildTimeline(logs, state) {
  const photoCount = state.progressPhotos?.length || 0;
  const scanCount = state.bodyScans?.length || 0;
  return [
    { label: "Logged sessions", value: logs.length + (state.workoutSessions?.length || 0) },
    { label: "Progress photos", value: photoCount },
    { label: "Body scans", value: scanCount },
    { label: "Current streak", value: state.streakDays || 0 },
  ];
}

export function getISODate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getAchievementProgress(state) {
  const streak = state.streakDays || 0;
  const weightLost = Math.max(0, (state.weightEntries?.[0]?.value || 0) - (state.weightEntries?.at(-1)?.value || 0));
  return [
    { label: "25% completed", unlocked: (state.analytics?.consistencyScore || 0) >= 25 },
    { label: "First 5kg lost", unlocked: weightLost >= 5 },
    { label: "First 30-day streak", unlocked: streak >= 30 },
  ];
}
