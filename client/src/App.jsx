import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Tickets from './pages/Tickets'
import TicketDetail from './pages/TicketDetail'
import Customers from './pages/Customers'
import Auth from './pages/Auth'

// redirect if user is not logged in
function ProtectedRoute({ currentUser, loading, children }) {
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <p className="text-gray-500">Loading...</p>
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/" replace state={{ message: "You need to log in to access that page." }} />
    }
    return children
}

function App() {
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // On app load, check if there's a stored user and valid token
    useEffect(() => {
        const initializeAuth = async () => {
            const storedUser = localStorage.getItem('currentUser')
            const token = localStorage.getItem('token')

            if (storedUser && token) {
                // Verify the token is still valid by making a test API call
                try {
                    const response = await apiFetch('/api/users', {
                        method: 'GET',
                    })

                    if (response.ok) {
                        // Token is valid, restore user
                        setCurrentUser(JSON.parse(storedUser))
                    } else if (response.status === 401) {
                        // Token expired or invalid, clear storage
                        localStorage.removeItem('token')
                        localStorage.removeItem('currentUser')
                        setCurrentUser(null)
                    } else {
                        // Server error (500, 502, etc) keeps user logged in
                        setCurrentUser(JSON.parse(storedUser))
                    }
                } catch (error) {
                    console.error('Auth check failed:', error)
                    // keep stored user logged in in case networking drops
                    setCurrentUser(JSON.parse(storedUser))
                }
            }

            setLoading(false)
        }

        initializeAuth()
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')
        setCurrentUser(null)
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Auth setCurrentUser={setCurrentUser} />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute currentUser={currentUser} loading={loading}>
                            <Dashboard currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tickets"
                    element={
                        <ProtectedRoute currentUser={currentUser} loading={loading}>
                            <Tickets currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tickets/:id"
                    element={
                        <ProtectedRoute currentUser={currentUser} loading={loading}>
                            <TicketDetail currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/customers"
                    element={
                        <ProtectedRoute currentUser={currentUser} loading={loading}>
                            <Customers currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    )
}

export default App