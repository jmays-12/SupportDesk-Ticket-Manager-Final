import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Navbar from '../components/Navbar.jsx'
import { apiFetch } from '../api.js'
import { formatDate } from '../utils/dateUtils.js'

function Dashboard({ currentUser, onLogout }) {
    document.title = 'SupportDesk - Dashboard'

    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)

    const statusStyles = {
        open: 'bg-blue-50 text-blue-700 border-blue-200',
        in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        resolved: 'bg-green-50 text-green-700 border-green-200',
    }

    const statusLabels = {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
    }


    useEffect(() => {
        apiFetch('/api/tickets')
            .then(async (response) => {
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.msg || data.error || 'Failed to load tickets')
                }

                setTickets(Array.isArray(data) ? data : [])
            })
            .catch((error) => {
                console.error('Failed to load dashboard tickets:', error)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    const openTickets = tickets.filter(
        (ticket) => ticket.status !== 'resolved'
    ).length

    const resolvedTickets = tickets.filter(
        (ticket) => ticket.status === 'resolved'
    ).length

    const criticalPriorityTickets = tickets.filter(
        (ticket) => ticket.priority === 'critical'
    ).length

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar currentUser={currentUser} onLogout={onLogout} />

            <div className="mx-auto max-w-6xl px-4 pt-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome, {currentUser?.name || 'User'}
                    </h1>
                </div>

                {/* stats */}
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-med text-center font-medium text-gray-900">
                            Open Tickets
                        </p>

                        <p className="mt-2 text-3xl text-center font-bold text-gray-500">
                            {loading ? '-' : openTickets}
                        </p>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-med text-center font-medium text-gray-900">
                            Critical Priority
                        </p>

                        <p className="mt-2 text-3xl text-center font-bold text-red-600">
                            {loading ? '-' : criticalPriorityTickets}
                        </p>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-med text-center font-medium text-gray-900">
                            Resolved Tickets
                        </p>

                        <p className="mt-2 text-3xl text-center font-bold text-green-400">
                            {loading ? '-' : resolvedTickets}
                        </p>
                    </div>
                </div>
                {/* recent tickets */}
                <div className="mt-8 rounded-lg bg-white p-6 shadow">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Recent Tickets
                        </h2>

                        <Link
                            to="/tickets"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            View all
                        </Link>
                    </div>

                    {loading ? (
                        <p className="mt-4 text-gray-500">
                            Loading tickets...
                        </p>
                    ) : tickets.length === 0 ? (
                        <p className="mt-4 text-gray-500">
                            No tickets yet.
                        </p>
                    ) : (
                        <div className="mt-4 divide-y divide-gray-200">
                            {tickets.slice(-5).reverse().map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex items-center justify-between py-4"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {ticket.subject}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {ticket.customer_name || 'Unknown customer'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                                            Created: {formatDate(ticket.created_at)}
                                        </span>
                                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[ticket.status]}`}>
                                            {statusLabels[ticket.status]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard