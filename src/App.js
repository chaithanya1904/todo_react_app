import React, { useState, useEffect } from 'react';
import './App.css';
import { initSmartTrace } from './sdk';

const CATEGORIES = ['All', 'Work', 'Personal', 'Health', 'Finance'];
const PRIORITIES = ['high', 'medium', 'low'];

// ─── USERS ───────────────────────────────────────────────────────────────────
const USERS = {
  USR_001: { id: 'USR_001', name: 'John Smith',     initials: 'JS', color: '#3b82f6' },
  USR_002: { id: 'USR_002', name: 'Priya Sharma',   initials: 'PS', color: '#8b5cf6' },
  USR_003: { id: 'USR_003', name: 'Marcus Johnson', initials: 'MJ', color: '#10b981' },
};

// Read user from URL param
// http://localhost:3000?user=USR_001
function getUserFromURL() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('user');
  return USERS[userId] || USERS['USR_001'];
}

// ─── API HELPERS ─────────────────────────────────────────────────────────────

async function fetchTasks(userId) {
  const response = await fetch(`/tasks?userId=${userId}`);
  return response.json();
}

async function createTask(task) {
  const response = await fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return response.json();
}

async function updateTask(id, changes) {
  const response = await fetch(`/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  return response.json();
}

async function deleteTask(id) {
  await fetch(`/tasks/${id}`, { method: 'DELETE' });
}

// ─── TASK ITEM ────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onDelete }) {
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = !task.completed && task.dueDate < today;

 
  const priorityLabel = task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '';

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-left">
        <button className={`checkbox ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task)}>
          {task.completed && '✓'}
        </button>
        <div className="task-info">
          <span className="task-title">{task.title.trim()}</span>
          <div className="task-meta">
            <span className="category-tag">{task.category}</span>
            {task.dueDate && (
              <span className={`due-date ${isOverdue ? 'overdue-text' : ''}`}>
                {isOverdue ? '⚠ Overdue · ' : '📅 '}
                {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="task-right">
        <span className={`priority-badge priority-${task.priority}`}>{priorityLabel}</span>
        <button className="delete-btn" onClick={() => onDelete(task.id)}>✕</button>
      </div>
    </div>
  );
}

// ─── ADD TASK FORM ────────────────────────────────────────────────────────────

function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd({ title: title.trim(), category, priority, dueDate, completed: false });
    setTitle('');
    setDueDate('');
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <input
        className="text-input"
        type="text"
        placeholder="Task title…"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <div className="form-row">
        <select className="select-input" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="select-input" value={priority} onChange={e => setPriority(e.target.value)}>
          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <input
        className="date-input"
        type="date"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
      />
      <button className="btn-primary" type="submit">Add Task</button>
    </form>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Get user from URL param
  const currentUser = getUserFromURL();

  // Initialize SmartTrace SDK with current user
  initSmartTrace({ userId: currentUser.id });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activePriority, setActivePriority] = useState('all');

  // Load tasks for current user only
  useEffect(() => {
    fetchTasks(currentUser.id)
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => { setError('Could not connect to API. Is json-server running?'); setLoading(false); });
  }, [currentUser.id]);

  const handleAdd = async (taskData) => {
    const newTask = await createTask({ ...taskData, userId: currentUser.id });
    setTasks(prev => [newTask, ...prev]);
  };

  const handleToggle = async (task) => {
    const updated = await updateTask(task.id, { completed: !task.completed });
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const today = new Date().toISOString().split('T')[0];
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const overdueCount = tasks.filter(t => !t.completed && t.dueDate < today).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const activeCount = tasks.filter(t => !t.completed).length;
  const completedCount = completed;
  const catCount = (cat) => tasks.filter(t => t.category === cat).length;

  const filteredTasks = tasks
    .filter(t => {
      if (activeFilter === 'active') return !t.completed;
      if (activeFilter === 'completed') return t.completed;
      if (activeFilter === 'overdue') return !t.completed && t.dueDate < today;
      return true;
    })
    .filter(t => activeCategory === 'All' || t.category === activeCategory)
    .filter(t => activePriority === 'all' || t.priority === activePriority);

  const filterLabel = {
    all: 'All Tasks', active: 'Active', completed: 'Completed', overdue: 'Overdue'
  };

  if (loading) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo"><div className="check">✓</div> Todo List</div>
          <div className="user-indicator" style={{ background: currentUser.color }}>
            {currentUser.initials}
          </div>
        </header>
        <div className="loading-state">
          <div className="loading-spinner" />
          <div className="loading-text">Loading tasks for {currentUser.name}…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <header className="header">
          <div className="header-logo"><div className="check">✓</div> Todo List</div>
          <div className="user-indicator" style={{ background: currentUser.color }}>
            {currentUser.initials}
          </div>
        </header>
        <div className="error-state">
          <div className="error-icon">⚠</div>
          <div className="error-title">Could not load tasks</div>
          <div className="error-msg">{error}</div>
          <button
            className="btn-primary"
            style={{ width: 'auto', padding: '8px 20px', marginTop: 4 }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-logo">
          <div className="check">✓</div>
          Todo List
        </div>

        <div className="header-stats">
          <div className="hstat total">
            <span>{total}</span>
            <span className="hstat-label">total</span>
          </div>
          <div className="hstat done">
            <span>{completedCount}</span>
            <span className="hstat-label">done</span>
          </div>
          {overdueCount > 0 && (
            <div className="hstat overdue">
              <span>{overdueCount}</span>
              <span className="hstat-label">overdue</span>
            </div>
          )}
        </div>

        <div className="header-progress">
          <div className="header-progress-bar">
            <div className="header-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="header-progress-pct">{progress}%</span>
        </div>

        <div className="header-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
        </div>

        {/* USER PILL */}
        <div className="user-pill" style={{ background: currentUser.color }}>
          <span className="user-pill-initials">{currentUser.initials}</span>
          <span className="user-pill-id">{currentUser.id}</span>
        </div>
      </header>

      <div className="body">
        <aside className="left-panel">

          <div className="panel-section">
            <div className="panel-label">New Task</div>
            <AddTaskForm onAdd={handleAdd} />
          </div>

          <div className="panel-section">
            <div className="panel-label">Status</div>
            <div className="nav-items">
              {[
                { key: 'all',       icon: '📋', label: 'All Tasks',  count: total          },
                { key: 'active',    icon: '⚡', label: 'Active',     count: activeCount    },
                { key: 'completed', icon: '✅', label: 'Completed',  count: completedCount },
                { key: 'overdue',   icon: '🔥', label: 'Overdue',    count: overdueCount   },
              ].map(item => (
                <div
                  key={item.key}
                  className={`nav-item ${activeFilter === item.key ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(item.key); setActiveCategory('All'); }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  <span className="nav-count">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="panel-label">Category</div>
            <div className="nav-items">
              {[
                { key: 'All',      icon: '🗂',  label: 'All'      },
                { key: 'Work',     icon: '💼',  label: 'Work'     },
                { key: 'Personal', icon: '🏠',  label: 'Personal' },
                { key: 'Health',   icon: '💪',  label: 'Health'   },
                { key: 'Finance',  icon: '💰',  label: 'Finance'  },
              ].map(item => (
                <div
                  key={item.key}
                  className={`nav-item ${activeCategory === item.key && activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => { setActiveCategory(item.key); setActiveFilter('all'); }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                  <span className="nav-count">{item.key === 'All' ? total : catCount(item.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* USER INFO */}
          <div className="panel-section user-section">
            <div className="panel-label">Logged In As</div>
            <div className="sidebar-user">
              <div className="sidebar-user-avatar" style={{ background: currentUser.color }}>
                {currentUser.initials}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{currentUser.name}</div>
                <div className="sidebar-user-id">{currentUser.id}</div>
              </div>
            </div>
            <div className="switch-user-links">
              <div className="switch-label">Switch User:</div>
              <div className="switch-links">
                {Object.values(USERS).map(user => (
                  <a
                    key={user.id}
                    href={`?user=${user.id}`}
                    className={`switch-link ${currentUser.id === user.id ? 'active-link' : ''}`}
                    style={{ background: currentUser.id === user.id ? user.color : '' }}
                    title={user.name}
                  >
                    {user.initials}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </aside>

        <div className="right-panel">

          <div className="toolbar">
            <span className="toolbar-title">
              {filterLabel[activeFilter]}
              <span className="toolbar-count">({filteredTasks.length})</span>
            </span>
            <div className="priority-tabs">
              {['all', 'high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  className={`priority-tab ${activePriority === p ? 'active' : ''}`}
                  onClick={() => setActivePriority(p)}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="task-scroll">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No tasks here</div>
                <div className="empty-sub">Add a task using the panel on the left</div>
              </div>
            ) : (
              filteredTasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}