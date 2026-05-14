import { useEffect, useMemo, useState } from "react";
import { 
  Play, CheckCircle, SkipForward, Timer, 
  Flame, Award, Layout, History, ChevronRight,
  ChevronDown, Activity
} from "lucide-react";

import PageHeader from "../components/PageHeader";
import { getWorkout } from "../services/planService";
import { useWellnessStore } from "../services/wellnessStore";

export default function WorkoutPage() {
  const [backendPlan, setBackendPlan] = useState(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [timerMode, setTimerMode] = useState("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const workoutQueue = useWellnessStore((state) => state.workoutQueue);
  const workoutSessions = useWellnessStore((state) => state.workoutSessions);
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
    <div className="min-h-screen bg-[#F8F9FA] pb-40">
      <div className="px-5 pt-4">
        <PageHeader
          compact
          eyebrow="Training"
          title="Daily Flow"
          action={
            <button onClick={onGenerate} className="p-3 rounded-2xl bg-ink text-cream active:scale-90 transition-transform">
              <Flame size={20} fill={progress > 0 ? "currentColor" : "none"} />
            </button>
          }
        />
      </div>

      <main className="px-5 space-y-6 mt-6">
        {/* --- COMPACT DASHBOARD --- */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-stone-900 leading-tight">
                {workoutQueue?.focusLabel || "No Active Plan"}
              </h2>
              <div className="flex gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-500">
                  {workoutQueue?.fitnessLevel || "Ready"}
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-50 text-[10px] font-black uppercase tracking-widest text-orange-600">
                  Week {workoutQueue?.progressionWeek || 0}
                </span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-stone-900 flex items-center justify-center text-cream">
              <Activity size={24} />
            </div>
          </div>

          {workoutQueue && (
            <div className="mt-8">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-900 transition-all duration-1000" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          )}
        </section>

        {currentExercise && !finishedAll ? (
          <div className="space-y-6">
            {/* --- ACTIVE EXERCISE CARD --- */}
            <section className="bg-stone-900 rounded-[3rem] p-8 text-cream shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
               
               <div className="relative z-10">
                 <div className="flex justify-between items-center mb-6">
                   <span className="px-3 py-1 rounded-lg bg-white/10 text-[10px] font-black uppercase tracking-widest text-gold border border-white/5">
                     {currentStage?.label || "Active"}
                   </span>
                   <div className="flex items-center gap-2">
                     <Timer size={14} className="text-stone-500" />
                     <span className="text-xl font-bold tabular-nums text-white">
                       {formatSeconds(secondsLeft || totalSeconds)}
                     </span>
                   </div>
                 </div>

                 <h3 className="text-4xl font-black tracking-tight leading-none mb-4 italic">
                   {currentExercise.exercise_name}
                 </h3>
                 <p className="text-cream/50 text-sm leading-relaxed mb-8">
                   {currentExercise.example}
                 </p>

                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                     <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Target</p>
                     <p className="text-xl font-bold italic">{currentExercise.sets} × {currentExercise.reps}</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                     <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-1">Duration</p>
                     <p className="text-xl font-bold italic">{currentExercise.duration_seconds}s</p>
                   </div>
                 </div>
               </div>
            </section>

            {/* --- UP NEXT (MINI CARD) --- */}
            <div className="bg-white rounded-[2rem] p-5 flex items-center justify-between border border-stone-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <SkipForward size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Up Next</p>
                  <h4 className="font-bold text-stone-900">{nextExercise?.exercise_name || "Final Stretch"}</h4>
                </div>
              </div>
              <ChevronRight size={20} className="text-stone-300" />
            </div>

            {/* --- ROADMAP / STAGES --- */}
            <section className="bg-stone-50 rounded-[2.5rem] p-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-6 px-2">Session Roadmap</h4>
              <div className="space-y-4">
                {stageSummary.map((stage, idx) => (
                  <div key={stage.key} className="flex items-center gap-4 px-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${stage.done === stage.total ? 'bg-emerald-500 text-white' : 'bg-white text-stone-400'}`}>
                      {stage.done === stage.total ? <CheckCircle size={14} /> : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-stone-800">{stage.label}</span>
                        <span className="text-[10px] font-bold text-stone-400">{stage.done}/{stage.total}</span>
                      </div>
                      <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden">
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
          /* --- EMPTY / START STATE --- */
          <div className="py-12 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-6">
              {workoutQueue ? <Award size={40} className="text-orange-500" /> : <Play size={40} className="text-stone-300 ml-1" />}
            </div>
            <h3 className="text-2xl font-black text-stone-900">
              {workoutQueue ? "Session Complete!" : "Start Training"}
            </h3>
            <p className="text-stone-500 text-sm mt-2 max-w-[240px] mx-auto">
              {workoutQueue 
                ? `You crushed ${completedCount} exercises today.` 
                : "Initialize your adaptive flow to begin your workout."}
            </p>
            <button 
              onClick={workoutQueue ? saveSession : onGenerate} 
              className="mt-8 px-10 py-4 bg-stone-900 text-cream rounded-full font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform"
            >
              {workoutQueue ? "Log Session" : "Build Workout"}
            </button>
          </div>
        )}
      </main>

      {/* --- STICKY MOBILE CONTROLS --- */}
      {currentExercise && !finishedAll && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-stone-100 z-50">
          <div className="max-w-md mx-auto space-y-3">
            {timerMode === "idle" && (
              <button 
                onClick={startExerciseTimer} 
                className="w-full bg-stone-900 text-cream py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-2xl"
              >
                <Play size={16} fill="currentColor" /> Start Set
              </button>
            )}
            {timerMode === "exercise" && (
              <button 
                onClick={completeCurrent} 
                className="w-full bg-emerald-500 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle size={16} /> Mark Done
              </button>
            )}
            {timerMode === "restPrompt" && (
              <div className="flex gap-3">
                <button 
                  onClick={startRestTimer} 
                  className="flex-1 bg-stone-900 text-cream py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs"
                >
                  Rest
                </button>
                <button 
                  onClick={goNextWithoutRest} 
                  className="flex-1 bg-stone-100 text-stone-900 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs"
                >
                  Next
                </button>
              </div>
            )}
            <button 
              onClick={skipCurrent} 
              className="w-full py-2 text-stone-400 font-bold uppercase tracking-widest text-[9px]"
            >
              Skip this exercise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSeconds(total) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}