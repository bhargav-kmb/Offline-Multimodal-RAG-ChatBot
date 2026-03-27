import { useState } from "react";

export default function FileUpload() {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    alert("File uploaded & processed!");
  };

  return (
    <>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="form-control"
      />
      <button className="btn btn-secondary mt-1" onClick={uploadFile}>
        Upload
      </button>
    </>
  );
}