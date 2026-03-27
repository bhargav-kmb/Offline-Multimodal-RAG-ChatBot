import os
import fitz
import pytesseract
from docx import Document
from PIL import Image
from sentence_transformers import SentenceTransformer
import numpy as np
import pickle
import faiss
import ollama 

pytesseract.pytesseract.tesseract_cmd = r"C:\\Program Files\\Tesseract-OCR\\tesseract.exe"


EMBED_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


# ------------------ PARSE ------------------
def parse_document(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    chunks = []

    if ext == ".pdf":
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                chunks.append({"content": text, "page": i+1, "source": file_path})

    elif ext in [".docx", ".doc"]:
        doc = Document(file_path)
        for i, para in enumerate(doc.paragraphs):
            if para.text.strip():
                chunks.append({"content": para.text, "page": i+1, "source": file_path})

    elif ext in [".png", ".jpg", ".jpeg"]:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        chunks.append({"content": text, "page": 1, "source": file_path})

    else:
        raise ValueError("Unsupported file type")

    return chunks


# ------------------ CHUNK ------------------
def chunk_text(text, chunk_size=500, overlap=100):
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap

    return chunks


# ------------------ PROCESS + STORE ------------------
def process_document(file_path):
    base_name = os.path.splitext(os.path.basename(file_path))[0]

    os.makedirs("storage", exist_ok=True)

    embed_path = f"storage/{base_name}_embeddings.npy"
    chunk_path = f"storage/{base_name}_chunks.pkl"
    faiss_path = f"storage/{base_name}.index"

    # Load existing
    if os.path.exists(embed_path) and os.path.exists(chunk_path) and os.path.exists(faiss_path):
        print("Loading existing FAISS index")

        embeddings = np.load(embed_path)
        index = faiss.read_index(faiss_path)

        with open(chunk_path, "rb") as f:
            final_chunks = pickle.load(f)

        return final_chunks, embeddings, index

    print("Processing document")

    documents = parse_document(file_path)
    final_chunks = []

    for doc in documents:
        small_chunks = chunk_text(doc["content"])
        for chunk in small_chunks:
            final_chunks.append({
                "content": chunk,
                "page": doc["page"],
                "source": doc["source"]
            })

    texts = [c["content"] for c in final_chunks]
    embeddings = EMBED_MODEL.encode(texts, batch_size=16)

    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(np.array(embeddings))


    np.save(embed_path, embeddings)
    faiss.write_index(index, faiss_path)

    with open(chunk_path, "wb") as f:
        pickle.dump(final_chunks, f)

    print("Stored in FAISS")

    return final_chunks, embeddings, index


# ------------------ RAG ------------------
def generate_answer(query, index, chunks, top_k=5):

    query_embedding = EMBED_MODEL.encode([query])
    D, I = index.search(np.array(query_embedding), top_k)

    retrieved = [chunks[i] for i in I[0]]

 
    context = "\n\n".join([c["content"] for c in retrieved])
    context = context[:3000]


    prompt = f"""
You are a helpful assistant.

Answer ONLY using the context.
No local documents are available. Answer based on general knowledge

Context:
{context}

Question:
answer only in 10-15 lines.
{query}

Answer:
"""

    response = ollama.chat(
        model="llama3",
        messages=[{"role": "user", "content": prompt}]
    )

    answer = response["message"]["content"]

    return answer, retrieved


# ------------------ RUN ------------------
if __name__ == "__main__":
    file_path = "unit2entp.pdf"

    chunks, embeddings, index = process_document(file_path)

    print("Total chunks:", len(chunks))

    # while True:
    #     query = input("\nAsk something (type exit): ")

    #     if query.lower() == "exit":
    #         break

    #     answer, sources = generate_answer(query, index, chunks)

    #     print("\n Answer:\n", answer)

    #     print("\n Sources:")
    #     for s in sources:
    #         print(f"Page {s['page']}")
    #         print(s["content"][:150])
    #         print("-" * 40)
# query = "what is entrepreneurship"
# answer, results = generate_answer(query, index, chunks)
# print("\n Answer:\n", answer)

# print("\n Sources:\n")
# for r in results:
#     print({
#         "content": r["content"],
#         "page": r["page"],
#         "source": r["source"]
#     })
#     print("-" * 50)