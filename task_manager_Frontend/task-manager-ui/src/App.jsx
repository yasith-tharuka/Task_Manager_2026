import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Route, Routes } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1/tasks';

const normalizeStatus = (value) => {
    const safe = String(value || 'TODO').toUpperCase();
    if (safe === 'COMPLETED') return 'DONE';
    return safe;
};

const normalizePriority = (value) => {
    const safe = String(value || 'LOW').toUpperCase();
    if (safe === 'HIGH' || safe === 'MEDIUM') return safe;
    return 'LOW';
};

const normalizeTask = (task) => {
    const dueDate = task?.dueDate || task?.date || '';

    return {
        id: task?.id,
        title: task?.title || '',
        description: task?.description || '',
        status: normalizeStatus(task?.status),
        priority: normalizePriority(task?.priority),
        dueDate,
        assigneeEmail: task?.assigneeEmail || '',
        createdAt: task?.createdAt || null,
        completedAt: task?.completedAt || null,
    };
};

const toTaskPayload = (task) => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    assigneeEmail: task.assigneeEmail,
});

const unwrapApiData = (response) => {
    const body = response?.data;
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'success')) {
        if (!body.success) throw new Error(body.message || 'Request failed');
        return body.data;
    }
    return body;
};

const getApiErrorMessage = (error, fallbackMessage) => {
    return error?.response?.data?.message || error?.message || fallbackMessage;
};

const priorityRank = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
};

