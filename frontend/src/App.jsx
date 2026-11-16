import { useEffect, useMemo, useState } from 'react';
import { demoMode, taskService } from './tasks.js';

const columns = [
  { id: 'BACKLOG', label: 'Backlog', color: 'slate' },
  { id: 'IN_PROGRESS', label: 'In progress', color: 'blue' },
  { id: 'IN_REVIEW', label: 'In review', color: 'amber' },
  { id: 'DONE', label: 'Done', color: 'green' },
];
const priorities = ['LOW', 'MEDIUM', 'HIGH'];
const priorityName = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' };
const dateLabel = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function TaskForm({ initial, onSave, onClose }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const task = {
      ...(initial?.id ? { id: initial.id } : {}),
      title: String(form.get('title')).trim(), description: String(form.get('description')).trim(),
      assignee: String(form.get('assignee')).trim(), status: String(form.get('status')),
      priority: String(form.get('priority')), dueDate: String(form.get('dueDate')),
    };
    try { await onSave(task); onClose(); } catch (e) { setError(e.message || 'Unable to save task.'); }
    finally { setBusy(false); }
  }
  return <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="form-title">
      <header className="dialog-head"><div><span className="overline">SPRINT TASK</span><h2 id="form-title">{initial ? 'Edit task' : 'Create a task'}</h2></div><button className="close" onClick={onClose} aria-label="Close dialog">×</button></header>
      <form className="task-form" onSubmit={submit}>
        <label className="wide">Task title<input name="title" required minLength="3" maxLength="120" defaultValue={initial?.title || ''} placeholder="What needs to get done?" /></label>
        <label className="wide">Description<textarea name="description" rows="3" maxLength="1000" defaultValue={initial?.description || ''} placeholder="Add a little context for the team" /></label>
        <label>Assignee<input name="assignee" required maxLength="60" defaultValue={initial?.assignee || ''} placeholder="Name" /></label>
        <label>Due date<input name="dueDate" type="date" required defaultValue={initial?.dueDate || '2026-12-05'} /></label>
        <label>Priority<select name="priority" defaultValue={initial?.priority || 'MEDIUM'}>{priorities.map((p) => <option key={p} value={p}>{priorityName[p]}</option>)}</select></label>
        <label>Status<select name="status" defaultValue={initial?.status || 'BACKLOG'}>{columns.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
        {error && <p className="form-error wide" role="alert">{error}</p>}
        <div className="dialog-actions wide"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Create task'}</button></div>
      </form>
    </section>
  </div>;
}

