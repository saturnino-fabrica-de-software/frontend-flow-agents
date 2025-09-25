const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ClaudeIntegration = require('./claude-integration');

async function runPipeline(demand, projectPath, options = {}) {
  const startTime = Date.now();
  const frontendFlowDir = path.join(projectPath, '.frontend-flow');

  // Initialize Claude integration
  const claude = new ClaudeIntegration();
  await claude.detectClaudeCode();

  // Load configurations
  const configs = await loadConfigurations(frontendFlowDir);
  const projectInfo = options.projectInfo;

  console.log(chalk.blue('🧠 Iniciando orquestração autônoma...'));

  // Always start with the master orchestrator for 100% autonomy
  console.log(chalk.cyan('🎯 Chamando agent_master_orchestrator...'));

  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Modo dry-run - simulando orquestração...'));
    return simulateOrchestration(demand, projectPath);
  }

  // Update state file
  await updateStateFile(frontendFlowDir, {
    status: 'ORCHESTRATING',
    currentAgent: 'agent_master_orchestrator',
    currentTask: `Analisando demanda: "${demand}"`,
    progress: 5,
    event: 'pipeline_start',
    recentActivity: 'Iniciando orquestração autônoma com todos os 22 agentes',
    demand: demand,
    startTime: new Date().toISOString(),
    agentsCompleted: 0
  });

  // Execute master orchestrator - it will handle everything autonomously
  const result = await executeMasterOrchestrator(demand, projectPath, frontendFlowDir, claude, options);

  // Calculate duration
  const duration = formatDuration(Date.now() - startTime);

  return {
    ...result,
    duration,
    classification
  };
}

async function loadConfigurations(frontendFlowDir) {
  const configsDir = path.join(frontendFlowDir, 'configs');

  const orchestratorConfig = await fs.readJSON(path.join(configsDir, 'orchestrator_config.json'));
  const parallelConfig = await fs.readJSON(path.join(configsDir, 'parallel_execution_config.json'));
  const cacheConfig = await fs.readJSON(path.join(configsDir, 'cache_config.json'));

  return {
    orchestrator: orchestratorConfig,
    parallel: parallelConfig,
    cache: cacheConfig
  };
}

