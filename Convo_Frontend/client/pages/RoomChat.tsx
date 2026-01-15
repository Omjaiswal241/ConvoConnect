import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MessageCircle, Send, LogOut, Users, Menu, X } from "lucide-react";

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

interface RoomMember {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline";
}

export default function RoomChat() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [members, setMembers] = useState<RoomMember[]>([]);

  const [messageInput, setMessageInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [roomName, setRoomName] = useState("General Chat");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");

  const [currentUserId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem("convo_user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.id ?? null;
    } catch {
      return null;
    }
  });

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "https://convoconnect-r74v.onrender.com";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem("convo_token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const fetchRoomData = async () => {
      setApiError(null);
      try {
        // Load room details (name, members)
        const detailsRes = await fetch(
          `${API_BASE}/rooms/${roomId}/details`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const detailsData = await detailsRes.json().catch(() => null);

        if (!detailsRes.ok) {
          setApiError(detailsData?.message || "Failed to load room details");
          return;
        }

        const room = detailsData.room;
        if (room?.name) {
          setRoomName(room.name);
          setNewRoomName(room.name);
        }

        if (room?.owner && currentUserId) {
          setIsOwner(String(room.owner) === String(currentUserId));
        }

        if (Array.isArray(detailsData.members)) {
          const mappedMembers: RoomMember[] = detailsData.members.map(
            (m: any) => {
              const userName = m.user?.name || "Unknown";
              const avatarText =
                m.user?.avatar && m.user.avatar.trim().length > 0
                  ? m.user.avatar.trim().slice(0, 2).toUpperCase()
                  : userName
                      .split(" ")
                      .map((part: string) => part.charAt(0).toUpperCase())
                      .join("")
                      .slice(0, 2);

              return {
                id: m._id,
                name: userName,
                avatar: avatarText || "?",
                status: "online",
              };
            }
          );
          setMembers(mappedMembers);
        }

        // Load messages
        const messagesRes = await fetch(
          `${API_BASE}/rooms/${roomId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const messagesData = await messagesRes.json().catch(() => null);

        if (!messagesRes.ok) {
          setApiError(messagesData?.message || "Failed to load messages");
          return;
        }

        const loadedMessages: Message[] = (messagesData?.messages || []).map(
          (msg: any) => {
            const authorName = msg.author?.name || "Unknown";
            const avatarText =
              msg.author?.avatar && msg.author.avatar.trim().length > 0
                ? msg.author.avatar.trim().slice(0, 2).toUpperCase()
                : authorName
                    .split(" ")
                    .map((part: string) => part.charAt(0).toUpperCase())
                    .join("")
                    .slice(0, 2);

            const isMine =
              currentUserId && msg.author?._id
                ? String(msg.author._id) === String(currentUserId)
                : false;

            return {
              id: msg._id,
              author: authorName,
              avatar: avatarText || "?",
              content: msg.content,
              timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              isMine,
            };
          }
        );

        setMessages(loadedMessages);
      } catch (error) {
        console.error("Failed to load room data", error);
        setApiError("Failed to load room. Please try again.");
      }
    };

    fetchRoomData();
  }, [API_BASE, navigate, roomId, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !roomId) {
      return;
    }

    const token = localStorage.getItem("convo_token");
    if (!token) {
      navigate("/signin");
      return;
    }

    setIsSending(true);
    setApiError(null);

    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageInput }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setApiError(data?.message || "Failed to send message");
        return;
      }

      const msg = data?.message;
      if (msg) {
        const authorName = msg.author?.name || "You";
        const avatarText =
          msg.author?.avatar && msg.author.avatar.trim().length > 0
            ? msg.author.avatar.trim().slice(0, 2).toUpperCase()
            : authorName
                .split(" ")
                .map((part: string) => part.charAt(0).toUpperCase())
                .join("")
                .slice(0, 2);

        const newMessage: Message = {
          id: msg._id,
          author: authorName,
          avatar: avatarText || "?",
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          isMine: true,
        };

        setMessages((prev) => [...prev, newMessage]);
      }

      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message", error);
      setApiError("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveRoom = () => {
    if (!roomId) {
      navigate("/joinroom");
      return;
    }

    const token = localStorage.getItem("convo_token");
    if (!token) {
      navigate("/signin");
      return;
    }

    const leave = async () => {
      try {
        const response = await fetch(`${API_BASE}/rooms/${roomId}/leave`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          setApiError(data?.message || "Failed to leave room");
          return;
        }

        navigate("/joinroom");
      } catch (error) {
        console.error("Failed to leave room", error);
        setApiError("Failed to leave room. Please try again.");
      }
    };

    leave();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {showSidebar ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-primary" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {isOwner && isRenaming ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!roomId || !newRoomName.trim()) return;

                        const token = localStorage.getItem("convo_token");
                        if (!token) {
                          navigate("/signin");
                          return;
                        }

                        try {
                          const response = await fetch(
                            `${API_BASE}/rooms/${roomId}`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ name: newRoomName }),
                            }
                          );

                          const data = await response
                            .json()
                            .catch(() => null);

                          if (!response.ok) {
                            setApiError(
                              data?.message || "Failed to rename room"
                            );
                            return;
                          }

                          if (data?.room?.name) {
                            setRoomName(data.room.name);
                            setNewRoomName(data.room.name);
                          }
                          setIsRenaming(false);
                        } catch (error) {
                          console.error("Failed to rename room", error);
                          setApiError(
                            "Failed to rename room. Please try again."
                          );
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="px-2 py-1 rounded border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="text-xs text-primary hover:underline"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRenaming(false);
                          setNewRoomName(roomName);
                        }}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                      {roomName}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setIsRenaming(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Rename
                        </button>
                      )}
                    </h1>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {members.length} members online
                </p>

                {apiError && (
                  <p className="mb-4 text-sm text-destructive">{apiError}</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Chat Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Section */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.isMine ? "flex-row-reverse" : ""
                }`}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                      msg.isMine ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    {msg.avatar}
                  </div>
                </div>
                <div
                  className={`flex-1 max-w-xs ${
                    msg.isMine ? "text-right" : ""
                  }`}
                >
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="font-semibold text-foreground text-sm">
                      {msg.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {msg.timestamp}
                    </p>
                  </div>
                  <div
                    className={`inline-block px-4 py-2 rounded-lg ${
                      msg.isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="break-words">{msg.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-border bg-card p-6">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Type a message..."
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {isSending ? "Sending..." : "Send"}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Members Sidebar */}
        <div
          className={`w-64 border-l border-border bg-card flex flex-col transition-all duration-300 ${
            showSidebar ? "absolute right-0 top-0 bottom-0 z-40 h-full" : ""
          } lg:relative lg:translate-x-0 ${!showSidebar && "hidden lg:flex"}`}
        >
          {/* Header */}
          <div className="border-b border-border p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Members</h2>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {members.length}
            </span>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-lg hover:bg-secondary/50 transition-colors flex items-center gap-3"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                    {member.avatar}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                      member.status === "online"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.status === "online" ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Leave Button */}
          <div className="border-t border-border p-4">
            <button
              onClick={handleLeaveRoom}
              className="w-full px-4 py-2 text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors font-semibold text-sm hidden lg:block"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
