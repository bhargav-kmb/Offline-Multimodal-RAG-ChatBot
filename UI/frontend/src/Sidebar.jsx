export default function Sidebar({ chats, setCurrentChat, newChat }) {
  return (
    <div className="sidebar">

      <button onClick={newChat}>+ New Chat</button>

      <h3>History</h3>

      {chats.map((chat, index) => (
        <div
          key={index}
          className="historyItem"
          onClick={() => setCurrentChat(chat)}
        >
          Chat {index + 1}
        </div>
      ))}

    </div>
  );
}