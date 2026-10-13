import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus, LogIn } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentWorkspace } from "../features/workspaceSlice";
import { useNavigate } from "react-router-dom";
import CreateWorkspaceDialog from "./CreateWorkspaceDialog";
import axios from "axios";
import toast from "react-hot-toast";

function WorkspaceDropdown() {
  const { workspaces, currentWorkspace } = useSelector(
    (state) => state.workspace
  );

  const [isOpen, setIsOpen] = useState(false);

  // Create workspace dialog
  const [isWorkspaceDialogOpen, setIsWorkspaceDialogOpen] = useState(false);

  // Join workspace dialog
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const dropdownRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* SELECT WORKSPACE */
  const onSelectWorkspace = (workspace) => {
    dispatch(setCurrentWorkspace(workspace.id));
    setIsOpen(false);
    navigate("/");
  };

  /* JOIN WORKSPACE */
  const handleJoinWorkspace = async (e) => {
    e.preventDefault();

    if (!workspaceId.trim()) {
      return toast.error("Please enter a workspace ID");
    }

    try {
      setIsJoining(true);

      const response = await axios.post("/api/join-requests", {
        workspaceId: workspaceId.trim(),
      });

      toast.success(response.data.message || "Join request sent");

      setWorkspaceId("");
      setIsJoinDialogOpen(false);
    } catch (error) {
      console.error("Join workspace error:", error);

      toast.error(
        error.response?.data?.message || "Failed to send join request"
      );
    } finally {
      setIsJoining(false);
    }
  };

  /* CLOSE DROPDOWN ON OUTSIDE CLICK */
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* WORKSPACE DROPDOWN */}
      <div className="relative m-4" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((p) => !p)}
          className="w-full flex items-center justify-between p-3 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <div className="flex items-center gap-3">
            <img
              src={currentWorkspace?.image_url || "/placeholder.png"}
              alt={currentWorkspace?.name || "Workspace"}
              className="w-8 h-8 rounded object-cover bg-blue-600/10"
            />

            <div className="min-w-0 text-left">
              <p className="font-semibold text-sm truncate">
                {currentWorkspace?.name || "Select Workspace"}
              </p>

              <p className="text-xs text-gray-500 truncate">
                {workspaces.length} workspace
                {workspaces.length !== 1 && "s"}
              </p>
            </div>
          </div>

          <ChevronDown className="w-4 h-4" />
        </button>

        {/* DROPDOWN MENU */}
        {isOpen && (
          <div className="absolute z-50 w-64 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded shadow-lg left-0 top-full mt-1">
            {/* WORKSPACES */}
            <div className="p-2">
              <p className="text-xs uppercase tracking-wider px-2 mb-2 text-gray-500">
                Workspaces
              </p>

              {workspaces.length > 0 ? (
                workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => onSelectWorkspace(workspace)}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                  >
                    <img
                      src={workspace.image_url || "/placeholder.png"}
                      alt={workspace.name}
                      className="w-6 h-6 rounded object-cover"
                    />

                    <p className="flex-1 truncate text-sm">
                      {workspace.name}
                    </p>

                    {currentWorkspace?.id === workspace.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                ))
              ) : (
                <p className="px-2 py-2 text-sm text-gray-500">
                  No workspaces found
                </p>
              )}
            </div>

            <hr className="border-gray-200 dark:border-zinc-800" />

            {/* CREATE WORKSPACE */}
            <div
              onClick={() => {
                setIsWorkspaceDialogOpen(true);
                setIsOpen(false);
              }}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <p className="flex items-center gap-2 text-xs text-blue-500 font-medium">
                <Plus className="w-4 h-4" />
                Create Workspace
              </p>
            </div>

            {/* JOIN WORKSPACE */}
            <div
              onClick={() => {
                setIsJoinDialogOpen(true);
                setIsOpen(false);
              }}
              className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <p className="flex items-center gap-2 text-xs text-green-500 font-medium">
                <LogIn className="w-4 h-4" />
                Join Workspace
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CREATE WORKSPACE DIALOG */}
      <CreateWorkspaceDialog
        isDialogOpen={isWorkspaceDialogOpen}
        setIsDialogOpen={setIsWorkspaceDialogOpen}
      />

      {/* JOIN WORKSPACE DIALOG */}
      {isJoinDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
            {/* HEADER */}
            <h2 className="text-lg font-semibold mb-1">
              Join Workspace
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              Enter the workspace ID to send a join request.
            </p>

            {/* FORM */}
            <form onSubmit={handleJoinWorkspace}>
              <label className="block text-sm font-medium mb-2">
                Workspace ID
              </label>

              <input
                type="text"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                placeholder="Enter workspace ID"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* ACTIONS */}
              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsJoinDialogOpen(false);
                    setWorkspaceId("");
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
                  {isJoining ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default WorkspaceDropdown;