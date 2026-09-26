import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar'
import { apiFetch } from '../api.js'
import { formatRelativeTime } from '../utils/dateUtils.js'

export const statusStyles = {
    open: 'bg-[#FBF3E4] text-[#8A4A12] border-[#E7C9A0]',
    in_progress: 'bg-[#EAF1F6] text-[#2E5A78] border-[#B9D3E0]',
    resolved: 'bg-[#E8EEE5] text-[#3E573A] border-[#9BAF96]',
}

export const priorityStyles = {
    low: 'bg-[#F1EFEA] text-[#6B6259] border-[#DAD2C2]',
    medium: 'bg-[#F6EEDC] text-[#8A6A32] border-[#E0CB9C]',
    high: 'bg-[#F5E1D6] text-[#B5651D] border-[#DBA98A]',
    critical: 'bg-[#FBDCD6] text-[#B3261E] border-[#E8A79C]',
}

function Tickets({ currentUser, onLogout }) {
    document.title = 'SupportDesk - Tickets'

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
    const [editDescription, setEditDescription] = useState('')
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

    // filter and sort states
    const [filterStatus, setFilterStatus] = useState('all')
    const [sortBy, setSortBy] = useState('dateold')

    // toggle for showing resolved tickets
    const [showResolved, setShowResolved] = useState(false)

    // pagination state - now driven by the backend, not sliced client-side
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalTickets, setTotalTickets] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    // builds the query string for the current filter/sort/page state and fetches that page from the backend
    const fetchTickets = (overrides = {}) => {
        const effectivePage = overrides.page ?? page
        const effectivePageSize = overrides.pageSize ?? pageSize
        const effectiveSortBy = overrides.sortBy ?? sortBy
        const effectiveShowResolved = overrides.showResolved ?? showResolved
        const effectiveFilterStatus = overrides.filterStatus ?? filterStatus

        const params = new URLSearchParams({
            page: String(effectivePage),
            limit: String(effectivePageSize),
            sort_by: effectiveSortBy,
            show_resolved: String(effectiveShowResolved),
        })

        if (effectiveFilterStatus !== 'all') {
            params.set('status', effectiveFilterStatus)
        }

        return apiFetch(`/api/tickets?${params.toString()}`)
            .then((r) => r.json())
            .then((data) => {
                setTickets(data.tickets || [])
                setTotalTickets(data.total || 0)
                setTotalPages(data.total_pages || 1)
            })
    }

    // initial load: tickets (paginated), plus the full customer/user lists for the forms
    useEffect(() => {
        setLoading(true)

        Promise.all([
            apiFetch('/api/customers').then((r) => r.json()).then(setCustomers),
            apiFetch('/api/users').then((r) => r.json()).then(setUsers),
        ])
            .catch(() => {
                setMessage('Failed to load data.')
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    // re-fetch whenever the page, page size, filter, sort, or resolved toggle changes
    useEffect(() => {
        setLoading(true)

        fetchTickets()
            .catch(() => {
                setMessage('Failed to load tickets.')
            })
            .finally(() => {
                setLoading(false)
            })
    }, [page, pageSize, filterStatus, sortBy, showResolved])

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
            // jump back to page 1 so the new ticket is visible under default sort/filter
            setPage(1)
            // add override so theres no stale state issue
            fetchTickets({ page: 1 })

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
        setEditDescription(ticket.description)
        setEditStatus(ticket.status)
        setEditPriority(ticket.priority)
        setEditAssignedUserId(ticket.assigned_user_id ?? '')
        setEditError('')
    }

    const handleSaveTicket = async (ticketId) => {
        const response = await apiFetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                description: editDescription,
                status: editStatus,
                priority: editPriority,
                assigned_user_id: editAssignedUserId ? parseInt(editAssignedUserId) : null,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            // status/priority changes can move a ticket out of the current filter/sort, so re-fetch this page
            fetchTickets()
            setEditingTicketId(null)
            setEditError('')
            setMessage('Ticket updated successfully.')
        } else {
            setEditError(data.error || 'Failed to update ticket.')
        }
    }

    const handleMarkResolved = async (ticketId) => {
        const confirmed = window.confirm('Are you sure you want to mark this ticket as resolved?')
        if (!confirmed) return

        const response = await apiFetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status: 'resolved',
            }),
        })

        const data = await response.json()

        if (response.ok) {
            fetchTickets()
            setMessage('Ticket marked as resolved.')
        } else {
            setMessage(data.error || 'Failed to mark ticket as resolved.')
        }
    }

    const handleDeleteTicket = async (ticketId) => {
        const confirmed = window.confirm('Are you sure you want to delete this ticket?')

        if (!confirmed) return

        const response = await apiFetch(`/api/tickets/${ticketId}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            setTicketNotes((prev) => {
                const updated = { ...prev }
                delete updated[ticketId]
                return updated
            })

            // deleting can shrink the total page count out from under the current page, so let fetchTickets settle it
            if (tickets.length === 1 && page > 1) {
                setPage(page - 1)
            } else {
                fetchTickets()
            }

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

    const handleClaimTicket = async (ticketId) => {
        const response = await apiFetch(`/api/tickets/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                assigned_user_id: currentUser.id,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            setTickets((prev) =>
                prev.map((t) =>
                    t.id === ticketId
                        ? { ...t, ...data, assigned_user_id: currentUser.id, assigned_user_name: currentUser.name }
                        : t
                )
            )
            setMessage('Ticket claimed successfully.')
        } else {
            setMessage(data.error || 'Failed to claim ticket.')
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

    // filtering, sorting, and paging now all happen on the backend - `tickets` is already just this page's rows

    return (
        <div className="min-h-screen bg-[#F6F4EE]">
            <Navbar currentUser={currentUser} onLogout={onLogout} />

            <div className="mx-auto max-w-6xl p-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-serif text-[#211C16]">Tickets</h1>
                        <p className="mt-2 text-gray-600">View and manage support tickets</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowForm(!showForm)
                            setCreateError('')
                        }}
                        className="rounded bg-[#B5651D] px-4 py-2 text-sm text-white hover:bg-[#8A4A12]"
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
                    <div className="mt-6 rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-serif text-[#211C16]">New Ticket</h2>

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
                                className="rounded bg-[#B5651D] px-4 py-2 text-sm text-white hover:bg-[#8A4A12]"
                            >
                                Create Ticket
                            </button>
                        </form>
                    </div>
                )}

                <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-wrap items-center gap-2 border-b pb-4">
                        <button
                            type="button"
                            onClick={() => {
                                setFilterStatus('all')
                                setPage(1)
                            }}
                            className={`rounded px-3 py-1 text-sm transition-colors ${filterStatus === 'all' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                        >
                            All
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setFilterStatus('open')
                                setPage(1)
                            }}
                            className={`rounded px-3 py-1 text-sm transition-colors ${filterStatus === 'open' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                        >
                            Open
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setFilterStatus('in_progress')
                                setPage(1)
                            }}
                            className={`rounded px-3 py-1 text-sm transition-colors ${filterStatus === 'in_progress' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                        >
                            In Progress
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setFilterStatus('resolved')
                                setPage(1)
                            }}
                            className={`rounded px-3 py-1 text-sm transition-colors ${filterStatus === 'resolved' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                        >
                            Resolved
                        </button>

                        {/* show resolved tickets toggle checkbox */}
                        <label className="rounded px-3 py-1 bg-[#F1EDE2] hover:bg-[#E7E2D6] ml-auto flex items-center gap-2 text-sm text-[#6B6259]">
                            Show resolved tickets:

                            <input
                                type="checkbox"
                                checked={showResolved}
                                onChange={(e) => {
                                    setShowResolved(e.target.checked)
                                    setPage(1)
                                }}
                                className="mt-0.5 h-3 w-3 rounded border-gray-300 accent-[#B5651D] focus:ring-[#B5651D]"
                            />
                        </label>

                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort:</span>

                            <button
                                type="button"
                                onClick={() => setSortBy('dateold')}
                                className={`rounded px-3 py-1 text-sm transition-colors ${sortBy === 'dateold' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                            >
                                Date (Oldest first)
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('datenew')}
                                className={`rounded px-3 py-1 text-sm transition-colors ${sortBy === 'datenew' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                            >
                                Date (Newest first)
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('priority')}
                                className={`rounded px-3 py-1 text-sm transition-colors ${sortBy === 'priority' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                            >
                                Priority
                            </button>

                            <button
                                type="button"
                                onClick={() => setSortBy('status')}
                                className={`rounded px-3 py-1 text-sm transition-colors ${sortBy === 'status' ? 'bg-[#B5651D] text-white' : 'bg-[#F1EDE2] text-[#6B6259] hover:bg-[#E7E2D6]'}`}
                            >
                                Status
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-500">Loading tickets...</p>
                    ) : tickets.length === 0 ? (
                        <p className="text-gray-500">No tickets found.</p>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {tickets.map((ticket) => (
                                    <div key={ticket.id} className="rounded border p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="mt-2 text-sm text-gray-500 capitalize">
                                                    Subject:
                                                </p>

                                                <h2 className="text-gray-900">
                                                    &nbsp;{ticket.subject}
                                                </h2>

                                                <p className="mt-1 text-sm text-gray-500 capitalize">
                                                    Description:
                                                </p>

                                                {editingTicketId === ticket.id ? (
                                                    <textarea
                                                        value={editDescription}
                                                        onChange={(e) => setEditDescription(e.target.value)}
                                                        className="mt-1 w-full rounded border p-2 text-sm"
                                                        rows={4}
                                                    />
                                                ) : (
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        &nbsp;{ticket.description}
                                                    </p>
                                                )}

                                                <p className="mt-1 text-sm text-gray-500 capitalize">
                                                    Customer:
                                                </p>

                                                <p>
                                                    &nbsp;{ticket.customer_name}
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
                                                    <>
                                                        <p className="text-sm text-gray-500">
                                                            Assigned to:
                                                        </p>

                                                        <div className="flex items-center gap-2">
                                                            <p>
                                                                &nbsp;{ticket.assigned_user_name || 'Unassigned'}
                                                            </p>

                                                            {!ticket.assigned_user_id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleClaimTicket(ticket.id)}
                                                                    className="rounded border border-[#B5651D] bg-white px-2 py-1 text-xs text-[#B5651D] hover:bg-[#F6F4EE]"
                                                                >
                                                                    Claim Ticket
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
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
                                                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-[#F6F4EE]"
                                            >
                                                {expandedTicketId === ticket.id ? 'Hide notes' : 'Show notes'}
                                            </button>

                                            <span className="text-xs text-gray-400">
                                                {formatRelativeTime(ticket.created_at)}
                                            </span>

                                            <div className="flex gap-2">
                                                {editingTicketId === ticket.id ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveTicket(ticket.id)}
                                                            className="rounded bg-[#B5651D] px-3 py-1 text-sm text-white hover:bg-[#8A4A12]"
                                                        >
                                                            Save
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingTicketId(null)
                                                                setEditError('')
                                                            }}
                                                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE]"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link
                                                            to={`/tickets/${ticket.id}`}
                                                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE]"
                                                        >
                                                            View
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditTicket(ticket)}
                                                            className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE]"
                                                        >
                                                            Edit
                                                        </button>

                                                        {ticket.status !== 'resolved' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleMarkResolved(ticket.id)}
                                                                className="rounded border border-[#9BAF96] bg-[#E8EEE5] px-3 py-1 text-sm text-[#3E573A] hover:bg-[#D9E3D5]"
                                                            >
                                                                Mark Resolved
                                                            </button>
                                                        )}

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
                                                                                className="rounded bg-[#B5651D] px-3 py-1 text-sm text-white hover:bg-[#8A4A12]"
                                                                            >
                                                                                Save
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setEditingNoteId(null)
                                                                                    setEditNoteError('')
                                                                                }}
                                                                                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE]"
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
                                                        className="rounded bg-[#B5651D] px-3 py-1 text-sm text-white hover:bg-[#8A4A12]"
                                                    >
                                                        Add Note
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* pagination controls - page, page size, and total count all come from the backend response */}
                            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>Show</span>

                                    <select
                                        value={pageSize}
                                        onChange={(e) => {
                                            setPageSize(Number(e.target.value))
                                            setPage(1)
                                        }}
                                        className="rounded border p-1.5 text-sm"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>

                                    <span>per page &middot; {totalTickets} ticket{totalTickets === 1 ? '' : 's'} total</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <span className="text-sm text-gray-500">
                                        Page {page} of {totalPages}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-[#F6F4EE] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Tickets