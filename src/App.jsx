import { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from './api.js';
import { initWebSocket, onWSMessage, onWSStatus } from './services/websocket.js';

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

const emptyDashboard = {
  summary: {
    totalTasks: 0,
    completedTasks: 0,
    openTasks: 0,
    activeClients: 0,
    confirmedSessions: 0
  },
  tasks: [],
  clients: [],
  sessions: []
};

const sameId = (first, second) => String(first) === String(second);

const normalizeWSMessage = (message) => {
  let normalized = message;

  for (let depth = 0; depth < 3; depth += 1) {
    if (normalized?.type === 'broadcast' && typeof normalized.message === 'string') {
      try {
        normalized = JSON.parse(normalized.message);
        continue;
      } catch {
        return normalized;
      }
    }
    if (normalized?.type === 'broadcast' && normalized.message && typeof normalized.message === 'object') {
      normalized = normalized.message;
      continue;
    }
    break;
  }

  if (normalized?.type === 'newTask' && normalized.task) {
    return { ...normalized, type: 'tasks:created', payload: { task: normalized.task } };
  }
  if (normalized?.type === 'newClient' && normalized.client) {
    return { ...normalized, type: 'clients:created', payload: { client: normalized.client } };
  }
  if (normalized?.type === 'newSession' && normalized.session) {
    return { ...normalized, type: 'sessions:created', payload: { session: normalized.session } };
  }

  return normalized;
};

const updateDashboard = (dashboard, message) => {
  const { type, payload = {} } = message;
  const next = (() => {
    if (type === 'tasks:created' && payload.task) {
      return {
        ...dashboard,
        tasks: [payload.task, ...dashboard.tasks.filter((task) => !sameId(task.id, payload.task.id))]
      };
    }
    if (type === 'tasks:updated' && payload.task) {
      return {
        ...dashboard,
        tasks: dashboard.tasks.map((task) => sameId(task.id, payload.task.id) ? payload.task : task)
      };
    }
    if (type === 'tasks:deleted' && payload.id !== undefined) {
      return {
        ...dashboard,
        tasks: dashboard.tasks.filter((task) => !sameId(task.id, payload.id))
      };
    }
    if (type === 'clients:created' && payload.client) {
      return {
        ...dashboard,
        clients: [payload.client, ...dashboard.clients.filter((client) => !sameId(client.id, payload.client.id))]
      };
    }
    if (type === 'sessions:created' && payload.session) {
      return {
        ...dashboard,
        sessions: [payload.session, ...dashboard.sessions.filter((session) => !sameId(session.id, payload.session.id))]
      };
    }
    return null;
  })();

  if (!next) return dashboard;

  return {
    ...next,
    summary: {
      totalTasks: next.tasks.length,
      completedTasks: next.tasks.filter((task) => task.status === 'Completada').length,
      openTasks: next.tasks.filter((task) => task.status === 'Pendiente').length,
      activeClients: next.clients.filter((client) => client.status === 'Activa').length,
      confirmedSessions: next.sessions.filter((session) => session.status === 'Confirmada').length
    }
  };
};

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [backendStatus, setBackendStatus] = useState('Comprobando...');
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const dashboardRevision = useRef(0);

  useEffect(() => {
    let isMounted = true;
    let initialDataLoaded = false;
    const pendingMessages = [];

    const refreshDashboard = async (revision = dashboardRevision.current) => {
      try {
        const dashboardData = await apiFetch('/dashboard');
        if (!isMounted || revision !== dashboardRevision.current) return;
        setDashboard({
          ...emptyDashboard,
          ...dashboardData,
          summary: { ...emptyDashboard.summary, ...dashboardData.summary }
        });
      } catch (error) {
        console.error('Error sincronizando datos en tiempo real:', error);
      }
    };

    const unsubscribeMessages = onWSMessage((message) => {
      if (!initialDataLoaded) {
        pendingMessages.push(normalizeWSMessage(message));
        return;
      }
      const normalizedMessage = normalizeWSMessage(message);
      if (normalizedMessage?.type === 'welcome') return;

      dashboardRevision.current += 1;
      const revision = dashboardRevision.current;
      setDashboard((current) => updateDashboard(current, normalizedMessage));
      refreshDashboard(revision);
    });
    const unsubscribeStatus = onWSStatus((status) => {
      setSocketStatus(status);
      if (status === 'connected' && initialDataLoaded) {
        refreshDashboard();
      }
    });
    const stopWebSocket = initWebSocket();

    const loadData = async () => {
      try {
        const [health, dashboardData] = await Promise.all([
          apiFetch('/health'),
          apiFetch('/dashboard')
        ]);

        if (!isMounted) return;

        setBackendStatus(health.success ? '🟢 Backend conectado' : '🔴 Backend no disponible');
        const currentDashboard = pendingMessages.reduce(updateDashboard, {
          ...emptyDashboard,
          ...dashboardData,
          summary: { ...emptyDashboard.summary, ...dashboardData.summary }
        });
        initialDataLoaded = true;
        dashboardRevision.current += 1;
        setDashboard(currentDashboard);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error cargando datos:', error);
        setBackendStatus('🔴 Backend no disponible');
        initialDataLoaded = true;
        pendingMessages.forEach((message) => {
          setDashboard((current) => updateDashboard(current, message));
        });
      }
    };

    loadData();

    return () => {
      isMounted = false;
      unsubscribeMessages();
      unsubscribeStatus();
      stopWebSocket();
    };
  }, []);

  const addTask = async (title) => {
    const newTask = await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title })
    });

    setDashboard((current) => updateDashboard(current, {
      type: 'tasks:created',
      payload: { task: newTask }
    }));
  };

  const toggleTask = async (id) => {
    const updatedTask = await apiFetch(`/tasks/${id}/toggle`, {
      method: 'PATCH'
    });

    setDashboard((current) => updateDashboard(current, {
      type: 'tasks:updated',
      payload: { task: updatedTask }
    }));
  };

  const deleteTask = async (id) => {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });

    setDashboard((current) => updateDashboard(current, {
      type: 'tasks:deleted',
      payload: { id }
    }));
  };

  const addClient = async (payload) => {
    const client = await apiFetch('/clients', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setDashboard((current) => updateDashboard(current, {
      type: 'clients:created',
      payload: { client }
    }));
  };

  const addSession = async (payload) => {
    const session = await apiFetch('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setDashboard((current) => updateDashboard(current, {
      type: 'sessions:created',
      payload: { session }
    }));
  };

  const currentPage = useMemo(() => {
    switch (activeView) {
      case 'tasks':
        return <TasksPage tasks={dashboard.tasks} onAddTask={addTask} onDeleteTask={deleteTask} onToggleTask={toggleTask} />;
      case 'clients':
        return <ClientsPage clients={dashboard.clients} onAddClient={addClient} />;
      case 'sessions':
        return <SessionsPage sessions={dashboard.sessions} onAddSession={addSession} />;
      default:
        return <DashboardPage dashboard={dashboard} />;
    }
  }, [activeView, dashboard]);

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
          <span>Backend</span>
          <strong>{backendStatus}</strong>
          <span>Tiempo real</span>
          <strong>
            {socketStatus === 'connected' ? '🟢 Conectado' :
              socketStatus === 'connecting' || socketStatus === 'reconnecting' ? '🟡 Reconectando...' :
                '🔴 Desconectado'}
          </strong>
        </div>
      </aside>

      <main className="main-panel">{currentPage}</main>
    </div>
  );
}

export default App;
