#!/usr/bin/env bash
#
# img2particle3d 跨客户端安装脚本
# ------------------------------------------------------------
# 用法：
#   bash scripts/install.sh                 # 自动装到本机所有"已存在"的客户端 skills 目录
#   bash scripts/install.sh --dest ~/.codex/skills   # 只装到指定目录（不存在则创建）
#   bash scripts/install.sh --list          # 只列出检测到的候选目录，不安装
#
# 原理：把整个 img2particle3d/ 技能文件夹复制到目标 skills 目录下。
# 任何遵循 Agent Skills / SKILL.md 约定的客户端都能识别该文件夹。
set -euo pipefail

# 技能根目录 = 本脚本所在 scripts/ 的上一级
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILL_NAME="$(basename "$SKILL_ROOT")"

# 候选 skills 目录（存在才装；不同客户端约定不同，拿不准用 --dest）
CANDIDATES=(
  "$HOME/.codex/skills"        # Codex
  "$HOME/.claude/skills"       # Claude Code（个人级）
  "$HOME/.qoder/skills"        # Qoder
  "$HOME/.qwenworkcn/skills"   # QwenWork / 千问办公
  "$HOME/.cursor/skills"       # Cursor
  "$HOME/.windsurf/skills"     # Windsurf
  "$HOME/.openclaw/skills"     # OpenClaw
  "$HOME/.agents/skills"       # 通用 Agent Skills 约定
)

MODE="auto"; DEST=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dest) DEST="${2:-}"; shift 2 ;;
    --list) MODE="list"; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "未知参数：$1（用 --help 查看用法）" >&2; exit 2 ;;
  esac
done

install_into() {
  local target_dir="$1"
  mkdir -p "$target_dir"
  local dest="$target_dir/$SKILL_NAME"
  # 覆盖式安装：先移到 .bak 再复制，避免残留旧文件
  if [ -e "$dest" ]; then mv "$dest" "$dest.bak.$(date +%s)"; fi
  cp -R "$SKILL_ROOT" "$dest"
  echo "  ✓ 已安装 → $dest"
}

if [ -n "$DEST" ]; then
  echo "安装 $SKILL_NAME 到指定目录：$DEST"
  install_into "$DEST"
  exit 0
fi

found=0
echo "检测本机已存在的客户端 skills 目录："
for d in "${CANDIDATES[@]}"; do
  if [ -d "$d" ]; then
    echo "  • 存在 $d"
    found=1
    [ "$MODE" = "list" ] || install_into "$d"
  fi
done

if [ "$MODE" = "list" ]; then
  [ "$found" = 0 ] && echo "  （未检测到任何候选目录）"
  exit 0
fi

if [ "$found" = 0 ]; then
  echo "未检测到任何已知客户端 skills 目录。"
  echo "请用 --dest 指定目标，例如：bash scripts/install.sh --dest ~/.codex/skills"
  exit 1
fi
echo "完成。"
