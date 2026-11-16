const KEY = 'sprintboard-demo-v1';
const seed = [
  { id: 'SB-241', title: 'Refresh onboarding flow', description: 'Review the welcome steps and reduce friction on the first session.', assignee: 'A. Khan', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2026-12-02' },
  { id: 'SB-242', title: 'Add keyboard shortcuts', description: 'Support quick navigation between the main board views.', assignee: 'M. Patel', status: 'BACKLOG', priority: 'MEDIUM', dueDate: '2026-12-05' },
  { id: 'SB-243', title: 'Write API error guide', description: 'Document common validation responses and recovery steps.', assignee: 'R. Das', status: 'IN_REVIEW', priority: 'LOW', dueDate: '2026-12-01' },
  { id: 'SB-244', title: 'Improve task search', description: 'Match search terms against title and assignee.', assignee: 'A. Khan', status: 'DONE', priority: 'MEDIUM', dueDate: '2026-11-28' },
  { id: 'SB-245', title: 'Check compact board layout', description: 'Confirm task cards remain readable on narrow screens.', assignee: 'S. Roy', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2026-12-03' },
  { id: 'SB-246', title: 'Add empty state copy', description: 'Help new users understand how to add their first task.', assignee: 'M. Patel', status: 'BACKLOG', priority: 'LOW', dueDate: '2026-12-08' },
  { id: 'SB-247', title: 'Validate due date input', description: 'Reject invalid dates and keep form feedback close to the field.', assignee: 'R. Das', status: 'IN_REVIEW', priority: 'MEDIUM', dueDate: '2026-12-04' },
  { id: 'SB-248', title: 'Ship status transition API', description: 'Add a focused endpoint for moving work between columns.', assignee: 'S. Roy', status: 'DONE', priority: 'HIGH', dueDate: '2026-11-27' },
];

const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
export const demoMode = !base;
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || seed; } catch { return seed; }
};
const write = (items) => { localStorage.setItem(KEY, JSON.stringify(items)); return items; };

async function call(path, options) {
  const response = await fetch(`${base}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}

export const taskService = {
  list: async (search = '', priority = '') => {
    if (!demoMode) {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (priority) params.set('priority', priority);
      return call(`/tasks${params.size ? `?${params}` : ''}`);
    }
    return read().filter((task) => (!priority || task.priority === priority)
      && `${task.title} ${task.assignee}`.toLowerCase().includes(search.toLowerCase()));
  },
  save: async (task) => {
    if (!demoMode) return task.id ? call(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) }) : call('/tasks', { method: 'POST', body: JSON.stringify(task) });
    const items = read();
    const saved = task.id ? task : { ...task, id: `SB-${Math.floor(250 + Math.random() * 700)}` };
    write(task.id ? items.map((item) => item.id === task.id ? saved : item) : [saved, ...items]);
    return saved;
  },
  move: async (id, status) => {
    if (!demoMode) return call(`/tasks/${id}/status?status=${status}`, { method: 'PATCH' });
    return write(read().map((task) => String(task.id) === String(id) ? { ...task, status } : task));
  },
  remove: async (id) => {
    if (!demoMode) return call(`/tasks/${id}`, { method: 'DELETE' });
    return write(read().filter((task) => String(task.id) !== String(id)));
  },
  reset: () => write(seed),
};
