import fitz  # PyMuPDF
import os, json

def extract_text_from_pdfs(pdf_folder, output_file):
    data = []
    for file in os.listdir(pdf_folder):
        if file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_folder, file)
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text("text")
            data.append({"file_name": file, "content": text})
    json.dump(data, open(output_file, "w", encoding="utf-8"), indent=2)

extract_text_from_pdfs("pdfs", "subjects_raw.json")
