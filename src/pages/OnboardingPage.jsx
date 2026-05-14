import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { generateMealPlan, generateWorkout } from "../services/planService";
import { updateProfile } from "../services/profileService";
import { updateWellness } from "../services/wellnessService";

const TOTAL_STEPS = 5;

const stepInfo = [
  {
    step: 1,
    title: "Basic Profile",
    subtitle: "Let's start with the basics",
    icon: "👤",
    bgGradient: "from-emerald-900/80 via-emerald-800/60 to-emerald-900/90",
    bgEmoji: "🏃‍♂️",
    bgImages: ["👤", "📏", "⚖️", "🎂", "📋"],
  },
  {
    step: 2,
    title: "Goal Definition",
    subtitle: "What do you want to achieve?",
    icon: "🎯",
    bgGradient: "from-blue-900/80 via-blue-800/60 to-blue-900/90",
    bgEmoji: "🎯",
    bgImages: ["💪", "🏆", "📈", "⚡", "🎯"],
  },
  {
    step: 3,
    title: "Lifestyle & Activity",
    subtitle: "How do you move through your day?",
    icon: "🏃",
    bgGradient: "from-orange-900/80 via-orange-800/60 to-orange-900/90",
    bgEmoji: "🏋️",
    bgImages: ["🏋️", "🚶", "🏃", "🧘", "🚴"],
  },
  {
    step: 4,
    title: "Food Intelligence",
    subtitle: "Let's understand your eating habits",
    icon: "🍎",
    bgGradient: "from-purple-900/80 via-purple-800/60 to-purple-900/90",
    bgEmoji: "🥗",
    bgImages: ["🍎", "🥗", "🍕", "🥩", "🥦"],
  },
  {
    step: 5,
    title: "Habits & Commitment",
    subtitle: "Final touches for your success",
    icon: "⚡",
    bgGradient: "from-red-900/80 via-red-800/60 to-red-900/90",
    bgEmoji: "🌟",
    bgImages: ["💧", "😴", "🌅", "🔔", "💪"],
  },
];

