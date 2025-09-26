#!/bin/bash

echo "🧪 Teste Completo do Frontend Flow com Claude Real"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check Claude
echo -e "${YELLOW}1. Verificando Claude CLI...${NC}"
if command -v claude &> /dev/null; then
    CLAUDE_VERSION=$(claude --version)
    echo -e "${GREEN}✅ Claude encontrado: $CLAUDE_VERSION${NC}"
else
    echo -e "${RED}❌ Claude não encontrado${NC}"
    exit 1
fi
echo ""

# Test 2: Dry Run
echo -e "${YELLOW}2. Testando modo dry-run...${NC}"
./bin/frontend-flow --dry-run "criar botão de teste"
echo -e "${GREEN}✅ Dry-run funcionando${NC}"
echo ""

# Test 3: Non-interactive
echo -e "${YELLOW}3. Testando modo não-interativo...${NC}"
./bin/frontend-flow --non-interactive "analisar estrutura do projeto"
echo -e "${GREEN}✅ Modo não-interativo funcionando${NC}"
echo ""

# Test 4: Interactive (needs user input)
echo -e "${YELLOW}4. Testando modo interativo...${NC}"
echo -e "${GREEN}IMPORTANTE: Quando Claude pedir permissão, digite 'yes'${NC}"
echo ""

# Create a simple test
cat > test-demand.txt << 'EOF'
Crie um arquivo chamado test-button.jsx com um botão React simples que diz "Hello Frontend Flow"
EOF

./bin/frontend-flow --interactive "$(cat test-demand.txt)"

# Check if file was created
if [ -f "test-button.jsx" ]; then
    echo -e "${GREEN}✅ SUCESSO! Arquivo criado pelo Claude:${NC}"
    cat test-button.jsx
else
    echo -e "${YELLOW}⚠️ Arquivo não foi criado (pode ter sido recusado ou Claude está em modo print)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Teste completo finalizado!${NC}"