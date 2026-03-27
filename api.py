from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# import your functions
from app import process_document, generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GLOBAL_INDEX = None
GLOBAL_CHUNKS = None


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global GLOBAL_INDEX, GLOBAL_CHUNKS

    file_path = f"temp_{file.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Process document
    chunks, embeddings, index = process_document(file_path)

    GLOBAL_INDEX = index
    GLOBAL_CHUNKS = chunks

    return {"message": "File processed successfully", "chunks": len(chunks)}



@app.post("/chat")
async def chat(query: dict):
    global GLOBAL_INDEX, GLOBAL_CHUNKS

    if GLOBAL_INDEX is None:
        return {"error": "Upload document first"}

    user_query = query["query"]

    answer, sources = generate_answer(user_query, GLOBAL_INDEX, GLOBAL_CHUNKS)

    return {
        "answer": answer,
        "sources": sources
    }