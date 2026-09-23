import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar'
import { apiFetch } from '../api.js'

const statusStyles = {
    open: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
}

const priorityStyles = {
    low: 'bg-gray-50 text-gray-600 border-gray-200',
    medium: 'bg-orange-50 text-orange-700 border-orange-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-red-100 text-red-900 border-red-400',
}

function Tickets({ currentUser, onLogout }) {
    document.title = 'SupportDesk - Tickets'
    // huge wall of states but needed to keep track of everything
    const [tickets, setTickets] = useState([])
    const [customers, setCustomers] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [message, setMessage] = useState('')
    // new ticket form state
    const [showForm, setShowForm] = useState(false)
    const [subject, setSubject] = useState('')
    const [description, setDescription] = useState('')
    const [customerId, setCustomerId] = useState('')
    const [assignedUserId, setAssignedUserId] = useState('')
    const [status, setStatus] = useState('open')
    const [priority, setPriority] = useState('medium')
    const [createError, setCreateError] = useState('')
    // edit state
    const [editingTicketId, setEditingTicketId] = useState(null)
    const [editStatus, setEditStatus] = useState('')
    const [editPriority, setEditPriority] = useState('')
    const [editAssignedUserId, setEditAssignedUserId] = useState('')
    const [editError, setEditError] = useState('')
    // notes state
    const [expandedTicketId, setExpandedTicketId] = useState(null)
    const [ticketNotes, setTicketNotes] = useState({})
    const [noteContent, setNoteContent] = useState('')
    const [noteError, setNoteError] = useState('')
    const [editingNoteId, setEditingNoteId] = useState(null)
    const [editNoteContent, setEditNoteContent] = useState('')
    const [editNoteError, setEditNoteError] = useState('')


    useEffect(() => {
        Promise.all([
            apiFetch('/api/tickets').then((r) => r.json()),
            apiFetch('/api/customers').then((r) => r.json()),
            apiFetch('/api/users').then((r) => r.json()),
        ])
            .then(([ticketsData, customersData, usersData]) => {
                setTickets(ticketsData)
                setCustomers(customersData)
                setUsers(usersData)
                setLoading(false)
            })
            .catch(() => {
                setMessage('Failed to load data.')
                setLoading(false)
            })
    }, [])

    const handleCreateTicket = async (event) => {
        event.preventDefault()

        if (!customerId) {
            setCreateError('Please select a customer.')
            return
        }

        const response = await apiFetch('/api/tickets', {
            method: 'POST',
            body: JSON.stringify({
                subject,
                description,
                customer_id: parseInt(customerId),
                assigned_user_id: assignedUserId ? parseInt(assignedUserId) : null,
                status,
                priority,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            apiFetch('/api/tickets')
                .then((r) => r.json())
                .then((ticketsData) => setTickets(ticketsData))

            setSubject('')
            setDescription('')
            setCustomerId('')
            setAssignedUserId('')
            setStatus('open')
            setPriority('medium')
            setCreateError('')
            setShowForm(false)
            setMessage('Ticket created successfully.')
        } else {
            setCreateError(data.error || 'Failed to create ticket.')
        }
    }

    const handleEditTicket = (ticket) => {
        setEditingTicketId(ticket.id)
        setEditStatus(ticket.status)
        setEditPriority(ticket.priority)
        setEditAssignedUserId(ticket.assigned_user_id ?? '')
        setEditError('')
    }

    const handleSaveTicket = async (ticketId) => {
        const response = await apiFetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: editStatus,
                priority: editPriority,
                assigned_user_id: editAssignedUserId ? parseInt(editAssignedUserId) : null,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            setTickets(tickets.map((t) => (t.id === ticketId ? { ...t, ...data } : t)))
            setEditingTicketId(null)
            setEditError('')
            setMessage('Ticket updated successfully.')
        } else {
            setEditError(data.error || 'Failed to update ticket.')
        }
    }

    const handleDeleteTicket = async (ticketId) => {
        const confirmed = window.confirm('Are you sure you want to delete this ticket?')

        if (!confirmed) return

        const response = await apiFetch(`/api/tickets/${ticketId}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            setTickets(tickets.filter((t) => t.id !== ticketId))
            setTicketNotes((prev) => {
                const updated = { ...prev }
                delete updated[ticketId]
                return updated
            })
            setMessage('Ticket deleted successfully.')
        } else {
            const data = await response.json()
            setMessage(data.error || 'Failed to delete ticket.')
        }
    }

    const toggleNotes = async (ticketId) => {
        if (expandedTicketId === ticketId) {
            setExpandedTicketId(null)
            setNoteContent('')
            setNoteError('')
            return
        }

        setExpandedTicketId(ticketId)
        setNoteContent('')
        setNoteError('')

        // only fetch notes the first time we expand this ticket
        if (!ticketNotes[ticketId]) {
            const response = await apiFetch(`/api/tickets/${ticketId}`)
            const data = await response.json()
            setTicketNotes((prev) => ({ ...prev, [ticketId]: data.notes || [] }))
        }
    }

    const handleCreateNote = async (ticketId) => {
        if (!noteContent.trim()) {
            setNoteError('Note cannot be empty.')
            return
        }

        const response = await apiFetch(`/api/tickets/${ticketId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ content: noteContent }),
        })

        const data = await response.json()

        if (response.ok) {
            setTicketNotes((prev) => ({
                ...prev,
                [ticketId]: [...(prev[ticketId] || []), data],
            }))
            setNoteContent('')
            setNoteError('')
        } else {
            setNoteError(data.error || 'Failed to add note.')
        }
    }

    const handleEditNote = (note) => {
        setEditingNoteId(note.id)
        setEditNoteContent(note.content)
        setEditNoteError('')
    }

    const handleSaveNote = async (ticketId, noteId) => {
        if (!editNoteContent.trim()) {
            setEditNoteError('Note cannot be empty.')
            return
        }

        const response = await apiFetch(`/api/notes/${noteId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content: editNoteContent }),
        })

        const data = await response.json()

        if (response.ok) {
            setTicketNotes((prev) => ({
                ...prev,
                [ticketId]: prev[ticketId].map((n) => (n.id === noteId ? data : n)),
            }))
            setEditingNoteId(null)
            setEditNoteError('')
        } else {
            setEditNoteError(data.error || 'Failed to update note.')
        }
    }

    const handleDeleteNote = async (ticketId, noteId) => {
        const confirmed = window.confirm('Are you sure you want to delete this note?')

        if (!confirmed) return

        const response = await apiFetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            setTicketNotes((prev) => ({
                ...prev,
                [ticketId]: prev[ticketId].filter((n) => n.id !== noteId),
            }))
        } else {
            const data = await response.json()
            setNoteError(data.error || 'Failed to delete note.')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar currentUser={currentUser} onLogout={onLogout} />

            <div className="mx-auto max-w-6xl p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
                        <p className="mt-2 text-gray-600">View and manage support tickets.</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowForm(!showForm)
                            setCreateError('')
                        }}
                        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                        {showForm ? 'Cancel' : 'New Ticket'}
                    </button>
                </div>

                {message && (
                    <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                        {message}
                    </div>
                )}

                {showForm && (
                    <div className="mt-6 rounded-lg bg-white p-6 shadow">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">New Ticket</h2>

                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full rounded border p-2"
                                    placeholder="Brief summary of the issue"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full rounded border p-2"
                                    rows={4}
                                    placeholder="Full description of the issue"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Customer</label>
                                    <select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="w-full rounded border p-2"
                                    >
                                        <option value="">Select a customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Assign To</label>
                                    <select
                                        value={assignedUserId}
                                        onChange={(e) => setAssignedUserId(e.target.value)}
                                        className="w-full rounded border p-2"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Current Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded border p-2"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full rounded border p-2"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            {createError && (
                                <p className="text-sm text-red-600">{createError}</p>
                            )}

                            <button
                                type="submit"
                                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                            >
                                Create Ticket
                            </button>
                        </form>
                    </div>
                )}

                <div className="mt-8 rounded-lg bg-white p-6 shadow">
                    {loading ? (
                        <p className="text-gray-500">Loading tickets...</p>
                    ) : tickets.length === 0 ? (
                        <p className="text-gray-500">No tickets yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="rounded border p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h2 className="font-semibold text-gray-900">
                                                {ticket.subject}
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-600">
                                                {ticket.description}
                                            </p>

                                            <p className="mt-2 text-sm text-gray-500 capitalize">
                                                Customer: {ticket.customer_name}
                                            </p>

                                            {editingTicketId === ticket.id ? (
                                                <div className="mt-3 grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                                                        <select
                                                            value={editStatus}
                                                            onChange={(e) => setEditStatus(e.target.value)}
                                                            className="w-full rounded border p-1.5 text-sm"
                                                        >
                                                            <option value="open">Open</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-500">Priority</label>
                                                        <select
                                                            value={editPriority}
                                                            onChange={(e) => setEditPriority(e.target.value)}
                                                            className="w-full rounded border p-1.5 text-sm"
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                            <option value="critical">Critical</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-500">Assigned To</label>
                                                        <select
                                                            value={editAssignedUserId}
                                                            onChange={(e) => setEditAssignedUserId(e.target.value)}
                                                            className="w-full rounded border p-1.5 text-sm"
                                                        >
                                                            <option value="">Unassigned</option>
                                                            {users.map((user) => (
                                                                <option key={user.id} value={user.id}>
                                                                    {user.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {editError && (
                                                        <p className="col-span-3 text-sm text-red-600">{editError}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                ticket.assigned_user_name && (
                                                    <p className="text-sm text-gray-500">
                                                        Assigned to: {ticket.assigned_user_name}
                                                    </p>
                                                )
                                            )}
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            {editingTicketId !== ticket.id && (
                                                <>
                                                    <span className={`rounded border capitalize px-2 py-1 text-xs ${statusStyles[ticket.status]}`}>
                                                        {ticket.status.replace('_', ' ')}
                                                    </span>

                                                    <span className={`rounded border capitalize px-2 py-1 text-xs ${priorityStyles[ticket.priority]}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                                        <button
                                            type="button"
                                            onClick={() => toggleNotes(ticket.id)}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            {expandedTicketId === ticket.id ? 'Hide notes' : 'Show notes'}
                                        </button>

                                        <div className="flex gap-2">
                                            {editingTicketId === ticket.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveTicket(ticket.id)}
                                                        className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingTicketId(null)
                                                            setEditError('')
                                                        }}
                                                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        to={`/tickets/${ticket.id}`}
                                                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        View
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditTicket(ticket)}
                                                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteTicket(ticket.id)}
                                                        className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {expandedTicketId === ticket.id && (
                                        <div className="mt-4 space-y-3 border-t pt-4">
                                            <h3 className="text-sm font-medium text-gray-700">Notes</h3>

                                            {(ticketNotes[ticket.id] || []).length === 0 ? (
                                                <p className="text-sm text-gray-400">No notes yet.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {(ticketNotes[ticket.id] || []).map((note) => (
                                                        <div key={note.id} className="rounded border bg-gray-50 p-3">
                                                            {editingNoteId === note.id ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={editNoteContent}
                                                                        onChange={(e) => setEditNoteContent(e.target.value)}
                                                                        className="w-full rounded border bg-white p-2 text-sm"
                                                                        rows={3}
                                                                    />

                                                                    {editNoteError && (
                                                                        <p className="text-sm text-red-600">{editNoteError}</p>
                                                                    )}

                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleSaveNote(ticket.id, note.id)}
                                                                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                                                                        >
                                                                            Save
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setEditingNoteId(null)
                                                                                setEditNoteError('')
                                                                            }}
                                                                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <p className="text-sm text-gray-800">{note.content}</p>

                                                                    <div className="mt-2 flex items-center justify-between">
                                                                        <p className="text-xs text-gray-400">
                                                                            {note.user_name} &middot; {new Date(note.created_at).toLocaleString()}
                                                                        </p>

                                                                        {note.user_id === currentUser.id && (
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleEditNote(note)}
                                                                                    className="text-xs text-gray-500 hover:text-gray-700"
                                                                                >
                                                                                    Edit
                                                                                </button>

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteNote(ticket.id, note.id)}
                                                                                    className="text-xs text-red-500 hover:text-red-700"
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="mt-3 space-y-2">
                                                <textarea
                                                    value={noteContent}
                                                    onChange={(e) => setNoteContent(e.target.value)}
                                                    className="w-full rounded border p-2 text-sm"
                                                    rows={2}
                                                    placeholder="Add a note..."
                                                />

                                                {noteError && (
                                                    <p className="text-sm text-red-600">{noteError}</p>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => handleCreateNote(ticket.id)}
                                                    className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                                                >
                                                    Add Note
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Tickets