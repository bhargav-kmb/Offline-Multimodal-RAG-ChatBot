
// import { useState, useRef } from "react";

// const isCasualQuery = (text) => {
//   const casual = ["hey", "hello", "hi", "how are you", "what's up", "whats up", "good morning", "good evening", "good night", "thanks", "thank you", "bye", "ok", "okay"];
//   return casual.some(word => text.trim().toLowerCase() === word);
// };

// const isSelfQuery = (text) => {
//   const selfKeywords = ["who are you", "what are you", "tell me about yourself", "introduce yourself", "what can you do", "who made you", "what is your name", "your name", "are you a bot", "are you an ai", "what kind of ai", "which model", "what model are you"];
//   return selfKeywords.some(keyword => text.trim().toLowerCase().includes(keyword));
// };

// export default function Chat({ currentChat, setCurrentChat }) {

//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [uploadStatus, setUploadStatus] = useState("");
//   const [chatImage, setChatImage] = useState(null); 
//   const fileInputRef = useRef(null);
//   const imageInputRef = useRef(null);

//   const handleUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setUploading(true);
//     setUploadStatus("Uploading...");

//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       const res = await fetch("http://localhost:8000/upload", {
//         method: "POST",
//         body: formData,
//       });

//       const data = await res.json();

//       if (data.error) {
//         setUploadStatus(` Error: ${data.error}`);
//       } else {
//         setUploadStatus(` ${file.name} uploaded successfully!`);
//       }
//     } catch (err) {
//       setUploadStatus(" Upload failed");
//     }

//     setUploading(false);
//   };

  
//   const handleChatImage = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = () => {
//       setChatImage(reader.result); // base64
//     };
//     reader.readAsDataURL(file);
//   };

//   const sendMessage = async () => {
//     if (!input.trim() && !chatImage || loading) return;

//     const userMessage = {
//       role: "user",
//       text: input || "Describe this image",
//       image: chatImage || null
//     };

//     const updatedChat = [...currentChat, userMessage];
//     const botMessageIndex = updatedChat.length;
//     updatedChat.push({ role: "bot", text: "", sources: [] });

//     setCurrentChat([...updatedChat]);
//     setInput("");
//     setChatImage(null);
//     setLoading(true);

//     // Handle casual greetings locally
//     if (!chatImage && isCasualQuery(input)) {
//       setTimeout(() => {
//         setCurrentChat(prev => {
//           const updated = [...prev];
//           updated[botMessageIndex] = { role: "bot", text: "Hi! How can I help you?" };
//           return updated;
//         });
//         setLoading(false);
//       }, 300);
//       return;
//     }

//     // Handle self-introduction locally
//     if (!chatImage && isSelfQuery(input)) {
//       setTimeout(() => {
//         setCurrentChat(prev => {
//           const updated = [...prev];
//           updated[botMessageIndex] = {
//             role: "bot",
//             text: "I am not a single model  I am a combined system of 3 models working together:\n\n1.  Sentence Transformer  understands and embeds your documents into vectors.\n2.  FAISS Index — performs fast and accurate context retrieval from those vectors.\n3. 🧠 LLaMA 3 (via Ollama) — generates intelligent responses based on the retrieved context.\n\nTogether, these models allow me to answer questions based on your uploaded documents!"
//           };
//           return updated;
//         });
//         setLoading(false);
//       }, 300);
//       return;
//     }

//     try {
//       const response = await fetch("http://localhost:8000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           query: input || "Describe this image in detail.",
//           history: currentChat.map(m => `${m.role}: ${m.text}`).join("\n"),
//           image_b64: chatImage || null  
//         }),
//       });

//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();
//       let botText = "";

//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;

//         const chunk = decoder.decode(value);
//         const lines = chunk.split("\n");

//         for (const line of lines) {
//           if (line.startsWith("data: ")) {
//             const jsonStr = line.replace("data: ", "").trim();
//             if (!jsonStr) continue;

//             try {
//               const parsed = JSON.parse(jsonStr);

//               if (parsed.token) {
//                 botText += parsed.token;

//                 await new Promise(resolve => setTimeout(resolve, 15));

//                 setCurrentChat(prev => {
//                   const updated = [...prev];
//                   updated[botMessageIndex] = {
//                     ...updated[botMessageIndex],
//                     text: botText
//                   };
//                   return updated;
//                 });
//               }

//               if (parsed.done && parsed.sources) {
//                 setCurrentChat(prev => {
//                   const updated = [...prev];
//                   updated[botMessageIndex] = {
//                     ...updated[botMessageIndex],
//                     sources: parsed.sources
//                   };
//                   return updated;
//                 });
//               }

