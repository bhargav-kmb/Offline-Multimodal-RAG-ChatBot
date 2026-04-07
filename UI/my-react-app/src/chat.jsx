import { useState } from "react";

export default function Chat({ currentChat, setCurrentChat }) {

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setUploadStatus(`Error: ${data.error}`);
      } else {
        setUploadStatus(` ${file.name} uploaded successfully!`);
      }
    } catch (err) {
      setUploadStatus(" Upload failed");
    }

    setUploading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", text: input };
    const updatedChat = [...currentChat, userMessage];

    // Add empty bot message placeholder
    const botMessageIndex = updatedChat.length;
    updatedChat.push({ role: "bot", text: "", sources: [] });

    setCurrentChat([...updatedChat]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          history: currentChat.map(m => `${m.role}: ${m.text}`).join("\n")
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.token) {
                botText += parsed.token;

                // Update the bot message in place as tokens arrive
                setCurrentChat(prev => {
                  const updated = [...prev];
                  updated[botMessageIndex] = {
                    ...updated[botMessageIndex],
                    text: botText
                  };
                  return updated;
                });
              }

              if (parsed.done && parsed.sources) {
                setCurrentChat(prev => {
                  const updated = [...prev];
                  updated[botMessageIndex] = {
                    ...updated[botMessageIndex],
                    sources: parsed.sources
                  };
                  return updated;
                });
              }

            } catch (e) {
              // skip malformed chunks
            }
          }
        }
      }

    } catch (error) {
      setCurrentChat(prev => {
        const updated = [...prev];
        updated[botMessageIndex] = {
          role: "bot",
          text: "Error connecting to backend"
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex flex-column vh-100">

      {uploadStatus && (
        <div className="px-3 py-1 bg-light border-bottom small text-muted">
          {uploadStatus}
        </div>
      )}

      <div className="flex-grow-1 overflow-auto p-3">
        {currentChat.length === 0 && (
          <div className="text-center text-muted mt-5">
            <p>No document uploaded. You can still chat or upload a file below.</p>
          </div>
        )}

        {currentChat.map((msg, index) => (
          <div key={index}
            className={`mb-2 p-2 rounded ${
              msg.role === "user"
                ? "bg-primary text-white text-end"
                : "bg-light text-dark"
            }`}>

            {msg.text || (msg.role === "bot" && loading && index === currentChat.length - 1
              ? <span className="text-muted fst-italic">............</span>
              : null
            )}

            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 small text-muted">
                <b>Sources:</b>
                {msg.sources.map((s, i) => (
                  <div key={i}>Page {s.page} - {s.source}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-top p-3 bg-white">
        <div className="row g-2 align-items-center">

          <div className="col-auto">
            <label className="btn btn-outline-secondary mb-0" title="Upload document">
              {uploading ? "⏳" : "📎"}
              <input
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="col">
            <input
              className="form-control"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter you query ..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
          </div>

          <div className="col-auto">
            <button
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={loading}
            >
              {loading ? "Loading" : "Send"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}