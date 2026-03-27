from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import json

model_id = "mistralai/Mistral-7B-v0.1"
tokenizer = AutoTokenizer.from_pretrained(model_id)
generator = pipeline("text-generation", model=model_id, tokenizer=tokenizer, max_new_tokens=200)

with open("subjects_raw.json", "r") as f:
    docs = json.load(f)

qa_data = []

for doc in docs:
    text = doc["content"][:4000]  # process chunk by chunk
    prompt = f"Create 5 question-answer pairs based on the following study notes:\n\n{text}"
    result = generator(prompt)[0]["generated_text"]
    qa_data.append({"source": doc["file_name"], "qa_text": result})

json.dump(qa_data, open("qa_synthetic.json", "w"), indent=2)
