import { useState } from "react";
import Chat from "./chat";
import ChatSidebar from "./Chatsidebar";

function App() {

  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);

  const newChat = () => {

    if (currentChat.length > 0) {
      setChats([...chats, currentChat]);
    }

    setCurrentChat([]);
  };

  return (
    <div>

      <ChatSidebar
        chats={chats}
        setCurrentChat={setCurrentChat}
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