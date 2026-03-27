# index_embeddings.py
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from pathlib import Path

MODEL_NAME = "all-MiniLM-L6-v2"  # light, good offline choice

def load_chunks(path):
    with open(path,"r",encoding="utf-8") as f:
        return [json.loads(line) for line in f]

def main(chunks_path, index_out_dir):
    chunks = load_chunks(chunks_path)
    texts = [c["text"] for c in chunks]
    model = SentenceTransformer(MODEL_NAME)
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True, batch_size=32)
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)          # inner-product (use after normalizing)
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    Path(index_out_dir).mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(Path(index_out_dir)/"faiss.index"))
    # save metadata
    with open(Path(index_out_dir)/"chunks_meta.jsonl","w",encoding="utf-8") as f:
        for c in chunks:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    print("Index built and saved.")

if __name__ == "__main__":
    import sys
    chunks_path = sys.argv[1]  # e.g. ./data/chunks.jsonl
    index_out_dir = sys.argv[2]
    main(chunks_path, index_out_dir)
