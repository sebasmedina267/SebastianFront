import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api.js';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import ClientsPage from './pages/ClientsPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';

const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tareas' },
  { id: 'clients', label: 'Clientes' },
  { id: 'sessions', label: 'Sesiones' }
];

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('Comprobando...');
  const [dashboard, setDashboard] = useState({ summary: {}, tasks: [], clients: [], sessions: [] });
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [sessions, setSessions] = useState([]);

  const addTask = async (title) => {
    const newTask = await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    setTasks((current) => [newTask, ...current]);
    setDashboard((current) => ({
      ...current,
      summary: {
        ...current.summary,
        totalTasks: (current.summary.totalTasks || 0) + 1,
        openTasks: (current.summary.openTasks || 0) + 1
      },
      tasks: [newTask, ...current.tasks]
    }));
  };

  const toggleTask = async (id) => {
    const updatedTask = await apiFetch(`/tasks/${id}/toggle`, {
      method: 'PATCH'
    });

    setTasks((current) =>
      current.map((task) => (task.id === id ? updatedTask : task))
    );
    setDashboard((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? updatedTask : task)),
      summary: {
        ...current.summary,
        completedTasks: current.tasks.filter((task) => task.status === 'Completada').length + (updatedTask.status === 'Completada' ? 1 : -1),
        openTasks: current.tasks.filter((task) => task.status === 'Pendiente').length + (updatedTask.status === 'Pendiente' ? 1 : -1)
      }
    }));
  };

  const deleteTask = async (id) => {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    setTasks((current) => current.filter((task) => task.id !== id));
    setDashboard((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id)
    }));
  };

  const addClient = async (payload) => {
    const client = await apiFetch('/clients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setClients((current) => [client, ...current]);
    setDashboard((current) => ({
      ...current,
      clients: [client, ...current.clients]
    }));
  };

  const addSession = async (payload) => {
    const session = await apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setSessions((current) => [session, ...current]);
    setDashboard((current) => ({
      ...current,
      sessions: [session, ...current.sessions]
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [health, dashboardData, taskData, clientData, sessionData] = await Promise.all([
          apiFetch('/health'),
          apiFetch('/dashboard'),
          apiFetch('/tasks'),
          apiFetch('/clients'),
          apiFetch('/sessions')
        ]);

        if (!isMounted) return;

        setBackendStatus(health.success ? '🟢 Backend conectado' : '🔴 Backend no disponible');
        setDashboard(dashboardData);
        setTasks(taskData);
        setClients(clientData);
        setSessions(sessionData);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error cargando datos:', error);
        setBackendStatus('🔴 Backend no disponible');
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const currentPage = useMemo(() => {
    switch (activeView) {
      case 'tasks':
        return <TasksPage tasks={tasks} onAddTask={addTask} onDeleteTask={deleteTask} onToggleTask={toggleTask} />;
      case 'clients':
        return <ClientsPage clients={clients} onAddClient={addClient} />;
      case 'sessions':
        return <SessionsPage sessions={sessions} onAddSession={addSession} />;
      default:
        return <DashboardPage dashboard={dashboard} />;
    }
  }, [activeView, dashboard, tasks, clients, sessions]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>GymFlow</h1>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activeView === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="status-box">
          <span>Estado</span>
          <strong>{backendStatus}</strong>
        </div>
      </aside>

      <main className="main-panel">{currentPage}</main>
    </div>
  );
}

export default App;