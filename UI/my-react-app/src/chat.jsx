import { useState } from "react";
import FileUpload from "./FileUpload";

export default function Chat({ currentChat, setCurrentChat }) {

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
  if (!input.trim()) return;

  const userMessage = {
    role: "user",
    text: input,
  };

  const updatedChat = [...currentChat, userMessage];
  setCurrentChat(updatedChat);
  setInput("");
  setLoading(true);

  try {
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: input }),
    });

    const data = await response.json();

    const botMessage = {
      role: "bot",
      text: data.answer || "No response",
    };

    setCurrentChat([...updatedChat, botMessage]);

  } catch (error) {
    setCurrentChat([
      ...updatedChat,
      { role: "bot", text: "Error connecting to backend" },
    ]);
  }

  setLoading(false);
};
  return (
    <div className="container-fluid d-flex flex-column vh-100">

      {/* Chat Messages */}
      <div className="flex-grow-1 overflow-auto p-3">

        {currentChat.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              msg.role === "user"
                ? "bg-primary text-white text-end"
                : "bg-light text-dark"
            }`}
          >
            {msg.text}
          </div>
        ))}

      </div>

      {/* Bottom Input Section */}
      <div className="border-top p-3 bg-white">

        <div className="row g-2 align-items-center">

          {/* File Upload */}
          <div className="col-auto">
            <FileUpload />
          </div>

          {/* Text Input */}
          <div className="col">
            <input
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
          </div>

          {/* Send Button / Loading */}
          <div className="col-auto">
            {loading ? (
              <button className="btn btn-primary" disabled>
                <span className="spinner-border spinner-border-sm"></span>{" "}
                Loading..
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={sendMessage}
              >
                Send
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}