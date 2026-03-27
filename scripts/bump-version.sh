#!/bin/bash
# 版本号更新脚本

set -e

VERSION_FILE="VERSION.md"
CURRENT_VERSION="v1.0"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
    echo "用法: ./scripts/bump-version.sh <版本类型>"
    echo ""
    echo "版本类型:"
    echo "  major  - 主版本号 (如 1.0 -> 2.0)"
    echo "  minor  - 次版本号 (如 1.0 -> 1.1)"
    echo "  patch  - 修订号 (如 1.0 -> 1.0.1)"
    echo ""
    echo "示例:"
    echo "  ./scripts/bump-version.sh minor  # 1.0 -> 1.1"
    exit 1
}

if [ $# -eq 0 ]; then
    usage
fi

BUMP_TYPE=$1

if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}错误: 无效的版本类型 '$BUMP_TYPE'${NC}"
    usage
fi

# 解析当前版本号
read_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        CURRENT_VERSION=$(grep -E "^## 当前版本" -A 1 "$VERSION_FILE" | tail -1 | sed 's/\*\*v//' | sed 's/\*\*//' | tr -d ' ')
    else
        CURRENT_VERSION="v1.0.0"
    fi
}

# 计算新版本号
calculate_new_version() {
    local major minor patch
    IFS='.' read -r major minor patch <<< "${CURRENT_VERSION//v/}"

    major=${major:-1}
    minor=${minor:-0}
    patch=${patch:-0}

    case $BUMP_TYPE in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac

    NEW_VERSION="v${major}.${minor}.${patch}"
}

# 更新 VERSION.md
update_version_file() {
    local new_version=$1
    local today=$(date +%Y-%m-%d)
    local commit_hash=$(git log -1 --oneline | awk '{print $1}')

    # 使用 sed 更新当前版本
    sed -i.bak "s/## 当前版本/## 当前版本 (已弃用)/" "$VERSION_FILE"
    sed -i.bak "s/\*\*v[0-9.]*\*\*/\*\*${new_version}\*\*/" "$VERSION_FILE"

    # 在版本历史表格顶部添加新条目
    local new_entry="| ${new_version} | ${today} | ${commit_hash} | 更新内容 |"
    sed -i.bak "/| 版本 | 日期 | 提交/a ${new_entry}" "$VERSION_FILE"

    rm -f "${VERSION_FILE}.bak"
}

# 主流程
main() {
    read_current_version
    echo -e "${YELLOW}当前版本: ${CURRENT_VERSION}${NC}"

    calculate_new_version
    echo -e "${GREEN}新版本: ${NEW_VERSION}${NC}"

    read -p "确认更新版本号? (y/n): " confirm
    if [ "$confirm" != "y" ]; then
        echo "已取消"
        exit 0
    fi

    # 获取 Git 提交消息
    local commit_msg=$(git log -1 --pretty=%B | head -n 1)

    # 更新 VERSION.md
    update_version_file "$NEW_VERSION"

    # 提交版本更新
    git add "$VERSION_FILE"
    git commit -m "chore: 版本更新 ${CURRENT_VERSION} -> ${NEW_VERSION}"

    echo -e "${GREEN}✅ 版本已更新并提交${NC}"
    echo -e "${YELLOW}下一步: 执行 ./scripts/deploy.sh 或 git push${NC}"
}

main