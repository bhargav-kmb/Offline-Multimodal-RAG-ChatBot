
import { useState } from "react";
import { useTheme } from "./App";

export default function ChatSidebar({ chats, activeIndex, loadChat, newChat }) {
  const { theme, dark, setDark } = useTheme();
  const [hovered, setHovered] = useState(null);

  const getChatLabel = (chat, index) => {
    const text = chat[0]?.text || "New Chat";
    return text.length > 26 ? text.slice(0, 26) + "…" : text;
  };

  const getChatMeta = (chat) => {
    const userMsgs = chat.filter(m => m.role === "user").length;
    return `${userMsgs} message${userMsgs !== 1 ? "s" : ""}`;
  };

  const getInitialEmoji = (chat) => {
    const text = (chat[0]?.text || "").toLowerCase();
    if (text.includes("image") || chat[0]?.image) return "🖼️";
    if (text.includes("pdf") || text.includes("document")) return "📄";
    if (text.includes("code") || text.includes("function")) return "💻";
    if (text.includes("summar")) return "📝";
    return "💬";
  };

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .chat-card {
          animation: fadeUp 0.3s ease both;
        }
        .new-chat-btn:hover {
          transform: translateY(-1px);
          box-shadow: ${theme.accentGlow} !important;
        }
        .new-chat-btn:active { transform: scale(0.97); }
      `}</style>

      <div style={{
        width: "270px",
        minWidth: "270px",
        height: "100vh",
        backgroundColor: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
        gap: "8px",
        overflow: "hidden",
      }}>

        {/* Logo / Brand */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
          paddingBottom: "16px",
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <div style={{
            width: "34px", height: "34px",
            borderRadius: "10px",
            backgroundColor: theme.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
            boxShadow: theme.accentGlow,
            flexShrink: 0,
          }}>🤖</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "15px", color: theme.textPrimary, lineHeight: 1.1 }}>
              MultiModel-RAG
            </div>
            <div style={{ fontSize: "11px", color: theme.textMuted, fontWeight: 400 }}>AI Assistant</div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setDark(d => !d)}
            style={{
              marginLeft: "auto",
              width: "32px", height: "32px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBg,
              color: theme.textSecondary,
              cursor: "pointer",
              fontSize: "15px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
            title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>

        {/* New Chat Button */}
        <button
          className="new-chat-btn"
          onClick={newChat}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: "12px",
            border: "none",
            backgroundColor: theme.accent,
            color: "#ffffff",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "transform 0.15s, box-shadow 0.15s, background-color 0.25s",
            boxShadow: "none",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "16px" }}>✦</span>
          New Chat
        </button>

        {/* Section Label */}
        {chats.length > 0 && (
          <div style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: theme.textMuted,
            padding: "8px 4px 2px",
          }}>
            Recent Chats
          </div>
        )}

        {/* Chat History Cards */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {chats.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "40px 16px",
              color: theme.textMuted,
              fontSize: "13px",
              lineHeight: 1.6,
            }}>
              <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.5 }}>🗂️</div>
              No saved chats yet.<br />Start a conversation!
            </div>
          )}

          {chats.map((chat, index) => {
            const isActive = activeIndex === index;
            const isHov = hovered === index;

            return (
              <div
                key={index}
                className="chat-card"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => loadChat(chat, index)}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1.5px solid ${isActive ? theme.activeBorder : isHov ? theme.borderHover : theme.border}`,
                  backgroundColor: isActive ? theme.activeCard : isHov ? theme.cardHoverBg : theme.cardBg,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  transform: isHov ? "translateX(3px)" : "none",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? `0 0 0 3px ${theme.accent}22` : "none",
                }}>
                  {/* Icon */}
                  <div style={{
                    width: "32px", height: "32px",
                    borderRadius: "8px",
                    backgroundColor: isActive ? theme.accent : theme.accentLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px",
                    flexShrink: 0,
                    transition: "background-color 0.2s",
                  }}>
                    {getInitialEmoji(chat)}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isActive ? theme.accent : theme.textPrimary,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.3,
                    }}>
                      {getChatLabel(chat, index)}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: theme.textMuted,
                      marginTop: "2px",
                    }}>
                      {getChatMeta(chat)}
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      width: "6px", height: "6px",
                      borderRadius: "50%",
                      backgroundColor: theme.accent,
                      flexShrink: 0,
                      boxShadow: theme.accentGlow,
                    }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: "12px",
          borderTop: `1px solid ${theme.border}`,
          fontSize: "11px",
          color: theme.textMuted,
          textAlign: "center",
          lineHeight: 1.5,
        }}>
          Powered by LLaMA 3 + FAISS
        </div>
      </div>
    </>
  );
}
