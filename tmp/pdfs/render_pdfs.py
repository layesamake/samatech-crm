from pathlib import Path
import sys

sys.path.insert(0, r"C:\tmp\samtech-pdf-tools")
import pymupdf as fitz

source = Path("output/pdf")
target = Path("tmp/pdfs/rendered")
target.mkdir(parents=True, exist_ok=True)

for pdf_path in source.glob("*.pdf"):
    document = fitz.open(pdf_path)
    text = []
    for index, page in enumerate(document):
        text.append(page.get_text())
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        pixmap.save(target / f"{pdf_path.stem}-page-{index + 1}.png")
    (target / f"{pdf_path.stem}.txt").write_text("\n".join(text), encoding="utf-8")
    print(f"{pdf_path.name}: {document.page_count} page(s), {sum(len(value) for value in text)} caractères extraits")