//             } catch (e) {
//               // skip malformed chunks
//             }
//           }
//         }
//       }

//     } catch (error) {
//       setCurrentChat(prev => {
//         const updated = [...prev];
//         updated[botMessageIndex] = {
//           role: "bot",
//           text: "Error connecting to backend"
//         };
//         return updated;
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container-fluid d-flex flex-column vh-100">

//       {uploadStatus && (
//         <div className="px-3 py-1 bg-light border-bottom small text-muted">
//           {uploadStatus}
//         </div>
//       )}

//       <div className="flex-grow-1 overflow-auto p-3">
//         {currentChat.length === 0 && (
//           <div className="text-center text-muted mt-5">
//             <p>No document uploaded. You can still chat or upload a file below.</p>
//             <p>How can I help you today?</p>
//           </div>
//         )}

//         {currentChat.map((msg, index) => (
//           <div key={index}
//             className={`mb-2 p-2 rounded ${
//               msg.role === "user"
//                 ? "bg-primary text-white text-end"
//                 : "bg-light text-dark"
//             }`}>

            
//             {msg.image && (
//               <div className="mb-1">
//                 <img
//                   src={msg.image}
//                   alt="uploaded"
//                   style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
//                 />
//               </div>
//             )}

//             {msg.text
//               ? msg.text.split("\n").map((line, i) => (
//                   <div key={i}>{line || <br />}</div>
//                 ))
//               : (msg.role === "bot" && loading && index === currentChat.length - 1
//                   ? <span className="text-muted fst-italic">
//                       <span className="typing-dot">●</span>
//                       <span className="typing-dot">●</span>
//                       <span className="typing-dot">●</span>
//                     </span>
//                   : null
//                 )
//             }

//             {msg.sources && msg.sources.length > 0 && (
//               <div className="mt-2 small text-muted">
//                 <b>Sources:</b>
//                 {msg.sources.map((s, i) => (
//                   <div key={i}>Page {s.page} - {s.source}</div>
//                 ))}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>


//       {chatImage && (
//         <div className="px-3 py-2 bg-light border-top d-flex align-items-center gap-2">
//           <img
//             src={chatImage}
//             alt="preview"
//             style={{ maxHeight: "60px", maxWidth: "60px", borderRadius: "6px" }}
//           />
//           <span className="small text-muted">Image attached</span>
//           <button
//             className="btn btn-sm btn-outline-danger ms-auto"
//             onClick={() => setChatImage(null)}
//           >
//             ✕ Remove
//           </button>
//         </div>
//       )}

//       <div className="border-top p-3 bg-white">
//         <div className="row g-2 align-items-center">

//           {/* 📎 Document upload */}
//           <div className="col-auto">
//             <label className="btn btn-outline-secondary mb-0" title="Upload document">
//               {uploading ? "⏳" : "📎"}
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept=".pdf,.docx,.doc"
//                 style={{ display: "none" }}
//                 onChange={handleUpload}
//                 disabled={uploading}
//               />
//             </label>
//           </div>

          
//           <div className="col-auto">
//             <label className="btn btn-outline-secondary mb-0" title="Attach image to chat">
//               🖼️
//               <input
//                 ref={imageInputRef}
//                 type="file"
//                 accept=".png,.jpg,.jpeg,.bmp,.webp"
//                 style={{ display: "none" }}
//                 onChange={handleChatImage}
//                 disabled={loading}
//               />
//             </label>
//           </div>

//           <div className="col">
//             <input
//               className="form-control"
//               value={input}
//               disabled={loading}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Enter your query..."
//               onKeyDown={(e) => {
//                 if (e.key === "Enter") sendMessage();
//               }}
//             />
//           </div>

//           <div className="col-auto">
//             <button
//               className="btn btn-primary"
//               onClick={sendMessage}
//               disabled={loading}
//             >
//               {loading ? "Loading..." : "Send"}
//             </button>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// }





import { useState, useRef } from "react";

const isCasualQuery = (text) => {
  const casual = ["hey", "hello", "hi", "how are you", "what's up", "whats up", "good morning", "good evening", "good night", "thanks", "thank you", "bye", "ok", "okay"];
  return casual.some(word => text.trim().toLowerCase() === word);
};

const isSelfQuery = (text) => {
  const selfKeywords = ["who are you", "what are you", "tell me about yourself", "introduce yourself", "what can you do", "who made you", "what is your name", "your name", "are you a bot", "are you an ai", "what kind of ai", "which model", "what model are you"];
  return selfKeywords.some(keyword => text.trim().toLowerCase().includes(keyword));
};