const getInitialForm = (user) => ({
  name: user?.full_name || "",
  age: "",
  gender: "",
  height: "",
  current_weight: "",
  goal: "",
  target_weight: "",
  body_type: "",
  result_speed: "",
  has_gym_access: null,
  workout_days: "",
  workout_duration: "",
  activity_level: "",
  fitness_level: "",
  regular_foods: [],
  junk_food_frequency: "",
  dietary_restrictions: [],
  meals_per_day: "",
  water_intake: "",
  wake_time: "",
  sleep_time: "",
  workout_preference: "",
  want_reminders: null,
  biggest_obstacle: "",
});

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(() => getInitialForm(user));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStepData = stepInfo[currentStep];

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1 && !isAnimating) {
      setDirection("forward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && !isAnimating) {
      setDirection("back");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Profile payload - stores basic metrics and goals
      const profilePayload = {
        full_name: form.name?.trim() || user?.full_name || null,
        age: toNumberOrNull(form.age),
        gender: form.gender || null,
        height: toNumberOrNull(form.height),
        weight: toNumberOrNull(form.current_weight),
        target_weight: toNumberOrNull(form.target_weight),
        desired_body_type: mapBodyType(form.body_type),
        has_gym_access: form.has_gym_access,
        daily_workout_minutes: toWorkoutMinutes(form.workout_days, form.workout_duration),
        dietary_habits: buildDietaryHabits(form),
      };

      // Wellness payload - stores detailed preferences and habits
      const wellnessPayload = {
        fitness_level: form.fitness_level || "beginner",
        ...buildWellnessPreferences(form),
      };

      // Save all information
      const updated = await updateProfile(profilePayload);
      await updateWellness(wellnessPayload);
      await Promise.all([generateMealPlan(), generateWorkout()]);
      setUser(updated);
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-stone-900">
      {/* Dynamic Background Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient overlay based on current step */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.bgGradient} z-10 transition-all duration-500`} />

        {/* Background pattern grid */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="grid grid-cols-8 gap-2 p-4">
            {[...Array(64)].map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-white"
                style={{
                  opacity: Math.random() * 0.5 + 0.1,
                  transform: `scale(${Math.random() * 1.5 + 0.5})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating background images for current step */}
        <div className="absolute inset-0 z-[5]">
          {currentStepData.bgImages.map((emoji, index) => (
            <div
              key={index}
              className="absolute text-6xl opacity-30"
              style={{
                top: `${15 + index * 18}%`,
                left: `${10 + (index % 3) * 30}%`,
                animation: `float ${3 + index}s ease-in-out infinite`,
                animationDelay: `${index * 0.7}s`,
                transform: `rotate(${index * 15}deg)`,
              }}
            >
              {emoji}
            </div>
          ))}

          {/* Floating circles */}
          <div className="absolute top-10 right-10 h-20 w-20 rounded-full bg-white/10 blur-xl animate-pulse" />
          <div className="absolute bottom-40 left-5 h-24 w-24 rounded-full bg-white/5 blur-xl animate-pulse delay-700" />
          <div className="absolute top-1/2 right-5 h-16 w-16 rounded-full bg-white/10 blur-xl animate-pulse delay-1000" />

          {/* Large background emoji */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] opacity-10 select-none">
            {currentStepData.bgEmoji}
          </div>

          {/* Decorative lines */}
          <svg className="absolute inset-0 h-full w-full opacity-5" viewBox="0 0 100 100">
            <circle cx="80" cy="20" r="15" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="20" cy="70" r="10" fill="none" stroke="white" strokeWidth="0.5" />
            <path d="M0,30 Q30,10 60,30 T100,30" fill="none" stroke="white" strokeWidth="0.3" />
            <path d="M10,80 Q40,50 70,80 T100,80" fill="none" stroke="white" strokeWidth="0.3" />
          </svg>
        </div>
      </div>

      {/* Hero Content Above Sheet */}
      <div className="relative z-20 flex-1 flex flex-col justify-center px-6 pb-4">
        <div className="text-center">
          {/* Animated icon */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
            <span className="text-4xl animate-bounce">{currentStepData.icon}</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-base text-white/70 max-w-xs mx-auto">
            {currentStepData.subtitle}
          </p>

          {/* Step Progress Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {stepInfo.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (index < currentStep) {
                    setDirection("back");
                    setCurrentStep(index);
                  }
                }}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? "w-8 bg-white"
                    : index < currentStep
                    ? "w-2.5 bg-white/60 cursor-pointer hover:bg-white/80"
                    : "w-2.5 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="relative z-20 w-full animate-slide-up">
        <div className="relative mx-auto w-full max-w-lg rounded-t-[2.5rem] bg-white/95 backdrop-blur-2xl shadow-2xl">
          {/* Drag Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-stone-300" />
          </div>

          {/* Progress bar */}
          <div className="px-6 mb-4">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-stone-700 to-stone-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs text-stone-400">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </p>
          </div>

          {/* Sheet Content */}
          <div className="px-6 pb-8 max-h-[55vh] overflow-y-auto">
            {/* Animated step content */}
            <div
              key={currentStep}
              className={`${
                direction === "forward" ? "animate-slide-forward" : "animate-slide-back"
              }`}
            >
              {currentStep === 0 && (
                <Step1BasicProfile form={form} updateForm={updateForm} />
              )}
              {currentStep === 1 && (
                <Step2GoalDefinition form={form} updateForm={updateForm} />
              )}
              {currentStep === 2 && (
                <Step3Lifestyle form={form} updateForm={updateForm} />
              )}
              {currentStep === 3 && (
                <Step4FoodIntelligence form={form} updateForm={updateForm} />
              )}
              {currentStep === 4 && (
                <Step5Habits form={form} updateForm={updateForm} />
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  currentStep === 0
                    ? "cursor-not-allowed text-stone-300"
                    : "text-stone-600 hover:bg-stone-100 active:scale-95"
                }`}
              >
                ← Back
              </button>

              {currentStep < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-stone-900/20 transition-all hover:bg-stone-800 active:scale-95"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-emerald-500/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    "Complete Setup ✨"
                  )}
                </button>
              )}
            </div>

            {/* Skip button for non-last steps */}
            {currentStep < TOTAL_STEPS - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="mt-3 w-full text-center text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Skip this step
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideForward {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideBack {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes foodAppear {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .animate-slide-forward {
          animation: slideForward 0.35s ease-out;
        }
        
        .animate-slide-back {
          animation: slideBack 0.35s ease-out;
        }

        .animate-food-appear {
          animation: foodAppear 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
}

function mapBodyType(value) {
  if (value === "slim" || value === "lean") {
    return "lean";
  }
  if (value === "athletic" || value === "muscular") {
    return "muscular";
  }
  if (value === "curvy" || value === "toned") {
    return "toned";
  }
  return null;
}

function toWorkoutMinutes(days, duration) {
  const durationMinutes = toNumberOrNull(duration);
  if (durationMinutes !== null) {
    return durationMinutes;
  }

  const dayCount = toNumberOrNull(days);
  if (dayCount === null) {
    return null;
  }

  return dayCount * 30;
}

function buildWellnessPreferences(form) {
  const preferences = {};

  // Convert water intake to hours/liters for wellness tracking
  if (form.water_intake) {
    const waterMap = { low: 6, medium: 8, high: 12 };
    preferences.water_intake = waterMap[form.water_intake] || 8;
  }

  // Calculate sleep hours from wake/sleep times
  if (form.wake_time && form.sleep_time) {
    const sleepHours = calculateSleepHours(form.wake_time, form.sleep_time);
    if (sleepHours) {
      preferences.sleep_hours = sleepHours;
    }
  }

  // Store recovery notes with comprehensive onboarding info
  const recoveryNotes = [
    form.activity_level ? `Activity: ${form.activity_level}` : "",
    form.workout_preference ? `Workout time: ${form.workout_preference}` : "",
    form.biggest_obstacle ? `Challenge: ${form.biggest_obstacle}` : "",
    form.want_reminders ? `Reminders: enabled` : "",
  ].filter(Boolean).join(" | ");

  if (recoveryNotes) {
    preferences.recovery_notes = recoveryNotes;
  }

  return preferences;
}

function calculateSleepHours(wakeTime, sleepTime) {
  if (!wakeTime || !sleepTime) return null;

  const [wakeHour, wakeMin] = wakeTime.split(":").map(Number);
  const [sleepHour, sleepMin] = sleepTime.split(":").map(Number);

  let wake = wakeHour + wakeMin / 60;
  let sleep = sleepHour + sleepMin / 60;

  // Handle overnight sleep (e.g., sleep at 23:00, wake at 07:00)
  if (sleep < wake) {
    sleep += 24;
  }

  const hours = sleep - wake;
  return Math.max(0, Math.min(24, hours)); // Clamp between 0 and 24
}

function buildDietaryHabits(form) {
  const parts = [
    form.goal ? `Goal: ${form.goal}` : "",
    form.result_speed ? `Result speed: ${form.result_speed}` : "",
    form.activity_level ? `Activity level: ${form.activity_level}` : "",
    form.fitness_level ? `Fitness level: ${form.fitness_level}` : "",
    Array.isArray(form.regular_foods) && form.regular_foods.length ? `Regular foods: ${form.regular_foods.join(", ")}` : "",
    Array.isArray(form.dietary_restrictions) && form.dietary_restrictions.length
      ? `Restrictions: ${form.dietary_restrictions.join(", ")}`
      : "",
    form.meals_per_day ? `Meals/day: ${form.meals_per_day}` : "",
    form.junk_food_frequency ? `Junk food: ${form.junk_food_frequency}` : "",
    form.water_intake ? `Water intake: ${form.water_intake}` : "",
    form.workout_preference ? `Workout preference: ${form.workout_preference}` : "",
    form.wake_time ? `Wake time: ${form.wake_time}` : "",
    form.sleep_time ? `Sleep time: ${form.sleep_time}` : "",
    form.biggest_obstacle ? `Biggest obstacle: ${form.biggest_obstacle}` : "",
    form.want_reminders === null ? "" : `Reminders: ${form.want_reminders ? "enabled" : "disabled"}`,
  ].filter(Boolean);

  return parts.length ? parts.join(" | ") : null;
}

// Step 1: Basic Profile
function Step1BasicProfile({ form, updateForm }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-stone-800">
        Tell us about yourself 👋
      </h3>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          What's your name? <span className="text-stone-300">(optional)</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
          placeholder="Your name"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          How old are you?
        </label>
        <input
          type="number"
          value={form.age}
          onChange={(e) => updateForm("age", e.target.value)}
          placeholder="25"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Gender
        </label>
        <div className="flex gap-2">
          {["Male", "Female", "Other"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateForm("gender", option.toLowerCase())}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.gender === option.toLowerCase()
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-stone-500">
            Height (cm)
          </label>
          <input
            type="number"
            value={form.height}
            onChange={(e) => updateForm("height", e.target.value)}
            placeholder="175"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-stone-500">
            Weight (kg)
          </label>
          <input
            type="number"
            value={form.current_weight}
            onChange={(e) => updateForm("current_weight", e.target.value)}
            placeholder="70"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Goal Definition
function Step2GoalDefinition({ form, updateForm }) {
  const goals = [
    { id: "lose_weight", label: "Lose Weight", icon: "⚡", desc: "Drop body fat" },
    { id: "gain_weight", label: "Gain Weight", icon: "📈", desc: "Add healthy mass" },
    { id: "build_muscle", label: "Build Muscle", icon: "💪", desc: "Get stronger" },
    { id: "stay_fit", label: "Stay Fit", icon: "🏃", desc: "Maintain fitness" },
  ];

  const bodyTypes = [
    { id: "lean", label: "Lean", icon: "🏋️" },
    { id: "athletic", label: "Athletic", icon: "🏃" },
    { id: "muscular", label: "Muscular", icon: "💪" },
    { id: "slim", label: "Slim", icon: "🧘" },
  ];

  const speeds = [
    { id: "aggressive", label: "Aggressive", desc: "Fast results" },
    { id: "balanced", label: "Balanced", desc: "Steady progress" },
    { id: "slow", label: "Slow & Steady", desc: "Easier to maintain" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-base font-semibold text-stone-800">
          What is your primary goal?
        </label>
        <div className="grid grid-cols-2 gap-2">
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => updateForm("goal", goal.id)}
              className={`rounded-2xl border p-3 text-left transition-all ${
                form.goal === goal.id
                  ? "border-stone-900 bg-stone-900 text-white shadow-lg"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-xl">{goal.icon}</span>
              <h4 className="mt-1 text-sm font-semibold">{goal.label}</h4>
              <p className={`mt-0.5 text-[10px] ${form.goal === goal.id ? "text-stone-300" : "text-stone-400"}`}>
                {goal.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Target Weight (kg)
        </label>
        <input
          type="number"
          value={form.target_weight}
          onChange={(e) => updateForm("target_weight", e.target.value)}
          placeholder="65"
          className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Desired Body Type
        </label>
        <div className="grid grid-cols-4 gap-2">
          {bodyTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => updateForm("body_type", type.id)}
              className={`rounded-2xl border p-2 text-center transition-all ${
                form.body_type === type.id
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-xl">{type.icon}</span>
              <p className="mt-1 text-[10px] font-medium">{type.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          How fast do you want results?
        </label>
        <div className="space-y-2">
          {speeds.map((speed) => (
            <button
              key={speed.id}
              type="button"
              onClick={() => updateForm("result_speed", speed.id)}
              className={`w-full rounded-2xl border p-3 text-left transition-all ${
                form.result_speed === speed.id
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <h4 className="text-sm font-semibold">{speed.label}</h4>
              <p className={`mt-0.5 text-[10px] ${form.result_speed === speed.id ? "text-stone-300" : "text-stone-400"}`}>
                {speed.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 3: Lifestyle & Activity
function Step3Lifestyle({ form, updateForm }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-base font-semibold text-stone-800">
          Do you have access to a gym?
        </label>
        <div className="flex gap-2">
          {[
            { value: true, label: "Yes", icon: "🏋️" },
            { value: false, label: "No", icon: "🏠" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => updateForm("has_gym_access", option.value)}
              className={`flex-1 rounded-2xl border p-4 text-center transition-all ${
                form.has_gym_access === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-2xl">{option.icon}</span>
              <p className="mt-1 text-sm font-semibold">{option.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Current fitness level
        </label>
        <div className="flex gap-2">
          {[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateForm("fitness_level", option.value)}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.fitness_level === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Workout days per week
        </label>
        <div className="flex gap-2">
          {["2-3", "4-5", "6+"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateForm("workout_days", option)}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.workout_days === option
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
              }`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Minutes per session
        </label>
        <div className="flex gap-2">
          {["20-30", "30-45", "60+"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateForm("workout_duration", option)}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.workout_duration === option
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
              }`}
            >
              {option} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Daily Activity Level
        </label>
        <div className="space-y-2">
          {[
            { value: "sedentary", label: "Mostly Sitting", desc: "Desk job" },
            { value: "moderate", label: "Moderately Active", desc: "Some walking" },
            { value: "active", label: "Very Active", desc: "On feet all day" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateForm("activity_level", option.value)}
              className={`w-full rounded-2xl border p-3 text-left transition-all ${
                form.activity_level === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <h4 className="text-sm font-semibold">{option.label}</h4>
              <p className={`mt-0.5 text-[10px] ${form.activity_level === option.value ? "text-stone-300" : "text-stone-400"}`}>
                {option.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 4: Food Intelligence
function Step4FoodIntelligence({ form, updateForm }) {
  const foodsByRegion = {
    Nigeria: [
      "Jollof Rice", "Fufu", "Pounded Yam", "Egusi Soup", "Okra Soup",
      "Pepper Soup", "Amala", "Suya", "Akara", "Garri", "Tuwo",
      "Banga Soup", "Moi Moi", "Chin Chin", "Plantain", "Yam",
    ],
    USA: [
      "Hamburger", "Hot Dog", "Pizza", "Fried Chicken", "Steak",
      "Barbecue", "Mac & Cheese", "Apple Pie", "Donuts", "Pancakes",
      "Grilled Cheese", "Tacos", "Burrito", "Cheeseburger", "Fries",
    ],
    Africa: [
      "Injera", "Ugali", "Nyama Choma", "Sadza", "Bobotie",
      "Biltong", "Mopane Worms", "Pap", "Chapati", "Mandazi",
      "Tagine", "Couscous", "Fufu", "Cassava", "Millet",
    ],
    Europe: [
      "Pasta", "Croissants", "Schnitzel", "Fish & Chips", "Paella",
      "Risotto", "Ratatouille", "Sausages", "Cheese Board", "Bread",
      "Goulash", "Moussaka", "Carbonara", "Tiramisu", "Bratwurst",
    ],
    General: [
      "Rice", "Eggs", "Beef", "Fish", "Salmon",
      "Vegetables", "Fruits", "Milk", "Yogurt", "Beans",
      "Potatoes", "Oats", "Honey", "Olive Oil", "Nuts",
    ],
  };

  const [currentRegionIndex, setCurrentRegionIndex] = useState(0);
  const regions = Object.keys(foodsByRegion);
  const currentRegion = regions[currentRegionIndex];
  const currentFoods = foodsByRegion[currentRegion];
  const selectedFoods = form.regular_foods || [];
  const unselectedFoods = currentFoods.filter(food => !selectedFoods.includes(food));

  const handleFoodClick = (food) => {
    const foods = selectedFoods || [];
    const newFoods = [...foods, food];
    updateForm("regular_foods", newFoods);
    
    // Move to next region if all foods in current region are selected
    if (unselectedFoods.length === 1) {
      setTimeout(() => {
        if (currentRegionIndex < regions.length - 1) {
          setCurrentRegionIndex(currentRegionIndex + 1);
        }
      }, 400);
    }
  };

  const dietaryOptions = [
    "None", "Vegetarian", "Vegan", "No Pork", "No Beef", "Gluten-Free", "Dairy-Free",
  ];

  const toggleDietary = (diet) => {
    const restrictions = form.dietary_restrictions || [];
    if (diet === "None") {
      updateForm("dietary_restrictions", ["None"]);
    } else {
      const filtered = restrictions.filter((d) => d !== "None");
      if (filtered.includes(diet)) {
        updateForm("dietary_restrictions", filtered.filter((d) => d !== diet));
      } else {
        updateForm("dietary_restrictions", [...filtered, diet]);
      }
    }
  };

  const handleRemoveFood = (food) => {
    const foods = form.regular_foods || [];
    updateForm("regular_foods", foods.filter((f) => f !== food));
  };

  return (
    <div className="space-y-5">
      {/* Selected Foods Display */}
      {selectedFoods.length > 0 && (
        <div>
          <label className="mb-2 block text-xs font-medium text-stone-600">
            ✓ Selected Foods ({selectedFoods.length})
          </label>
          <div className="flex flex-wrap gap-2 rounded-2xl bg-emerald-50 p-3">
            {selectedFoods.map((food) => (
              <button
                key={food}
                type="button"
                onClick={() => handleRemoveFood(food)}
                className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-all hover:bg-emerald-200 active:scale-95"
                title="Click to remove"
              >
                {food}
                <span>✕</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available Foods by Region */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-base font-semibold text-stone-800">
            Foods from {currentRegion} 🍽️
          </label>
          <span className="text-xs text-stone-400">
            {regions.map((region, idx) => (
              <span
                key={region}
                className={`${
                  idx === currentRegionIndex ? "font-bold text-stone-700" : "text-stone-300"
                }`}
              >
                {idx > 0 && " • "}
                {region}
              </span>
            ))}
          </span>
        </div>

        {unselectedFoods.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {unselectedFoods.map((food) => (
              <button
                key={food}
                type="button"
                onClick={() => handleFoodClick(food)}
                className="animate-food-appear rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition-all hover:border-stone-400 hover:bg-stone-100 active:scale-95"
              >
                {food}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-sm font-medium text-emerald-700">
              ✓ All {currentRegion} foods added!
              {currentRegionIndex < regions.length - 1 ? (
                <span
                  className="ml-2 cursor-pointer underline hover:no-underline"
                  onClick={() => setCurrentRegionIndex(currentRegionIndex + 1)}
                >
                  Next region →
                </span>
              ) : (
                <span className="ml-2">Food selection complete! 🎉</span>
              )}
            </p>
          </div>
        )}

        {/* Region Navigation */}
        {unselectedFoods.length > 0 && currentRegionIndex > 0 && (
          <button
            type="button"
            onClick={() => setCurrentRegionIndex(currentRegionIndex - 1)}
            className="mt-3 text-xs text-stone-400 transition-colors hover:text-stone-600"
          >
            ← Back to {regions[currentRegionIndex - 1]}
          </button>
        )}
        {unselectedFoods.length === 0 && currentRegionIndex < regions.length - 1 && (
          <button
            type="button"
            onClick={() => setCurrentRegionIndex(currentRegionIndex + 1)}
            className="mt-3 text-xs font-medium text-stone-600 transition-colors hover:text-stone-800"
          >
            Skip to next region →
          </button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Junk food frequency
        </label>
        <div className="flex gap-2">
          {[
            { value: "rarely", label: "Rarely", icon: "🥗" },
            { value: "sometimes", label: "Sometimes", icon: "🍕" },
            { value: "often", label: "Often", icon: "🍔" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateForm("junk_food_frequency", option.value)}
              className={`flex-1 rounded-2xl border p-3 text-center transition-all ${
                form.junk_food_frequency === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <p className="mt-1 text-xs font-medium">{option.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Dietary Restrictions
        </label>
        <div className="flex flex-wrap gap-1.5">
          {dietaryOptions.map((diet) => (
            <button
              key={diet}
              type="button"
              onClick={() => toggleDietary(diet)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                (form.dietary_restrictions || []).includes(diet)
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
              }`}
            >
              {diet}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Meals per day
        </label>
        <div className="flex gap-2">
          {["1-2", "3", "4+"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateForm("meals_per_day", option)}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
                form.meals_per_day === option
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
              }`}
            >
              {option} meals
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 5: Habits & Commitment
function Step5Habits({ form, updateForm }) {
  const obstacles = [
    { value: "consistency", label: "Lack of Consistency", icon: "📅" },
    { value: "diet", label: "Poor Diet", icon: "🍕" },
    { value: "no_plan", label: "No Plan", icon: "📋" },
    { value: "motivation", label: "No Motivation", icon: "💪" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Daily water intake
        </label>
        <div className="flex gap-2">
          {[
            { value: "low", label: "Low", icon: "💧" },
            { value: "medium", label: "Medium", icon: "💧💧" },
            { value: "high", label: "High", icon: "💧💧💧" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateForm("water_intake", option.value)}
              className={`flex-1 rounded-2xl border p-3 text-center transition-all ${
                form.water_intake === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-lg">{option.icon}</span>
              <p className="mt-1 text-xs font-medium">{option.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-stone-500">
            Wake Up Time
          </label>
          <input
            type="time"
            value={form.wake_time}
            onChange={(e) => updateForm("wake_time", e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-stone-500">
            Sleep Time
          </label>
          <input
            type="time"
            value={form.sleep_time}
            onChange={(e) => updateForm("sleep_time", e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 outline-none transition-all focus:border-stone-400 focus:ring-4 focus:ring-stone-400/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Preferred workout time
        </label>
        <div className="flex gap-2">
          {[
            { value: "morning", label: "Morning", icon: "🌅" },
            { value: "evening", label: "Evening", icon: "🌙" },
            { value: "flexible", label: "Flexible", icon: "🔄" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateForm("workout_preference", option.value)}
              className={`flex-1 rounded-2xl border p-3 text-center transition-all ${
                form.workout_preference === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <p className="mt-1 text-xs font-medium">{option.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-base font-semibold text-stone-800">
          What stopped you before?
        </label>
        <div className="space-y-2">
          {obstacles.map((obstacle) => (
            <button
              key={obstacle.value}
              type="button"
              onClick={() => updateForm("biggest_obstacle", obstacle.value)}
              className={`w-full rounded-2xl border p-3 text-left transition-all ${
                form.biggest_obstacle === obstacle.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{obstacle.icon}</span>
                <h4 className="text-sm font-semibold">{obstacle.label}</h4>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-stone-500">
          Want workout reminders?
        </label>
        <div className="flex gap-2">
          {[
            { value: true, label: "Yes", icon: "🔔" },
            { value: false, label: "No", icon: "🔕" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => updateForm("want_reminders", option.value)}
              className={`flex-1 rounded-2xl border p-3 text-center transition-all ${
                form.want_reminders === option.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300"
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <p className="mt-1 text-xs font-medium">{option.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
