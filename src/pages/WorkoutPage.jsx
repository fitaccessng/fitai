import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Play, CheckCircle, SkipForward, Timer, 
  Flame, Award, Activity, ChevronLeft, ChevronRight, X
} from "lucide-react";

import { getWorkout } from "../services/planService";
import { useWellnessStore } from "../services/wellnessStore";

export default function WorkoutPage() {
  const navigate = useNavigate();
  const [queueIndex, setQueueIndex] = useState(0);
  const [timerMode, setTimerMode] = useState("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const { 
    workoutQueue, prepareWorkout, completeWorkoutExercise, 
    skipWorkoutExercise, finishWorkoutSession 
  } = useWellnessStore();

  // Unified Timer Logic
  useEffect(() => {
    if (timerMode === "idle" || timerMode === "restPrompt" || secondsLeft <= 0) return;
    
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          handleTimerFinished();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerMode, secondsLeft]);

  // Derived State
  const exercises = workoutQueue?.exercises || [];
  const currentExercise = exercises[queueIndex];
  const nextExercise = exercises[queueIndex + 1];
  const progress = exercises.length ? (queueIndex / exercises.length) * 100 : 0;
  const isWorkoutActive = timerMode === "exercise" || timerMode === "rest";

  // Actions
  const handleTimerFinished = () => {
    if (timerMode === "exercise") setTimerMode("restPrompt");
    else if (timerMode === "rest") {
      setTimerMode("idle");
      setQueueIndex(i => i + 1);
    }
  };

  const startSet = () => {
    setTimerMode("exercise");
    setSecondsLeft(currentExercise.duration_seconds);
  };

  const startRest = () => {
    setTimerMode("rest");
    setSecondsLeft(currentExercise.rest_seconds || 30);
  };

  const skipRest = () => {
    setTimerMode("idle");
    setQueueIndex(i => i + 1);
  };

  const completeManually = async () => {
    await completeWorkoutExercise(currentExercise.id);
    setTimerMode("restPrompt");
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-stone-900 transition-colors duration-500">
      
      {/* 1. Global Progress Bar (Always present) */}
      <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-stone-100">
        <div 
          className="h-full bg-orange-500 transition-all duration-500" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      {/* 2. Header: Hidden during active sets for focus */}
      {!isWorkoutActive && (
        <header className="flex items-center justify-between px-6 py-5">
          <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-stone-900"><ChevronLeft size={24}/></button>
          <div className="text-center">
            <h1 className="text-xs font-black uppercase tracking-tighter text-stone-400">Adaptive Training</h1>
            <p className="text-sm font-bold text-stone-900">{workoutQueue?.focusLabel || "Ready?"}</p>
          </div>
          <div className="w-6" />
        </header>
      )}

      <main className={`flex flex-1 flex-col px-6 ${isWorkoutActive ? 'pt-12' : 'pt-2'}`}>
        
        {!workoutQueue ? (
          /* EMPTY STATE */
          <div className="flex flex-1 flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-100 opacity-25" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-stone-900 text-white">
                <Play size={40} fill="currentColor" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black">Begin Session</h2>
              <p className="mt-2 text-sm text-stone-400">Initialize your custom adaptive flow.</p>
            </div>
            <button 
              onClick={prepareWorkout}
              className="w-full max-w-xs rounded-2xl bg-stone-900 py-4 font-black uppercase tracking-widest text-white shadow-xl transition-transform active:scale-95"
            >
              Build Workout
            </button>
          </div>
        ) : queueIndex >= exercises.length ? (
          /* COMPLETION STATE */
          <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center animate-in slide-in-from-bottom">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Award size={48} />
            </div>
            <h2 className="text-3xl font-black">Workout Crushed</h2>
            <p className="text-stone-500">Your session data is ready for the logbook.</p>
            <button 
              onClick={finishWorkoutSession}
              className="w-full max-w-xs rounded-2xl bg-stone-900 py-4 font-black uppercase tracking-widest text-white"
            >
              Log Session
            </button>
          </div>
        ) : (
          /* ACTIVE EXERCISE FLOW */
          <div className="flex flex-1 flex-col">
            
            {/* Stage Tag */}
            {!isWorkoutActive && (
              <div className="mb-4 inline-flex self-start rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-600">
                {currentExercise.stage}
              </div>
            )}

            {/* Title Area */}
            <div className={`transition-all duration-500 ${isWorkoutActive ? 'text-center' : 'text-left'}`}>
              <h2 className={`font-black italic leading-none transition-all duration-500 ${isWorkoutActive ? 'text-5xl' : 'text-3xl'}`}>
                {currentExercise.exercise_name}
              </h2>
              {timerMode === "rest" && (
                 <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Recovery Phase</p>
              )}
            </div>

            {/* Visual Timer/Reps Hub */}
            <div className="my-10 flex flex-1 flex-col items-center justify-center">
              {isWorkoutActive || timerMode === "restPrompt" ? (
                <div className="relative flex h-64 w-64 items-center justify-center">
                   {/* Circular Progress (CSS based) */}
                   <svg className="absolute inset-0 h-full w-full rotate-[-90deg]">
                     <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-stone-100" />
                     <circle 
                        cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={754} 
                        strokeDashoffset={754 - (754 * (secondsLeft / (currentExercise.duration_seconds || 30)))}
                        className={`transition-all duration-1000 ${timerMode === 'rest' ? 'text-blue-500' : 'text-stone-900'}`}
                        strokeLinecap="round"
                      />
                   </svg>
                   <span className="text-6xl font-black tabular-nums tracking-tighter">
                     {formatSeconds(secondsLeft)}
                   </span>
                </div>
              ) : (
                <div className="grid w-full grid-cols-2 gap-4">
                  <StatCard label="Sets" value={currentExercise.sets} />
                  <StatCard label="Reps" value={currentExercise.reps} />
                  <div className="col-span-2 rounded-3xl bg-stone-50 p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Pro Tip</p>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{currentExercise.example}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Up Next Preview (Only when idle) */}
            {!isWorkoutActive && nextExercise && (
              <div className="mb-32 flex items-center justify-between rounded-2xl border border-stone-100 p-4">
                <span className="text-[10px] font-black uppercase text-stone-400">Up Next</span>
                <span className="text-sm font-bold">{nextExercise.exercise_name}</span>
                <ChevronRight size={16} className="text-stone-300" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. CONTEXTUAL CONTROLS */}
      {workoutQueue && queueIndex < exercises.length && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 p-6">
          <div className="mx-auto max-w-md">
            {timerMode === "idle" && (
              <button 
                onClick={startSet} 
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-stone-900 py-5 font-black uppercase tracking-widest text-white shadow-2xl transition-transform active:scale-95"
              >
                <Play size={18} fill="currentColor" /> Start Set
              </button>
            )}

            {timerMode === "exercise" && (
              <button 
                onClick={completeManually} 
                className="w-full rounded-2xl bg-emerald-500 py-5 font-black uppercase tracking-widest text-white shadow-lg animate-in fade-in slide-in-from-bottom-2"
              >
                Complete Set
              </button>
            )}

            {timerMode === "restPrompt" && (
              <div className="flex gap-3 animate-in fade-in scale-95">
                <button onClick={startRest} className="flex-1 rounded-2xl bg-stone-900 py-5 font-black uppercase tracking-widest text-white shadow-xl">
                  Rest
                </button>
                <button onClick={skipRest} className="flex-1 rounded-2xl bg-stone-100 py-5 font-black uppercase tracking-widest text-stone-600">
                  Skip Rest
                </button>
              </div>
            )}

            {timerMode === "rest" && (
              <button onClick={skipRest} className="w-full rounded-2xl border-2 border-stone-200 py-5 font-black uppercase tracking-widest text-stone-400">
                End Rest Early
              </button>
            )}

            {!isWorkoutActive && timerMode !== "restPrompt" && (
               <button 
                onClick={() => skipWorkoutExercise(currentExercise.id)}
                className="mt-4 w-full text-center text-[10px] font-black uppercase tracking-widest text-stone-400"
               >
                 Skip Exercise
               </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</p>
      <p className="mt-1 text-3xl font-black italic text-stone-900">{value}</p>
    </div>
  );
}

function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}