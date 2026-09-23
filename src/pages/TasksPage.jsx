import { useState } from 'react';

export default function TasksPage({ tasks, onAddTask, onDeleteTask, onToggleTask }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    onAddTask(title.trim());
    setTitle('');
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Tareas</p>
          <h2>Listado de pendientes</h2>
        </div>
      </header>

      <form className="form-panel" onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Añadir nueva tarea..."
        />
        <button type="submit">Guardar</button>
      </form>

      <div className="table-panel">
        <table>
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="3">No hay tareas registradas.</td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>
                    <span className={`status-pill ${task.status === 'Completada' ? 'success' : 'warning'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button type="button" className="secondary" onClick={() => onToggleTask(task.id, task.status)}>
                      {task.status === 'Completada' ? 'Reabrir' : 'Completar'}
                    </button>
                    <button type="button" className="danger" onClick={() => onDeleteTask(task.id)}>
                      Eliminar
                    </button>
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
