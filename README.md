
# Offline Multimodal RAG: Unified Semantic Retrieval for Documents, Images, and Audio

A full-stack AI chatbot that lets you upload documents,pdfs,images  and chat with them using a combination of powerful models working together.

---


---

##  Features

- 📎 Upload PDF, DOCX, or DOC files and chat with them
- 🖼️ Attach images in chat  analyzed using LLaVA vision model
- 🔍 Retrieval-Augmented Generation (RAG) for accurate document-based answers
- ⚡ Streaming responses with smooth typing effect
- 💬 Chat without a document — works as a general assistant too
- 🧠 Understands who it is — responds to "who are you" with a proper explanation
- 📚 Shows source page references for every answer
- 🗂️ Caches embeddings so re-uploading the same document is instant

---

## 🗂️ Project Structure

```
project/
│
├── backend/
│   ├── app.py          # Document parsing, chunking, embedding, retrieval
│   ├── api.py          # FastAPI server with /upload and /chat endpoints
│   └── storage/        # Cached embeddings, FAISS indexes, chunks
│
├── frontend/
│   └── src/
│       ├── App.jsx         
│       ├── Chat.jsx        
│       └── ChatSidebar.jsx
|       └── FileUpload.jsx
|       └── Sidebar.jsx
|       └── App.css
│
└── README.md
```

---

## ⚙️ Requirements

### System
- Python 3.9+
- Node.js 18+
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki) installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`
- [Ollama](https://ollama.com) installed and running

### Ollama Models
Pull the required models before running:

```bash
ollama pull llama3
ollama pull llava
```

---

##  Installation

### Backend

```bash
# Create and activate virtual environment (recommended)
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install fastapi uvicorn pymupdf pytesseract python-docx pillow \
            sentence-transformers numpy faiss-cpu ollama
```

### Frontend

```bash
cd frontend
npm install
```

---

##  Running the Project

### Start the backend

```bash
cd backend
uvicorn api:app --reload
```

Backend runs at: `http://localhost:8000`

### Start the frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

##  Usage

1. Open the app in your browser
2. Click **📎** to upload a PDF or DOCX document
3. Wait for the upload confirmation
4. Type your question and press **Send** or hit **Enter**
5. Click **🖼️** to attach an image and ask questions about it
6. Sources with page numbers are shown below each answer

---

##  API Endpoints

### `POST /upload`
Upload a document for processing.

- **Body:** `multipart/form-data` with a `file` field
- **Returns:** `{ message, chunks, type }`

### `POST /chat`
Send a message and get a streamed response.

- **Body:**
```json
{
  "query": "Your question here",
  "history": "Previous conversation as string",
  "image_b64": "base64 encoded image (optional)"
}
```
- **Returns:** Server-Sent Events stream of tokens, ending with sources

---

## 🛠️ Troubleshooting

### HuggingFace network error on startup
If you see `Failed to resolve 'huggingface.co'`, the model is already cached. Add this to the top of `app.py`:

```python
import os
os.environ["TRANSFORMERS_OFFLINE"] = "1"
os.environ["HF_DATASETS_OFFLINE"] = "1"
```

### Ollama not responding
Make sure Ollama is running before starting the backend:

```bash
ollama serve
```

### Tesseract not found
Make sure Tesseract is installed and the path in `app.py` matches your installation:

```python
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
```

### Slow responses
- Make sure Ollama is using your GPU (check Task Manager)
- Try a lighter model like `phi3` or `gemma:2b` in `api.py`
- Reduce `top_k` in `retrieve_context()` from 3 to 2

---

##  Notes

- Embeddings are cached in the `storage/` folder — re-uploading the same file is instant
- Images uploaded via 📎 are OCR'd and indexed like documents
- Images attached via 🖼️ in chat are sent directly to LLaVA for visual analysis
- The chatbot works without any document uploaded as a general-purpose assistant

---
