#!/bin/bash

# Script para gerar ícones PWA usando ImageMagick
# Requer: sudo apt-get install imagemagick (Linux) ou brew install imagemagick (macOS)

# Criar um ícone base como PNG
convert -size 512x512 xc:"#2563eb" \
  \( -size 384x320 xc:white -draw "fill white roundrectangle 0,0 384,320 24,24" \) -gravity center -composite \
  \( -size 80x80 xc:"#2563eb" -draw "fill #3b82f6 roundrectangle 8,8 72,72 4,4" \) -geometry +0-60 -gravity west -composite \
  \( -size 80x80 xc:"#2563eb" -draw "fill #3b82f6 roundrectangle 8,8 72,72 4,4" \) -geometry +0-60 -gravity center -composite \
  \( -size 80x80 xc:"#2563eb" -draw "fill #3b82f6 roundrectangle 8,8 72,72 4,4" \) -geometry +0-60 -gravity east -composite \
  icon-512x512.png

# Gerar diferentes tamanhos
for size in 16 32 72 96 128 144 152 192 384 512; do
  convert icon-512x512.png -resize ${size}x${size} icon-${size}x${size}.png
done

echo "Ícones PWA gerados com sucesso!"
echo "Mova os arquivos para a pasta public/icons/"
