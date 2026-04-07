export default function ChatSidebar({ chats, setCurrentChat, newChat }) {

  return (
    <div style={{ width: "250px", borderRight: "1px solid #ddd", padding: "10px" }}>

      <button className="btn btn-primary w-100 mb-3" onClick={newChat}>
        + New Chat
      </button>

      {chats.map((chat, index) => (
        <div
          key={index}
          className="p-2 border rounded mb-2"
          style={{ cursor: "pointer" }}
          onClick={() => setCurrentChat(chat)}
        >
          {chat[0]?.text?.slice(0, 20) || "New Chat"}
        </div>
      ))}

    </div>
  );
}