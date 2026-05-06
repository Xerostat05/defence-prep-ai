import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = "olive-wings-todo-list";

const DailyGoalsSection = () => {
  const [tasks, setTasks] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch {
        setTasks([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const unfinishedCount = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);

  const createId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const addTask = () => {
    const trimmed = newTask.trim();
    if (!trimmed) {
      toast.error("Enter a task to add your daily goal.");
      return;
    }
    setTasks((prev) => [
      ...prev,
      { id: createId(), text: trimmed, done: false },
    ]);
    setNewTask("");
    toast.success("Daily goal added.");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.done));
    toast.success("Cleared completed goals.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[2rem] border border-gold/20 bg-slate-950/80 backdrop-blur-xl p-6 shadow-2xl shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Daily Goals</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Today's achievement plan</h2>
            <p className="mt-2 text-sm text-slate-400">Track your study goals for the day and stay disciplined with bite-size tasks.</p>
          </div>
          <div className="flex items-center gap-2 rounded-3xl bg-white/5 px-4 py-2 text-slate-100">
            <Clock3 className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">{unfinishedCount} left</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {tasks.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No goals yet. Add your first goal for the day.
            </div>
          ) : (
            tasks.map((task, index) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`w-full text-left rounded-[1.5rem] border px-4 py-4 transition-all duration-200 focus:outline-none ${
                  task.done
                    ? "border-white/10 bg-slate-900/70 text-slate-400 line-through"
                    : "border-white/10 bg-slate-950/80 text-white hover:border-gold/40 hover:bg-gold/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${task.done ? "border-slate-500 bg-slate-700" : "border-gold bg-gold/10 text-gold"}`}>
                    {task.done ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="text-sm font-medium">{task.text}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a daily goal..."
            className="flex-1 rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask} className="rounded-3xl bg-gold text-black hover:bg-amber-300 px-4 py-3">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 text-xs text-slate-500 flex items-center justify-between">
          <span>Tap a goal to mark complete.</span>
          <button onClick={clearCompleted} className="text-gold hover:text-white transition-colors">
            Clear done
          </button>
        </div>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 backdrop-blur-xl p-5">
        <div className="flex items-center gap-3 text-slate-300">
          <Sparkles className="h-4 w-4 text-gold" />
          <p className="text-sm">Daily goals help you stay accountable and consistent with your training.</p>
        </div>
      </div>
    </div>
  );
};

export default DailyGoalsSection;
