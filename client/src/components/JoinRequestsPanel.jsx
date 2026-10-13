import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
} from "lucide-react";

function JoinRequestsPanel() {
    const { currentWorkspace } = useSelector(
        (state) => state.workspace
    );

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    /* FETCH JOIN REQUESTS */
    const fetchRequests = async () => {
        if (!currentWorkspace?.id) {
            setRequests([]);
            return;
        }

        try {
            setLoading(true);

            const response = await axios.get(
                `/api/join-requests/${currentWorkspace.id}`,
                {
                    withCredentials: true,
                }
            );

            const fetchedRequests = response.data?.requests;

            setRequests(
                Array.isArray(fetchedRequests)
                    ? fetchedRequests
                    : []
            );

            
        } catch (error) {
            console.error(
                "Fetch join requests error:",
                error
            );

            setRequests([]);

            /*
             * Don't show an error toast for every render
             * if authentication is temporarily unavailable.
             */
            if (error.response?.status !== 401) {
                toast.error(
                    error.response?.data?.message ||
                        "Failed to fetch join requests"
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /* LOAD REQUESTS WHEN WORKSPACE CHANGES */
    useEffect(() => {
        fetchRequests();
    }, [currentWorkspace?.id]);

    /* ACCEPT REQUEST */
    const acceptRequest = async (requestId) => {
        if (!currentWorkspace?.id) return;

        try {
            const response = await axios.patch(
                `/api/join-requests/${currentWorkspace.id}/${requestId}/accept`,
                {},
                {
                    withCredentials: true,
                }
            );

            toast.success(
                response.data?.message ||
                    "Join request accepted"
            );

            /*
             * Remove accepted request from the current list
             * immediately.
             */
            setRequests((previousRequests) =>
                previousRequests.filter(
                    (request) => request.id !== requestId
                )
            );

            /*
             * Fetch again to keep UI synchronized
             * with backend.
             */
            await fetchRequests();
        } catch (error) {
            console.error(
                "Accept join request error:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                    "Failed to accept join request"
            );
        }
    };

    /* REJECT REQUEST */
    const rejectRequest = async (requestId) => {
        if (!currentWorkspace?.id) return;

        try {
            const response = await axios.patch(
                `/api/join-requests/${currentWorkspace.id}/${requestId}/reject`,
                {},
                {
                    withCredentials: true,
                }
            );

            toast.success(
                response.data?.message ||
                    "Join request rejected"
            );

            setRequests((previousRequests) =>
                previousRequests.filter(
                    (request) => request.id !== requestId
                )
            );

            await fetchRequests();
        } catch (error) {
            console.error(
                "Reject join request error:",
                error
            );

            toast.error(
                error.response?.data?.message ||
                    "Failed to reject join request"
            );
        }
    };

    /* NO WORKSPACE */
    if (!currentWorkspace?.id) {
        return null;
    }

    return (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-400" />

                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Join Requests
                        </h2>

                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                            Requests to join this workspace
                        </p>
                    </div>
                </div>

                {!loading && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                        {requests.length}
                    </span>
                )}
            </div>

            {/* LOADING */}
            {loading ? (
                <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                        Loading join requests...
                    </p>
                </div>
            ) : requests.length === 0 ? (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <Clock className="w-6 h-6 text-gray-400 dark:text-zinc-500" />
                    </div>

                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                        No pending requests
                    </p>

                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                        New workspace join requests will appear here.
                    </p>
                </div>
            ) : (
                /* REQUEST LIST */
                <div className="space-y-3">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-gray-200 dark:border-zinc-800 p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition"
                        >
                            {/* USER INFO */}
                            <div className="flex items-center gap-3 min-w-0">
                                {request.user?.image ? (
                                    <img
                                        src={request.user.image}
                                        alt={
                                            request.user?.name ||
                                            "User"
                                        }
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-500" />
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {request.user?.name ||
                                            "Unknown User"}
                                    </p>

                                    <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">
                                        {request.user?.email ||
                                            "No email"}
                                    </p>

                                    <span className="inline-block mt-1 text-xs text-yellow-500">
                                        Pending
                                    </span>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            <div className="flex gap-2 sm:flex-shrink-0">
                                <button
                                    onClick={() =>
                                        acceptRequest(request.id)
                                    }
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Accept
                                </button>

                                <button
                                    onClick={() =>
                                        rejectRequest(request.id)
                                    }
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default JoinRequestsPanel;