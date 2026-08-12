#!/bin/bash
# 构建前下载 LXGW WenKai 字体文件到本地 public/fonts/
# 重写 CSS 路径为本地绝对路径，不依赖外部 CDN

set -e
BASE="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0"
FONT_DIR="public/fonts"
CSS_FILE="public/lxgw-wenkai.css"

mkdir -p "$FONT_DIR"

# 下载 regular + bold woff2 文件
for weight in regular bold; do
  for f in $(curl -s "$BASE/files/" | grep -o "lxgwwenkai-${weight}-subset-[^\"]*\.woff2" | sort -V | uniq); do
    if [ ! -f "$FONT_DIR/$f" ]; then
      curl -sf "$BASE/files/$f" -o "$FONT_DIR/$f"
    fi
  done
done

# 生成 CSS，将相对路径重写为本地绝对路径
{
  echo "/* LXGW WenKai 字体 — 自托管，勿手动编辑 */"
  for weight in regular bold; do
    curl -sf "$BASE/lxgwwenkai-${weight}.css" | sed "s|url('./files/|url('/fonts/|g"
  done
} > "$CSS_FILE"

echo "Generated $CSS_FILE ($(wc -l < "$CSS_FILE") lines)"
echo "Font files: $(ls "$FONT_DIR"/*.woff2 | wc -l) files, $(du -sh "$FONT_DIR" | cut -f1) total"
