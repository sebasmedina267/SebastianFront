import MetricCard from '../components/MetricCard.jsx';

export default function DashboardPage({ dashboard }) {
  const { summary = {}, tasks = [], clients = [], sessions = [] } = dashboard;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel general</p>
          <h2>Resumen del gimnasio</h2>
        </div>
      </header>

      <div className="metrics-grid">
        <MetricCard label="Tareas totales" value={summary.totalTasks ?? 0} tone="primary" />
        <MetricCard label="Pendientes" value={summary.openTasks ?? 0} tone="warning" />
        <MetricCard label="Clientes activos" value={summary.activeClients ?? 0} tone="success" />
        <MetricCard label="Sesiones confirmadas" value={summary.confirmedSessions ?? 0} tone="info" />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h3>Últimas tareas</h3>
          <ul className="list">
            {tasks.slice(0, 4).map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                <small>{task.status}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h3>Clientes activos</h3>
          <ul className="list">
            {clients.slice(0, 4).map((client) => (
              <li key={client.id}>
                <span>{client.name}</span>
                <small>{client.plan}</small>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel full-width">
          <h3>Próximas sesiones</h3>
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Coach</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 4).map((session) => (
                <tr key={session.id}>
                  <td>{session.client}</td>
                  <td>{session.coach}</td>
                  <td>{session.date}</td>
                  <td>{session.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
