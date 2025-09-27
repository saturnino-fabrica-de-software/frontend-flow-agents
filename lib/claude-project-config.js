const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Creates Claude-compatible project configuration
 * This ensures Claude recognizes all agents as native commands
 */
class ClaudeProjectConfig {
  constructor() {
    this.agents = [
      'agent_react_components',
      'agent_tailwind_estilization',
      'agent_responsiveness',
      'agent_animations',
      'agent_accessibility',
      'agent_performance',
      'agent_security',
      'agent_code_quality',
      'agent_integration_tests',
      'agent_e_2_e_cypress',
      'agent_redux_toolkit',
      'agent_state_manager',
      'agent_figma_extract',
      'agent_i_18_n',
      'agent_analytics',
      'agent_github_flow',
      'agent_github_pullrequest',
      'agent_nlp_classifier',
      'agent_master_orchestrator',
      'agent_pipeline_optimizer',
      'agent_cleanup_manager',
      'agent_metrics_collector',
      'agent_technical_roundtable',
      'agent_realtime_monitor'
    ];
  }

  async createClaudeConfig(projectDir) {
    console.log(chalk.blue('🔧 Criando configuração para reconhecimento nativo...'));

    // Create .claude-project file for native recognition
    const claudeProjectFile = {
      name: 'Frontend Flow Agents',
      version: '2.5.0',
      description: 'Sistema de orquestração com 29 agentes especializados',
      type: 'agent-orchestration',
      agents: this.agents.map(agent => ({
        name: agent,
        path: `agents/${agent}.md`,
        type: 'markdown',
        executable: true,
        keywords: this.getAgentKeywords(agent)
      })),
      commands: {
        'mesa técnica': {
          description: 'Executar mesa técnica com 13 especialistas',
          agent: 'agent_technical_roundtable',
          aliases: ['technical roundtable', 'mesa tecnica', 'roundtable']
        },
        'criar componente': {
          description: 'Criar componente React com TypeScript',
          agent: 'agent_react_components',
          aliases: ['create component', 'new component', 'componente react']
        },
        'análise segurança': {
          description: 'Análise de segurança OWASP',
          agent: 'agent_security',
          aliases: ['security analysis', 'owasp', 'vulnerabilities']
        }
      },
      integrations: {
        mcp: ['shadcn-ui', 'context7', 'github', 'figma'],
        claude: {
          nativeExecution: true,
          autoComplete: true,
          contextAware: true
        }
      }
    };

    const configPath = path.join(projectDir, '.claude-project');
    await fs.writeJson(configPath, claudeProjectFile, { spaces: 2 });

    console.log(chalk.green('  ✓ Arquivo .claude-project criado'));

    // Also create a commands.txt for direct Claude recognition
    const commandsList = this.generateCommandsList();
    const commandsPath = path.join(projectDir, 'COMMANDS.md');
    await fs.writeFile(commandsPath, commandsList, 'utf8');

    console.log(chalk.green('  ✓ Lista de comandos COMMANDS.md criada'));

    return true;
  }

  getAgentKeywords(agentName) {
    const keywords = {
      agent_react_components: ['react', 'component', 'tsx', 'jsx', 'ui'],
      agent_tailwind_estilization: ['tailwind', 'css', 'style', 'styling'],
      agent_responsiveness: ['responsive', 'mobile', 'tablet', 'breakpoint'],
      agent_animations: ['animation', 'transition', 'framer-motion', 'gsap'],
      agent_accessibility: ['a11y', 'wcag', 'aria', 'screen-reader'],
      agent_performance: ['performance', 'optimization', 'bundle', 'lazy'],
      agent_security: ['security', 'owasp', 'vulnerability', 'xss', 'csrf'],
      agent_technical_roundtable: ['mesa', 'técnica', 'roundtable', 'specialists']
    };

    return keywords[agentName] || [];
  }

  generateCommandsList() {
    return `# Frontend Flow - Comandos Disponíveis

## 🤖 Como Usar no Claude

Após a instalação nativa, você pode usar os agentes de várias formas:

### Formato 1: Comando direto
\`\`\`
execute agent_react_components para criar formulário
use agent_security para análise
run agent_performance para otimização
\`\`\`

### Formato 2: Linguagem natural
\`\`\`
"crie um componente de dashboard usando o agent_react_components"
"faça uma análise de segurança com agent_security"
"execute a mesa técnica sobre arquitetura"
\`\`\`

### Formato 3: Atalhos
\`\`\`
mesa técnica: analise a arquitetura do projeto
criar componente: formulário de contato responsivo
análise segurança: verificar vulnerabilidades OWASP
\`\`\`

## 📋 Lista Completa de Agentes

### Frontend Core
- **agent_react_components** - Criação de componentes React com TypeScript
- **agent_tailwind_estilization** - Estilização com Tailwind CSS
- **agent_responsiveness** - Design responsivo e breakpoints
- **agent_animations** - Animações e micro-interações

### Quality & Testing
- **agent_code_quality** - Análise de qualidade de código
- **agent_integration_tests** - Testes de integração
- **agent_e_2_e_cypress** - Testes end-to-end com Cypress
- **agent_accessibility** - Acessibilidade WCAG

### Performance & Security
- **agent_performance** - Otimização de performance
- **agent_security** - Análise de segurança OWASP

### State & Data
- **agent_redux_toolkit** - Gerenciamento de estado com Redux
- **agent_state_manager** - Gerenciamento de estado do pipeline

### Integration & Workflow
- **agent_github_flow** - Integração com GitHub
- **agent_github_pullrequest** - Criação de pull requests
- **agent_figma_extract** - Extração de design tokens do Figma

### Orchestration & Monitoring
- **agent_master_orchestrator** - Orquestração principal
- **agent_pipeline_optimizer** - Otimização do pipeline
- **agent_metrics_collector** - Coleta de métricas
- **agent_realtime_monitor** - Monitoramento em tempo real

### Special Features
- **agent_technical_roundtable** - Mesa técnica com 13 especialistas
- **agent_nlp_classifier** - Classificação NLP de demandas
- **agent_i_18_n** - Internacionalização
- **agent_analytics** - Analytics e tracking

## 🎯 Exemplos Práticos

### Criar um componente completo
\`\`\`
execute agent_react_components para criar um formulário de login com validação
\`\`\`

### Análise completa com mesa técnica
\`\`\`
use mesa técnica para analisar: implementar sistema de notificações em tempo real
\`\`\`

### Pipeline completo
\`\`\`
execute pipeline completo: criar dashboard administrativo responsivo
\`\`\`

### Otimização de performance
\`\`\`
use agent_performance para otimizar bundle e lazy loading
\`\`\`

### Análise de segurança
\`\`\`
execute agent_security para verificar vulnerabilidades OWASP no projeto
\`\`\`

## 💡 Dicas

1. **Mesa Técnica**: Use para decisões arquiteturais importantes
2. **Combine agentes**: Múltiplos agentes podem trabalhar em sequência
3. **Modo Enhanced**: Adicione "enhanced" para execução completa do pipeline
4. **Paralelização**: Agentes independentes executam em paralelo automaticamente

## 📚 Documentação Completa

Para mais detalhes sobre cada agente, consulte os arquivos em:
\`~/.claude/projects/frontend-flow-agents/agents/\`
`;
  }
}

module.exports = ClaudeProjectConfig;