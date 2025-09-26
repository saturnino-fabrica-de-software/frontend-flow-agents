# 📚 Frontend Flow - Guia de Uso Completo

## 🚀 Como Usar com Claude Real

### Pré-requisitos
- ✅ Claude CLI instalado (https://claude.ai/download)
- ✅ Node.js 16+
- ✅ Git (opcional)

### Instalação
```bash
npm install
./bin/frontend-flow init
```

## 🎯 Modos de Execução

### 1. **Modo Interativo (Padrão)** - RECOMENDADO
Claude solicita permissão para cada ação. Você aprova ou recusa.

```bash
./bin/frontend-flow "criar componente de login"
```

Quando Claude perguntar:
- Digite `yes` ou `y` para aprovar
- Digite `no` ou `n` para recusar

### 2. **Modo Auto-Approve** ⚠️ CUIDADO!
Claude executa TUDO automaticamente sem pedir permissão.

```bash
./bin/frontend-flow --auto-approve "implementar dark mode"
```

### 3. **Modo Dry-Run** (Simulação)
Apenas mostra o que seria feito, sem executar.

```bash
./bin/frontend-flow --dry-run "adicionar testes"
```

### 4. **Modo Não-Interativo** (Análise)
Claude apenas analisa e sugere, sem executar.

```bash
./bin/frontend-flow --non-interactive "revisar código"
```

## 📋 Comandos Disponíveis

### Básicos
```bash
# Executar demanda
./bin/frontend-flow "sua demanda aqui"

# Inicializar projeto
./bin/frontend-flow init

# Ver status
./bin/frontend-flow status

# Limpar arquivos temporários
./bin/frontend-flow clean
```

### Marketplace
```bash
# Buscar agentes
./bin/frontend-flow marketplace search react

# Instalar agente
./bin/frontend-flow marketplace install agent-name

# Ver estatísticas
./bin/frontend-flow marketplace stats
```

### Monitoramento
```bash
# Verificar saúde dos agentes
./bin/frontend-flow health

# Abrir dashboard
./bin/frontend-flow dashboard

# Detectar framework
./bin/frontend-flow detect-framework
```

## 🎨 Opções Avançadas

```bash
# Modo educacional - explica cada passo
./bin/frontend-flow --educational "criar formulário"

# Coletar métricas
./bin/frontend-flow --collect-metrics "otimizar performance"

# Modo verbose
./bin/frontend-flow --verbose "debug do sistema"

# Sem GitHub
./bin/frontend-flow --no-github "tarefa local"

# Forçar modo Enhanced
./bin/frontend-flow --enhanced "tarefa complexa"
```

## ⚡ Exemplos Práticos

### Criar Componente React
```bash
./bin/frontend-flow "criar componente CardProduct com props: title, price, image, description"
```

### Implementar Feature Completa
```bash
./bin/frontend-flow "implementar sistema de autenticação com login, registro e recuperação de senha"
```

### Otimizar Performance
```bash
./bin/frontend-flow "analisar e otimizar performance da página de listagem"
```

### Adicionar Testes
```bash
./bin/frontend-flow "criar testes unitários e de integração para o componente UserProfile"
```

## 🔧 Troubleshooting

### Claude não executa ações
- **Problema**: Claude só mostra o que faria mas não executa
- **Solução**: Use o modo interativo padrão e aprove as ações quando solicitado

### Timeout em tarefas longas
- **Problema**: Execução para após 2 minutos
- **Solução**: Divida em tarefas menores ou use `--timeout 300000` (5 min)

### Erro de permissão
- **Problema**: Claude não consegue criar/modificar arquivos
- **Solução**: Verifique permissões da pasta ou use `sudo` (não recomendado)

## 🛡️ Segurança

### Boas Práticas
1. **NUNCA** use `--auto-approve` em produção
2. **SEMPRE** revise o que Claude quer fazer antes de aprovar
3. **USE** `--dry-run` primeiro para tarefas críticas
4. **CONFIGURE** `.gitignore` para excluir `.frontend-flow/temp`

### Dados Sensíveis
- Claude não tem acesso a variáveis de ambiente
- Não inclua senhas ou tokens nas demandas
- Use `.env` para configurações sensíveis

## 📊 Métricas e Analytics

### Ver Métricas
```bash
# Dashboard web
./bin/frontend-flow dashboard

# Relatório no terminal
./bin/frontend-flow health --report
```

### Coletar Métricas
```bash
# Ativar coleta
export FRONTEND_FLOW_TELEMETRY=true

# Desativar coleta
export FRONTEND_FLOW_TELEMETRY=false
```

## 🤝 Contribuindo

### Criar Novo Agente
1. Crie arquivo em `.frontend-flow/agents/agent_name.md`
2. Defina role, task e instructions
3. Teste com `./bin/frontend-flow --dry-run "tarefa do agente"`

### Submeter ao Marketplace
```bash
./bin/frontend-flow marketplace submit ./my-agent
```

## 📞 Suporte

- **Issues**: https://github.com/seu-usuario/frontend-flow-agents/issues
- **Docs**: https://frontend-flow.dev/docs
- **Discord**: https://discord.gg/frontend-flow

---

## ✅ Checklist de Instalação

- [ ] Claude CLI instalado e funcionando
- [ ] Node.js 16+ instalado
- [ ] Projeto inicializado com `frontend-flow init`
- [ ] Testado com `--dry-run` primeiro
- [ ] Entendeu diferença entre modos interativo e auto-approve

## 🎉 Pronto para Usar!

Comece com:
```bash
./bin/frontend-flow "criar meu primeiro componente"
```

E aprove as ações quando Claude solicitar! 🚀