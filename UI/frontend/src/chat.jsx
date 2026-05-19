
import { useState, useRef, useEffect } from "react";
import { useTheme } from "./App";

const isCasualQuery = (text) => {
  const casual = ["hey", "hello", "hi", "how are you", "what's up", "whats up", "good morning", "good evening", "good night", "thanks", "thank you", "bye", "ok", "okay"];
  return casual.some(word => text.trim().toLowerCase() === word);
};

const isSelfQuery = (text) => {
  const selfKeywords = ["who are you", "what are you", "tell me about yourself", "introduce yourself", "what can you do", "who made you", "what is your name", "your name", "are you a bot", "are you an ai", "what kind of ai", "which model", "what model are you"];
  return selfKeywords.some(keyword => text.trim().toLowerCase().includes(keyword));
};

const SUGGESTION_CARDS = [
  { icon: "📄", label: "Summarize a document", prompt: "Summarize my uploaded document", color: "#4f6ef7" },
  { icon: "🔍", label: "Find key insights", prompt: "What are the key insights from my document?", color: "#7c3aed" },
  { icon: "❓", label: "Ask about content", prompt: "What topics does my document cover?", color: "#0891b2" },
  { icon: "🖼️", label: "Analyze an image", prompt: "Describe this image in detail.", color: "#059669" },
];

