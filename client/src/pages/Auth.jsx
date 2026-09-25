import { useState } from 'react'
import { useNavigate, useLocation, redirect } from 'react-router-dom'

import { apiFetch } from '../api.js'

function Auth({ setCurrentUser }) {
    const navigate = useNavigate()

    const location = useLocation()
    const redirectMessage = location.state?.message

    const [showLoginForm, setShowLoginForm] = useState(true)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    const [message, setMessage] = useState('')
    const [messageIsError, setMessageIsError] = useState(false)

    const handleSignup = async (event) => {
        event.preventDefault()

        const response = await apiFetch('/api/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        })

        const data = await response.json()

        if (response.ok) {
            setMessage('Account created successfully. You can now log in.')
            setMessageIsError(false)
            setShowLoginForm(true)
        } else {
            setMessage(
                data.error === 'Email already in use'
                    ? 'That email is already in use. Please log in or use another email.'
                    : data.error || 'Signup failed. Please contact an administrator.'
            )
            setMessageIsError(true)
        }
    }

    const handleLogin = async (event) => {
        event.preventDefault()

        setMessage('')
        setMessageIsError(false)

        try {
            const response = await apiFetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                localStorage.setItem('token', data.token)
                localStorage.setItem('currentUser', JSON.stringify(data.user))

                setCurrentUser(data.user)
                navigate('/dashboard')
            } else {
                setMessage(
                    data.error ||
                    `Login failed. Server returned ${response.status}.`
                )
                setMessageIsError(true)
            }
        } catch (error) {
            console.error('Login request failed:', error)

            setMessage(
                'Unable to connect to the server. Please try again or contact an administrator.'
            )
            setMessageIsError(true)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F6F4EE]">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm border-t-2 border-[#B5651D]">
                <h1 className="text-center text-4xl font-serif text-[#211C16]">SupportDesk</h1>

                <p className="mt-2 text-center text-gray-500">
                    Manage customer tickets from one central app.
                </p>
                {message && (
                    <div
                        className={
                            messageIsError
                                ? 'mt-4 w-full rounded border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700'
                                : 'mt-4 w-full rounded border border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-700'
                        }
                    >
                        {message}
                    </div>
                )}

                {showLoginForm ? (
                    <form onSubmit={handleLogin} className="mt-6">
                        <h2 className="text-xl font-serif text-[#211C16]">Log In</h2>

                        <div className="mt-4 space-y-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="w-full rounded border p-2"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="w-full rounded border p-2"
                            />

                            <button
                                type="submit"
                                className="w-full rounded bg-[#B5651D] px-4 py-2 text-white hover:bg-[#8A4A12]"
                            >
                                Log In
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                Don't have an account?
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLoginForm(false)
                                        setMessage('')
                                    }}
                                    className="ml-1 text-[#B5651D] hover:underline"
                                >
                                    Sign up
                                </button>
                            </p>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSignup} className="mt-6">
                        <h2 className="text-xl font-serif text-[#211C16]">Sign Up</h2>

                        <div className="mt-4 space-y-4">
                            <input
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded border p-2"
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded border p-2"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded border p-2"
                            />

                            <button
                                type="submit"
                                className="w-full rounded bg-[#B5651D] px-4 py-2 text-white hover:bg-[#8A4A12]"
                            >
                                Sign Up
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                Already have an account?
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowLoginForm(true)
                                        setMessage('')
                                    }}
                                    className="ml-1 text-[#B5651D] hover:underline"
                                >
                                    Log in
                                </button>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

export default Auth