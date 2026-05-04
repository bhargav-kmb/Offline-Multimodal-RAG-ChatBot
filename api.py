
# from fastapi import FastAPI, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# import shutil
# import os
# import ollama
# import json

# from app import process_document, retrieve_context

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# GLOBAL_INDEX = None
# GLOBAL_CHUNKS = None


# # ------------------ UPLOAD ------------------
# @app.post("/upload")
# async def upload_file(file: UploadFile = File(...)):
#     global GLOBAL_INDEX, GLOBAL_CHUNKS

#     file_path = f"temp_{file.filename}"

#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     chunks, embeddings, index = process_document(file_path)

#     GLOBAL_INDEX = index
#     GLOBAL_CHUNKS = chunks

#     os.remove(file_path)

#     return {"message": "File processed successfully", "chunks": len(chunks)}


# # ------------------ CHAT ------------------
# @app.post("/chat")
# async def chat(query: dict):
#     global GLOBAL_INDEX, GLOBAL_CHUNKS

#     try:
#         user_query = query["query"]
#         history = query.get("history", "")

#         if GLOBAL_INDEX is not None:
#             context, retrieved = retrieve_context(
#                 user_query, GLOBAL_INDEX, GLOBAL_CHUNKS
#             )
#             prompt = f"""
# You are a precise technical assistant.

# Rules:
# - No phrases like "Here is a summary"
# - No phrases like "Based on the document"
# - No phrases like "Here's an explanation"
# - No extra sentences
# - Strictly return only the answer
# - Answer the question directly
# - No greetings or conversational text
# - Always use bullet points or numbered format
# - Keep answers clear and structured
# - Do NOT offer additional help or suggestions
# - Do NOT say things like "Let me know if you need more"
# - Do NOT add any closing remarks or follow-up offers

# Formatting Rules:
# - If the question asks for a summary → give a summary in the exact number of lines requested
# - If the question is simple → give 5 to 10 short bullet points
# - If the question is complex → use headings and bullet points
# - Avoid long paragraphs in all cases
# - Do not ask follow-up questions

# Conversation History:
# {history}

# Context from document:
# {context}

# Question:
# {user_query}

# Answer:
# """
#         else:
#             retrieved = []
#             prompt = f"""
# You are a precise assistant.

# Rules:
# - Answer ONLY what is asked. Nothing more.
# - No phrases like "Here is a summary" or "Here's an explanation"
# - No greetings or conversational text
# - Always use bullet points or numbered format
# - Keep answers clear and structured
# - Do NOT offer additional help or suggestions
# - Do NOT say things like "Let me know if you need more"
# - Do NOT add any closing remarks or follow-up offers
# - Do not ask follow-up questions

# Conversation History:
# {history}

# Question:
# {user_query}

# Answer:
# """

#         def stream_response():
#             for chunk in ollama.chat(
#                 model="llama3",
#                 messages=[{"role": "user", "content": prompt}],
#                 stream=True
#             ):
#                 token = chunk.message.content 
#                 yield f"data: {json.dumps({'token': token})}\n\n"

#             yield f"data: {json.dumps({'sources': retrieved, 'done': True})}\n\n"

#         return StreamingResponse(stream_response(), media_type="text/event-stream")

#     except Exception as e:
#         return {"error": str(e)}

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import shutil
import os
import ollama
import json
import base64

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

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".doc"}



@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global GLOBAL_INDEX, GLOBAL_CHUNKS

    file_path = f"temp_{file.filename}"
    ext = os.path.splitext(file.filename)[1].lower()

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    chunks, embeddings, index = process_document(file_path)

    GLOBAL_INDEX = index
    GLOBAL_CHUNKS = chunks

    if ext in IMAGE_EXTENSIONS:
        os.makedirs("storage/images", exist_ok=True)
        saved_image_path = f"storage/images/{file.filename}"
        shutil.copy(file_path, saved_image_path)

    os.remove(file_path)

    return {
        "message": "File processed successfully",
        "chunks": len(chunks),
        "type": "image" if ext in IMAGE_EXTENSIONS else "document"
    }


@app.post("/chat")
async def chat(query: dict):
    global GLOBAL_INDEX, GLOBAL_CHUNKS

    try:
        user_query = query["query"]
        history = query.get("history", "")
        image_b64 = query.get("image_b64", None)  

        if image_b64:
            def stream_image_response():
                image_bytes = base64.b64decode(image_b64.split(",")[1] if "," in image_b64 else image_b64)

                response = ollama.chat(
                    model="llava", 
                    messages=[{
                        "role": "user",
                        "content": user_query or "Describe this image in detail.",
                        "images": [image_bytes]
                    }],
                    stream=True
                )

                for chunk in response:
                    token = chunk.message.content
                    yield f"data: {json.dumps({'token': token})}\n\n"

                yield f"data: {json.dumps({'sources': [], 'done': True})}\n\n"

            return StreamingResponse(stream_image_response(), media_type="text/event-stream")

      
        if GLOBAL_INDEX is not None:
            context, retrieved = retrieve_context(
                user_query, GLOBAL_INDEX, GLOBAL_CHUNKS
            )
            prompt = f"""
You are a precise technical assistant.

Rules:
- Answer ONLY what is asked. Nothing more.
- No phrases like "Here is a summary" or "Based on the document"
- No phrases like "Here's an explanation" or "Here is the answer"
- No greetings or conversational text
- Do NOT say a feature is unavailable or that you cannot do something
- Do NOT offer additional help or suggestions
- Do NOT add closing remarks or follow-up offers
- Do not ask follow-up questions

Formatting Rules:
- If the question asks for a summary → give a summary in the exact number of lines requested
- If the question is simple → give 5 to 10 short bullet points
- If the question is complex → use headings and bullet points
- Avoid long paragraphs

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
You are a precise assistant.

Rules:
- Answer ONLY what is asked. Nothing more.
- No phrases like "Here is a summary" or "Here's an explanation"
- No greetings or conversational text
- Do NOT say a feature is unavailable or that you cannot do something
- Do NOT offer additional help or suggestions
- Do NOT add closing remarks or follow-up offers
- Do not ask follow-up questions

Formatting Rules:
- If the question asks for a summary → give a summary in the exact number of lines requested
- If the question is simple → give 5 to 10 short bullet points
- If the question is complex → use headings and bullet points
- Avoid long paragraphs

Conversation History:
{history}

Question:
{user_query}

Answer:
"""

        def stream_response():
            for chunk in ollama.chat(
                model="llama3",
                messages=[{"role": "user", "content": prompt}],
                stream=True
            ):
                token = chunk.message.content
                yield f"data: {json.dumps({'token': token})}\n\n"

            yield f"data: {json.dumps({'sources': retrieved, 'done': True})}\n\n"

        return StreamingResponse(stream_response(), media_type="text/event-stream")

    except Exception as e:
        return {"error": str(e)}