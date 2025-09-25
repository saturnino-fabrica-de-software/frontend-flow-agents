# 🤝 Contributing to Frontend Flow Agents

Obrigado pelo seu interesse em contribuir com o Frontend Flow Agents! Este documento fornece diretrizes para contribuições.

## 🚀 Como Contribuir

### **1. Fork & Clone**
```bash
# Fork o repositório no GitHub
git clone https://github.com/seu-username/frontend-flow-agents.git
cd frontend-flow-agents
npm install
```

### **2. Desenvolvimento Local**
```bash
# Testar CLI localmente
node bin/frontend-flow --help

# Testar em projeto
mkdir test-project && cd test-project
node ../bin/frontend-flow init
```

### **3. Tipos de Contribuições**

#### 🤖 **Novos Agentes**
- Adicione em `agents/agent_seu_nome.md`
- Siga o template dos agentes existentes
- Inclua integração com orquestrador
- Adicione testes e documentação

#### ⚡ **Melhorias de Performance**
- Otimizações de execução paralela
- Melhorias no sistema de cache
- Redução de dependências

#### 🐛 **Bug Fixes**
- Correções de problemas reportados
- Melhorias de estabilidade
- Fixes de compatibilidade

#### 📚 **Documentação**
- Exemplos de uso
- Guias avançados
- Tradução de documentos

### **4. Guidelines de Código**

#### **Structure**
```
agents/           # Agentes IA (markdown files)
lib/             # Lógica core (JavaScript)
configs/         # Configurações base
templates/       # Templates GitHub
bin/             # CLI executável
```

#### **Estilo de Código**
- Use CommonJS (require/module.exports)
- Mantenha compatibilidade Node.js 16+
- Siga padrões ESLint (se configurado)
- Comentários em inglês, mensagens user em português

#### **Commits**
Use Conventional Commits:
```bash
feat: add new agent for performance optimization
fix: resolve parallel execution race condition
docs: update CLI usage examples
test: add integration tests for orchestrator
```

### **5. Process de Review**

#### **Pull Request Checklist**
- [ ] Código testado localmente
- [ ] CLI funciona sem erros
- [ ] Documentação atualizada
- [ ] Commits seguem padrão conventional
- [ ] Sem breaking changes (ou justificados)

#### **Template de PR**
```markdown
## 📝 Descrição
Breve descrição das mudanças

## 🧪 Como Testar
```bash
# Comandos para testar as mudanças
```

## 📊 Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## ✅ Checklist
- [ ] Testado localmente
- [ ] Documentação atualizada
- [ ] Commits organizados
```

### **6. Desenvolvimento de Agentes**

#### **Template de Novo Agente**
```markdown
# Agent Nome do Agente

## Descrição
Descrição detalhada do que o agente faz

## Objetivos Principais
- Objetivo 1
- Objetivo 2

## Entradas Esperadas
- Entrada 1
- Entrada 2

## Saídas Esperadas
- Saída 1
- Saída 2

## Capacidades (Agnósticas)
- Capacidade 1
- Capacidade 2

## Integração com Orquestrador

### Dependências
- **agent_exemplo**: Dependência explicada

### Pode Chamar
- **agent_outro**: Quando e por quê

### Status de Saída
- **SUCCESS**: Descrição
- **ERROR**: Descrição

### Callbacks
- **@evento:nome**: Descrição do evento

## Limites
- Limitação 1
- Limitação 2

## Critérios de Qualidade (Checklist)
- [ ] Critério 1
- [ ] Critério 2
```

### **7. Testes**

#### **Testes Manuais**
```bash
# Teste básico de CLI
node bin/frontend-flow --help

# Teste de inicialização
mkdir test && cd test
echo '{"name":"test","dependencies":{"react":"^18.0.0"}}' > package.json
node ../bin/frontend-flow init

# Teste de classificação
node ../bin/frontend-flow "criar botão" --dry-run
```

#### **Testes Automatizados** (futuro)
- Unit tests para lib/
- Integration tests para CLI
- E2E tests para pipelines completos

### **8. Documentação**

#### **README Updates**
- Mantenha exemplos atualizados
- Documente novas features
- Atualize lista de agentes

#### **Changelog**
- Documente mudanças importantes
- Siga padrão Keep a Changelog
- Inclua breaking changes

### **9. Release Process**

#### **Versioning**
- Patch (1.0.1): Bug fixes
- Minor (1.1.0): New features
- Major (2.0.0): Breaking changes

#### **Release Checklist**
- [ ] Todos testes passando
- [ ] Documentação atualizada
- [ ] CHANGELOG.md atualizado
- [ ] Version bump no package.json
- [ ] Tag de release criada

### **10. Comunidade**

#### **Onde Buscar Ajuda**
- 🐛 [GitHub Issues](https://github.com/saturnino-fabrica-de-software/frontend-flow-agents/issues)
- 💬 [GitHub Discussions](https://github.com/saturnino-fabrica-de-software/frontend-flow-agents/discussions)
- 📧 [Email Suporte](mailto:support@saturnino.dev)

#### **Code of Conduct**
- Seja respeitoso e inclusivo
- Colabore de forma construtiva
- Mantenha discussões técnicas focadas
- Ajude outros desenvolvedores

### **11. Roadmap de Contribuições**

#### **🔥 Prioridade Alta**
- Integração com Claude API real
- Testes automatizados
- Templates de projeto
- Documentação avançada

#### **⚡ Prioridade Média**
- Novos tipos de agentes
- Melhorias de performance
- Suporte a mais frameworks
- Integração CI/CD

#### **💡 Ideias Futuras**
- Interface web/GUI
- Plugins para IDEs
- Marketplace de agentes
- Analytics avançado

## 🎉 Reconhecimento

Todos os contribuidores serão reconhecidos no README principal e releases notes.

**Obrigado por contribuir para o Frontend Flow Agents!** 🚀