function TaskCard({ task, onOpen, onMove, dragging, setDragging }) {
  return <article className={`task-card ${dragging === task.id ? 'dragging' : ''}`} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(task.id)); setDragging(task.id); }} onDragEnd={() => setDragging(null)} onClick={() => onOpen(task)}>
    <div className="task-top"><span className={`priority ${task.priority.toLowerCase()}`}><i />{priorityName[task.priority]}</span><button className="card-menu" aria-label={`Edit ${task.title}`} onClick={(e) => { e.stopPropagation(); onOpen(task); }}>···</button></div>
    <h3>{task.title}</h3><p className="task-description">{task.description}</p>
    <div className="task-footer"><span className="assignee"><b>{task.assignee.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</b>{task.assignee}</span><span className="due-date">▢ {dateLabel(task.dueDate)}</span></div>
    <div className="task-access"><label className="sr-only" htmlFor={`move-${task.id}`}>{`Move ${task.title}`}</label><select id={`move-${task.id}`} value={task.status} onClick={(e) => e.stopPropagation()} onChange={(e) => { e.stopPropagation(); onMove(task.id, e.target.value); }} aria-label={`Move ${task.title}`}>{columns.map((c) => <option key={c.id} value={c.id}>Move to {c.label}</option>)}</select></div>
  </article>;
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('ALL');
  const [modal, setModal] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh(searchTerm = search, priorityTerm = priority === 'ALL' ? '' : priority) {
    setLoading(true); setError('');
    try { setTasks(await taskService.list(searchTerm, priorityTerm)); } catch (e) { setError(e.message || 'Unable to load sprint tasks.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh('', ''); }, []);
  useEffect(() => { const id = setTimeout(() => refresh(search), 160); return () => clearTimeout(id); }, [search]);
  useEffect(() => { refresh(search, priority === 'ALL' ? '' : priority); }, [priority]);

  const grouped = useMemo(() => Object.fromEntries(columns.map((col) => [col.id, tasks.filter((task) => task.status === col.id)])), [tasks]);
  const activeCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const completion = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;

  async function save(task) { await taskService.save(task); await refresh(); setNotice(task.id ? 'Task updated.' : 'Task created.'); setTimeout(() => setNotice(''), 2400); }
  async function move(id, status) { try { await taskService.move(id, status); if (demoMode) await refresh(); else await refresh(); } catch (e) { setError(e.message || 'Unable to move task.'); } }
  async function remove(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    try { await taskService.remove(task.id); setModal(null); await refresh(); setNotice('Task deleted.'); setTimeout(() => setNotice(''), 2400); } catch (e) { setError(e.message || 'Unable to delete task.'); }
  }
  function resetDemo() { taskService.reset(); setSearch(''); setPriority('ALL'); refresh('', ''); setNotice('Demo tasks restored.'); setTimeout(() => setNotice(''), 2400); }

  return <div className="app-layout">
    <aside className="sidebar"><a className="logo" href="#board"><span className="logo-mark">S</span><span>Sprint<span>Board</span></span></a><div className="workspace-label">WORKSPACE</div><button className="workspace-switch"><span className="workspace-icon">N</span><span><b>Northstar Studio</b><small>Product team</small></span><i>⌄</i></button><div className="nav-label">MENU</div><a className="nav-item active" href="#board"><span>▦</span> Sprint board <b className="nav-count">08</b></a><a className="nav-item" href="#board"><span>◷</span> My work</a><a className="nav-item" href="#board"><span>◫</span> Projects</a><div className="nav-label project-label">YOUR PROJECTS <button aria-label="Add project">+</button></div><a className="project-link"><i className="project-dot purple"/> Mobile app</a><a className="project-link"><i className="project-dot blue"/> Design system</a><a className="project-link"><i className="project-dot orange"/> Website refresh</a><div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><b>Need a hand?</b><p>Check the project guide to get started.</p><a href="https://github.com/MdAsadkne/SprintBoard-FullStack" target="_blank" rel="noreferrer">Read the guide ↗</a></div><div className="profile"><div className="avatar avatar-self">AK</div><span><b>Asad Khurshid</b><small>Workspace member</small></span><button aria-label="Profile menu">···</button></div></div></aside>

    <main className="main" id="board"><header className="topbar"><div className="breadcrumbs"><span>Projects</span><b>/</b><span>Mobile app</span><b>/</b><strong>Sprint board</strong></div><div className="top-actions"><button className="icon-control" aria-label="Notifications">♧<i /></button><div className="avatar avatar-self small">AK</div></div></header>
      <section className="page-content"><div className="page-heading"><div><div className="overline"><span className="live-dot" /> SPRINT 08 <span className="separator">/</span> NOV 24 - DEC 05</div><h1>Build with clarity.</h1><p>Keep the team in sync and the next milestone in sight.</p></div><div className="heading-actions"><button className="btn outline" onClick={() => setModal({task:null})}><span>+</span> Add task</button><button className="btn primary invite" onClick={() => setNotice('This demo workspace is private to your browser.')}>↗ <span>Share board</span></button></div></div>

        <section className="summary-row" aria-label="Sprint summary"><div className="summary-card"><div className="summary-top"><span>SPRINT PROGRESS</span><span className="summary-icon violet">◔</span></div><div className="summary-main"><strong>{completion}<small>%</small></strong><span className="summary-caption">{doneCount} of {tasks.length} tasks done</span></div><div className="progress-track"><i style={{width:`${completion}%`}} /></div></div><div className="summary-card"><div className="summary-top"><span>IN PROGRESS</span><span className="summary-icon blue">↗</span></div><div className="summary-main"><strong>{activeCount.toString().padStart(2,'0')}</strong><span className="summary-caption">Active right now</span></div><div className="summary-note"><i className="tiny-dot blue-dot"/> Across the team</div></div><div className="summary-card"><div className="summary-top"><span>TEAM CAPACITY</span><span className="summary-icon gold">⌘</span></div><div className="capacity"><div className="avatar-stack"><div className="avatar avatar-lilac">AK</div><div className="avatar avatar-peach">MP</div><div className="avatar avatar-sky">RD</div><div className="avatar avatar-mint">SR</div></div><b>4 <small>members</small></b></div><div className="summary-note"><i className="tiny-dot green-dot"/> Sprint ends Dec 05</div></div><div className="summary-card focus-card"><div className="summary-top"><span>SPRINT FOCUS</span><span className="summary-icon pink">✳</span></div><div className="focus-title">Make the first run feel effortless</div><div className="summary-note">Updated by A. Khan <span>·</span> 2 days ago</div></div></section>

        <section className="board-toolbar"><div className="board-title"><h2>Tasks <span>{tasks.length}</span></h2><div className="filter-pills"><button className={priority==='ALL'?'chosen':''} onClick={()=>setPriority('ALL')}>All tasks</button><button className={priority==='HIGH'?'chosen':''} onClick={()=>setPriority(priority==='HIGH'?'ALL':'HIGH')}>High priority</button></div></div><div className="board-controls"><label className="search"><span>⌕</span><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search tasks..." aria-label="Search tasks" /></label><select className="priority-filter" value={priority} onChange={(e)=>setPriority(e.target.value)} aria-label="Filter tasks by priority"><option value="ALL">All priorities</option><option value="HIGH">High priority</option><option value="MEDIUM">Medium priority</option><option value="LOW">Low priority</option></select><button className="icon-control filter-icon" aria-label="Board options">☷</button></div></section>
        {notice && <div className="notice" role="status">✓ {notice}</div>}{error && <div className="error-banner" role="alert"><span>{demoMode?'Could not load demo tasks.':'Could not reach the Spring Boot API.'}</span><button onClick={()=>refresh()}>Retry</button></div>}
        {loading ? <div className="loading-board">Loading sprint board...</div> : <section className="kanban" aria-label="Sprint task board">{columns.map((col) => <div className="kanban-column" key={col.id} onDragOver={(e)=>e.preventDefault()} onDrop={async(e)=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');setDragging(null);if(id)await move(id,col.id);}}><div className="column-header"><div className="column-name"><i className={`column-dot ${col.color}`}/><h3>{col.label}</h3><span>{grouped[col.id]?.length || 0}</span></div><button className="column-add" aria-label={`Add task to ${col.label}`} onClick={()=>setModal({task:null,status:col.id})}>+</button></div><div className={`column-list ${dragging?'drop-ready':''}`}>
          {grouped[col.id]?.map((task)=> <TaskCard key={task.id} task={task} onOpen={(t)=>setModal({task:t})} onMove={move} dragging={dragging} setDragging={setDragging}/>)}
          {!grouped[col.id]?.length && <div className="empty-column">Drop a task here</div>}
          <button className="add-card" onClick={()=>setModal({task:null,status:col.id})}><span>+</span> Add a task</button>
        </div></div>)}</section>}
        <footer className="board-foot"><span><i className="tiny-dot green-dot"/> All changes saved {demoMode?'in this browser':'to the API'}</span><span>Last updated just now</span><button onClick={resetDemo}>Reset demo board</button></footer>
      </section>
    </main>
    {modal && <TaskForm key={modal.task?.id || `new-${modal.status || ''}`} initial={modal.task || (modal.status ? {status:modal.status} : null)} onSave={save} onClose={()=>setModal(null)} />}
  </div>;
}
