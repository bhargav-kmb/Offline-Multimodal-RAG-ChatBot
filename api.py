from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import shutil
import os
import ollama
import json

from app import process_document, retrieve_context

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL_INDEX = None
GLOBAL_CHUNKS = None


# ------------------ UPLOAD ------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global GLOBAL_INDEX, GLOBAL_CHUNKS

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks, embeddings, index = process_document(file_path)

    GLOBAL_INDEX = index
    GLOBAL_CHUNKS = chunks

    os.remove(file_path)

    return {"message": "File processed successfully", "chunks": len(chunks)}


# ------------------ CHAT ------------------
@app.post("/chat")
async def chat(query: dict):
    global GLOBAL_INDEX, GLOBAL_CHUNKS

    try:
        user_query = query["query"]
        history = query.get("history", "")

        if GLOBAL_INDEX is not None:
            context, retrieved = retrieve_context(
                user_query, GLOBAL_INDEX, GLOBAL_CHUNKS
            )
            prompt = f"""
You are a precise technical assistant.

Rules:
- Answer the question directly
- No greetings or conversational text
- Always use bullet points or numbered format
- Keep answers clear and structured

Length Control:
- If the question is simple → give 5 to 10 short points
- If the question is complex → give structured explanation with headings + bullet points
- Avoid long paragraphs in all cases
- Do not ask follow-up questions
Conversation History:
{history}

Context from document:
{context}

Question:
{user_query}

Answer:
"""
        else:
            retrieved = []
            prompt = f"""
You are a helpful assistant. Answer the question directly and clearly.
Do NOT ask the user for more information.

Conversation History:
{history}

Question:
{user_query}

Answer:
"""

        def stream_response():
            full_answer = ""
            for chunk in ollama.chat(
                model="llama3",
                messages=[{"role": "user", "content": prompt}],
                stream=True 
            ):
                token = chunk["message"]["content"]
                full_answer += token
                yield f"data: {json.dumps({'token': token})}\n\n"

            # Send sources at the end
            yield f"data: {json.dumps({'sources': retrieved, 'done': True})}\n\n"

        return StreamingResponse(stream_response(), media_type="text/event-stream")

    except Exception as e:
        return {"error": str(e)}