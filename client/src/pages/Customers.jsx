import { useEffect, useState } from 'react'

import Navbar from '../components/Navbar'
import { apiFetch } from '../api.js'

function Customers({ currentUser, onLogout }) {

    document.title = "SupportDesk - Customers"

    const [customers, setCustomers] = useState([])

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')

    const [message, setMessage] = useState('')
    const [createError, setCreateError] = useState('')

    // state manager for Add Customer form
    const [isMinimized, setIsMinimized] = useState(true)

    const [editingCustomerId, setEditingCustomerId] = useState(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPhoneNumber, setEditPhoneNumber] = useState('')
    const [editMessage, setEditMessage] = useState('')

    //regex patterns for form validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[0-9+().\-\s]+$/

    useEffect(() => {
        apiFetch('/api/customers')
            .then((response) => response.json())
            .then((data) => {
                setCustomers(data)
            })
    }, [])

    const handleCreateCustomer = async (event) => {
        event.preventDefault()

        if (!emailRegex.test(email)) {
            setCreateError('Please enter a valid email address.')
            return
        }

        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
            setCreateError('Please enter a valid phone number.')
            return
        }

        if (phoneNumber && (phoneNumber.replace(/\D/g, '').length < 10 || phoneNumber.replace(/\D/g, '').length > 15)) {
            setCreateError('Phone number must contain between 10 and 15 digits.')
            return
        }

        const response = await apiFetch('/api/customers', {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                phone_number: phoneNumber,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            setCustomers([...customers, data])
            setName('')
            setEmail('')
            setPhoneNumber('')
            setCreateError('')
            setMessage('Customer created successfully.')
        } else {
            setCreateError(data.error || 'Failed to create customer.')
        }
    }

    const handleEditCustomer = (customer) => {
        setEditingCustomerId(customer.id)
        setEditName(customer.name)
        setEditEmail(customer.email)
        setEditPhoneNumber(customer.phone_number || '')
        setEditMessage('')
    }

    const handleSaveCustomer = async (customerId) => {
        if (!editName.trim()) {
            setEditMessage('Name cannot be empty.')
            return
        }

        if (!emailRegex.test(editEmail)) {
            setEditMessage('Please enter a valid email address.')
            return
        }

        if (editPhoneNumber && !phoneRegex.test(editPhoneNumber)) {
            setEditMessage('Please enter a valid phone number.')
            return
        }

        if (editPhoneNumber && (editPhoneNumber.replace(/\D/g, '').length < 10 || editPhoneNumber.replace(/\D/g, '').length > 15)) {
            setEditMessage('Phone number must contain between 10 and 15 digits.')
            return
        }

        const response = await apiFetch(`/api/customers/${customerId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                name: editName,
                email: editEmail,
                phone_number: editPhoneNumber,
            }),
        })

        const data = await response.json()

        if (response.ok) {
            setCustomers(
                customers.map((customer) =>
                    customer.id === customerId ? data : customer
                )
            )
            setEditingCustomerId(null)
            setEditMessage('')
            setMessage('Customer updated successfully.')
        } else {
            setEditMessage(data.error || 'Failed to update customer.')
        }
    }

    const handleDeleteCustomer = async (customerId) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this customer?'
        )

        if (!confirmed) {
            return
        }

        const response = await apiFetch(`/api/customers/${customerId}`, {
            method: 'DELETE',
        })

        const data = await response.json()

        if (response.ok) {
            setCustomers(
                customers.filter((customer) => customer.id !== customerId)
            )
            setMessage('Customer deleted successfully.')
        } else {
            setMessage(data.error || 'Failed to delete customer.')
        }
    }

    return (
        <div className="min-h-screen bg-[#F6F4EE]">
            <Navbar currentUser={currentUser} onLogout={onLogout} />
            <div className="mx-auto max-w-6xl">
                <h1 className="text-3xl font-serif text-[#211C16] pt-4">
                    Customers
                </h1>

                <p className="mt-2 text-gray-600">
                    View and manage customer records.
                </p>

                {message && (
                    <div className="mt-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                        {message}
                    </div>
                )}

                <div className="fixed bottom-6 right-6 w-80 rounded-lg bg-white shadow-lg border border-[#E7E2D6]">
                    <div className="flex items-center justify-between border-b border-[#E7E2D6] p-4">
                        <h2 className="text-xl font-serif text-[#211C16]">
                            Add Customer
                        </h2>

                        <button
                            type="button"
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="flex h-8 w-8 items-center pb-1 justify-center rounded border border-gray-300 text-xl text-gray-600 hover:border-[#B5651D] hover:text-[#B5651D]"
                        >
                            {isMinimized ? '+' : '-'}
                        </button>
                    </div>

                    {!isMinimized && (
                        <form onSubmit={handleCreateCustomer} className="space-y-4 p-4">
                            <input
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                className="w-full rounded border p-2"
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                className="w-full rounded border p-2"
                            />

                            <input
                                type="text"
                                placeholder="Phone number"
                                value={phoneNumber}
                                onChange={(event) =>
                                    setPhoneNumber(event.target.value)
                                }
                                className="w-full rounded border p-2"
                            />

                            {createError && (
                                <p className="text-sm text-red-600">
                                    {createError}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="rounded bg-[#B5651D] px-4 py-2 text-white hover:bg-[#8A4A12]"
                            >
                                Add Customer
                            </button>
                        </form>
                    )}
                </div>

                <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
                    {customers.length === 0 ? (
                        <p className="text-gray-500">
                            No customers in database.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {customers.map((customer) => (
                                <div
                                    key={customer.id}
                                    className="rounded border p-4"
                                >
                                    {editingCustomerId === customer.id ? (
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(event) =>
                                                    setEditName(event.target.value)
                                                }
                                                className="w-full rounded border p-2"
                                            />

                                            <input
                                                type="email"
                                                value={editEmail}
                                                onChange={(event) =>
                                                    setEditEmail(event.target.value)
                                                }
                                                className="w-full rounded border p-2"
                                            />

                                            <input
                                                type="text"
                                                value={editPhoneNumber}
                                                onChange={(event) =>
                                                    setEditPhoneNumber(event.target.value)
                                                }
                                                className="w-full rounded border p-2"
                                            />

                                            {editMessage && (
                                                <p className="text-sm text-red-600">
                                                    {editMessage}
                                                </p>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleSaveCustomer(customer.id)
                                                    }
                                                    className="rounded bg-[#B5651D] px-4 py-2 text-white hover:bg-[#8A4A12]"
                                                >
                                                    Save
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingCustomerId(null)
                                                        setEditMessage('')
                                                    }}
                                                    className="rounded border border-gray-300 px-4 py-2 text-gray-700"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <h2 className="font-semibold text-gray-900">
                                                {customer.name}
                                            </h2>

                                            <p className="text-gray-600">
                                                {customer.email}
                                            </p>

                                            {customer.phone_number && (
                                                <p className="text-gray-600">
                                                    {customer.phone_number}
                                                </p>
                                            )}

                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditCustomer(customer)
                                                    }
                                                    className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteCustomer(customer.id)
                                                    }
                                                    className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </>
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

export default Customers