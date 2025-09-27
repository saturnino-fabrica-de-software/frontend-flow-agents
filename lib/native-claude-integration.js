const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { createSpinner } = require('./spinner');

class NativeClaudeIntegration {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.projectClaudeDir = path.join(projectPath, '.claude');
    this.globalClaudeDir = path.join(os.homedir(), '.claude');
  }

  async setupNativeIntegration(sourcePath) {
    const spinner = createSpinner('Configurando integração nativa com Claude no projeto...').start();

    try {
      // Ensure project .claude directory exists
      await fs.ensureDir(this.projectClaudeDir);

      console.log(chalk.cyan('\n📦 Instalando Frontend Flow no projeto (.claude)...'));

      // Copy agents to PROJECT's .claude directory
      await this.copyAgentsToProject(sourcePath);

      // Convert agents to Claude-compatible format
      const AgentConverter = require('./agent-converter');
      const converter = new AgentConverter();
      await converter.convertAllAgents(path.join(this.projectClaudeDir, 'agents'));

      // Update project's CLAUDE.md with Frontend Flow instructions
      await this.updateProjectClaudeMd();

      // Copy templates and configs
      await this.copyTemplatesAndConfigs(sourcePath);

      // Create Claude project configuration
      const ClaudeProjectConfig = require('./claude-project-config');
      const configGenerator = new ClaudeProjectConfig();
      await configGenerator.createClaudeConfig(this.projectClaudeDir);

      spinner.success(chalk.green('✅ Frontend Flow instalado nativamente!'));

      console.log(chalk.yellow('\n📝 Instruções:'));
      console.log(chalk.gray('1. Abra o Claude Code neste projeto'));
      console.log(chalk.gray('2. Os agentes estarão em .claude/ do projeto'));
      console.log(chalk.gray('3. Use: "execute agent_react_components" ou qualquer outro agente'));
      console.log(chalk.gray('4. A mesa técnica está disponível no contexto do projeto'));

      return true;
    } catch (error) {
      spinner.error(chalk.red('❌ Erro ao configurar integração nativa'));
      console.error(error);
      return false;
    }
  }

  async copyAgentsToProject(sourcePath) {
    console.log(chalk.blue(`📂 Copiando agentes para ${this.projectClaudeDir}...`));

    // Copy agents directory with all metadata
    const agentsSource = path.join(sourcePath, 'agents');
    const agentsDest = path.join(this.projectClaudeDir, 'agents');

    if (await fs.pathExists(agentsSource)) {
      await fs.copy(agentsSource, agentsDest, {
        overwrite: true,
        preserveTimestamps: true
      });
      console.log(chalk.green('  ✓ Agentes copiados com metadados'));
    }

    // Copy templates
    const templatesSource = path.join(sourcePath, 'templates');
    const templatesDest = path.join(this.projectClaudeDir, 'templates');

    if (await fs.pathExists(templatesSource)) {
      await fs.copy(templatesSource, templatesDest, {
        overwrite: true,
        preserveTimestamps: true
      });
      console.log(chalk.green('  ✓ Templates copiados'));
    }

    // Copy configs
    const configsSource = path.join(sourcePath, 'configs');
    const configsDest = path.join(this.projectClaudeDir, 'configs');

    if (await fs.pathExists(configsSource)) {
      await fs.copy(configsSource, configsDest, {
        overwrite: true,
        preserveTimestamps: true
      });
      console.log(chalk.green('  ✓ Configurações copiadas'));
    }

    // Create a PROJECT.md for Frontend Flow in the project directory
    const projectMd = `# Frontend Flow Agents

## 🚀 Agentes IA Especializados

Este projeto contém 29 agentes especializados para desenvolvimento Frontend/Full-Stack.

### Como usar os agentes:

1. **Componentes React**: \`execute agent_react_components para criar um formulário\`
2. **Segurança**: \`execute agent_security para análise OWASP\`
3. **Performance**: \`execute agent_performance para otimizar bundle\`
4. **Mesa Técnica**: \`execute mesa técnica sobre [sua demanda]\`

### Agentes Disponíveis:

#### Frontend Core
- agent_react_components - Criação de componentes React
- agent_tailwind_estilization - Estilização com Tailwind CSS
- agent_responsiveness - Design responsivo
- agent_animations - Animações e micro-interações

#### Quality & Testing
- agent_integration_tests - Testes de integração
- agent_e_2_e_cypress - Testes E2E com Cypress
- agent_code_quality - Análise de qualidade de código

#### Performance & Security
- agent_performance - Otimização de performance
- agent_security - Análise de segurança OWASP
- agent_accessibility - Acessibilidade WCAG

#### Orchestration
- agent_master_orchestrator - Orquestração principal
- agent_technical_roundtable - Mesa técnica com 13 especialistas

### Mesa Técnica

A mesa técnica simula 13 especialistas analisando sua demanda:
- Patrick (Frontend Arquitetura)
- André (Frontend Performance)
- Saturnino (Frontend Escalabilidade)
- Philipe (Mobile)
- Mateus (Backend)
- Avner (DevOps)
- Guilherme (Infraestrutura)
- Wander (UX)
- Viviane (QA)
- Marcelo (Security)
- Bruno (Product Manager)
- Deivis (Business)
- Carlos (Tech Lead)

## 📚 Documentação Completa

Visite: https://github.com/saturnino-fabrica-de-software/frontend-flow-agents
`;

    await fs.writeFile(
      path.join(this.projectClaudeDir, 'PROJECT.md'),
      projectMd,
      'utf8'
    );
    console.log(chalk.green('  ✓ PROJECT.md criado'));
  }

  async updateGlobalClaudeMd() {
    console.log(chalk.blue('📝 Atualizando CLAUDE.md global (opcional)...'));

    const claudeMdPath = path.join(this.globalClaudeDir, 'CLAUDE.md');
    const frontendFlowSection = `

## 🚀 Frontend Flow Agents

Sistema de orquestração com 29 agentes especializados instalado.

### Uso Rápido:
- Mesa Técnica: \`analise com mesa técnica: [sua demanda]\`
- Componentes: \`use agent_react_components para [tarefa]\`
- Segurança: \`use agent_security para análise\`
- Performance: \`use agent_performance para otimização\`

### Agentes disponíveis em: ~/.claude/projects/frontend-flow-agents/
`;

    try {
      let currentContent = '';
      if (await fs.pathExists(claudeMdPath)) {
        currentContent = await fs.readFile(claudeMdPath, 'utf8');

        // Check if Frontend Flow section already exists
        if (currentContent.includes('Frontend Flow Agents')) {
          console.log(chalk.yellow('  ⚠ Seção Frontend Flow já existe em CLAUDE.md'));
          return;
        }
      }

      // Append Frontend Flow section
      await fs.writeFile(
        claudeMdPath,
        currentContent + frontendFlowSection,
        'utf8'
      );

      console.log(chalk.green('  ✓ CLAUDE.md atualizado com instruções do Frontend Flow'));
    } catch (error) {
      console.log(chalk.yellow('  ⚠ Não foi possível atualizar CLAUDE.md:', error.message));
    }
  }

  async updateProjectClaudeMd() {
    console.log(chalk.blue('📝 Criando/Atualizando CLAUDE.md do projeto...'));

    const projectClaudeMdPath = path.join(this.projectPath, 'CLAUDE.md');

    const projectInstructions = `# Frontend Flow Agents - Instruções para Este Projeto

## 🚀 Agentes Disponíveis

Este projeto tem o Frontend Flow instalado com 29 agentes especializados.

### 🎯 Como Usar os Agentes

#### Mesa Técnica (13 Especialistas)
\`\`\`
analise com mesa técnica: implementar sistema de autenticação JWT
execute mesa técnica sobre: arquitetura de microserviços
\`\`\`

#### Criação de Componentes React
\`\`\`
use agent_react_components para criar formulário de cadastro
execute agent_react_components: dashboard com gráficos
crie um componente de tabela com paginação
\`\`\`

#### Estilização com Tailwind
\`\`\`
use agent_tailwind_estilization para estilizar o header
aplique tailwind no formulário de login
\`\`\`

#### Análise de Segurança
\`\`\`
execute agent_security para análise OWASP
verifique vulnerabilidades no código
faça auditoria de segurança
\`\`\`

#### Otimização de Performance
\`\`\`
use agent_performance para otimizar bundle
melhore a performance do dashboard
implemente lazy loading
\`\`\`

#### Testes Automatizados
\`\`\`
execute agent_integration_tests para criar testes
crie testes E2E com agent_e_2_e_cypress
adicione cobertura de testes
\`\`\`

### 📋 Lista Completa de Agentes

#### Frontend Core (8 agentes)
- **agent_react_components** - Componentes React com TypeScript e shadcn-ui
- **agent_tailwind_estilization** - Estilização Tailwind pixel-perfect
- **agent_responsiveness** - Design responsivo e mobile-first
- **agent_animations** - Animações com Framer Motion
- **agent_accessibility** - Acessibilidade WCAG 2.1
- **agent_redux_toolkit** - Estado global com Redux Toolkit
- **agent_state_manager** - Gerenciamento de estado do pipeline
- **agent_figma_extract** - Extração de tokens do Figma

#### Quality & Testing (5 agentes)
- **agent_code_quality** - ESLint, Prettier, TypeScript strict
- **agent_integration_tests** - Testes com Vitest/Jest
- **agent_e_2_e_cypress** - Testes E2E com Cypress
- **agent_security** - Análise OWASP Top 10
- **agent_performance** - Core Web Vitals e otimizações

#### Workflow & Integration (4 agentes)
- **agent_github_flow** - Criação de issues e branches
- **agent_github_pullrequest** - PRs automatizados
- **agent_i_18_n** - Internacionalização com i18next
- **agent_analytics** - Google Analytics e tracking

#### Orchestration & Monitoring (8 agentes)
- **agent_master_orchestrator** - Orquestração principal
- **agent_technical_roundtable** - Mesa com 13 especialistas
- **agent_nlp_classifier** - Classificação NLP de demandas
- **agent_pipeline_optimizer** - Otimização do pipeline
- **agent_cleanup_manager** - Limpeza e organização
- **agent_metrics_collector** - Coleta de métricas
- **agent_realtime_monitor** - Monitoramento em tempo real
- **agent_auto_healing** - Recuperação automática de erros

### 🔄 Pipeline Completo

Para executar o pipeline completo com todos os agentes:
\`\`\`
execute pipeline completo: [sua demanda]
frontend-flow enhanced: [sua demanda]
\`\`\`

### 💡 Exemplos Práticos

#### Criar um Dashboard Completo
\`\`\`
execute pipeline: criar dashboard administrativo com gráficos, tabelas e filtros
\`\`\`

#### Implementar Feature Completa
\`\`\`
use mesa técnica e depois implemente: sistema de notificações em tempo real
\`\`\`

#### Otimização de Projeto Existente
\`\`\`
analise e otimize: melhorar performance e segurança do projeto
\`\`\`

### 🛠️ Comandos Específicos do Projeto

#### Build e Deploy
\`\`\`bash
npm run build
npm test
npm run lint
\`\`\`

#### Frontend Flow CLI
\`\`\`bash
frontend-flow status         # Ver status do pipeline
frontend-flow doctor         # Verificar saúde do sistema
frontend-flow clean          # Limpar arquivos temporários
\`\`\`

### 📚 Documentação

- Agentes: ~/.claude/projects/frontend-flow-agents/agents/
- GitHub: https://github.com/saturnino-fabrica-de-software/frontend-flow-agents
- NPM: https://www.npmjs.com/package/frontend-flow-agents

### ⚠️ Notas Importantes

1. **Mesa Técnica**: Use para decisões arquiteturais importantes
2. **Pipeline Enhanced**: Executa TODOS os 29 agentes
3. **Modo Paralelo**: Agentes independentes executam simultaneamente
4. **Cache Inteligente**: Resultados são cacheados por 15 minutos

---
*Frontend Flow v2.5.0 - Sistema de Orquestração com 29 Agentes Especializados*
`;

    try {
      // Check if project CLAUDE.md exists
      let existingContent = '';
      let hasFrontendFlowSection = false;

      if (await fs.pathExists(projectClaudeMdPath)) {
        existingContent = await fs.readFile(projectClaudeMdPath, 'utf8');
        hasFrontendFlowSection = existingContent.includes('Frontend Flow Agents');

        if (hasFrontendFlowSection) {
          // Replace existing Frontend Flow section
          const startMarker = '# Frontend Flow Agents';
          const endMarker = '*Frontend Flow v';

          const startIndex = existingContent.indexOf(startMarker);
          if (startIndex !== -1) {
            const endIndex = existingContent.indexOf(endMarker);
            if (endIndex !== -1) {
              const endOfSection = existingContent.indexOf('*', endIndex + endMarker.length) + 1;
              existingContent = existingContent.substring(0, startIndex) +
                              existingContent.substring(endOfSection);
            }
          }
        }
      }

      // Write updated content
      const finalContent = existingContent.trim() ?
        existingContent + '\n\n' + projectInstructions :
        projectInstructions;

      await fs.writeFile(projectClaudeMdPath, finalContent, 'utf8');

      console.log(chalk.green('  ✓ CLAUDE.md do projeto atualizado com instruções do Frontend Flow'));
    } catch (error) {
      console.log(chalk.yellow('  ⚠ Não foi possível atualizar CLAUDE.md do projeto:', error.message));
    }
  }

  async copyTemplatesAndConfigs(sourcePath) {
    console.log(chalk.blue('🔧 Copiando bibliotecas auxiliares...'));

    // Copy lib files needed for agent execution
    const libSource = path.join(sourcePath, 'lib');
    const libDest = path.join(this.projectClaudeDir, 'lib');

    if (await fs.pathExists(libSource)) {
      // Copy only essential lib files
      const essentialLibs = [
        'agent-executor.js',
        'agent-context.js',
        'spinner.js',
        'technical-roundtable-claude-prompt.js',
        'technical-roundtable-prompt-generator.js'
      ];

      await fs.ensureDir(libDest);

      for (const libFile of essentialLibs) {
        const srcFile = path.join(libSource, libFile);
        const destFile = path.join(libDest, libFile);

        if (await fs.pathExists(srcFile)) {
          await fs.copy(srcFile, destFile);
        }
      }

      console.log(chalk.green('  ✓ Bibliotecas essenciais copiadas'));
    }
  }

  async checkNativeIntegration() {
    try {
      const exists = await fs.pathExists(this.projectClaudeDir);
      if (exists) {
        const agentsDir = path.join(this.projectClaudeDir, 'agents');
        const hasAgents = await fs.pathExists(agentsDir);
        return hasAgents;
      }
      return false;
    } catch {
      return false;
    }
  }

  async removeNativeIntegration() {
    const spinner = createSpinner('Removendo integração nativa do projeto...').start();

    try {
      if (await fs.pathExists(this.projectClaudeDir)) {
        await fs.remove(this.projectClaudeDir);
        spinner.success(chalk.green('✅ Integração nativa removida do projeto'));

        console.log(chalk.yellow('\n⚠ Nota: O CLAUDE.md do projeto foi mantido.'));
        console.log(chalk.gray('  Edite manualmente se desejar remover as instruções.'));
      } else {
        spinner.info(chalk.yellow('ℹ Integração nativa não encontrada no projeto'));
      }
    } catch (error) {
      spinner.error(chalk.red('❌ Erro ao remover integração nativa'));
      console.error(error);
    }
  }
}

module.exports = NativeClaudeIntegration;