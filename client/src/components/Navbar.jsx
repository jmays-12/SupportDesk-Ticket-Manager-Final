import { NavLink, useNavigate, useLocation } from 'react-router-dom'

function Navbar({ currentUser, onLogout }) {
    const navigate = useNavigate()
    const location = useLocation()

    // pick up the "not logged in" message if we were redirected here
    const redirectMessage = location.state?.message

    const handleLogout = () => {
        onLogout()
        navigate('/')
    }

    return (
        <>


            <nav className="bg-[#FBF9F4] border-b border-[#E7E2D6] px-8 py-4 flex items-center justify-between">
                <span className="text-xl font-serif tracking-tight text-[#211C16]">SupportDesk</span>

                <div className="flex items-center gap-6">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            isActive
                                ? 'text-sm font-medium text-[#211C16] border-b-2 border-[#B5651D] pb-1'
                                : 'text-sm text-gray-500 hover:text-[#211C16] pb-1 border-b-2 border-transparent'
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/tickets"
                        className={({ isActive }) =>
                            isActive
                                ? 'text-sm font-medium text-[#211C16] border-b-2 border-[#B5651D] pb-1'
                                : 'text-sm text-gray-500 hover:text-[#211C16] pb-1 border-b-2 border-transparent'
                        }
                    >
                        Tickets
                    </NavLink>

                    <NavLink
                        to="/customers"
                        className={({ isActive }) =>
                            isActive
                                ? 'text-sm font-medium text-[#211C16] border-b-2 border-[#B5651D] pb-1'
                                : 'text-sm text-gray-500 hover:text-[#211C16] pb-1 border-b-2 border-transparent'
                        }
                    >
                        Customers
                    </NavLink>

                    <div className="flex items-center gap-3 border-l border-[#E7E2D6] pl-6">
                        {currentUser && (
                            <span className="text-sm text-gray-500">
                                {currentUser.name}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-sm text-gray-500 hover:text-[#211C16]"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar