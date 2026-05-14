import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Play, CheckCircle, SkipForward, Timer, 
  Flame, Award, Activity, ChevronLeft, ChevronRight
} from "lucide-react";

import { getWorkout } from "../services/planService";
import { useWellnessStore } from "../services/wellnessStore";

export default function WorkoutPage() {
  const navigate = useNavigate();
  const [backendPlan, setBackendPlan] = useState(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [timerMode, setTimerMode] = useState("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const workoutQueue = useWellnessStore((state) => state.workoutQueue);
  const prepareWorkout = useWellnessStore((state) => state.prepareWorkout);
  const completeWorkoutExercise = useWellnessStore((state) => state.completeWorkoutExercise);
  const skipWorkoutExercise = useWellnessStore((state) => state.skipWorkoutExercise);
  const finishWorkoutSession = useWellnessStore((state) => state.finishWorkoutSession);

  useEffect(() => {
    getWorkout().then(setBackendPlan).catch(() => setBackendPlan(null));
  }, []);

  useEffect(() => {
    if (timerMode === "idle" || secondsLeft <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          void handleTimerFinished();
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerMode, secondsLeft]);

  const exercises = workoutQueue?.exercises || [];
  const stages = workoutQueue?.stages || [];
  const currentExercise = exercises[queueIndex];
  const nextExercise = exercises[queueIndex + 1];
  const currentStage = stages.find((stage) => stage.key === currentExercise?.stage);
  const completedCount = exercises.filter((exercise) => exercise.completed).length;
  const skippedCount = exercises.filter((exercise) => exercise.skipped).length;
  const finishedAll = exercises.length ? queueIndex >= exercises.length : false;
  const progress = exercises.length ? ((completedCount + skippedCount) / exercises.length) * 100 : 0;

  const stageSummary = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      done: stage.items.filter((item) => item.completed || item.skipped).length,
      total: stage.items.length,
    }));
  }, [stages]);

  async function onGenerate() {
    await prepareWorkout();
    setQueueIndex(0);
    setTimerMode("idle");
    setSecondsLeft(0);
    setTotalSeconds(0);
  }

  function startExerciseTimer() {
    if (!currentExercise) return;
    setTimerMode("exercise");
    setTotalSeconds(currentExercise.duration_seconds);
    setSecondsLeft(currentExercise.duration_seconds);
  }

  function startRestTimer() {
    if (!currentExercise) return;
    setTimerMode("rest");
    setTotalSeconds(currentExercise.rest_seconds || 0);
    setSecondsLeft(currentExercise.rest_seconds || 0);
  }

  async function handleTimerFinished() {
    if (timerMode === "exercise") {
      if (currentExercise && !currentExercise.completed) {
        await completeWorkoutExercise(currentExercise.id);
      }
      setTimerMode("restPrompt");
      return;
    }
    if (timerMode === "rest") {
      setTimerMode("idle");
      setQueueIndex((current) => current + 1);
      return;
    }
    setTimerMode("idle");
  }

  async function completeCurrent() {
    if (!currentExercise) return;
    await completeWorkoutExercise(currentExercise.id);
    setTimerMode("restPrompt");
  }

  async function skipCurrent() {
    if (!currentExercise) return;
    await skipWorkoutExercise(currentExercise.id);
    setTimerMode("idle");
    setQueueIndex((current) => current + 1);
  }

  async function goNextWithoutRest() {
    setTimerMode("idle");
    setQueueIndex((current) => current + 1);
  }

  async function saveSession() {
    if (!workoutQueue) return;
    await finishWorkoutSession({
      focus: workoutQueue.focusLabel,
      completedExercises: completedCount,
      skippedExercises: skippedCount,
      fitnessLevel: workoutQueue.fitnessLevel,
      progressionWeek: workoutQueue.progressionWeek,
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] pb-40 font-sans text-stone-900">
      {/* IDENTICAL HEADER TO MEAL PLAN */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white/70 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 transition-colors active:bg-stone-100"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-base font-black tracking-tight text-stone-800">Training</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
              Daily Flow
            </p>
          </div>

          <button
            onClick={onGenerate}
            className="flex h-10 w-10 items-center justify-center rounded-full text-stone-800 transition-all active:scale-90 active:bg-stone-100"
          >
            <Flame size={20} fill={progress > 0 ? "currentColor" : "none"} className={progress > 0 ? "text-orange-500" : ""} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 pt-6">
        {/* Dashboard Section */}
        <section className="rounded-[2.5rem] border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black leading-tight text-stone-900">
                {workoutQueue?.focusLabel || "No Active Plan"}
              </h2>
              <div className="mt-2 flex gap-2">
                <span className="rounded-full bg-stone-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-stone-500">
                  {workoutQueue?.fitnessLevel || "Ready"}
                </span>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-orange-600">
                  Week {workoutQueue?.progressionWeek || 0}
                </span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white">
              <Activity size={20} />
            </div>
          </div>

          {workoutQueue && (
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-[9px] font-black uppercase tracking-widest text-stone-400">
                <span>Workout Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div 
                  className="h-full bg-stone-900 transition-all duration-1000" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </section>

        {currentExercise && !finishedAll ? (
          <div className="space-y-6 animate-slide-up">
            {/* Active Exercise */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 p-6 text-white shadow-2xl">
               <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl" />
               
               <div className="relative z-10">
                 <div className="mb-5 flex items-center justify-between">
                   <span className="rounded-lg border border-white/5 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400">
                     {currentStage?.label || "Active"}
                   </span>
                   <div className="flex items-center gap-2">
                     <Timer size={14} className="text-stone-500" />
                     <span className="text-lg font-bold tabular-nums">
                       {formatSeconds(secondsLeft || totalSeconds)}
                     </span>
                   </div>
                 </div>

                 <h3 className="mb-3 text-3xl font-black italic leading-tight tracking-tight">
                   {currentExercise.exercise_name}
                 </h3>
                 <p className="mb-6 text-xs leading-relaxed text-stone-400">
                   {currentExercise.example}
                 </p>

                 <div className="grid grid-cols-2 gap-2.5">
                   <div className="rounded-xl border border-white/5 bg-white/5 p-3.5">
                     <p className="mb-0.5 text-[8px] font-black uppercase tracking-widest text-stone-500">Target</p>
                     <p className="text-lg font-bold italic">{currentExercise.sets} × {currentExercise.reps}</p>
                   </div>
                   <div className="rounded-xl border border-white/5 bg-white/5 p-3.5">
                     <p className="mb-0.5 text-[8px] font-black uppercase tracking-widest text-stone-500">Duration</p>
                     <p className="text-lg font-bold italic">{currentExercise.duration_seconds}s</p>
                   </div>
                 </div>
               </div>
            </section>

            {/* Up Next */}
            <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <SkipForward size={18} />
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Up Next</p>
                  <h4 className="text-sm font-bold text-stone-900">{nextExercise?.exercise_name || "Final Stretch"}</h4>
                </div>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </div>

            {/* Roadmap */}
            <section className="rounded-[2rem] bg-stone-50 p-5">
              <h4 className="mb-5 px-1 text-[9px] font-black uppercase tracking-widest text-stone-400">Roadmap</h4>
              <div className="space-y-4">
                {stageSummary.map((stage, idx) => (
                  <div key={stage.key} className="flex items-center gap-3 px-1">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold transition-colors ${stage.done === stage.total ? 'bg-emerald-500 text-white' : 'bg-white text-stone-400'}`}>
                      {stage.done === stage.total ? <CheckCircle size={12} /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex justify-between items-center">
                        <span className="text-[11px] font-bold text-stone-800">{stage.label}</span>
                        <span className="text-[9px] font-bold text-stone-400">{stage.done}/{stage.total}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-stone-200">
                        <div 
                          className="h-full bg-stone-800 transition-all" 
                          style={{ width: `${(stage.done / stage.total) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
              {workoutQueue ? <Award size={32} className="text-orange-500" /> : <Play size={32} className="ml-1 text-stone-300" />}
            </div>
            <h3 className="text-xl font-black text-stone-900">
              {workoutQueue ? "Session Complete!" : "Start Training"}
            </h3>
            <p className="mx-auto mt-2 max-w-[200px] text-xs text-stone-500">
              {workoutQueue 
                ? `You crushed ${completedCount} exercises today.` 
                : "Initialize your adaptive flow to begin your workout."}
            </p>
            <button 
              onClick={workoutQueue ? saveSession : onGenerate} 
              className="mt-8 rounded-full bg-stone-900 px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-transform active:scale-95"
            >
              {workoutQueue ? "Log Session" : "Build Workout"}
            </button>
          </div>
        )}
      </main>

      {/* Sticky Controls */}
      {currentExercise && !finishedAll && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/80 p-5 backdrop-blur-xl">
          <div className="mx-auto max-w-md space-y-3">
            {timerMode === "idle" && (
              <button 
                onClick={startExerciseTimer} 
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 font-black uppercase tracking-widest text-[10px] text-white shadow-2xl transition-all active:scale-95"
              >
                <Play size={14} fill="currentColor" /> Start Set
              </button>
            )}
            {timerMode === "exercise" && (
              <button 
                onClick={completeCurrent} 
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-black uppercase tracking-widest text-[10px] text-white shadow-lg transition-all active:scale-95"
              >
                <CheckCircle size={14} /> Mark Done
              </button>
            )}
            {timerMode === "restPrompt" && (
              <div className="flex gap-2">
                <button 
                  onClick={startRestTimer} 
                  className="flex-1 rounded-2xl bg-stone-900 py-4 font-black uppercase tracking-widest text-[10px] text-white transition-all active:scale-95"
                >
                  Rest
                </button>
                <button 
                  onClick={goNextWithoutRest} 
                  className="flex-1 rounded-2xl bg-stone-100 py-4 font-black uppercase tracking-widest text-[10px] text-stone-900 transition-all active:scale-95"
                >
                  Skip Rest
                </button>
              </div>
            )}
            <button 
              onClick={skipCurrent} 
              className="w-full py-2 text-[8px] font-bold uppercase tracking-widest text-stone-400"
            >
              Skip this exercise
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

function formatSeconds(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}