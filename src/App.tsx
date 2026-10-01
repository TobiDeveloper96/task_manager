import { useEffect, useMemo, useState } from "react";

type Priority = "Low" | "Medium" | "High";
type Filter = "all" | "active" | "completed";

type Task = {
  id: number;
  title: string;
  note: string;
  priority: Priority;
  dueDate: string;
  completed: boolean;
  createdAt: number;
};

type TaskFormState = {
  title: string;
  note: string;
  priority: Priority;
  dueDate: string;
};

const STORAGE_KEY = "taskflow.tasks";
const EMPTY_FORM: TaskFormState = {
  title: "",
  note: "",
  priority: "Medium",
  dueDate: "",
};

const defaultTasks: Task[] = [
  {
    id: 1,
    title: "Prepare sprint plan",
    note: "Outline goals, owners, and blockers for the next iteration.",
    priority: "High",
    dueDate: "2026-10-03",
    completed: false,
    createdAt: Date.now(),
  },
  {
    id: 2,
    title: "Review design draft",
    note: "Check mobile spacing, hierarchy, and CTA copy.",
    priority: "Medium",
    dueDate: "2026-10-02",
    completed: true,
    createdAt: Date.now() - 1000,
  },
  {
    id: 3,
    title: "Update dependencies",
    note: "Install and verify the latest stable library versions.",
    priority: "Low",
    dueDate: "",
    completed: false,
    createdAt: Date.now() - 2000,
  },
];

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

function formatDate(date: string): string {
  if (!date) {
    return "No due date";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return defaultTasks;
    }

    try {
      const parsed = JSON.parse(storedValue) as Task[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTasks;
    } catch {
      return defaultTasks;
    }
  });

  const [form, setForm] = useState<TaskFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "active"
            ? !task.completed
            : task.completed;

      const matchesSearch =
        searchValue.length === 0 ||
        task.title.toLowerCase().includes(searchValue) ||
        task.note.toLowerCase().includes(searchValue);

      return matchesFilter && matchesSearch;
    });
  }, [filter, search, tasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const active = tasks.length - completed;
    const overdue = tasks.filter((task) => isOverdue(task)).length;

    return { completed, active, overdue };
  }, [tasks]);

  const handleFieldChange = (field: keyof TaskFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const sanitizedTitle = form.title.trim();
    if (!sanitizedTitle) {
      return;
    }

    if (editingId !== null) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId
            ? {
                ...task,
                title: sanitizedTitle,
                note: form.note.trim(),
                priority: form.priority,
                dueDate: form.dueDate,
              }
            : task,
        ),
      );
    } else {
      setTasks((current) => [
        {
          id: Date.now() + Math.random(),
          title: sanitizedTitle,
          note: form.note.trim(),
          priority: form.priority,
          dueDate: form.dueDate,
          completed: false,
          createdAt: Date.now(),
        },
        ...current,
      ]);
    }

    resetForm();
  };

  const toggleTask = (taskId: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  const removeTask = (taskId: number) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (editingId === taskId) {
      resetForm();
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      note: task.note,
      priority: task.priority,
      dueDate: task.dueDate,
    });
  };

  const clearCompleted = () => {
    setTasks((current) => current.filter((task) => !task.completed));
    resetForm();
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>TaskFlow</h1>
        </div>
        <div className="status-chip">{tasks.length} tasks</div>
      </header>

      <main className="content-grid">
        <section className="panel form-panel">
          <h2>{editingId === null ? "Add a task" : "Update task"}</h2>
          <form onSubmit={handleSubmit} className="task-form">
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => handleFieldChange("title", event.target.value)}
                placeholder="Finish pricing review"
                maxLength={80}
              />
            </label>

            <label>
              <span>Notes</span>
              <textarea
                value={form.note}
                onChange={(event) => handleFieldChange("note", event.target.value)}
                placeholder="Add context or next steps"
                rows={4}
              />
            </label>

            <div className="inline-fields">
              <label>
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    handleFieldChange("priority", event.target.value as Priority)
                  }
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label>
                <span>Due date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => handleFieldChange("dueDate", event.target.value)}
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn">
                {editingId === null ? "Add task" : "Save changes"}
              </button>
              {editingId !== null && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <aside className="panel summary-panel">
          <h2>Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Active</span>
              <strong>{stats.active}</strong>
            </div>
            <div className="stat-card">
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
            <div className="stat-card warning">
              <span>Overdue</span>
              <strong>{stats.overdue}</strong>
            </div>
          </div>
        </aside>

        <section className="panel task-panel">
          <div className="toolbar">
            <div className="filter-group" aria-label="Task filters">
              <button
                type="button"
                className={filter === "all" ? "active" : ""}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={filter === "active" ? "active" : ""}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                type="button"
                className={filter === "completed" ? "active" : ""}
                onClick={() => setFilter("completed")}
              >
                Done
              </button>
            </div>

            <input
              className="search-box"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
            />
          </div>

          <div className="task-list-header">
            <h2>Tasks</h2>
            {stats.completed > 0 && (
              <button type="button" className="text-button" onClick={clearCompleted}>
                Clear completed
              </button>
            )}
          </div>

          <div className="task-list">
            {visibleTasks.length === 0 ? (
              <div className="empty-state">No tasks match your current filters.</div>
            ) : (
              visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-item ${task.completed ? "done" : ""} ${
                    isOverdue(task) ? "overdue" : ""
                  }`}
                >
                  <div className="task-main">
                    <button
                      type="button"
                      className="checkbox"
                      onClick={() => toggleTask(task.id)}
                      aria-label={`Toggle ${task.title}`}
                      title="Toggle complete"
                    >
                      {task.completed ? "✓" : ""}
                    </button>

                    <div className="task-copy">
                      <div className="task-title-row">
                        <h3>{task.title}</h3>
                        <span className={`priority-badge ${task.priority.toLowerCase()}`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.note && <p>{task.note}</p>}

                      <div className="meta-row">
                        <span>{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
                        {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
                      </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    <button type="button" className="ghost-btn" onClick={() => startEditing(task)}>
                      Edit
                    </button>
                    <button type="button" className="ghost-btn danger" onClick={() => removeTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
