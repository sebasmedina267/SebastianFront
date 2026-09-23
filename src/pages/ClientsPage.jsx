import { useState } from 'react';

const emptyForm = {
  name: '',
  plan: 'Mensual',
  status: 'Activa',
  lastVisit: ''
};

export default function ClientsPage({ clients, onAddClient }) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) return;

    onAddClient({
      name: form.name.trim(),
      plan: form.plan,
      status: form.status,
      lastVisit: form.lastVisit || new Date().toISOString().slice(0, 10)
    });

    setForm(emptyForm);
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h2>Gestión de socios</h2>
        </div>
      </header>

      <form className="form-panel form-grid" onSubmit={handleSubmit}>
        <input
          type="text"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Nombre del cliente"
        />
        <select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}>
          <option value="Mensual">Mensual</option>
          <option value="Premium">Premium</option>
          <option value="Básico">Básico</option>
        </select>
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="Activa">Activa</option>
          <option value="Inactiva">Inactiva</option>
        </select>
        <input
          type="date"
          value={form.lastVisit}
          onChange={(event) => setForm({ ...form, lastVisit: event.target.value })}
        />
        <button type="submit">Añadir</button>
      </form>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Última visita</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan="4">No hay clientes registrados.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td>{client.name}</td>
                  <td>{client.plan}</td>
                  <td>
                    <span className={`status-pill ${client.status === 'Activa' ? 'success' : 'warning'}`}>
                      {client.status}
                    </span>
                  </td>
                  <td>{client.lastVisit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