export default function Chat({ currentChat, setCurrentChat }) {

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [chatImage, setChatImage] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

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
        setUploadStatus(` Error: ${data.error}`);
      } else {
        setUploadStatus(` ${file.name} uploaded successfully!`);
      }
    } catch (err) {
      setUploadStatus(" Upload failed");
    }

    setUploading(false);
  };

  const handleChatImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setChatImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if ((!input.trim() && !chatImage) || loading) return;

    const userMessage = {
      role: "user",
      text: input || "Describe this image",
      image: chatImage || null
    };

    const updatedChat = [...currentChat, userMessage];
    const botMessageIndex = updatedChat.length;
    updatedChat.push({ role: "bot", text: "", sources: [] });

    setCurrentChat([...updatedChat]);
    setInput("");
    setChatImage(null);
    setLoading(true);

    // Handle casual greetings locally
    if (!chatImage && isCasualQuery(input)) {
      setTimeout(() => {
        setCurrentChat(prev => {
          const updated = [...prev];
          updated[botMessageIndex] = { role: "bot", text: "Hi! How can I help you?" };
          return updated;
        });
        setLoading(false);
      }, 300);
      return;
    }

    // Handle self-introduction locally
    if (!chatImage && isSelfQuery(input)) {
      setTimeout(() => {
        setCurrentChat(prev => {
          const updated = [...prev];
          updated[botMessageIndex] = {
            role: "bot",
            text: "I am not a single model  I am a combined system of 3 models working together:\n\n1.  Sentence Transformer  understands and embeds your documents into vectors.\n2.  FAISS Index  performs fast and accurate context retrieval from those vectors.\n3.  LLaMA 3 (via Ollama)  generates intelligent responses based on the retrieved context.\n\nTogether, these models allow me to answer questions based on your uploaded documents!"
          };
          return updated;
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
          query: input || "Describe this image in detail.",
          history: currentChat.map(m => `${m.role}: ${m.text}`).join("\n"),
          image_b64: chatImage || null
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";
      let lastUpdate = Date.now();

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

                const now = Date.now();

          
                if (now - lastUpdate > 50) {
                  const snapshot = botText;
                  setCurrentChat(prev => {
                    const updated = [...prev];
                    updated[botMessageIndex] = {
                      ...updated[botMessageIndex],
                      text: snapshot
                    };
                    return updated;
                  });
                  lastUpdate = now;
                }
              }

              if (parsed.done && parsed.sources) {
             
                const snapshot = botText;
                setCurrentChat(prev => {
                  const updated = [...prev];
                  updated[botMessageIndex] = {
                    ...updated[botMessageIndex],
                    text: snapshot,
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
            <p>How can I help you today?</p>
          </div>
        )}

        {currentChat.map((msg, index) => (
          <div key={index}
            className={`mb-2 p-2 rounded ${
              msg.role === "user"
                ? "bg-primary text-white text-end"
                : "bg-light text-dark"
            }`}>

            {msg.image && (
              <div className="mb-1">
                <img
                  src={msg.image}
                  alt="uploaded"
                  style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
                />
              </div>
            )}

            {msg.text
              ? msg.text.split("\n").map((line, i) => (
                  <div key={i}>{line || <br />}</div>
                ))
              : (msg.role === "bot" && loading && index === currentChat.length - 1
                  ? <span className="text-muted fst-italic">
                      <span className="typing-dot">●</span>
                      <span className="typing-dot">●</span>
                      <span className="typing-dot">●</span>
                    </span>
                  : null
                )
            }

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

      {chatImage && (
        <div className="px-3 py-2 bg-light border-top d-flex align-items-center gap-2">
          <img
            src={chatImage}
            alt="preview"
            style={{ maxHeight: "60px", maxWidth: "60px", borderRadius: "6px" }}
          />
          <span className="small text-muted">Image attached</span>
          <button
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={() => setChatImage(null)}
          >
            ✕ Remove
          </button>
        </div>
      )}

      <div className="border-top p-3 bg-white">
        <div className="row g-2 align-items-center">

          <div className="col-auto">
            <label className="btn btn-outline-secondary mb-0" title="Upload document">
              {uploading ? "⏳" : "📎"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="col-auto">
            <label className="btn btn-outline-secondary mb-0" title="Attach image to chat">
              🖼️
              <input
                ref={imageInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.bmp,.webp"
                style={{ display: "none" }}
                onChange={handleChatImage}
                disabled={loading}
              />
            </label>
          </div>

          <div className="col">
            <input
              className="form-control"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your query..."
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
              {loading ? "Loading..." : "Send"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}