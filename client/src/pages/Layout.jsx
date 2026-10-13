import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon, PlusIcon, LogInIcon, LogOutIcon } from 'lucide-react'
import { fetchCurrentUser } from '../features/authSlice'
import { fetchWorkspaces } from '../features/workspaceSlice'
import CreateWorkspaceDialog from '../components/CreateWorkspaceDialog'
import api from '../configs/api'
import toast from 'react-hot-toast'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false)

    // Join workspace state
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
    const [workspaceId, setWorkspaceId] = useState('')
    const [isJoining, setIsJoining] = useState(false)

    const dispatch = useDispatch()

    const {
        user,
        isAuthenticated,
        loading: authLoading
    } = useSelector((state) => state.auth)

    const {
        loading: workspaceLoading,
        workspaces
    } = useSelector((state) => state.workspace)

    // Initial load of theme and current user
    useEffect(() => {
        dispatch(loadTheme())
        dispatch(fetchCurrentUser())
    }, [dispatch])

    // Load workspaces when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            dispatch(fetchWorkspaces())
        }
    }, [isAuthenticated, user, dispatch])

    const handleLogout = async () => {
    try {
        
        await api.post('/api/auth/logout')
        
        window.location.href = '/login'
    } catch (error) {
        console.error('Logout error:', error)
        toast.error('Failed to logout')
    }
}

    // Loading authentication
    if (authLoading) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        )
    }

    // Not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />
    }

    // Loading workspaces
    if (workspaceLoading) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <Loader2Icon className="size-7 text-blue-500 animate-spin" />
            </div>
        )
    }

    // JOIN WORKSPACE
    const handleJoinWorkspace = async (e) => {
        e.preventDefault()

        if (!workspaceId.trim()) {
            return toast.error('Please enter a workspace ID')
        }

        try {
            setIsJoining(true)

            const response = await api.post('/api/join-requests', {
                workspaceId: workspaceId.trim()
            })

            toast.success(
                response.data.message || 'Join request sent successfully'
            )

            setWorkspaceId('')
            setIsJoinDialogOpen(false)

        } catch (error) {
            console.error('Join workspace error:', error)

            toast.error(
                error.response?.data?.message ||
                'Failed to send join request'
            )
        } finally {
            setIsJoining(false)
        }
    }

    // If user has no workspace yet
    if (workspaces.length === 0) {
        return (
            <div className='min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-zinc-950 p-4 text-center'>

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 max-w-md w-full shadow-lg">

                    {/* HEADER */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to DevFlow AI!
                    </h2>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        You don't belong to any workspace yet.
                        Create a new workspace or join an existing one.
                    </p>

                    {/* CREATE WORKSPACE */}
                    <button
                        onClick={() => setIsWorkspaceDialogOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition shadow"
                    >
                        <PlusIcon className="size-4" />
                        Create Workspace
                    </button>

                    {/* OR */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                        <span className="text-xs text-gray-400">
                            OR
                        </span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                    </div>

                    {/* JOIN WORKSPACE */}
                    <button
                        onClick={() => setIsJoinDialogOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-800 dark:text-gray-200 font-medium rounded-lg text-sm transition"
                    >
                        <LogInIcon className="size-4" />
                        Join Existing Workspace
                    </button>

                </div>

                {/* CREATE WORKSPACE DIALOG */}
                <CreateWorkspaceDialog
                    isDialogOpen={isWorkspaceDialogOpen}
                    setIsDialogOpen={setIsWorkspaceDialogOpen}
                />

                <button
                    onClick={handleLogout}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition">
                    <LogOutIcon className="size-4" />
                    Logout
                </button>

                {/* JOIN WORKSPACE DIALOG */}
                {isJoinDialogOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">

                        <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl text-left">

                            {/* HEADER */}
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Join Workspace
                            </h2>

                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 mb-5">
                                Enter the workspace ID to send a join request.
                            </p>

                            {/* FORM */}
                            <form onSubmit={handleJoinWorkspace}>

                                <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                                    Workspace ID
                                </label>

                                <input
                                    type="text"
                                    value={workspaceId}
                                    onChange={(e) => setWorkspaceId(e.target.value)}
                                    placeholder="Enter workspace ID"
                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {/* ACTIONS */}
                                <div className="flex justify-end gap-3 mt-5">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsJoinDialogOpen(false)
                                            setWorkspaceId('')
                                        }}
                                        className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isJoining}
                                        className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isJoining
                                            ? 'Sending...'
                                            : 'Send Request'}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>
                )}

            </div>
        )
    }

    // NORMAL APPLICATION LAYOUT
    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />

            <div className="flex-1 flex flex-col h-screen">

                <Navbar
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />

                <div className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll">
                    <Outlet />
                </div>

            </div>

        </div>
    )
}

export default Layout