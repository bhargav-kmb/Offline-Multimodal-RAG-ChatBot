# query_rag.py
import faiss
import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
import subprocess
import shlex

INDEX_DIR = "C:\\flies\\VScode_flies\\multimodal_rag\\embeddings\\index"
MODEL_NAME = "all-MiniLM-L6-v2"

def load_index(index_dir):
    idx = faiss.read_index(str(Path(index_dir)/"faiss.index"))
    meta = [json.loads(line) for line in open(Path(index_dir)/"chunks_meta.jsonl", "r", encoding="utf-8")]
    return idx, meta

def embed_query(query, model):
    vec = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(vec)
    return vec

def retrieve_topk(index, qvec, k=5):
    D, I = index.search(qvec, k)
    return I[0], D[0]

def build_prompt(question, retrieved_chunks):
    header = (
        "You are an assistant that answers questions only from the provided sources.\n"
        "If the answer is not contained in the sources, say 'I don't know based on the provided documents.'\n\n"
    )
    context = ""
    for i, (meta, text) in enumerate(retrieved_chunks, 1):
        context += f"[source {i}] file: {meta['source_file']}, page: {meta['page']}, chunk: {meta['chunk_index']}\n"
        context += text + "\n\n"
    prompt = (
        header
        + "Context:\n" + context
        + f"Question: {question}\n\nAnswer (be concise, cite sources inline like [source 1]):"
    )
    return prompt

def call_ollama_cli(prompt, model_name="phi3", max_tokens=512, temperature=0.0):
    """
    Simple wrapper that calls the local Ollama CLI. Adjust if your ollama CLI uses different flags.
    If you prefer any other method (HTTP or other), replace this implementation.
    """
    # NOTE: check your local ollama CLI syntax; here we call `ollama run` as an example.
    cmd = f"ollama run {shlex.quote(model_name)} --prompt {shlex.quote(prompt)}"
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print("Ollama CLI error:", res.stderr)
        raise RuntimeError("Ollama call failed")
    return res.stdout

if __name__ == "__main__":
    import sys
    question = sys.argv[1] if len(sys.argv)>1 else input("Question: ")
    index, meta = load_index(INDEX_DIR)
    sbert = SentenceTransformer(MODEL_NAME)
    qvec = embed_query(question, sbert)
    ids, scores = retrieve_topk(index, qvec, k=6)  # tune k
    retrieved = [(meta[i], meta[i]['text']) for i in ids]
    prompt = build_prompt(question, retrieved)
    print("=== PROMPT (truncated) ===")
    print(prompt[:2000])  # preview
    print("=== CALLING LOCAL LLM ===\n")
    out = call_ollama_cli(prompt, model_name="phi3")
    print("=== MODEL OUTPUT ===")
    print(out)
    print("\n====================\n")