async function classifyDemand(demand, projectInfo, options = {}) {
  const demandLower = demand.toLowerCase();

  // Build base pipeline with essential agents
  let pipeline = ['agent_react_components', 'agent_tailwind_estilization'];
  let type = 'component_novo';

  // Context-aware agent selection
  const agentSelectors = {
    // GitHub integration - include by default for git repos (professional workflow)
    github: () => {
      // Skip GitHub if explicitly requested or CLI option
      if (options.noGithub || options['no-github'] ||
          demandLower.includes('sem github') ||
          demandLower.includes('sem pr') ||
          demandLower.includes('local only') ||
          demandLower.includes('apenas local')) {
        return;
      }

      try {
        const { execSync } = require('child_process');
        execSync('git rev-parse --git-dir', { cwd: projectInfo.path, stdio: 'ignore' });
        pipeline.unshift('agent_github_flow');
        pipeline.push('agent_github_pullrequest');
      } catch (e) {
        // Not a git repo, skip GitHub agents
      }
    },

    // Figma integration - only if explicitly mentioned
    figma: () => {
      if (demandLower.includes('figma') ||
          demandLower.includes('design system') ||
          demandLower.includes('token') ||
          demandLower.includes('selecionando no figma') ||
          demandLower.includes('baseado em figma')) {
        pipeline.splice(1, 0, 'agent_figma_extract');
      }
    },

    // Analytics - if configured in project or explicitly requested
    analytics: () => {
      const hasAnalyticsConfig = projectInfo.packageJson?.dependencies?.['@analytics/core'] ||
                                projectInfo.packageJson?.dependencies?.['react-ga4'] ||
                                projectInfo.packageJson?.dependencies?.['gtag'] ||
                                projectInfo.packageJson?.devDependencies?.['@analytics/core'];

      if (hasAnalyticsConfig ||
          demandLower.includes('analytics') ||
          demandLower.includes('métricas') ||
          demandLower.includes('tracking') ||
          demandLower.includes('rastreamento') ||
          demandLower.includes('google analytics')) {
        pipeline.push('agent_analytics');
      }
    },

    // Redux - only for complex state management
    redux: () => {
      if (demandLower.includes('estado') ||
          demandLower.includes('redux') ||
          demandLower.includes('global') ||
          demandLower.includes('compartilhado') ||
          demandLower.includes('dashboard') ||
          demandLower.includes('carrinho') ||
          demandLower.includes('contexto')) {
        pipeline.splice(-1, 0, 'agent_redux_toolkit');
      }
    },

    // Security - only if security mentioned or auth related
    security: () => {
      if (demandLower.includes('segur') ||
          demandLower.includes('login') ||
          demandLower.includes('auth') ||
          demandLower.includes('2fa') ||
          demandLower.includes('senha') ||
          demandLower.includes('jwt') ||
          demandLower.includes('token')) {
        pipeline.push('agent_security');
      }
    },

    // Performance - only if performance mentioned
    performance: () => {
      if (demandLower.includes('performance') ||
          demandLower.includes('otimizar') ||
          demandLower.includes('velocidade') ||
          demandLower.includes('carregamento') ||
          demandLower.includes('bundle') ||
          demandLower.includes('lazy loading')) {
        pipeline.push('agent_performance');
        type = 'performance_focus';
      }
    },

    // Responsive/Accessibility - smart defaults for UI components
    responsive: () => {
      if (demandLower.includes('responsiv') ||
          demandLower.includes('mobile') ||
          demandLower.includes('tablet') ||
          demandLower.includes('adaptável')) {
        pipeline.push('agent_responsiveness');
      }
    },

    // Accessibility - include by default for user-facing components
    accessibility: () => {
      if (!demandLower.includes('interno') &&
          !demandLower.includes('admin') &&
          !demandLower.includes('debug') &&
          !demandLower.includes('dev only')) {
        pipeline.push('agent_accessibility');
      }
    },

    // I18n - only if internationalization mentioned or configured
    i18n: () => {
      const hasI18nConfig = projectInfo.packageJson?.dependencies?.['react-i18next'] ||
                           projectInfo.packageJson?.dependencies?.['next-i18next'] ||
                           projectInfo.packageJson?.dependencies?.['i18next'];

      if (hasI18nConfig ||
          demandLower.includes('i18n') ||
          demandLower.includes('internacionaliz') ||
          demandLower.includes('idioma') ||
          demandLower.includes('tradução') ||
          demandLower.includes('multilíngue')) {
        pipeline.push('agent_i_18_n');
      }
    },

    // Tests - based on complexity and project setup
    tests: () => {
      const hasTestConfig = projectInfo.packageJson?.devDependencies?.jest ||
                           projectInfo.packageJson?.devDependencies?.['@testing-library/react'] ||
                           projectInfo.packageJson?.devDependencies?.vitest;

      if (hasTestConfig ||
          demandLower.includes('dashboard') ||
          demandLower.includes('sistema') ||
          demandLower.includes('feature') ||
          demandLower.includes('funcionalidade') ||
          demandLower.includes('teste')) {
        pipeline.push('agent_integration_tests');
      }

      if (demandLower.includes('e2e') ||
          demandLower.includes('end-to-end') ||
          demandLower.includes('cypress') ||
          demandLower.includes('playwright')) {
        pipeline.push('agent_e_2_e_cypress');
      }
    },

    // Animations - only if mentioned
    animations: () => {
      if (demandLower.includes('animaç') ||
          demandLower.includes('transição') ||
          demandLower.includes('hover') ||
          demandLower.includes('interativ') ||
          demandLower.includes('framer') ||
          demandLower.includes('motion')) {
        pipeline.push('agent_animations');
      }
    }
  };

  // Execute all selectors
  Object.values(agentSelectors).forEach(selector => selector());

  // Always add code quality as final step before GitHub
  const githubIndex = pipeline.findIndex(agent => agent === 'agent_github_pullrequest');
  if (githubIndex > -1) {
    pipeline.splice(githubIndex, 0, 'agent_code_quality');
  } else {
    pipeline.push('agent_code_quality');
  }

  // Classify type based on complexity
  if (demandLower.includes('dashboard') || demandLower.includes('sistema') || pipeline.length > 6) {
    type = 'feature_completa';
  } else if (demandLower.includes('refator') || demandLower.includes('melhorar') || demandLower.includes('modernizar')) {
    type = 'refatoracao';
  } else if (demandLower.includes('design') || demandLower.includes('figma') || demandLower.includes('ui/ux')) {
    type = 'ui_ux_focus';
  }

  console.log(chalk.gray(`🎯 Pipeline selecionado: ${pipeline.join(' → ')}`));

  return {
    type,
    pipeline,
    confidence: 0.85,
    parallelGroups: identifyParallelGroups(pipeline)
  };
}

