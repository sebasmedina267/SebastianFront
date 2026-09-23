import { useState } from 'react';

const emptyForm = {
  client: '',
  coach: '',
  date: '',
  time: '',
  status: 'Pendiente'
};

export default function SessionsPage({ sessions, onAddSession }) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.client.trim() || !form.coach.trim() || !form.date || !form.time) return;

    onAddSession({
      client: form.client.trim(),
      coach: form.coach.trim(),
      date: form.date,
      time: form.time,
      status: form.status
    });

    setForm(emptyForm);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Sesiones</p>
          <h2>Agenda y reservas</h2>
        </div>
      </header>

      <form className="form-panel form-grid" onSubmit={handleSubmit}>
        <input
          type="text"
          value={form.client}
          onChange={(event) => setForm({ ...form, client: event.target.value })}
          placeholder="Cliente"
        />
        <input
          type="text"
          value={form.coach}
          onChange={(event) => setForm({ ...form, coach: event.target.value })}
          placeholder="Entrenador"
        />
        <input
          type="date"
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
        />
        <input
          type="time"
          value={form.time}
          onChange={(event) => setForm({ ...form, time: event.target.value })}
        />
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="Pendiente">Pendiente</option>
          <option value="Confirmada">Confirmada</option>
        </select>
        <button type="submit">Crear sesión</button>
      </form>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Coach</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan="5">No hay sesiones programadas.</td>
              </tr>
            ) : (
              sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.client}</td>
                  <td>{session.coach}</td>
                  <td>{session.date}</td>
                  <td>{session.time}</td>
                  <td>
                    <span className={`status-pill ${session.status === 'Confirmada' ? 'success' : 'warning'}`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
