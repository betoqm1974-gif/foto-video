#!/usr/bin/env python3
"""Gera miniaturas com qualidade reduzida para a galeria.

- Entrada:  assets/galeria/
- Saída:    assets/galeria/thumbs/

As miniaturas mantêm o nome do ficheiro original.
O site (a partir deste fix) tenta usar thumbs/ nas miniaturas,
mas a popup continua a abrir a imagem completa (data-full).

Uso:
  python3 tools/make_thumbs.py

Requisitos:
  python3 -m pip install pillow
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "assets" / "galeria"
DST_DIR = SRC_DIR / "thumbs"

MAX_SIZE = (480, 480)  # px (max largura/altura)
JPEG_QUALITY = 60     # 1-95


def is_image(p: Path) -> bool:
    return p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}


def make_thumb(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as im:
        im = im.convert("RGB") if im.mode not in ("RGB", "L") else im
        im.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

        ext = dst.suffix.lower()
        if ext in {".jpg", ".jpeg"}:
            im.save(dst, quality=JPEG_QUALITY, optimize=True, progressive=True)
        else:
            # Para PNG/WebP, reduzir tamanho (sem destruir transparência nos PNG)
            im.save(dst, optimize=True)


def main() -> None:
    if not SRC_DIR.exists():
        raise SystemExit(f"Pasta não encontrada: {SRC_DIR}")

    files = [p for p in SRC_DIR.iterdir() if p.is_file() and is_image(p) and p.parent != DST_DIR]
    if not files:
        print("Não encontrei imagens em assets/galeria/")
        return

    count = 0
    for src in files:
        if src.parent.name == "thumbs":
            continue
        dst = DST_DIR / src.name
        try:
            make_thumb(src, dst)
            count += 1
        except Exception as e:
            print(f"Falha em {src.name}: {e}")

    print(f"Miniaturas geradas: {count}")
    print(f"Saída: {DST_DIR}")


if __name__ == "__main__":
    main()
