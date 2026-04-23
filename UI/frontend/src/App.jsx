import { useState } from "react";
import Chat from "./chat";
import ChatSidebar from "./Chatsidebar";

function App() {

  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);

  const newChat = () => {
    if (currentChat.length > 0) {
      setChats(prev => [...prev, currentChat]);
    }
    setCurrentChat([]);
  };

  return (
    <div className="d-flex">

      <ChatSidebar
        chats={chats}
        setCurrentChat={(chat) => setCurrentChat([...chat])}
        newChat={newChat}
      />

      <Chat
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
      />

    </div>
  );
}

export default App;