# 🧪 Guia de Teste - Frontend Flow v2.0 Enhanced

## 📦 Instalação Pós-Publicação

```bash
# Instalar versão mais recente
npm install -g frontend-flow-agents@latest

# Verificar versão
frontend-flow --version
# Deve mostrar: 2.0.0

# Verificar recursos Enhanced
ff doctor
```

## 🧪 Testes Essenciais

### 1. **Teste Modo Enhanced (Automático)**

```bash
# Em um projeto React novo ou existente
npx create-react-app test-enhanced --template typescript
cd test-enhanced

# Instalar TailwindCSS para stack completa
npm install -D tailwindcss
npx tailwindcss init

# Inicializar Frontend Flow
frontend-flow init

# Teste com demanda simples - Modo Enhanced deve ativar automaticamente
frontend-flow "criar botão primary responsivo" --dry-run

# Deve mostrar:
# ✨ Frontend Flow Enhanced v2.0 - Modo Avançado ativo
# 🧠 Mesa Técnica + Classificador NLP + Monitor Tempo Real
```

### 2. **Teste Mesa Técnica**

```bash
# Teste com demanda complexa que gera mesa técnica
frontend-flow "criar dashboard analytics com gráficos e autenticação" --dry-run

# Deve mostrar:
# 🧠 Fase 1: Mesa Técnica Obrigatória...
# 👥 Convocando mesa técnica...
# [8 especialistas analisam a demanda]
```

### 3. **Teste Monitor Tempo Real**

```bash
# Iniciar com monitor (se não estiver em dry-run)
frontend-flow "criar componente de loading" --enhanced

# Em outro terminal ou navegador:
# Abrir: http://localhost:8081
# Deve mostrar dashboard com:
# - Pipeline progress em tempo real
# - Métricas: componentes criados, build time
# - Tech stack detection automático
```

### 4. **Teste Fallback Mode**

```bash
# Forçar modo padrão
frontend-flow "criar botão secondary" --standard

# Deve mostrar:
# 🚀 Frontend Flow Standard - Iniciando...
# (sem recursos Enhanced)
```

### 5. **Teste Classificação NLP Avançada**

```bash
# Teste diferentes tipos de demanda para ver classificação
frontend-flow "otimizar performance do componente Header" --dry-run
# Deve classificar como: performance_optimization

frontend-flow "implementar tema dark mode responsivo" --dry-run
# Deve classificar como: styling_design

frontend-flow "criar sistema de carrinho com Redux" --dry-run
# Deve classificar como: feature_complete
```

## 🔍 Verificações Importantes

### **Estrutura de Arquivos Enhanced**

```bash
# Verificar se agentes Enhanced foram instalados
ls -la $(npm root -g)/frontend-flow-agents/agents/claude-enhanced/
# Deve mostrar:
# - agent_technical_roundtable.md
# - agent_nlp_classifier.md

ls -la $(npm root -g)/frontend-flow-agents/agents/monitoring/
# Deve mostrar:
# - agent_realtime_monitor.md
# - dashboard.html

ls -la $(npm root -g)/frontend-flow-agents/lib/claude-enhanced/
# Deve mostrar:
# - enhanced-orchestrator.js
# - realtime-monitor-server.js
```

### **Configuração Enhanced**

```bash
# Verificar config Enhanced
cat $(npm root -g)/frontend-flow-agents/configs/enhanced-mode.json
# Deve mostrar JSON com enabled: true
```

### **Dependências**

```bash
# Verificar dependência WebSocket
npm list -g frontend-flow-agents --depth=1 | grep ws
# Deve mostrar: ws@8.x.x
```

## 🐛 Troubleshooting

### **Enhanced Mode Não Ativa**

```bash
# Forçar modo Enhanced
frontend-flow "sua demanda" --enhanced

# Verificar se diretório existe
ls -la $(npm root -g)/frontend-flow-agents/lib/claude-enhanced/
```

### **Monitor Não Inicia**

```bash
# Verificar porta disponível
lsof -i :8080  # WebSocket
lsof -i :8081  # Dashboard

# Testar sem monitor
frontend-flow "sua demanda" --no-monitor
```

### **Dependência WebSocket**

```bash
# Reinstalar dependências se necessário
npm install -g frontend-flow-agents@latest --force
```

## 🎯 Cenários de Sucesso

### **✅ Sucesso Total**
- Modo Enhanced ativa automaticamente
- Mesa técnica executa com 8 especialistas
- Dashboard aparece em http://localhost:8081
- Progress tracking funciona
- Fallback para modo standard quando necessário

### **✅ Sucesso Parcial**
- Enhanced falha mas fallback funciona
- Pipeline executa em modo standard
- Funcionalidade básica mantida

### **❌ Problemas Conhecidos**
- Claude Code não instalado: Enhanced usa simulação
- Porta 8080/8081 ocupada: Monitor falha mas pipeline continua
- Dependência ws faltando: Reinstalar pacote

## 📊 Métricas Esperadas

- **Precisão classificação**: 95%+ vs 80% anterior
- **Qualidade decisões**: +40% com mesa técnica
- **Experiência visual**: Dashboard funcional
- **Compatibilidade**: 100% com projetos existentes

---

**🚀 Se todos os testes passarem, Frontend Flow v2.0 Enhanced está funcionando perfeitamente!**