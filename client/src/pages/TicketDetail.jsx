import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import Navbar from '../components/Navbar.jsx'
import { apiFetch } from '../api.js'
import { priorityStyles, statusStyles } from './Tickets.jsx'

const statusLabels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
}

function TicketDetail({ currentUser, onLogout }) {
    const { id } = useParams()
    const navigate = useNavigate()

    const [ticket, setTicket] = useState(null)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // edit mode
    const [isEditing, setIsEditing] = useState(false)
    const [editStatus, setEditStatus] = useState('')
    const [editPriority, setEditPriority] = useState('')
    const [editAssignedUserId, setEditAssignedUserId] = useState('')
    const [editError, setEditError] = useState('')

    // notes
    const [noteContent, setNoteContent] = useState('')
    const [noteError, setNoteError] = useState('')
    const [editingNoteId, setEditingNoteId] = useState(null)
    const [editNoteContent, setEditNoteContent] = useState('')

    useEffect(() => {
        document.title = 'SupportDesk - Ticket Details'

        Promise.all([
            apiFetch(`/api/tickets/${id}`).then((r) => r.json()),
            apiFetch('/api/users').then((r) => r.json()),
        ])
            .then(([ticketData, usersData]) => {
                if (!ticketData.id) {
                    setError('Ticket not found.')
                } else {
                    setTicket(ticketData)
                    setEditStatus(ticketData.status)
                    setEditPriority(ticketData.priority)
                    setEditAssignedUserId(ticketData.assigned_user_id ?? '')
                }
                setUsers(usersData)
            })
            .catch(() => {
                setError('Failed to load ticket.')
            })
            .finally(() => {
                setLoading(false)
            })
    }, [id])

    const handleSaveTicket = async () => {
        const response = await apiFetch(`/api/tickets/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: editStatus,
                priority: editPriority,
                assigned_user_id: editAssignedUserId ? parseInt(editAssignedUserId) : null,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            setTicket({ ...ticket, ...data })
            setIsEditing(false)
            setEditError('')
            setMessage('Ticket updated successfully.')
        } else {
            setEditError(data.error || 'Failed to update ticket.')
        }
    }

    const handleCreateNote = async () => {
        if (!noteContent.trim()) {
            setNoteError('Note cannot be empty.')
            return
        }

        const response = await apiFetch(`/api/tickets/${id}/notes`, {
            method: 'POST',
            body: JSON.stringify({ content: noteContent }),
        })

        const data = await response.json()

        if (response.ok) {
            setTicket({
                ...ticket,
                notes: [...ticket.notes, data],
            })
            setNoteContent('')
            setNoteError('')
            setMessage('Note added successfully.')
        } else {
            setNoteError(data.error || 'Failed to add note.')
        }
    }

    const handleEditNote = (note) => {
        setEditingNoteId(note.id)
        setEditNoteContent(note.content)
    }

    const handleSaveNote = async (noteId) => {
        const response = await apiFetch(`/api/notes/${noteId}`, {
            method: 'PATCH',
            body: JSON.stringify({ content: editNoteContent }),
        })

        const data = await response.json()

        if (response.ok) {
            setTicket({
                ...ticket,
                notes: ticket.notes.map((n) => (n.id === noteId ? data : n)),
            })
            setEditingNoteId(null)
            setMessage('Note updated successfully.')
        } else {
            setNoteError(data.error || 'Failed to update note.')
        }
    }

    const handleDeleteNote = async (noteId) => {
        const confirmed = window.confirm('Delete this note?')
        if (!confirmed) return

        const response = await apiFetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            setTicket({
                ...ticket,
                notes: ticket.notes.filter((n) => n.id !== noteId),
            })
            setMessage('Note deleted successfully.')
        }
    }

    const handleDeleteTicket = async () => {
        const confirmed = window.confirm('Are you sure you want to delete this ticket?')
        if (!confirmed) return

        const response = await apiFetch(`/api/tickets/${id}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            navigate('/tickets')
        } else {
            setError('Failed to delete ticket.')
        }
    }


    if (loading) {
        return (
            <div className="min-h-screen bg-[#F6F4EE]">
                <Navbar currentUser={currentUser} onLogout={onLogout} />
                <div className="mx-auto max-w-4xl px-4 pt-8">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        )
    }

    if (error || !ticket) {
        return (
            <div className="min-h-screen bg-[#F6F4EE]">
                <Navbar currentUser={currentUser} onLogout={onLogout} />
                <div className="mx-auto max-w-4xl px-4 pt-8">
                    <p className="text-red-600">{error || 'Ticket not found.'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F6F4EE]">
            <Navbar currentUser={currentUser} onLogout={onLogout} />

            <div className="mx-auto max-w-4xl px-4 pt-8">
                {/* back button */}
                <button
                    onClick={() => navigate('/tickets')}
                    className="mb-6 text-sm text-[#B5651D] hover:text-[#8A4A12]"
                >
                    ← Back to Tickets
                </button>

                {message && (
                    <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                        {message}
                    </div>
                )}

                {/* main ticket card */}
                <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-serif text-[#211C16]">
                                {ticket.subject}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Ticket #{ticket.id} · Created {new Date(ticket.created_at).toLocaleString()}
                            </p>
                        </div>

                        {!isEditing && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-[#F6F4EE]"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={handleDeleteTicket}
                                    className="rounded border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>

                    {/* description */}
                    <div className="mb-6 border-b pb-6">
                        <h2 className="mb-2 text-sm font-medium text-gray-700">Description</h2>
                        <p className="text-gray-700">{ticket.description}</p>
                    </div>

                    {/* metadata */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Customer</label>
                            <p className="mt-1 text-gray-900">{ticket.customer_name}</p>
                        </div>

                        {isEditing ? (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        className="mt-1 w-full rounded border p-2"
                                    >
                                        <option value="open">Open</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Priority</label>
                                    <select
                                        value={editPriority}
                                        onChange={(e) => setEditPriority(e.target.value)}
                                        className="mt-1 w-full rounded border p-2"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                                    <select
                                        value={editAssignedUserId}
                                        onChange={(e) => setEditAssignedUserId(e.target.value)}
                                        className="mt-1 w-full rounded border p-2"
                                    >
                                        <option value="">Unassigned</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="mt-1">
                                        <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[ticket.status]}`}>
                                            {statusLabels[ticket.status]}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Priority</label>
                                    <div className="mt-1">
                                        <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium capitalize ${priorityStyles[ticket.priority]}`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700">Assigned To</label>
                                    <p className="mt-1 text-gray-900">
                                        {ticket.assigned_user_name || 'Unassigned'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {isEditing && (
                        <div className="mt-6 flex gap-2 border-t pt-6">
                            {editError && (
                                <p className="text-sm text-red-600">{editError}</p>
                            )}
                            <button
                                onClick={handleSaveTicket}
                                className="rounded bg-[#B5651D] px-4 py-2 text-white hover:bg-[#8A4A12]"
                            >
                                Save Changes
                            </button>

                            <button
                                onClick={() => setIsEditing(false)}
                                className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-[#F6F4EE]"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                {/* notes section */}
                <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-xl font-serif text-[#211C16]">Notes</h2>

                    {/* existing notes */}
                    {ticket.notes && ticket.notes.length > 0 ? (
                        <div className="mb-6 space-y-4">
                            {ticket.notes.map((note) => (
                                <div key={note.id} className="rounded border bg-gray-50 p-4">
                                    {editingNoteId === note.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editNoteContent}
                                                onChange={(e) => setEditNoteContent(e.target.value)}
                                                className="w-full rounded border p-2 text-sm"
                                                rows={3}
                                            />

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSaveNote(note.id)}
                                                    className="rounded bg-[#B5651D] px-3 py-1 text-sm text-white hover:bg-[#8A4A12]"
                                                >
                                                    Save
                                                </button>

                                                <button
                                                    onClick={() => setEditingNoteId(null)}
                                                    className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-800">{note.content}</p>

                                            <div className="mt-2 flex items-center justify-between">
                                                <p className="text-xs text-gray-500">
                                                    {note.user_name} · {new Date(note.created_at).toLocaleString()}
                                                </p>

                                                {note.user_id === currentUser.id && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditNote(note)}
                                                            className="text-xs text-gray-500 hover:text-gray-700"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeleteNote(note.id)}
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
                    ) : (
                        <p className="mb-6 text-sm text-gray-500">No notes yet.</p>
                    )}

                    {/* add note form */}
                    <div className="border-t pt-4">
                        <textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="w-full rounded border p-2 text-sm"
                            rows={3}
                            placeholder="Add a note..."
                        />

                        {noteError && (
                            <p className="mt-2 text-sm text-red-600">{noteError}</p>
                        )}

                        <button
                            onClick={handleCreateNote}
                            className="mt-3 rounded bg-[#B5651D] px-4 py-2 text-sm text-white hover:bg-[#8A4A12]"
                        >
                            Add Note
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TicketDetail