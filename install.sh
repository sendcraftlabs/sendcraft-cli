#!/usr/bin/env bash
# SendCraft CLI — one-line installer for Linux / macOS
# Usage: curl -fsSL https://sendcraft.online/install.sh | bash

set -euo pipefail

REPO="sendcraft/sendcraft-cli"
BINARY="sendcraft"
INSTALL_DIR="/usr/local/bin"

# Detect OS/arch
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  linux)  PLATFORM="linux-x64" ;;
  darwin)
    case "$ARCH" in
      arm64) PLATFORM="macos-arm64" ;;
      *)     PLATFORM="macos-x64"   ;;
    esac
    ;;
  *)
    echo "❌  Unsupported OS: $OS"
    echo "    Install manually: npm install -g sendcraft-cli"
    exit 1
    ;;
esac

# Fetch latest release tag
echo "→  Fetching latest release..."
TAG=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed 's/.*"tag_name": *"\(.*\)".*/\1/')

if [ -z "$TAG" ]; then
  echo "❌  Could not fetch latest release. Install via npm instead:"
  echo "    npm install -g sendcraft-cli"
  exit 1
fi

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/sendcraft-${PLATFORM}"
TMP="$(mktemp)"

echo "→  Downloading sendcraft ${TAG} (${PLATFORM})..."
curl -fsSL "$DOWNLOAD_URL" -o "$TMP"
chmod +x "$TMP"

# Install
if [ -w "$INSTALL_DIR" ]; then
  mv "$TMP" "$INSTALL_DIR/$BINARY"
else
  echo "→  Requesting sudo to install to $INSTALL_DIR..."
  sudo mv "$TMP" "$INSTALL_DIR/$BINARY"
fi

echo ""
echo "✓  sendcraft ${TAG} installed to ${INSTALL_DIR}/${BINARY}"
echo ""
echo "   Run: sendcraft login"
echo ""
