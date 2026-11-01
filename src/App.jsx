import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const STORAGE_KEY = "taskflow-tasks";

const navigation = [
  { name: "Dashboard", icon: "⌂" },
  { name: "All Tasks", icon: "▤" },
  { name: "Active Tasks", icon: "◷" },
  { name: "Completed Tasks", icon: "✓" },
];

const categories = [
  { name: "Work", icon: "▣" },
  { name: "Personal", icon: "♙" },
  { name: "Study", icon: "▤" },
];

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((task) => task && typeof task === "object")
      .map((task, index) => ({
        id: task.id ?? `${Date.now()}-${index}`,
        title: typeof task.title === "string" ? task.title : "",
        category: categories.some((item) => item.name === task.category)
          ? task.category
          : "Work",
        dueDate: task.dueDate || "",
        completed: Boolean(task.completed),
      }));
  } catch (error) {
    console.error("Unable to load tasks:", error);
    return [];
  }
}

function saveToLocalStorage(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Unable to save tasks:", error);
  }
}

function BrandLogo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 40 40" role="img">
          <rect x="1" y="1" width="38" height="38" rx="12" fill="#6755e8" />
          <path
            d="M11 20.5L17 26L29 13.5"
            fill="none"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="brand-name">
          TaskFlow <strong>AI</strong>
        </span>
      )}
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState(loadFromLocalStorage);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Work");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [editId, setEditId] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    saveToLocalStorage(tasks);
  }, [tasks]);

  const completed = tasks.filter((task) => task.completed).length;
  const active = tasks.length - completed;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatches =
        filter === "All" ||
        (filter === "Active" && !task.completed) ||
        (filter === "Completed" && task.completed);

      const categoryMatches =
        !categories.some((item) => item.name === activePage) ||
        task.category === activePage;

      const query = search.trim().toLowerCase();

      const searchMatches =
        (task.title || "").toLowerCase().includes(query) ||
        (task.category || "Work").toLowerCase().includes(query);

      return statusMatches && categoryMatches && searchMatches;
    });
  }, [tasks, filter, activePage, search]);

  function showNotice(message) {
    setNotice(message);
  }

  function resetForm() {
    setTitle("");
    setCategory("Work");
    setDueDate("");
    setEditId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      showNotice("Please enter a task title.");
      return;
    }

    if (editId !== null) {
      setTasks((oldTasks) =>
        oldTasks.map((task) =>
          task.id === editId
            ? { ...task, title: cleanTitle, category, dueDate }
            : task
        )
      );

      showNotice("Task updated successfully.");
    } else {
      const newTask = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        title: cleanTitle,
        category,
        dueDate,
        completed: false,
      };

      setTasks((oldTasks) => [newTask, ...oldTasks]);
      showNotice("New task added successfully.");
    }

    resetForm();
  }

  function editTask(task) {
    setTitle(task.title || "");
    setCategory(task.category || "Work");
    setDueDate(task.dueDate || "");
    setEditId(task.id);
    showNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    setTasks((oldTasks) => oldTasks.filter((task) => task.id !== id));

    if (editId === id) resetForm();

    showNotice("Task deleted successfully.");
  }

  function toggleTask(id) {
    const selectedTask = tasks.find((task) => task.id === id);

    setTasks((oldTasks) =>
      oldTasks.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed }
          : task
      )
    );

    showNotice(
      selectedTask?.completed
        ? "Task moved to Active."
        : "Congratulations! Task completed."
    );
  }

  function selectNavigation(name) {
    setActivePage(name);
    setSearch("");

    if (name === "Active Tasks") {
      setFilter("Active");
    } else if (name === "Completed Tasks") {
      setFilter("Completed");
    } else {
      setFilter("All");
    }
  }

  function selectCategory(name) {
    setActivePage(name);
    setFilter("All");
    setSearch("");
  }

  function handleDragStart(id) {
    setDraggedId(id);
  }

  function handleDrop(targetId) {
    if (draggedId === null || draggedId === targetId) return;

    setTasks((oldTasks) => {
      const updated = [...oldTasks];

      const fromIndex = updated.findIndex(
        (task) => task.id === draggedId
      );

      const toIndex = updated.findIndex(
        (task) => task.id === targetId
      );

      if (fromIndex === -1 || toIndex === -1) return oldTasks;

      const [movedTask] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedTask);

      return updated;
    });

    setDraggedId(null);
  }

  function clearCompleted() {
    const count = tasks.filter((task) => task.completed).length;

    if (!count) {
      showNotice("There are no completed tasks to clear.");
      return;
    }

    if (!window.confirm(`Delete all ${count} completed tasks?`)) return;

    setTasks((oldTasks) => oldTasks.filter((task) => !task.completed));
    showNotice("Completed tasks cleared.");
  }

  const pageTitle = categories.some((item) => item.name === activePage)
    ? `${activePage} Tasks`
    : activePage;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <BrandLogo />
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sidebar-link ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => selectNavigation(item.name)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>

              {item.name === "All Tasks" && (
                <span className="sidebar-count">{tasks.length}</span>
              )}
            </button>
          ))}
        </nav>

        <p className="sidebar-label category-heading">CATEGORIES</p>

        <nav className="sidebar-nav" aria-label="Task categories">
          {categories.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sidebar-link ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => selectCategory(item.name)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-progress">
          <div className="progress-heading">
            <span>Daily progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <small>{completed} of {tasks.length} tasks completed</small>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-avatar">R</div>
          <div className="sidebar-user">
            <strong>Ranjit Iwale</strong>
            <span>Workspace owner</span>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <BrandLogo />
          </div>

          <div className="topbar-left">
            <span className="topbar-caption">MY WORKSPACE</span>
            <strong>{pageTitle}</strong>
          </div>

          <div className="topbar-right">
            <span className="online-dot" />
            <span>Productivity workspace</span>
          </div>
        </header>

        <main className="main-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow">PLAN • ORGANIZE • ACHIEVE</p>
              <h1>Make today <span>count.</span></h1>
              <p className="welcome-description">
                A little progress every day adds up to big results.
              </p>
            </div>

            <div className="welcome-date">
              <span>YOUR PRODUCTIVITY</span>
              <strong>{progress}%</strong>
              <small>Completion rate</small>
            </div>
          </section>

          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          )}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon purple">▤</div>
              <div>
                <p>Total Tasks</p>
                <h2>{tasks.length}</h2>
                <small>All your tasks</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">◷</div>
              <div>
                <p>Active Tasks</p>
                <h2>{active}</h2>
                <small>Waiting to be done</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <p>Completed</p>
                <h2>{completed}</h2>
                <small>Tasks finished</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">↗</div>
              <div>
                <p>Progress</p>
                <h2>{progress}%</h2>
                <small>Overall completion</small>
              </div>
            </div>
          </section>

          <section className="content-grid">
            <section className="panel task-form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">TASK MANAGEMENT</p>
                  <h2>{editId !== null ? "Edit Task" : "Create New Task"}</h2>
                </div>
                <span className="panel-heading-icon">＋</span>
              </div>

              <form className="task-form" onSubmit={handleSubmit}>
                <label htmlFor="task-title">Task title *</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="What do you need to do?"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={150}
                  required
                />

                <label htmlFor="task-category">Category</label>
                <select
                  id="task-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categories.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="task-date">Due date</label>
                <input
                  id="task-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />

                <button type="submit" className="primary-button">
                  {editId !== null ? "Save Changes" : "+ Add Task"}
                </button>

                {editId !== null && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={resetForm}
                  >
                    Cancel editing
                  </button>
                )}
              </form>
            </section>

            <section className="panel overview-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">YOUR OVERVIEW</p>
                  <h2>Task Progress</h2>
                </div>
                <span className="panel-heading-icon">↗</span>
              </div>

              <div className="progress-circle-wrap">
                <div
                  className="progress-circle"
                  style={{
                    background: `conic-gradient(#6755e8 ${progress * 3.6}deg, #eeedf7 0deg)`,
                  }}
                >
                  <div className="progress-circle-inner">
                    <strong>{progress}%</strong>
                    <span>Completed</span>
                  </div>
                </div>
              </div>

              <div className="overview-stats">
                <div>
                  <span className="legend-dot active-dot" />
                  <span>Active tasks</span>
                  <strong>{active}</strong>
                </div>
                <div>
                  <span className="legend-dot completed-dot" />
                  <span>Completed tasks</span>
                  <strong>{completed}</strong>
                </div>
              </div>

              <div className="overview-message">
                {tasks.length === 0
                  ? "Add your first task and start making progress."
                  : completed === tasks.length
                    ? "Amazing! You have completed all your tasks."
                    : "Keep going! Every completed task moves you forward."}
              </div>
            </section>
          </section>

          <section className="panel task-list-panel">
            <div className="list-heading">
              <div>
                <p className="eyebrow">STAY ON TRACK</p>
                <h2>{pageTitle} <span className="count">{filteredTasks.length}</span></h2>
              </div>

              <div className="list-tools">
                <input
                  className="search-input"
                  type="search"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search tasks"
                />

                <button
                  type="button"
                  className="clear-button"
                  onClick={clearCompleted}
                >
                  Clear completed
                </button>
              </div>
            </div>

            <div className="filter-tabs">
              {["All", "Active", "Completed"].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filter-button ${
                    filter === item ? "selected" : ""
                  }`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                  <span>
                    {item === "All"
                      ? tasks.length
                      : item === "Active"
                        ? active
                        : completed}
                  </span>
                </button>
              ))}
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">✓</div>
                <h3>No tasks found</h3>
                <p>
                  {search
                    ? "Try another search term."
                    : "Add a task to get started with your day."}
                </p>
              </div>
            ) : (
              <div className="task-list">
                {filteredTasks.map((task) => (
                  <article
                    key={task.id}
                    className={`task-item ${
                      task.completed ? "is-completed" : ""
                    } ${draggedId === task.id ? "is-dragging" : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(task.id)}
                    onDragEnd={() => setDraggedId(null)}
                  >
                    <span className="drag-handle" title="Drag to reorder">
                      ⠿
                    </span>

                    <button
                      type="button"
                      className={`task-check ${
                        task.completed ? "checked" : ""
                      }`}
                      onClick={() => toggleTask(task.id)}
                      aria-label={
                        task.completed
                          ? "Mark task active"
                          : "Mark task completed"
                      }
                    >
                      {task.completed ? "✓" : ""}
                    </button>

                    <div className="task-content">
                      <h3>{task.title || "Untitled task"}</h3>

                      <div className="task-meta">
                        <span
                          className={`category ${
                            (task.category || "Work").toLowerCase()
                          }`}
                        >
                          {task.category || "Work"}
                        </span>

                        {task.dueDate && (
                          <span className="due-date">
                            Due: {task.dueDate}
                          </span>
                        )}

                        {task.completed && (
                          <span className="completed-label">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="task-actions">
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => editTask(task)}
                        aria-label="Edit task"
                        title="Edit task"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        className="icon-button delete-button"
                        onClick={() => deleteTask(task.id)}
                        aria-label="Delete task"
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="developer-footer">
            <div className="footer-brand">
              <BrandLogo />
              <p>Plan smarter. Stay organized. Achieve more.</p>
            </div>

            <div className="footer-divider" />

            <div className="footer-developer">
              <h3>Developed by <a href="https://github.com/ranjitiwale" target="_blank" rel="noreferrer">@Ranjit Iwale</a></h3>
              <p>All rights reserved to the developer.</p>
            </div>

            <div className="footer-contact">
              <a href="mailto:ranjitiwale2003@gmail.com">
                <span>✉</span>
                ranjitiwale2003@gmail.com
              </a>

              <a href="tel:+918080171003">
                <span>☎</span>
                +91 8080171003
              </a>
            </div>

            <div className="footer-socials">
              <a
                href="https://github.com/ranjitiwale"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub profile"
              >
                GitHub ↗
              </a>

              <a
                href="https://www.linkedin.com/in/ranjit-iwale-3a1112212/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn profile"
              >
                LinkedIn ↗
              </a>
            </div>

            <div className="footer-copyright">
              © {new Date().getFullYear()} TaskFlow AI. All rights reserved.
              <span>Designed & developed by Ranjit Iwale.</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;