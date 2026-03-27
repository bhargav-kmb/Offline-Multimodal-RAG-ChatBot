# ingest_pdfs.py
import fitz  # PyMuPDF
import json
import os
from pathlib import Path
from math import ceil

def extract_text_from_pdf(path):
    doc = fitz.open(path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        pages.append({"page": i+1, "text": text})
    return pages

def chunk_text(text, max_tokens=500, overlap_tokens=100, approx_chars_per_token=4):
    # simple char-based approx for tokens: tokens ~ chars/4
    max_chars = max_tokens * approx_chars_per_token
    overlap_chars = overlap_tokens * approx_chars_per_token
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = start + max_chars
        if end >= n:
            end = n
        else:
            # try to cut at sentence boundary
            last_period = text.rfind('.', start, end)
            if last_period > start + 20:  # avoid tiny chunks
                end = last_period + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = max(start + max_chars - overlap_chars, end)
    return chunks

def ingest_folder(pdf_folder, out_dir):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    all_chunks = []
    for pdf in Path(pdf_folder).glob("*.pdf"):
        pages = extract_text_from_pdf(pdf)
        for p in pages:
            page_text = p["text"]
            chunks = chunk_text(page_text)
            for i, c in enumerate(chunks):
                meta = {
                    "source_file": pdf.name,
                    "page": p["page"],
                    "chunk_index": i,
                    "text": c
                }
                all_chunks.append(meta)
    # save as jsonlines
    with open(out_dir/"chunks.jsonl","w",encoding="utf-8") as f:
        for ch in all_chunks:
            f.write(json.dumps(ch, ensure_ascii=False) + "\n")
    print(f"Saved {len(all_chunks)} chunks to {out_dir/'chunks.jsonl'}")

if __name__ == "__main__":
    import sys
    pdf_folder = sys.argv[1]  # folder with PDFs
    out_dir = sys.argv[2]     # output folder
    ingest_folder(pdf_folder, out_dir)
