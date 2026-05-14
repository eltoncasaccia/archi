import io

from pypdf import PdfReader
from docx import Document

MAX_CHARS = 40_000


def extract_text(file_bytes: bytes, content_type: str, filename: str) -> str:
    if "pdf" in content_type or filename.lower().endswith(".pdf"):
        return _from_pdf(file_bytes)
    if "wordprocessingml" in content_type or filename.lower().endswith(".docx"):
        return _from_docx(file_bytes)
    raise ValueError("Tipo de arquivo não suportado.")


def _from_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n".join(pages).strip()
    return text[:MAX_CHARS]


def _from_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    text = "\n".join(p.text for p in doc.paragraphs).strip()
    return text[:MAX_CHARS]
