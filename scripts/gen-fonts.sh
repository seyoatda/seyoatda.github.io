#!/bin/bash
# 构建前下载并重写 LXGW WenKai 字体 CSS
# 将 CDN 的相对路径 './files/' 重写为绝对 CDN URL，合并 regular + bold 到本地文件

set -e
BASE="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0"
OUT="public/lxgw-wenkai.css"

{
  echo "/* LXGW WenKai 字体 — 自动生成，勿手动编辑 */"
  for weight in regular bold; do
    curl -sf "$BASE/lxgwwenkai-${weight}.css" | sed "s|url('./files/|url('$BASE/files/|g"
  done
} > "$OUT"

echo "Generated $OUT ($(wc -l < "$OUT") lines)"