function identifyParallelGroups(pipeline) {
  // Define which agents can run in parallel
  const parallelMappings = {
    group_1: ['agent_react_components', 'agent_figma_extract'],
    group_2: ['agent_tailwind_estilization', 'agent_performance'],
    group_3: ['agent_accessibility', 'agent_security'],
    group_4: ['agent_integration_tests', 'agent_analytics']
  };

  const groups = [];
  let currentGroup = [];

  for (const agent of pipeline) {
    // Check if this agent can be parallel with previous
    const canBeParallel = Object.values(parallelMappings).some(group =>
      group.includes(agent) && group.some(a => currentGroup.includes(a))
    );

    if (canBeParallel && currentGroup.length > 0) {
      currentGroup.push(agent);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }
      currentGroup = [agent];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

async function executeMasterOrchestrator(demand, projectPath, frontendFlowDir, claude, options) {
  const startTime = Date.now();

  console.log(chalk.blue('🤖 Executando Master Orchestrator...'));

  try {
    // The master orchestrator will analyze, plan, and execute everything autonomously
    const masterTask = `Analisar e orquestrar completamente: "${demand}"

EXECUTE TODOS OS 22 AGENTES NA SEQUÊNCIA:
1. agent_github_flow (sempre)
2. agent_nlp_classifier (sempre)
3. agent_figma_extract (se aplicável)
4. agent_react_components (sempre)
5. agent_redux_toolkit (se aplicável)
6. agent_tailwind_estilization (sempre)
7. agent_animations (se aplicável)
8. agent_responsiveness (sempre)
9. agent_accessibility (sempre)
10. agent_i_18_n (se aplicável)
11. agent_performance (sempre)
12. agent_security (sempre)
13. agent_analytics (se aplicável)
14. agent_code_quality (sempre)
15. agent_integration_tests (sempre)
16. agent_e_2_e_cypress (se aplicável)
17. agent_pipeline_optimizer (sempre)
18. agent_state_manager (sempre)
19. agent_auto_healing (sempre)
20. agent_cleanup_manager (sempre)
21. agent_metrics_collector (sempre)
22. agent_github_pullrequest (sempre)

CONVENÇÕES OBRIGATÓRIAS:
- Branch DEVE ser em inglês: feature/task-name-in-english
- Commits DEVEM ser em inglês: "feat: add responsive login button"
- Issues podem ser em português (para comunicação da equipe)

IMPORTANTE: Cada agente decide se deve agir ou pular, mas TODOS devem ser chamados.

GERENCIAMENTO DE ESTADO OBRIGATÓRIO:
- ANTES de cada agente: Atualizar ${frontendFlowDir}/temp/current_pipeline_state.md
- DEPOIS de cada agente: Registrar resultado em ${frontendFlowDir}/temp/execution_context.json
- Manter histórico completo em ${frontendFlowDir}/temp/pipeline_history.log
- Esses arquivos são CRÍTICOS para auditoria e cleanup posterior

Trabalhe de forma 100% autônoma - você tem controle total sobre o processo.`;

    // Update state before master orchestrator execution
    await updateStateFile(frontendFlowDir, {
      status: 'EXECUTING',
      currentAgent: 'agent_master_orchestrator',
      currentTask: 'Executando master orchestrator - controle total dos 22 agentes',
      progress: 10,
      event: 'master_orchestrator_start',
      recentActivity: 'Master orchestrator assumindo controle total do pipeline',
      agentsCompleted: 0
    });

    const result = await claude.executeAgent(
      'agent_master_orchestrator',
      projectPath,
      masterTask,
      {
        ...options,
        // Master orchestrator needs full context
        masterMode: true,
        demand: demand,
        frontendFlowDir: frontendFlowDir
      }
    );

    // Update state after master orchestrator execution
    await updateStateFile(frontendFlowDir, {
      status: result.success ? 'COMPLETED' : 'FAILED',
      currentAgent: 'pipeline_complete',
      currentTask: result.success ? 'Pipeline executado com sucesso' : 'Pipeline falhou',
      progress: result.success ? 100 : 0,
      event: 'master_orchestrator_complete',
      recentActivity: `Master orchestrator finalizado: ${result.success ? 'SUCESSO' : 'FALHA'}`,
      agentsCompleted: result.agentsExecuted || 22
    });

    const duration = formatDuration(Date.now() - startTime);

    return {
      success: result.success,
      duration: duration,
      agentsExecuted: result.agentsExecuted || 1,
      filesModified: result.filesModified || 0,
      orchestratedByMaster: true,
      masterOutput: result.output
    };

  } catch (error) {
    console.error(chalk.red('❌ Erro no Master Orchestrator:'), error.message);
    throw error;
  }
}

async function executePipeline(classification, demand, projectPath, frontendFlowDir, claude, options) {
  const { pipeline, parallelGroups } = classification;
  let agentsExecuted = 0;
  let filesModified = 0;

  console.log(chalk.blue(`🚀 Executando pipeline com ${parallelGroups.length} grupos...`));

  for (let i = 0; i < parallelGroups.length; i++) {
    const group = parallelGroups[i];

    if (group.length === 1) {
      console.log(chalk.cyan(`📝 Executando: ${group[0]}`));
      const agentOptions = {
        ...options,
        nonInteractive: options.nonInteractive || options['non-interactive']
      };
      const agentTask = group[0] === 'agent_github_flow'
        ? `Criar issue e branch para: "${demand}"

IMPORTANTE:
- Branch DEVE ser em inglês: feature/task-name-in-english
- Commits DEVEM ser em inglês: "feat: add responsive login button"
- Issues podem ser em português`
        : group[0] === 'agent_github_pullrequest'
        ? `Criar PR para: "${demand}"`
        : `Implementar: "${demand}" usando ${group[0]}`;

      const result = await claude.executeAgent(group[0], projectPath, agentTask, agentOptions);
      if (result.success) {
        filesModified += result.filesCreated || 1;
      }
      agentsExecuted++;
    } else {
      console.log(chalk.cyan(`⚡ Execução paralela: ${group.join(' + ')}`));
      const results = await Promise.all(
        group.map(agent => {
          const agentOptions = {
            ...options,
            nonInteractive: options.nonInteractive || options['non-interactive']
          };

          const agentTask = agent === 'agent_github_flow'
            ? `Criar issue e branch para: "${demand}"

IMPORTANTE:
- Branch DEVE ser em inglês: feature/task-name-in-english
- Commits DEVEM ser em inglês: "feat: add responsive login button"
- Issues podem ser em português`
            : agent === 'agent_github_pullrequest'
            ? `Criar PR para: "${demand}"`
            : `Implementar: "${demand}" usando ${agent}`;

          return claude.executeAgent(agent, projectPath, agentTask, agentOptions);
        })
      );
      results.forEach(result => {
        if (result.success) {
          filesModified += result.filesCreated || 1;
        }
      });
      agentsExecuted += group.length;
    }

    // Update progress
    const progress = Math.round(((i + 1) / parallelGroups.length) * 100);
    await updateStateFile(frontendFlowDir, {
      progress: progress,
      currentGroup: group,
      agentsCompleted: agentsExecuted
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return {
    agentsExecuted,
    filesModified,
    pullRequest: null, // Will be set by agent_github_pullrequest
    claudeStatus: claude.getStatus()
  };
}

async function updateStateFile(frontendFlowDir, updates) {
  try {
    const tempDir = path.join(frontendFlowDir, 'temp');
    const stateFilePath = path.join(tempDir, 'current_pipeline_state.md');
    const contextFilePath = path.join(tempDir, 'execution_context.json');
    const historyFilePath = path.join(tempDir, 'pipeline_history.log');

    // Ensure both frontend flow and temp directories exist with proper permissions
    await fs.ensureDir(frontendFlowDir, { mode: 0o755 });
    await fs.ensureDir(tempDir, { mode: 0o755 });

  // Update current pipeline state
  const timestamp = new Date().toISOString();
  const stateContent = `# Frontend Flow Pipeline State

**Last Updated**: ${timestamp}
**Status**: ${updates.status || 'RUNNING'}
**Current Agent**: ${updates.currentAgent || 'N/A'}
**Progress**: ${updates.progress || 0}%

## Current Task
${updates.currentTask || 'Initializing...'}

## Agents Completed
${updates.agentsCompleted || 0} of 22

## Recent Activity
${updates.recentActivity || 'Pipeline started'}

---
*This file is automatically updated by the orchestrator*
`;

  await fs.writeFile(stateFilePath, stateContent);

  // Update execution context
  let contextData = {};
  try {
    if (await fs.pathExists(contextFilePath)) {
      contextData = await fs.readJSON(contextFilePath);
    }
  } catch (error) {
    // File doesn't exist or is invalid, start fresh
  }

  const updatedContext = {
    ...contextData,
    lastUpdate: timestamp,
    ...updates,
    history: [...(contextData.history || []), {
      timestamp,
      event: updates.event || 'update',
      data: updates
    }]
  };

    await fs.writeJSON(contextFilePath, updatedContext, { spaces: 2 });

    // Append to history log
    const logEntry = `[${timestamp}] ${updates.event || 'UPDATE'}: ${JSON.stringify(updates)}\n`;
    await fs.appendFile(historyFilePath, logEntry);

    console.log(chalk.gray(`📝 Estado salvo em: ${stateFilePath}`));
  } catch (error) {
    console.error(chalk.red(`❌ Erro ao salvar estado: ${error.message}`));
    console.error(chalk.yellow(`📍 Diretório de trabalho: ${frontendFlowDir}`));
    console.error(chalk.yellow(`📍 Diretório temp: ${frontendFlowDir}/temp`));

    if (error.code === 'EACCES') {
      console.error(chalk.red('🔒 Erro de permissão - verifique se tem acesso de escrita ao diretório'));
    } else if (error.code === 'ENOENT') {
      console.error(chalk.red('📁 Diretório não encontrado - criando estrutura necessária'));
    }

    // Continue execution even if state file fails
  }
}

function simulatePipelineExecution(classification, projectPath) {
  return {
    agentsExecuted: classification.pipeline.length,
    filesModified: 0,
    duration: '0s (simulação)',
    pullRequest: null
  };
}

async function simulateOrchestration(demand, projectPath) {
  console.log(chalk.yellow('🎭 Simulando Master Orchestrator...'));
  console.log(chalk.gray(`   Analisaria: "${demand}"`));
  console.log(chalk.gray('   Planejaria pipeline otimizado'));
  console.log(chalk.gray('   Executaria agentes autonomamente'));

  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    success: true,
    duration: '2s',
    agentsExecuted: 'simulated',
    filesModified: 'simulated',
    simulation: true
  };
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

module.exports = { runPipeline };