function TaskManagerPage() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('LOW');
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [newAssigneeEmail, setNewAssigneeEmail] = useState('');
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const [activeFilter, setActiveFilter] = useState('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [sortBy, setSortBy] = useState('NONE');

    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStatus, setEditStatus] = useState('TODO');
    const [editPriority, setEditPriority] = useState('LOW');
    const [editDate, setEditDate] = useState('');
    const [editAssigneeEmail, setEditAssigneeEmail] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [deletingTaskId, setDeletingTaskId] = useState(null);

    const loadTasks = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await axios.get(API_BASE_URL);
            const data = unwrapApiData(response);
            const normalized = Array.isArray(data) ? data.map(normalizeTask) : [];
            setTasks(normalized);
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, 'Failed to load tasks. Check backend connection.'));
            console.error('Backend connection failed! Is Spring Boot running?', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const addTask = async () => {
        const safeTitle = newTitle.trim();
        if (!safeTitle) return alert('Please enter a title');

        setIsCreatingTask(true);
        setErrorMessage('');

        const taskObj = {
            title: safeTitle,
            description: newDesc.trim(),
            priority,
            status,
            dueDate: date,
            assigneeEmail: newAssigneeEmail.trim(),
        };

        try {
            const response = await axios.post(API_BASE_URL, toTaskPayload(taskObj));
            const savedTask = normalizeTask(unwrapApiData(response) || taskObj);
            setTasks((prevTasks) => [...prevTasks, savedTask]);

            setNewTitle('');
            setNewDesc('');
            setStatus('TODO');
            setPriority('LOW');
            setDate(new Date().toISOString().split('T')[0]);
            setNewAssigneeEmail('');
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, 'Failed to save task.'));
            console.error('Error saving task', error);
        } finally {
            setIsCreatingTask(false);
        }
    };

    const formatDateTime = (value) => {
        if (!value) return 'N/A';

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;

        return parsed.toLocaleString();
    };

    const formatDateOnly = (value) => {
        if (!value) return 'N/A';

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;

        return parsed.toLocaleDateString();
    };

    const startEdit = (task) => {
        setEditingTaskId(task.id);
        setEditTitle(task.title || '');
        setEditDesc(task.description || '');
        setEditStatus(task.status || 'TODO');
        setEditPriority(task.priority || 'LOW');
        setEditDate((task.dueDate || '').toString().split('T')[0]);
        setEditAssigneeEmail(task.assigneeEmail || '');
    };

    const cancelEdit = () => {
        setEditingTaskId(null);
        setEditTitle('');
        setEditDesc('');
        setEditStatus('TODO');
        setEditPriority('LOW');
        setEditDate('');
        setEditAssigneeEmail('');
    };

    const updateTask = async (taskId, overrideTask = null) => {
        const updatedTask = overrideTask
            ? {
                ...overrideTask,
                title: (overrideTask.title || '').trim(),
                description: (overrideTask.description || '').trim(),
                assigneeEmail: (overrideTask.assigneeEmail || '').trim(),
            }
            : {
                id: taskId,
                title: editTitle.trim(),
                description: editDesc.trim(),
                status: editStatus,
                priority: editPriority,
                dueDate: editDate,
                assigneeEmail: editAssigneeEmail.trim(),
            };

        if (!updatedTask.title) return alert('Task title is required');

        setIsSavingEdit(true);
        setErrorMessage('');

        try {
            const response = await axios.put(`${API_BASE_URL}/${taskId}`, toTaskPayload(updatedTask));
            const fallbackUpdated = normalizeTask(updatedTask);
            const savedTask = normalizeTask(unwrapApiData(response) || fallbackUpdated);
            setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? savedTask : task)));
            if (!overrideTask) {
                cancelEdit();
            }
        } catch (error) {
            console.error('Error updating task', error);
            setErrorMessage(getApiErrorMessage(error, 'Failed to update task.'));
            alert('Failed to update task');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const deleteTask = async (taskId) => {
        const isConfirmed = window.confirm('Delete this task?');
        if (!isConfirmed) return;

        setDeletingTaskId(taskId);
        setErrorMessage('');

        try {
            await axios.delete(`${API_BASE_URL}/${taskId}`);
            setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

            if (editingTaskId === taskId) {
                cancelEdit();
            }
        } catch (error) {
            console.error('Error deleting task', error);
            setErrorMessage(getApiErrorMessage(error, 'Failed to delete task.'));
            alert('Failed to delete task');
        } finally {
            setDeletingTaskId(null);
        }
    };

    const markAsDone = (task) => updateTask(task.id, { ...task, status: 'DONE' });

    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        if (activeFilter !== 'ALL') {
            result = result.filter((task) => task.status === activeFilter);
        }

        if (assigneeFilter.trim()) {
            const lookup = assigneeFilter.trim().toLowerCase();
            result = result.filter((task) => (task.assigneeEmail || '').toLowerCase().includes(lookup));
        }

        if (sortBy === 'DUE_DATE') {
            result.sort((a, b) => {
                const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                return aTime - bTime;
            });
        } else if (sortBy === 'PRIORITY') {
            result.sort((a, b) => (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0));
        }

        return result;
    }, [activeFilter, assigneeFilter, sortBy, tasks]);

    const taskStats = useMemo(() => {
        const total = tasks.length;
        const todo = tasks.filter((task) => task.status === 'TODO').length;
        const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const done = tasks.filter((task) => task.status === 'DONE').length;
        return { total, todo, inProgress, done };
    }, [tasks]);

    return (
        <div className="min-h-screen bg-slate-100 p-4 sm:p-8 md:p-10">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold text-slate-900 mb-8 text-center">
                    Task Master | Yasith Tharuka
                </h1>

                <div className="bg-white p-6 rounded-2xl shadow-md mb-8 border border-slate-200">
                    <h2 className="text-lg font-bold mb-4">Add New Task</h2>
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            placeholder="Task Title..."
                            className="p-3 border rounded-xl"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Description..."
                            className="p-3 border rounded-xl"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                        <select className="p-3 border rounded-xl" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                        </select>
                        <select className="p-3 border rounded-xl" value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                        </select>
                        <input type="date" className="p-3 border rounded-xl" value={date} onChange={(e) => setDate(e.target.value)} />
                        <input
                            type="email"
                            placeholder="Assignee Email (optional)"
                            className="p-3 border rounded-xl"
                            value={newAssigneeEmail}
                            onChange={(e) => setNewAssigneeEmail(e.target.value)}
                        />
                        <button
                            onClick={addTask}
                            disabled={isCreatingTask}
                            className="bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
                        >
                            {isCreatingTask ? 'Saving...' : 'Save Task'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500">Total</p>
                        <p className="text-xl font-bold text-slate-800">{taskStats.total}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500">Todo</p>
                        <p className="text-xl font-bold text-slate-800">{taskStats.todo}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500">In Progress</p>
                        <p className="text-xl font-bold text-slate-800">{taskStats.inProgress}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <p className="text-xs text-slate-500">Done</p>
                        <p className="text-xl font-bold text-slate-800">{taskStats.done}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((filterValue) => (
                        <button
                            key={filterValue}
                            onClick={() => setActiveFilter(filterValue)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${activeFilter === filterValue
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-700 border-slate-200'
                                }`}
                        >
                            {filterValue === 'ALL' ? 'All' : filterValue.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="Filter by assignee email"
                        className="p-3 border rounded-xl"
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                    />
                    <select className="p-3 border rounded-xl" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="NONE">No Sorting</option>
                        <option value="DUE_DATE">Sort by Due Date</option>
                        <option value="PRIORITY">Sort by Priority</option>
                    </select>
                </div>

                {errorMessage && (
                    <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
                )}

                <div className="grid gap-6">
                    {isLoading ? (
                        <p className="text-center text-slate-500 mt-10 italic">Loading tasks...</p>
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">{task.title}</h3>
                                        <p className="text-slate-600 mt-1">{task.description || 'No description'}</p>
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-black uppercase ${task.priority === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                            }`}
                                    >
                                        {task.priority}
                                    </span>
                                </div>

                                <div className="mt-4 border-t pt-4 border-slate-50 space-y-1">
                                    <p className="text-sm font-medium text-slate-500">Status: {task.status || 'N/A'}</p>
                                    <p className="text-xs text-slate-400">Assignee: {task.assigneeEmail || 'Unassigned'}</p>
                                    <p className="text-xs text-slate-400">Due Date: {formatDateOnly(task.dueDate)}</p>
                                    <p className="text-xs text-slate-400">Created At: {formatDateTime(task.createdAt)}</p>
                                    {task.status === 'DONE' && (
                                        <p className="text-xs text-slate-400">Completed At: {formatDateTime(task.completedAt)}</p>
                                    )}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => startEdit(task)}
                                        disabled={deletingTaskId === task.id}
                                        className="bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-600 transition disabled:opacity-70"
                                    >
                                        Update
                                    </button>
                                    {task.status !== 'DONE' && (
                                        <button
                                            onClick={() => markAsDone(task)}
                                            disabled={deletingTaskId === task.id}
                                            className="bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-600 transition disabled:opacity-70"
                                        >
                                            Mark Done
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        disabled={deletingTaskId === task.id}
                                        className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 transition disabled:opacity-70"
                                    >
                                        {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>

                                {editingTaskId === task.id && (
                                    <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                        <input
                                            type="text"
                                            className="w-full p-3 border rounded-xl"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            placeholder="Task Title"
                                        />
                                        <input
                                            type="text"
                                            className="w-full p-3 border rounded-xl"
                                            value={editDesc}
                                            onChange={(e) => setEditDesc(e.target.value)}
                                            placeholder="Description"
                                        />
                                        <select
                                            className="w-full p-3 border rounded-xl"
                                            value={editStatus}
                                            onChange={(e) => setEditStatus(e.target.value)}
                                        >
                                            <option value="TODO">TODO</option>
                                            <option value="IN_PROGRESS">IN PROGRESS</option>
                                            <option value="DONE">DONE</option>
                                        </select>
                                        <select
                                            className="w-full p-3 border rounded-xl"
                                            value={editPriority}
                                            onChange={(e) => setEditPriority(e.target.value)}
                                        >
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                        </select>
                                        <input
                                            type="date"
                                            className="w-full p-3 border rounded-xl"
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                        />
                                        <input
                                            type="email"
                                            className="w-full p-3 border rounded-xl"
                                            value={editAssigneeEmail}
                                            onChange={(e) => setEditAssigneeEmail(e.target.value)}
                                            placeholder="Assignee Email (optional)"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => updateTask(task.id)}
                                                disabled={isSavingEdit}
                                                className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition disabled:opacity-70"
                                            >
                                                {isSavingEdit ? 'Saving...' : 'Save Update'}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                disabled={isSavingEdit}
                                                className="bg-slate-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-600 transition disabled:opacity-70"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 mt-10 italic">No tasks found for this filter.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

function NotFoundPage() {
    return <p className="p-6 text-center text-slate-600">Page not found.</p>;
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<TaskManagerPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default App;
