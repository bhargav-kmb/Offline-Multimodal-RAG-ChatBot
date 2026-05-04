
import { useState, createContext, useContext } from "react";
import Chat from "./Chat";
import ChatSidebar from "./ChatSidebar";

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const getTheme = (dark) => ({
  dark,
  // Backgrounds
  pageBg:        dark ? "#0d1117" : "#f0f4ff",
  sidebarBg:     dark ? "#111827" : "#ffffff",
  chatBg:        dark ? "#0d1117" : "#f7f9ff",
  inputBarBg:    dark ? "#111827" : "#ffffff",
  cardBg:        dark ? "#1a2235" : "#ffffff",
  cardHoverBg:   dark ? "#1e293b" : "#eef2ff",
  statusBg:      dark ? "#161d2e" : "#eef2ff",

  // Text
  textPrimary:   dark ? "#e2e8f0" : "#1e293b",
  textSecondary: dark ? "#94a3b8" : "#475569",
  textMuted:     dark ? "#64748b" : "#94a3b8",

  // Borders
  border:        dark ? "#1e293b" : "#e2e8f0",
  borderHover:   dark ? "#334155" : "#c7d2fe",

  // Accent
  accent:        dark ? "#FF7A00" : "#4f6ef7",
  accentLight:   dark ? "#FF7A0022" : "#eef2ff",
  accentHover:   dark ? "#e06e00" : "#3d5cf5",
  accentText:    "#ffffff",
  accentGlow:    dark ? "0 0 20px #FF7A0055" : "0 4px 20px #4f6ef755",

  // Bubbles
  userBubbleBg:  dark ? "#FF7A00" : "#4f6ef7",
  userBubbleText:"#ffffff",
  botBubbleBg:   dark ? "#1a2235" : "#ffffff",
  botBubbleText: dark ? "#e2e8f0" : "#1e293b",
  botBubbleBorder: dark ? "#1e293b" : "#e2e8f0",

  // Input
  inputBg:       dark ? "#0d1117" : "#f8faff",
  inputBorder:   dark ? "#1e293b" : "#dde3f8",
  inputFocus:    dark ? "#FF7A00" : "#4f6ef7",

  // Sidebar active
  activeCard:    dark ? "#FF7A0022" : "#eef2ff",
  activeBorder:  dark ? "#FF7A00" : "#4f6ef7",

  // New chat btn
  newChatBg:     dark ? "#FF7A00" : "#4f6ef7",
  newChatText:   "#ffffff",
});

function App() {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [dark, setDark] = useState(false);
  const theme = getTheme(dark);

  const newChat = () => {
    if (currentChat.length > 0) {
      setChats(prev => [...prev, currentChat]);
    }
    setCurrentChat([]);
    setActiveIndex(null);
  };

  const loadChat = (chat, index) => {
    setCurrentChat([...chat]);
    setActiveIndex(index);
  };

  return (
    <ThemeContext.Provider value={{ theme, dark, setDark }}>
      <style>{`
       

font-family: 'Segoe UI', 'Helvetica Neue', sans-serif; 
font-family: Georgia, 'Times New Roman', serif;
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; overflow: hidden; }
        body { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 4px; }
        * { transition: background-color 0.25s ease, border-color 0.25s ease, color 0.2s ease; }
      `}</style>

      <div style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: theme.pageBg,
        overflow: "hidden",
      }}>
        <ChatSidebar
          chats={chats}
          activeIndex={activeIndex}
          loadChat={loadChat}
          newChat={newChat}
        />
        <Chat
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
        />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
