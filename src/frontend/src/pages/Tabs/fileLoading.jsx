import { useState } from "react";

export default function FileLoad({ onResult }){
    const [emlFile, setEmlFile] = useState(null);
    const [pdfFiles, setPdfFiles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleEmlChange = (e) => { //eml files loading
        setError(null);
        const file = e.target.files[0];
        if (!file.name.toLowerCase().endsWith(".eml")){
            setError("The file needs to be of .eml extension");
            setEmlFile(null);
            return;
        }
        setEmlFile(file);
    };

    const handlePdfChange = (e) => { //pdfs files loading
        setError(null);
        const files = Array.from(e.target.files);
        const invalidFile = files.find(
            (file) => !file.name.toLowerCase().endsWith(".pdf")
        );
        if (invalidFile){
            setError("Detachments can only be PDF");
            setPdfFiles([]);
            return;
        }
        setPdfFiles(files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!emlFile) {
            setError("First add valid .eml file")
            return;
        }
        setError(null);
        setLoading(true);
        const formData = new FormData();
        formData.append("content",emlFile);

        pdfFiles.forEach((file) => {
            formData.append("attachments",file);
        });
        try {
            const response = await fetch("http://localhost:8000/full_ports/",{
                method: "POST",
                body: formData,
            });
            
            const payload = await response.json();
            console.log(payload);
            if (!response.ok){
                console.error("problem janka", payload);
                return;
            }
            
            console.log("MODEL RESULT:", payload);
            onResult(payload)
        } catch (err){
            console.error("Błąd fetch albo parsowania JSON:", err);
            setError("Failure server connection");
        } finally {
            setLoading(false);
        }
    };


    return (
    <div className="page file-load-page">
        <section className="upload-panel">
        <h1>Panel wczytywania danych</h1>

        <p>
            Dodaj plik wiadomości EML oraz opcjonalne załączniki PDF. Wysyłanie
            jest możliwe dopiero po dodaniu pliku EML.
        </p>

        {error && <p className="error-msg">{error}</p>}

        <form className="upload-form" onSubmit={handleSubmit}>
            <div className="upload-box">
            <label>
                Plik EML
                <input
                type="file"
                accept=".eml"
                onChange={handleEmlChange}
                />
            </label>

            {emlFile && (
                <p className="selected-file">
                Wybrano: {emlFile.name}
                </p>
            )}
            </div>

            <div className="upload-box">
            <label>
                Pliki PDF
                <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handlePdfChange}
                />
            </label>

            {pdfFiles.length > 0 && (
                <div className="selected-files">
                <p>Wybrane pliki PDF:</p>

                <ul>
                    {pdfFiles.map((file) => (
                    <li key={file.name}>{file.name}</li>
                    ))}
                </ul>
                </div>
            )}
            </div>

            <button
            type="submit"
            className="btn-primary"
            disabled={!emlFile || loading}
            >
            {loading ? "Loading..." : "Send files"}
            </button>
        </form>
        </section>
    </div>
    );
}


