"""Копирует готовый статический сайт в каталог публикации, без сборщиков."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent.parent
target = root / "dist"
target.mkdir(exist_ok=True)
for filename in ("index.html", "tasks.html", "profile.html"):
    shutil.copy2(root / filename, target / filename)
for folder in ("css", "js", "img"):
    shutil.copytree(root / folder, target / folder, dirs_exist_ok=True)
