#!/bin/bash

echo "🧪 Frontend Flow v2.0 Enhanced - Teste Local"
echo "============================================"

# Create test directory
TEST_DIR="/tmp/frontend-flow-test"
echo "📁 Criando diretório de teste: $TEST_DIR"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Install local package
PACKAGE_PATH="$(dirname "$(realpath "$0")")/frontend-flow-agents-2.0.0.tgz"
echo "📦 Instalando Frontend Flow v2.0.0 Enhanced..."
echo "📍 Package path: $PACKAGE_PATH"
npm install -g "$PACKAGE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Instalação global realizada com sucesso!"
else
    echo "❌ Erro na instalação global"
    exit 1
fi

# Verify installation
echo "🔍 Verificando instalação..."
which frontend-flow
which ff

# Test version
echo "📊 Verificando versão..."
frontend-flow --version

# Create test React project
echo "⚛️ Criando projeto React de teste..."
npx create-react-app test-project --template typescript
cd test-project

# Install TailwindCSS for full stack support
echo "🎨 Instalando TailwindCSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Initialize Frontend Flow
echo "🚀 Inicializando Frontend Flow..."
frontend-flow init

# Test Enhanced features detection
echo "🔍 Testando detecção de recursos Enhanced..."
if [ -f ".frontend-flow/configs/enhanced-mode.json" ]; then
    echo "✅ Modo Enhanced detectado"
    cat .frontend-flow/configs/enhanced-mode.json | head -10
else
    echo "⚠️ Modo Enhanced não detectado"
fi

# Test dry-run with Enhanced
echo "🧪 Testando pipeline Enhanced com dry-run..."
timeout 60 frontend-flow "criar botão primary responsivo" --dry-run --enhanced || echo "⚠️ Timeout ou erro no teste"

# Test standard mode
echo "🧪 Testando pipeline Standard com dry-run..."
timeout 60 frontend-flow "criar botão secondary" --dry-run --standard || echo "⚠️ Timeout ou erro no teste"

# Test dashboard command
echo "🖥️ Testando comando dashboard..."
frontend-flow dashboard --help || echo "⚠️ Comando dashboard não implementado ainda"

# Verify files structure
echo "📁 Verificando estrutura de arquivos..."
echo "Agentes Enhanced:"
ls -la "$(npm root -g)/frontend-flow-agents/agents/claude-enhanced/" 2>/dev/null || echo "❌ Diretório não encontrado"

echo "Monitor:"
ls -la "$(npm root -g)/frontend-flow-agents/agents/monitoring/" 2>/dev/null || echo "❌ Diretório não encontrado"

echo "Configs:"
ls -la "$(npm root -g)/frontend-flow-agents/configs/enhanced-mode.json" 2>/dev/null || echo "❌ Arquivo não encontrado"

# Cleanup
echo "🧹 Limpeza..."
cd /
rm -rf "$TEST_DIR"
npm uninstall -g frontend-flow-agents

echo "🎉 Teste local concluído!"
echo ""
echo "📋 Para instalação manual:"
echo "npm install -g $(dirname "$0")/frontend-flow-agents-2.0.0.tgz"
echo ""
echo "📋 Para teste em projeto existente:"
echo "cd seu-projeto-react"
echo "frontend-flow init"
echo "frontend-flow \"sua demanda\" --enhanced"