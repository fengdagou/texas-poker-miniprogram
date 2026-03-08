#!/bin/bash
# 音效文件自动下载脚本
# 使用方法：./download_sounds.sh

SOUNDS_DIR="$(dirname "$0")/sounds"
cd "$SOUNDS_DIR"

echo "🎵 开始下载音效文件..."

# 1. 从 Freesound 下载（需要替换为真实链接）
# 这些是示例链接，实际使用时需要找到真实的下载链接

# 背景音乐 - Lounge Jazz
echo "下载背景音乐..."
# wget -O bgm.mp3 "https://example.com/casino-bgm.mp3" || echo "⚠️ 背景音乐下载失败"

# 发牌音效
echo "下载发牌音效..."
# wget -O deal.mp3 "https://freesound.org/data/previews/xxx/deal-card.wav" || echo "⚠️ 发牌音效下载失败"

# 下注音效
echo "下载下注音效..."
# wget -O bet.mp3 "https://freesound.org/data/previews/xxx/chip-place.wav" || echo "⚠️ 下注音效下载失败"

# 胜利音效
echo "下载胜利音效..."
# wget -O win.mp3 "https://freesound.org/data/previews/xxx/win-celebration.wav" || echo "⚠️ 胜利音效下载失败"

# 失败音效
echo "下载失败音效..."
# wget -O lose.mp3 "https://freesound.org/data/previews/xxx/lose-sound.wav" || echo "⚠️ 失败音效下载失败"

# 筹码音效
echo "下载筹码音效..."
# wget -O chip.mp3 "https://freesound.org/data/previews/xxx/chip-clink.wav" || echo "⚠️ 筹码音效下载失败"

# 弃牌音效
echo "下载弃牌音效..."
# wget -O fold.mp3 "https://freesound.org/data/previews/xxx/card-fold.wav" || echo "⚠️ 弃牌音效下载失败"

echo ""
echo "✅ 音效下载完成！"
echo ""
echo "📋 文件列表："
ls -lh *.mp3 2>/dev/null || echo "⚠️ 未找到 mp3 文件，请检查下载链接"
