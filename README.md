# 🚀 Frontend Flow Agents

**Orquestrador de agentes IA especializados para desenvolvimento React/TypeScript**

[![NPM Version](https://img.shields.io/npm/v/frontend-flow-agents)](https://npmjs.com/package/frontend-flow-agents)
[![Downloads](https://img.shields.io/npm/dm/frontend-flow-agents)](https://npmjs.com/package/frontend-flow-agents)
[![License](https://img.shields.io/npm/l/frontend-flow-agents)](https://github.com/saturnino-fabrica-de-software/frontend-flow-agents/blob/main/LICENSE)

## ✨ O que é o Frontend Flow?

Frontend Flow é uma ferramenta que orquestra **22 agentes IA especializados** para automatizar completamente o desenvolvimento React/TypeScript. **TODOS os 22 agentes são executados SEMPRE**, mas cada agente decide inteligentemente se deve agir ou pular baseado no contexto do projeto, garantindo cobertura completa sem desperdício de recursos.

### 🤖 **Integração Claude Code**
- **Detecção automática**: Identifica se Claude Code está instalado
- **Execução real**: Agentes usam Claude para gerar código real
- **Modo fallback**: Simula execução quando Claude não está disponível
- **Configuração simples**: Funciona automaticamente quando disponível

### 📋 **MCPs Obrigatórios**
Para funcionamento completo, os agentes requerem os seguintes MCPs no Claude:

#### **🎨 Design & UI**
- **`shadcn-ui`** - Componentes React (obrigatório para `agent_react_components`)
- **`Context7`** - Padrões atualizados (obrigatório para TODOS os agentes)

#### **🔧 Desenvolvimento**
- **`Figma`** - Extração de tokens de design (`agent_figma_extract`)
- **`GitHub`** - Automação Git/PR (`agent_github_flow`, `agent_github_pullrequest`)

#### **⚡ Como Verificar MCPs**
```bash
# No Claude Code, verificar MCPs instalados:
claude mcp list

# MCPs essenciais para Frontend Flow:
# ✅ shadcn-ui - Componentes UI
# ✅ Context7 - Padrões/documentação
# ✅ Figma - Design tokens
# ✅ GitHub - Automação Git
```

### 🎯 **Uma solicitação → Código completo**

```bash
# Instalar globalmente
npm install -g frontend-flow-agents

# Em qualquer projeto React
cd meu-projeto
frontend-flow init

# Exemplo 1: Componente básico
frontend-flow "criar botão de login responsivo"

# Exemplo 2: Baseado em Figma
frontend-flow "implemente esse botão que estou selecionando no figma"

# 🔄 **Pipeline Completo - TODOS os 22 Agentes Executados:**

# 📋 **FASE 1: ANÁLISE & PLANEJAMENTO**
# → 1. agent_master_orchestrator - Orquestra todo o pipeline
# → 2. agent_github_flow - Cria issue e branch feature/figma-button
# → 3. agent_nlp_classifier - Analisa demanda (componente visual + Figma)

# 🎨 **FASE 2: EXTRAÇÃO & CRIAÇÃO**
# → 4. agent_figma_extract - Extrai tokens, cores e medidas do Figma
# → 5. agent_react_components - Gera componente Button com shadcn-ui
# → 6. agent_redux_toolkit - SKIP (botão simples, sem estado global)

# 💅 **FASE 3: ESTILIZAÇÃO & UX**
# → 7. agent_tailwind_estilization - Aplica estilos pixel-perfect do Figma
# → 8. agent_animations - SKIP (sem animações na demanda)
# → 9. agent_responsiveness - Garante funcionamento mobile/desktop
# → 10. agent_accessibility - Adiciona ARIA labels e navegação por teclado

# 🌍 **FASE 4: INTERNACIONALIZAÇÃO**
# → 11. agent_i_18_n - SKIP (projeto sem configuração i18n)

# ⚡ **FASE 5: OTIMIZAÇÃO**
# → 12. agent_performance - Otimiza renders com React.memo se necessário
# → 13. agent_security - Valida props e entradas do componente

# 📊 **FASE 6: MÉTRICAS**
# → 14. agent_analytics - SKIP (projeto sem analytics configurado)

# 🔍 **FASE 7: QUALIDADE & TESTES**
# → 15. agent_code_quality - Valida lint, tipos TypeScript, build
# → 16. agent_integration_tests - Cria testes Vitest cobrindo 100%
# → 17. agent_e_2_e_cypress - SKIP (componente simples, sem fluxo E2E)

# ⚙️ **FASE 8: SISTEMA & OTIMIZAÇÃO**
# → 18. agent_pipeline_optimizer - Analisa performance do pipeline
# → 19. agent_state_manager - Gerencia estado do processo
# → 20. agent_cleanup_manager - Organiza arquivos temporários
# → 21. agent_metrics_collector - Coleta dados de performance

# 🎯 **FASE 9: FINALIZAÇÃO**
# → 22. agent_github_pullrequest - Cria PR com documentação completa

# ✨ **RESULTADO FINAL:**
# → Issue criada e documentada em português
# → Branch feature/figma-button criada automaticamente
# → Componente Button pixel-perfect baseado no Figma
# → Estilos TailwindCSS com tokens centralizados
# → Acessibilidade WCAG compliant
# → Responsividade mobile/desktop
# → Testes 100% coverage
# → Qualidade de código garantida
# → PR pronto para review com checklist automático
```

## 🧠 **Pipeline Universal com Decisão Inteligente**

### **✨ Todos os 22 Agentes, Sempre!**
- **🔄 Execução Universal**: Todos os 22 agentes são SEMPRE executados
- **🧠 Decisão Inteligente**: Cada agente decide se deve agir ou pular baseado no contexto
- **⚡ Otimização Automática**: Sem desperdício, mas com cobertura 100% completa

### **📊 Categorias de Agentes**
- **🎯 CORE** (sempre executam): `react_components`, `tailwind_estilization`, `github_flow/pullrequest`
- **🛡️ QUALITY** (quase sempre): `security`, `accessibility`, `performance`, `code_quality`, `tests`
- **🎨 CONTEXTUAL** (pulam inteligentemente): `figma_extract`, `redux_toolkit`, `i18n`, `analytics`, `animations`
- **⚙️ SYSTEM** (sempre executam): `state_manager`, `cleanup_manager`, `metrics_collector`, `optimizer`

### **🤖 Como Funciona**
```bash
frontend-flow "criar botão simples"
# → Todos os 22 agentes são chamados
# → agent_figma_extract: SKIP (sem menção ao Figma)
# → agent_redux_toolkit: SKIP (componente simples)
# → agent_security: APPLY (sempre valida segurança)
# → agent_react_components: APPLY (sempre cria componente)
# → Resultado: Pipeline otimizado automaticamente!
```

## 🔧 **Recursos Principais**

### 🧠 **Processamento Inteligente**
- **Classificação NLP**: Analisa solicitações em linguagem natural para orientar agentes
- **Pipeline Universal**: TODOS os 22 agentes são executados sempre
- **Decisão Distribuída**: Cada agente decide internamente se deve agir ou pular
- **Otimização automática**: Identifica oportunidades de paralelização
- **Fallback inteligente**: Continua funcionando mesmo com falhas

### ⚡ **Performance**
- **Execução paralela**: Agentes independentes executam simultaneamente
- **Sistema de cache**: Reutiliza resultados de execuções anteriores
- **Pipelines otimizados**: Sequência de agentes adaptada ao contexto
- **Monitoramento**: Acompanha progresso e performance em tempo real

### 🛡️ **Confiabilidade**
- **Recuperação de erros**: Tenta resolver problemas automaticamente
- **Validação rigorosa**: Verificações de qualidade em cada etapa
- **Preservação de estado**: Mantém contexto durante toda execução
- **Backup automático**: Pontos de recuperação em momentos críticos

## 🤖 **22 Agentes Especializados**

### **Core Development**
- `agent_react_components` - Componentes React com TypeScript
- `agent_tailwind_estilization` - Estilização pixel-perfect
- `agent_redux_toolkit` - Estado global otimizado
- `agent_figma_extract` - Design tokens automáticos

### **Quality Assurance**
- `agent_code_quality` - Tolerância zero para erros
- `agent_security` - Vulnerabilidades e melhores práticas
- `agent_accessibility` - WCAG e inclusão
- `agent_integration_tests` - Testes automatizados

### **Enterprise Features**
- `agent_state_manager` - Estado vivo em tempo real
- `agent_pipeline_optimizer` - Otimização dinâmica
- `agent_auto_healing` - Recuperação automática
- `agent_metrics_collector` - Observabilidade completa

[Ver todos os 22 agentes →](./agents/)

## 🚀 **Instalação e Uso**

### **Instalação Global**
```bash
npm install -g frontend-flow-agents
```

### **Setup em Projeto**
```bash
cd meu-projeto-react
frontend-flow init
```

### **Executar Demandas**
```bash
# Componente simples
frontend-flow "criar botão de login responsivo"

# Feature complexa
frontend-flow "implementar sistema de carrinho com checkout"

# Otimização
frontend-flow "melhorar performance da listagem de produtos"

# Refatoração
frontend-flow "refatorar autenticação com melhor segurança"
```

## 📊 **Monitoramento em Tempo Real**

O Frontend Flow mantém um arquivo de estado vivo que você pode acompanhar:

```bash
# Ver status atual
frontend-flow status

# Arquivo de estado em tempo real
cat .frontend-flow/temp/current_pipeline_state.md
```

**Exemplo de estado vivo:**
```markdown
# 🚀 Pipeline Estado Vivo - feature_completa

**🎯 Status**: RUNNING | **📊 Progresso**: 65% | **⏱️ Tempo**: 8m 23s
**🎨 Demanda Original**: "criar dashboard de analytics"
**⏳ Estimativa Restante**: 4m 12s

## 🔄 Agentes em Execução Paralela

- 🟢 agent_react_components (85% concluído)
- 🟡 agent_redux_toolkit (45% concluído)
- ⏳ agent_tailwind_estilization (próximo)
```

## 🎯 **Exemplos Práticos**

### **E-commerce Dashboard**
```bash
frontend-flow "criar dashboard para loja online com métricas de vendas, gráficos de performance e gestão de produtos"
```

**Resultado:** Sistema completo com componentes React, estado Redux, gráficos interativos, testes e documentação.

### **Sistema de Autenticação**
```bash
frontend-flow "implementar login seguro com 2FA, recuperação de senha e controle de sessão"
```

**Resultado:** Fluxo completo de auth com validações, testes de segurança e integração.

### **Performance Optimization**
```bash
frontend-flow "otimizar carregamento da página inicial reduzindo bundle size"
```

**Resultado:** Análise automatizada, code splitting, lazy loading e métricas de melhoria.

## 🔧 **Compatibilidade**

### **Frameworks Suportados**
- ✅ Next.js (App Router + Pages Router)
- ✅ Vite + React
- ✅ Create React App
- ✅ React genérico

### **Tecnologias Integradas**
- ✅ TypeScript (detecção automática)
- ✅ Tailwind CSS (configuração automática)
- ✅ shadcn/ui (componentes premium)
- ✅ Redux Toolkit (estado global)
- ✅ ESLint + Prettier (quality gates)

### **Integrações Git**
- ✅ GitHub (issues + PRs automáticos)
- ✅ GitLab (suporte planejado)
- ✅ Bitbucket (suporte planejado)

## 🌟 **Casos de Uso**

### **Para Desenvolvedores**
- 🚀 **Prototipagem rápida**: De ideia a MVP em minutos
- 🔧 **Refatoração inteligente**: Melhoria automática de código
- 🐛 **Debugging assistido**: Identificação e correção de problemas
- 📈 **Otimização contínua**: Performance e qualidade automatizada

### **Para Equipes**
- 👥 **Padronização**: Código consistente em toda equipe
- 📊 **Observabilidade**: Métricas detalhadas de desenvolvimento
- 🔄 **CI/CD Integration**: Pipeline automatizado
- 📝 **Documentação**: Auto-gerada e sempre atualizada

### **Para Empresas**
- 💰 **ROI Maximizado**: 40-70% redução no tempo de desenvolvimento
- 🛡️ **Compliance**: Padrões de segurança e acessibilidade
- 📈 **Escalabilidade**: Suporte a projetos de qualquer tamanho
- 🎯 **Quality Assurance**: Tolerância zero para bugs

## 📚 **Documentação**

- 📖 [Documentação Completa em Português](./docs/README.md)
- 🤖 [22 Agentes Disponíveis](./agents/) - Pasta com todos os agentes
- ⚙️ [Configurações do Sistema](./configs/) - Arquivos de configuração
- 🔧 [Templates GitHub](./templates/) - Templates para issues e PRs

## 💡 **CLI Completo**

```bash
# Comandos principais
frontend-flow init                    # Inicializar projeto
frontend-flow "demanda"               # Executar pipeline
frontend-flow status                  # Ver status atual
frontend-flow doctor                  # Verificar saúde do sistema
frontend-flow clean                   # Limpar temporários

# Opções avançadas
frontend-flow "demanda" --dry-run     # Simular execução
frontend-flow "demanda" --verbose     # Logs detalhados
frontend-flow "demanda" --pipeline=performance_focus  # Pipeline específico

# Aliases disponíveis
ff "demanda"                          # Alias curto
ff doctor                             # Verificação rápida
```

## 🤝 **Contribuição**

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes.

### **Como contribuir:**
1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Abra um Pull Request

## 📄 **Licença**

MIT © [Saturnino Fábrica de Software](https://github.com/saturnino-fabrica-de-software)

## 🔗 **Links Úteis**

- 🌐 [Site Oficial](https://frontend-flow.dev)
- 📦 [NPM Package](https://npmjs.com/package/frontend-flow-agents)
- 🐛 [Reportar Bug](https://github.com/saturnino-fabrica-de-software/frontend-flow-agents/issues)
- 💬 [Discussões](https://github.com/saturnino-fabrica-de-software/frontend-flow-agents/discussions)
- 📧 [Suporte](mailto:support@saturnino.dev)

---

**Made with ❤️ by [Emerson Saturnino](https://saturnino.dev)**

*Frontend Flow - Transformando ideias em código de produção automaticamente*