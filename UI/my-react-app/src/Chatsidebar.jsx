export default function ChatSidebar({ chats, setCurrentChat, newChat }) {

  return (
    <>
      {/* Button to open sidebar */}
      <button
        className="btn btn-primary m-2"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#chatSidebar"
      >
        Chats
      </button>

      {/* Offcanvas Sidebar */}
      <div className="offcanvas offcanvas-start" id="chatSidebar">

        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Chat History</h5>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
          ></button>
        </div>

        <div className="offcanvas-body">

          <button
            className="btn btn-success w-100 mb-3"
            onClick={newChat}
          >
            + New Chat
          </button>

          {chats.length === 0 && <p>No chats yet</p>}

          {chats.map((chat, index) => (
            <div
              key={index}
              className="card p-2 mb-2"
              style={{ cursor: "pointer" }}
              onClick={() => setCurrentChat(chat)}
              data-bs-dismiss="offcanvas"
            >
              Chat {index + 1}
            </div>
          ))}

        </div>
      </div>
    </>
  );
}