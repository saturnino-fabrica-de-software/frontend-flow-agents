#!/bin/bash

# 🚀 Frontend Flow - Version Bump Helper
# Facilita o incremento de versão e trigger de publicação automática

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
NPM_VERSION=$(npm view frontend-flow-agents version 2>/dev/null || echo "0.0.0")

echo -e "${BLUE}📦 Frontend Flow Version Manager${NC}"
echo "=================================="
echo -e "Current local: ${GREEN}$CURRENT_VERSION${NC}"
echo -e "Current NPM:   ${GREEN}$NPM_VERSION${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "bin/frontend-flow" ]; then
    echo -e "${RED}❌ Not in Frontend Flow root directory${NC}"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Working directory is not clean${NC}"
    echo "Uncommitted changes:"
    git status --short
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Version bump options
echo "Select version bump type:"
echo "1) patch  - Bug fixes (2.0.0 → 2.0.1)"
echo "2) minor  - New features (2.0.0 → 2.1.0)"
echo "3) major  - Breaking changes (2.0.0 → 3.0.0)"
echo "4) custom - Enter specific version"
echo "5) cancel - Exit without changes"
echo ""

read -p "Choose option (1-5): " -n 1 -r choice
echo ""

case $choice in
    1)
        BUMP_TYPE="patch"
        ;;
    2)
        BUMP_TYPE="minor"
        ;;
    3)
        BUMP_TYPE="major"
        ;;
    4)
        echo -n "Enter new version (current: $CURRENT_VERSION): "
        read NEW_VERSION
        if [ -z "$NEW_VERSION" ]; then
            echo -e "${RED}❌ Version cannot be empty${NC}"
            exit 1
        fi
        BUMP_TYPE="custom"
        ;;
    5)
        echo -e "${YELLOW}🚫 Cancelled by user${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

# Perform version bump
echo ""
echo -e "${BLUE}🔄 Bumping version...${NC}"

if [ "$BUMP_TYPE" = "custom" ]; then
    # Manual version set
    npm version $NEW_VERSION --no-git-tag-version
    NEW_VERSION_ACTUAL=$NEW_VERSION
else
    # Automatic bump
    NEW_VERSION_ACTUAL=$(npm version $BUMP_TYPE --no-git-tag-version)
fi

echo -e "Version updated: ${GREEN}$CURRENT_VERSION${NC} → ${GREEN}$NEW_VERSION_ACTUAL${NC}"

# Generate changelog entry
CHANGELOG_ENTRY=""
case $BUMP_TYPE in
    "patch")
        CHANGELOG_ENTRY="🐛 Bug fixes and improvements"
        ;;
    "minor")
        CHANGELOG_ENTRY="✨ New features and enhancements"
        ;;
    "major")
        CHANGELOG_ENTRY="💥 Breaking changes and major updates"
        ;;
    "custom")
        CHANGELOG_ENTRY="🔄 Version update to $NEW_VERSION_ACTUAL"
        ;;
esac

# Ask for commit message
echo ""
echo "Default commit message:"
echo -e "${GREEN}feat: bump version to $NEW_VERSION_ACTUAL - $CHANGELOG_ENTRY${NC}"
echo ""
read -p "Use default message? (Y/n): " -n 1 -r use_default
echo ""

if [[ $use_default =~ ^[Nn]$ ]]; then
    echo -n "Enter custom commit message: "
    read COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="feat: bump version to $NEW_VERSION_ACTUAL"
    fi
else
    COMMIT_MSG="feat: bump version to $NEW_VERSION_ACTUAL - $CHANGELOG_ENTRY"
fi

# Show what will happen
echo ""
echo -e "${BLUE}📋 Summary of changes:${NC}"
echo -e "  • Version: ${GREEN}$CURRENT_VERSION${NC} → ${GREEN}$NEW_VERSION_ACTUAL${NC}"
echo -e "  • Commit: ${GREEN}$COMMIT_MSG${NC}"
echo -e "  • Push to: ${GREEN}main${NC} (triggers NPM publish)"
echo ""

read -p "Proceed with commit and push? (Y/n): " -n 1 -r proceed
echo ""

if [[ $proceed =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}🚫 Stopped before commit${NC}"
    echo -e "${BLUE}💡 You can manually commit with:${NC}"
    echo "   git add package.json"
    echo "   git commit -m \"$COMMIT_MSG\""
    echo "   git push origin main"
    exit 0
fi

# Commit and push
echo -e "${BLUE}📤 Committing and pushing...${NC}"

# Stage changes
git add package.json package-lock.json 2>/dev/null || git add package.json

# Commit
git commit -m "$COMMIT_MSG"

# Push to main
git push origin main

echo ""
echo -e "${GREEN}✅ Success!${NC}"
echo -e "📦 Version ${GREEN}$NEW_VERSION_ACTUAL${NC} pushed to main"
echo -e "🚀 GitHub Actions will automatically publish to NPM"
echo ""
echo -e "${BLUE}📊 Monitor progress:${NC}"
echo "   • Actions: https://github.com/$(git remote get-url origin | sed 's/.*github\.com[:/]\(.*\)\.git/\1/')/actions"
echo "   • NPM: https://npmjs.com/package/frontend-flow-agents"
echo ""
echo -e "${YELLOW}⏳ Publication usually takes 2-5 minutes${NC}"

# Optional: wait and check
echo ""
read -p "Wait and check NPM publication? (y/N): " -n 1 -r wait_check
echo ""

if [[ $wait_check =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}⏳ Waiting for NPM publication...${NC}"

    # Wait up to 5 minutes
    for i in {1..30}; do
        sleep 10
        PUBLISHED_VERSION=$(npm view frontend-flow-agents version 2>/dev/null || echo "unknown")

        if [ "$PUBLISHED_VERSION" = "$NEW_VERSION_ACTUAL" ]; then
            echo -e "${GREEN}🎉 Published successfully!${NC}"
            echo -e "Install with: ${GREEN}npm install -g frontend-flow-agents@latest${NC}"
            break
        fi

        if [ $i -eq 30 ]; then
            echo -e "${YELLOW}⚠️ Timeout waiting for publication${NC}"
            echo "Check GitHub Actions for status"
        else
            echo -n "."
        fi
    done
fi