export default function Chat({ currentChat, setCurrentChat }) {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [chatImage, setChatImage] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat, loading]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadStatus("Uploading…");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
      const data = await res.json();
      setUploadStatus(data.error ? ` ${data.error}` : ` ${file.name} uploaded!`);
      setTimeout(() => setUploadStatus(""), 4000);
    } catch {
      setUploadStatus(" Upload failed");
      setTimeout(() => setUploadStatus(""), 3000);
    }
    setUploading(false);
  };

  const handleChatImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setChatImage(reader.result);
    reader.readAsDataURL(file);
  };

  const sendMessage = async (overrideInput) => {
    const msg = overrideInput ?? input;
    if ((!msg.trim() && !chatImage) || loading) return;

    const userMessage = { role: "user", text: msg || "Describe this image", image: chatImage || null };
    const updatedChat = [...currentChat, userMessage];
    const botIndex = updatedChat.length;
    updatedChat.push({ role: "bot", text: "", sources: [] });

    setCurrentChat([...updatedChat]);
    setInput("");
    setChatImage(null);
    setLoading(true);

    if (!chatImage && isCasualQuery(msg)) {
      setTimeout(() => {
        setCurrentChat(prev => { const u = [...prev]; u[botIndex] = { role: "bot", text: "Hi there! 👋 How can I help you today?" }; return u; });
        setLoading(false);
      }, 300);
      return;
    }

    if (!chatImage && isSelfQuery(msg)) {
      setTimeout(() => {
        setCurrentChat(prev => {
          const u = [...prev];
          u[botIndex] = { role: "bot", text: "I'm a combined AI system of 3 models:\n\n1. 🧠 Sentence Transformer — embeds your documents into vectors.\n2. ⚡ FAISS Index — fast context retrieval from those vectors.\n3. 🦙 LLaMA 3 (via Ollama) — generates intelligent responses.\n\nTogether I can answer questions about your uploaded documents!" };
          return u;
        });
        setLoading(false);
      }, 300);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: msg || "Describe this image in detail.",
          history: currentChat.map(m => `${m.role}: ${m.text}`).join("\n"),
          image_b64: chatImage || null,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";
      let lastUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.replace("data: ", "").trim();
          if (!jsonStr) continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.token) {
              botText += parsed.token;
              if (Date.now() - lastUpdate > 50) {
                const snap = botText;
                setCurrentChat(prev => { const u = [...prev]; u[botIndex] = { ...u[botIndex], text: snap }; return u; });
                lastUpdate = Date.now();
              }
            }
            if (parsed.done && parsed.sources) {
              const snap = botText;
              setCurrentChat(prev => { const u = [...prev]; u[botIndex] = { ...u[botIndex], text: snap, sources: parsed.sources }; return u; });
            }
          } catch { /* skip */ }
        }
      }
    } catch {
      setCurrentChat(prev => { const u = [...prev]; u[botIndex] = { role: "bot", text: "⚠️ Error connecting to backend. Please try again." }; return u; });
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = currentChat.length === 0;

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; } 50% { opacity: 1; }
        }
        .msg-bubble { animation: msgIn 0.25s ease both; }
        .suggestion-card:hover { transform: translateY(-3px) !important; }
        .suggestion-card:active { transform: scale(0.97) !important; }
        .send-btn:hover:not(:disabled) { transform: scale(1.05); }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .icon-btn:hover { background-color: ${theme.cardHoverBg} !important; border-color: ${theme.borderHover} !important; }
      `}</style>

      <div style={{
        flex: 1,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.chatBg,
        overflow: "hidden",
        minWidth: 0,
      }}>

        {/* Top Header Bar */}
        <div style={{
          padding: "14px 24px",
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.inputBarBg,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            backgroundColor: loading ? theme.accent : "#22c55e",
            boxShadow: loading ? `0 0 8px ${theme.accent}` : "0 0 8px #22c55e",
            animation: loading ? "pulse 1s infinite" : "none",
          }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", color: theme.textPrimary }}>
            {isEmpty ? "New Conversation" : `Chat · ${currentChat.filter(m => m.role === "user").length} messages`}
          </span>

          {/* Upload status pill */}
          {uploadStatus && (
            <div style={{
              marginLeft: "auto",
              padding: "5px 12px",
              borderRadius: "20px",
              backgroundColor: uploadStatus.startsWith("✅") ? "#dcfce7" : uploadStatus.startsWith("❌") ? "#fee2e2" : theme.accentLight,
              color: uploadStatus.startsWith("✅") ? "#166534" : uploadStatus.startsWith("❌") ? "#991b1b" : theme.accent,
              fontSize: "12px",
              fontWeight: 600,
              animation: "fadeIn 0.2s ease",
            }}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Chat Messages Area */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}>

          {/* Empty State with Suggestion Cards */}
          {isEmpty && (
            <div style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ textAlign: "center", marginBottom: "36px", paddingTop: "24px" }}>
                <div style={{
                  width: "64px", height: "64px",
                  borderRadius: "20px",
                  backgroundColor: theme.accentLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px",
                  margin: "0 auto 16px",
                  border: `2px solid ${theme.accent}33`,
                }}>🤖</div>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "22px",
                  color: theme.textPrimary,
                  marginBottom: "8px",
                }}>How can I help you?</h2>
                <p style={{ color: theme.textMuted, fontSize: "14px", lineHeight: 1.6 }}>
                  Upload a document or ask me anything. Try one of these:
                </p>
              </div>

              {/* Suggestion Cards Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                maxWidth: "560px",
                margin: "0 auto",
              }}>
                {SUGGESTION_CARDS.map((card, i) => (
                  <div
                    key={i}
                    className="suggestion-card"
                    onClick={() => sendMessage(card.prompt)}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      padding: "16px",
                      borderRadius: "14px",
                      border: `1.5px solid ${hoveredCard === i ? card.color + "66" : theme.border}`,
                      backgroundColor: hoveredCard === i ? card.color + "11" : theme.cardBg,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      transform: "translateY(0)",
                      animationDelay: `${i * 0.08}s`,
                      animation: "fadeIn 0.4s ease both",
                    }}
                  >
                    <div style={{
                      width: "36px", height: "36px",
                      borderRadius: "10px",
                      backgroundColor: card.color + "22",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "18px",
                      marginBottom: "10px",
                      border: `1px solid ${card.color}33`,
                    }}>
                      {card.icon}
                    </div>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: theme.textPrimary,
                      lineHeight: 1.3,
                    }}>
                      {card.label}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: theme.textMuted,
                      marginTop: "4px",
                      lineHeight: 1.4,
                    }}>
                      Click to try →
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {currentChat.map((msg, index) => (
            <div
              key={index}
              className="msg-bubble"
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animationDelay: `${Math.min(index * 0.03, 0.15)}s`,
              }}
            >
              {/* Bot avatar */}
              {msg.role === "bot" && (
                <div style={{
                  width: "30px", height: "30px",
                  borderRadius: "8px",
                  backgroundColor: theme.accentLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px",
                  flexShrink: 0,
                  marginRight: "8px",
                  alignSelf: "flex-end",
                  border: `1px solid ${theme.border}`,
                }}>🤖</div>
              )}

              <div style={{
                maxWidth: "68%",
                padding: "11px 15px",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                backgroundColor: msg.role === "user" ? theme.userBubbleBg : theme.botBubbleBg,
                color: msg.role === "user" ? theme.userBubbleText : theme.botBubbleText,
                fontSize: "14px",
                lineHeight: 1.6,
                border: msg.role === "bot" ? `1px solid ${theme.botBubbleBorder}` : "none",
                boxShadow: msg.role === "user"
                  ? theme.accentGlow
                  : `0 1px 4px ${theme.dark ? "#00000040" : "#00000010"}`,
              }}>
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="attached"
                    style={{ maxWidth: "180px", maxHeight: "180px", borderRadius: "10px", display: "block", marginBottom: "8px" }}
                  />
                )}

                {msg.text
                  ? msg.text.split("\n").map((line, i) => <div key={i}>{line || <br />}</div>)
                  : (msg.role === "bot" && loading && index === currentChat.length - 1
                    ? <span style={{ display: "flex", gap: "4px", alignItems: "center", padding: "2px 0" }}>
                        {[0, 1, 2].map(i => (
                          <span key={i} style={{
                            display: "inline-block",
                            width: "7px", height: "7px",
                            borderRadius: "50%",
                            backgroundColor: theme.textMuted,
                            animation: `bounce 1.2s infinite ease-in-out`,
                            animationDelay: `${i * 0.2}s`,
                          }} />
                        ))}
                      </span>
                    : null
                  )
                }

                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: "10px",
                    paddingTop: "8px",
                    borderTop: `1px solid ${theme.border}`,
                    fontSize: "11px",
                    color: theme.textMuted,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: "4px", color: theme.accent }}>📎 Sources</div>
                    {msg.sources.map((s, i) => (
                      <div key={i} style={{
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: theme.accentLight,
                        marginBottom: "3px",
                        color: theme.textSecondary,
                      }}>
                        Page {s.page} — {s.source}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User avatar */}
              {msg.role === "user" && (
                <div style={{
                  width: "30px", height: "30px",
                  borderRadius: "8px",
                  backgroundColor: theme.userBubbleBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px",
                  flexShrink: 0,
                  marginLeft: "8px",
                  alignSelf: "flex-end",
                  color: "#fff",
                  fontWeight: 700,
                }}>U</div>
              )}
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        {/* Image Preview Bar */}
        {chatImage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 24px",
            backgroundColor: theme.statusBg,
            borderTop: `1px solid ${theme.border}`,
            animation: "fadeIn 0.2s ease",
            flexShrink: 0,
          }}>
            <img src={chatImage} alt="preview" style={{ maxHeight: "52px", maxWidth: "52px", borderRadius: "8px", border: `2px solid ${theme.accent}66` }} />
            <div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: theme.textPrimary }}>Image attached</div>
              <div style={{ fontSize: "11px", color: theme.textMuted }}>Ready to send</div>
            </div>
            <button
              onClick={() => setChatImage(null)}
              style={{
                marginLeft: "auto",
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1px solid #ef4444",
                backgroundColor: "transparent",
                color: "#ef4444",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >✕ Remove</button>
          </div>
        )}

        {/* Input Bar */}
        <div style={{
          padding: "14px 24px 18px",
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.inputBarBg,
          flexShrink: 0,
        }}>
          <div style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            padding: "6px 8px 6px 12px",
            borderRadius: "16px",
            border: `1.5px solid ${inputFocused ? theme.inputFocus : theme.inputBorder}`,
            backgroundColor: theme.inputBg,
            boxShadow: inputFocused ? `0 0 0 3px ${theme.accent}22` : "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}>

            {/* Doc upload */}
            <label
              className="icon-btn"
              title="Upload document"
              style={{
                width: "34px", height: "34px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: "transparent",
                color: theme.textMuted,
                cursor: uploading ? "not-allowed" : "pointer",
                fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
                opacity: uploading ? 0.5 : 1,
              }}
            >
              {uploading ? "⏳" : "📎"}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
            </label>

            {/* Image attach */}
            <label
              className="icon-btn"
              title="Attach image"
              style={{
                width: "34px", height: "34px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: "transparent",
                color: theme.textMuted,
                cursor: "pointer",
                fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              🖼️
              <input ref={imageInputRef} type="file" accept=".png,.jpg,.jpeg,.bmp,.webp" style={{ display: "none" }} onChange={handleChatImage} disabled={loading} />
            </label>

            {/* Text Input */}
            <input
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask anything…"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                backgroundColor: "transparent",
                color: theme.textPrimary,
                fontSize: "14px",
                fontFamily: "'DM Sans', sans-serif",
                padding: "6px 4px",
              }}
            />

            {/* Send Button */}
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !chatImage)}
              style={{
                padding: "9px 18px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: (loading || (!input.trim() && !chatImage)) ? theme.border : theme.accent,
                color: (loading || (!input.trim() && !chatImage)) ? theme.textMuted : "#ffffff",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                cursor: (loading || (!input.trim() && !chatImage)) ? "not-allowed" : "pointer",
                flexShrink: 0,
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "currentColor", animation: "bounce 1s infinite" }} />
                  Thinking
                </>
              ) : (
                <> Send ➤ </>
              )}
            </button>

          </div>

          <div style={{ marginTop: "8px", textAlign: "center", fontSize: "11px", color: theme.textMuted }}>
            Press Enter to send · Upload PDFs or images for context
          </div>
        </div>
      </div>
    </>
  );
}
