from email import policy
from email.parser import BytesParser
import fitz


def eml_to_clean_text(file_bytes: bytes) -> str:
    msg = BytesParser(policy=policy.default).parsebytes(file_bytes)

    text_body = ""

    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                text_body += part.get_content()
    else:
        if msg.get_content_type() == "text/plain":
            text_body = msg.get_content()


    return text_body

def extract_pdf_text(file_bytes: bytes) -> str:
    text_parts = []

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                text_parts.append(text)

    return "\n\n".join(text_parts).strip()