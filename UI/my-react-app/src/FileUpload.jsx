export default function FileUpload() {

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:8000/upload", {
      method: "POST",
      body: formData,
    });

    alert("File uploaded successfully!");
  };

  return (
    <input type="file" onChange={handleUpload} />
  );
}