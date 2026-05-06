import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Bell, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const STORAGE_KEY = "olive-wings-todo-list";

const getRandomReminder = () => {
  const reminders = [
    "Check your to-do list and keep moving.",
    "Have you completed your top prep task today?",
    "A short review of your notes can make a big difference.",
    "Open your to-do widget and update progress.",
    "Stay disciplined: tick one task off your list now."
  ];
  return reminders[Math.floor(Math.random() * reminders.length)];
};

const TodoWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  useEffect(() => {
    let timer: number;
    const scheduleReminder = () => {
      const delay = 45000 + Math.random() * 45000;
      timer = window.setTimeout(() => {
        toast(`📝 ${getRandomReminder()}`, { duration: 4000 });
        scheduleReminder();
      }, delay);
    };

    scheduleReminder();
    return () => window.clearTimeout(timer);
  }, []);

  const unfinishedCount = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);

  const addTask = () => {
    const trimmed = newTask.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: trimmed, done: false },
    ]);
    setNewTask("");
    toast.success("Task added to your to-do list.");
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((task) => !task.done));
    toast.success("Cleared completed tasks.");
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative inline-flex items-center justify-center rounded-full bg-slate-900/95 border border-gold/30 p-4 shadow-lg shadow-slate-950/30 text-white hover:bg-slate-800 transition"
        aria-label="Open to-do widget"
      >
        <Bell className="h-5 w-5" />
        {unfinishedCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-black">
            {unfinishedCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="w-[320px] rounded-[2rem] border border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-card p-5 text-slate-100">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold">Study To-Do List</p>
              <p className="text-xs text-slate-400">Stay on track with daily prep.</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 text-slate-300 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {tasks.length === 0 ? (
              <p className="text-slate-500 text-sm">Add your first note to keep your prep focused.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`mt-0.5 h-5 w-5 rounded-full border ${task.done ? "border-gold bg-gold text-black" : "border-slate-600 text-slate-400"} flex items-center justify-center`}
                    aria-label={task.done ? "Mark task undone" : "Mark task done"}
                  >
                    {task.done ? <Check className="h-3 w-3" /> : null}
                  </button>
                  <p className={`text-sm leading-5 ${task.done ? "line-through text-slate-500" : "text-slate-100"}`}>
                    {task.text}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
              placeholder="Add a note..."
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button
              onClick={addTask}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gold text-black hover:bg-amber-300"
              aria-label="Add task"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>{unfinishedCount} unfinished</span>
            <button onClick={clearCompleted} className="font-medium text-gold hover:text-white">
              Clear done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoWidget;
