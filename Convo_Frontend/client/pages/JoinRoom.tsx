import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageCircle, Users, Plus, LogOut } from "lucide-react";

interface Room {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
   roomCode: string;
}

export default function JoinRoom() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const [joinCode, setJoinCode] = useState("");
  const [isJoiningByCode, setIsJoiningByCode] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "https://convoconnect-r74v.onrender.com";

  useEffect(() => {
    const token = localStorage.getItem("convo_token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchRooms = async () => {
      setIsLoadingRooms(true);
      setApiError(null);
      try {
        const response = await fetch(`${API_BASE}/rooms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setApiError(data?.message || "Failed to load rooms");
          return;
        }

        const loadedRooms: Room[] = (data?.rooms || []).map((room: any) => ({
          id: room._id,
          name: room.name,
          description: room.description || "",
          members: room.membersCount ?? room.members ?? 0,
          maxMembers: room.maxMembers ?? 50,
          roomCode: room.roomCode || "",
        }));

        setRooms(loadedRooms);
      } catch (error) {
        console.error("Failed to load rooms", error);
        setApiError("Failed to load rooms. Please try again.");
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [API_BASE, navigate]);

  const handleJoinRoom = (roomId: string) => {
    const token = localStorage.getItem("convo_token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const join = async () => {
      try {
        const response = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setApiError(data?.message || "Failed to join room");
          return;
        }

        navigate(`/room/${roomId}`);
      } catch (error) {
        console.error("Failed to join room", error);
        setApiError("Failed to join room. Please try again.");
      }
    };

    join();
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newRoomName.trim()) {
      return;
    }

    const token = localStorage.getItem("convo_token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const create = async () => {
      setIsCreatingRoom(true);
      setApiError(null);
      try {
        const response = await fetch(`${API_BASE}/rooms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newRoomName,
            description: newRoomDescription,
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setApiError(data?.message || "Failed to create room");
          return;
        }

        const room = data?.room;
        if (room) {
          const newRoom: Room = {
            id: room._id,
            name: room.name,
            description: room.description || "",
            members: 1,
            maxMembers: room.maxMembers ?? 50,
            roomCode: room.roomCode || "",
          };
          setRooms([newRoom, ...rooms]);
        }

        setNewRoomName("");
        setNewRoomDescription("");
        setShowCreateRoom(false);
      } catch (error) {
        console.error("Failed to create room", error);
        setApiError("Failed to create room. Please try again.");
      } finally {
        setIsCreatingRoom(false);
      }
    };

    create();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <MessageCircle className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Convo</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("convo_token");
              localStorage.removeItem("convo_user");
              navigate("/");
            }}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Chat Rooms
            </h1>
            <p className="text-muted-foreground">
              Join an existing room or create your own
            </p>
          </div>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create Room
          </button>
        </div>

        {apiError && (
          <p className="mb-6 text-sm text-destructive">{apiError}</p>
        )}

        {/* Join by Room Code */}
        <div className="bg-card rounded-xl p-6 border border-border mb-10 shadow-sm flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Join with Room Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Enter room code (e.g. ABC123)"
            />
          </div>
          <button
            type="button"
            disabled={!joinCode.trim() || isJoiningByCode}
            onClick={async () => {
              const token = localStorage.getItem("convo_token");
              if (!token) {
                navigate("/signin");
                return;
              }

              setIsJoiningByCode(true);
              setApiError(null);
              try {
                const response = await fetch(`${API_BASE}/rooms/join-by-code`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ roomCode: joinCode.trim() }),
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                  setApiError(data?.message || "Failed to join room");
                  return;
                }

                const room = data?.room;
                if (room) {
                  navigate(`/room/${room._id}`);
                }
              } catch (error) {
                console.error("Failed to join by code", error);
                setApiError("Failed to join room. Please try again.");
              } finally {
                setIsJoiningByCode(false);
              }
            }}
            className="mt-4 md:mt-0 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoiningByCode ? "Joining..." : "Join Room"}
          </button>
        </div>

        {/* Create Room Form */}
        {showCreateRoom && (
          <div className="bg-card rounded-xl p-8 border border-border mb-12 shadow-lg">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Create a New Room
            </h2>
            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="My Awesome Room"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  placeholder="What's this room about?"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isCreatingRoom}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingRoom ? "Creating..." : "Create Room"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  className="px-6 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all shadow-md hover:shadow-lg group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  {room.members}/{room.maxMembers}
                </span>
              </div>

              <h3 className="text-xl font-bold text-foreground mb-2">
                {room.name}
              </h3>
              {room.roomCode && (
                <p className="text-xs font-mono text-muted-foreground mb-1">
                  Code: {room.roomCode}
                </p>
              )}
              <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                {room.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Users className="w-4 h-4" />
                  <span>{room.members} members</span>
                </div>
                <button
                  onClick={() => handleJoinRoom(room.id)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-sm"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No rooms yet
            </h3>
            <p className="text-muted-foreground">
              Create a room to get started chatting
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
