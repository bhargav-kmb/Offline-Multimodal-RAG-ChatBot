import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.utils import embedding_functions
import ollama
import os

# -------------------------------
# 1️⃣ Load Models
# -------------------------------
embedder = SentenceTransformer('all-MiniLM-L6-v2')  # small, fast local model
chroma_client = chromadb.PersistentClient(path="./embeddings")

collection = chroma_client.get_or_create_collection(name="study_notes")

# -------------------------------
# 2️⃣ PDF Text Extraction
# -------------------------------
def extract_text_from_pdf(pdf_path):
    text = ""
    with fitz.open(pdf_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text

# -------------------------------
# 3️⃣ Chunking Function
# -------------------------------
def chunk_text(text, chunk_size=500):
    words = text.split()
    return [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

# -------------------------------
# 4️⃣ Ingest PDFs
# -------------------------------
def ingest_pdfs(data_folder):
    for file in os.listdir(data_folder):
        if file.endswith(".pdf"):
            path = os.path.join(data_folder, file)
            text = extract_text_from_pdf(path)
            chunks = chunk_text(text)
            embeddings = embedder.encode(chunks).tolist()
            collection.add(
                documents=chunks,
                embeddings=embeddings,
                metadatas=[{"source": file}] * len(chunks),
                ids=[f"{file}_{i}" for i in range(len(chunks))]
            )
            print(f"Ingested {file} ({len(chunks)} chunks)")

# -------------------------------
# 5️⃣ Query Pipeline
# -------------------------------
def query_rag(question):
    query_emb = embedder.encode([question]).tolist()[0]
    results = collection.query(query_embeddings=[query_emb], n_results=3)
    context = "\n\n".join(results['documents'][0])
    
    prompt = f"""
You are a subject expert. Use the following study notes to answer the question accurately.

Context:
{context}

Question:
{question}
Answer:
"""
    
    response = ollama.chat(model='phi3', messages=[{'role':'user','content': prompt}])
    print(" Answer:\n", response['message']['content'])

# -------------------------------
# Run Once: Ingest PDFs
# -------------------------------
if not os.path.exists("./embeddings/chroma.sqlite3"):
    ingest_pdfs("./data")

# -------------------------------
# Interactive Q&A
# -------------------------------
while True:
    q = input("\n Ask a question (or 'exit'): ")
    if q.lower() == "exit":
        break
    query_rag(q)
