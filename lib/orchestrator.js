const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ClaudeIntegration = require('./claude-integration');
const { EnhancedOrchestrator } = require('./claude-enhanced/enhanced-orchestrator');
const MetricsCollector = require('./metrics-collector');
const FrameworkDetector = require('./framework-detector');
const HealthMonitor = require('./health-monitor');
const EducationalMode = require('./educational-mode');
const ContextualHelp = require('./contextual-help');
const { getTelemetry } = require('./telemetry');
const MetricsCleaner = require('./metrics-cleaner');
const AgentLoader = require('./agent-loader');
const NLPClassifier = require('./nlp-classifier');
const RealExecutor = require('./real-executor');

async function runPipeline(demand, projectPath, options = {}) {
  const startTime = Date.now();
  const frontendFlowDir = path.join(projectPath, '.frontend-flow');

  // Initialize new modules
  const metricsCollector = new MetricsCollector();
  await metricsCollector.initialize();

  const metricsCleaner = new MetricsCleaner();
  await metricsCleaner.cleanOldMetrics();

  const frameworkDetector = new FrameworkDetector();
  const healthMonitor = new HealthMonitor();
  const contextualHelp = new ContextualHelp();
  const telemetry = getTelemetry();
  let educationalMode = null;

  // Track command execution
  telemetry.trackCommand('pipeline', options);

  // Initialize Educational Mode if enabled
  if (options.educational) {
    educationalMode = new EducationalMode({
      verbosity: options.educationalVerbosity || 'standard'
    });
    await educationalMode.initialize();
  }

  // Initialize health monitoring
  await healthMonitor.initialize();

  // Initialize Agent Loader - CRITICAL for dynamic agent discovery
  const agentLoader = new AgentLoader();
  await agentLoader.initialize(projectPath);
  console.log(chalk.blue(`🤖 ${agentLoader.getAllAgents().length} agents loaded dynamically`));

  // Initialize NLP Classifier with discovered agents
  const nlpClassifier = new NLPClassifier();
  await nlpClassifier.initialize(path.join(projectPath, '.frontend-flow', 'agents'));

  // Detect framework early for optimization
  await frameworkDetector.loadConfig();
  const frameworkInfo = await frameworkDetector.detectFramework(projectPath);

  // Determine project type (frontend/backend/fullstack)
  const projectType = determineProjectType(frameworkInfo, projectPath);

  if (!options.noFrameworkDetection) {
    await frameworkDetector.displayDetectionResult(frameworkInfo);
    console.log(chalk.cyan(`\n🎯 Otimizando pipeline para ${frameworkInfo.primary.name}...`));
  }

  // Check if Claude Enhanced mode is enabled
  const useEnhancedMode = await checkEnhancedMode(frontendFlowDir, options);

  if (useEnhancedMode) {
    console.log(chalk.magenta('✨ Frontend Flow Enhanced v2.0 - Modo Avançado ativo'));
    console.log(chalk.gray('   🧠 Mesa Técnica + Classificador NLP + Monitor Tempo Real'));

    try {
      const enhancedOrchestrator = new EnhancedOrchestrator({
        enableMonitor: !options.noMonitor,
        monitorPort: options.monitorPort,
        dashboardPort: options.dashboardPort,
        metricsCollector,
        frameworkInfo,
        educationalMode,
        ...options
      });

      await enhancedOrchestrator.initialize();
      const result = await enhancedOrchestrator.runPipeline(demand, projectPath, options);

      // Record metrics
      await metricsCollector.saveMetrics();

      return result;

    } catch (error) {
      console.log(chalk.yellow('⚠️ Enhanced mode failed, fallback to standard mode...'));
      console.error(chalk.red('Enhanced error:'), error.message);
      console.error(chalk.red('Stack trace:'), error.stack);
      if (contextualHelp && contextualHelp.trackError) {
        await contextualHelp.trackError(error);
      }
      // Continue with standard mode below
    }
  }

  console.log(chalk.blue('🚀 Frontend Flow Standard - Iniciando...'));

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
    recentActivity: `Iniciando orquestração autônoma com ${agentLoader.getAllAgents().length} agentes`,
    demand: demand,
    startTime: new Date().toISOString(),
    agentsCompleted: 0
  });

  // Use NLP Classifier to determine optimal pipeline
  const classification = nlpClassifier.classifyDemand(demand, projectType);
  console.log(chalk.cyan(`📊 Classification: ${classification.classification} (${Math.round(classification.confidence * 100)}% confidence)`));

  // Build dynamic pipeline based on classification
  const pipeline = agentLoader.buildPipeline(demand, projectType);
  console.log(chalk.blue(`🔄 Pipeline: ${pipeline.join(' → ')}`));

  // Execute master orchestrator with dynamic pipeline
  const result = await executeMasterOrchestrator(demand, projectPath, frontendFlowDir, claude, {
    ...options,
    metricsCollector,
    frameworkInfo,
    educationalMode,
    healthMonitor,
    contextualHelp,
    agentLoader,
    nlpClassifier,
    dynamicPipeline: pipeline,
    projectType,
    classification
  });

  // Save metrics after execution
  await metricsCollector.saveMetrics();

  // Generate health report if enabled
  if (options.collectMetrics) {
    await healthMonitor.generateHealthReport();
  }

  // Calculate duration
  const duration = formatDuration(Date.now() - startTime);

  // Provide contextual suggestions for next steps
  if (!options.noSuggestions) {
    await contextualHelp.provideProactiveSuggestion('pipeline_complete', result);
  }

  // Track pipeline completion
  telemetry.trackPipeline(demand, result, duration);

  // Flush telemetry
  await telemetry.flush();

  return {
    ...result,
    duration
  };
}

async function checkEnhancedMode(frontendFlowDir, options = {}) {
  try {
    // Check if explicitly disabled
    if (options.noEnhanced || options['disable-enhanced'] || options.standard) {
      return false;
    }

    // Check if explicitly enabled
    if (options.enhanced || options.advanced) {
      return true;
    }

    // Check for enhanced config
    const enhancedConfigPath = path.join(frontendFlowDir, 'configs', 'enhanced-mode.json');
    if (await fs.pathExists(enhancedConfigPath)) {
      const config = await fs.readJSON(enhancedConfigPath);
      return config.enabled === true;
    }

    // Check for Claude enhanced agents
    const claudeEnhancedDir = path.join(__dirname, 'claude-enhanced');
    if (await fs.pathExists(claudeEnhancedDir)) {
      return true; // Enhanced agents available, enable by default
    }

    return false;
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Error checking enhanced mode: ${error.message}`));
    return false;
  }
}

async function loadConfigurations(frontendFlowDir) {
  const configsDir = path.join(frontendFlowDir, 'configs');

  const orchestratorConfig = await fs.readJSON(path.join(configsDir, 'orchestrator_config.json'));
  const parallelConfig = await fs.readJSON(path.join(configsDir, 'parallel_execution_config.json'));
  const cacheConfig = await fs.readJSON(path.join(configsDir, 'cache_config.json'));

  // Load new configuration files
  const configs = {
    orchestrator: orchestratorConfig,
    parallel: parallelConfig,
    cache: cacheConfig
  };

  // Try to load additional configs if they exist
  try {
    const collaborationPatterns = path.join(__dirname, '..', 'configs', 'collaboration-patterns.json');
    if (await fs.pathExists(collaborationPatterns)) {
      configs.collaboration = await fs.readJSON(collaborationPatterns);
    }
  } catch (error) {
    // Silent fail, use defaults
  }

  try {
    const agentVersions = path.join(__dirname, '..', 'configs', 'agent-versions.json');
    if (await fs.pathExists(agentVersions)) {
      configs.versions = await fs.readJSON(agentVersions);
    }
  } catch (error) {
    // Silent fail, use defaults
  }

  try {
    const educationalConfig = path.join(__dirname, '..', 'configs', 'educational-mode.json');
    if (await fs.pathExists(educationalConfig)) {
      configs.educational = await fs.readJSON(educationalConfig);
    }
  } catch (error) {
    // Silent fail, use defaults
  }

  return configs;
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
  const { metricsCollector, educationalMode, healthMonitor, frameworkInfo } = options;

  console.log(chalk.blue('🤖 Executando Master Orchestrator...'));

  // Educational mode explanation
  if (educationalMode) {
    await educationalMode.explainConcept('master_orchestrator', {
      description: 'O Master Orchestrator coordena todos os agentes disponíveis',
      reason: 'Garante que cada agente seja executado na ordem correta',
      alternatives: ['Pipeline sequencial', 'Pipeline paralelo'],
      selected: 'Master Orchestrator'
    });
  }

  try {
    // The master orchestrator will analyze, plan, and execute everything autonomously
    const masterTask = `🎯 MISSÃO CRÍTICA: Orquestrar agentes para: "${demand}"

🚨 Executando pipeline dinâmico com ${options.dynamicPipeline ? options.dynamicPipeline.length : 'todos os'} agentes!

SEQUÊNCIA OBRIGATÓRIA COMPLETA (SEMPRE mostrar contador "Agente X/22"):
1. agent_github_flow (sempre)
2. agent_nlp_classifier (sempre)
3. agent_figma_extract (decide SKIP/APPLY)
4. agent_react_components (sempre)
5. agent_redux_toolkit (decide SKIP/APPLY)
6. agent_tailwind_estilization (sempre)
7. agent_animations (decide SKIP/APPLY)
8. agent_responsiveness (sempre)
9. agent_accessibility (sempre)
10. agent_i_18_n (decide SKIP/APPLY)
11. agent_performance (sempre)
12. agent_security (sempre)
13. agent_analytics (decide SKIP/APPLY)
14. agent_code_quality (sempre)
15. agent_integration_tests (sempre)
16. agent_e_2_e_cypress (decide SKIP/APPLY)
17. agent_pipeline_optimizer (sempre)
18. agent_state_manager (sempre)
19. agent_auto_healing (sempre)
20. agent_cleanup_manager (sempre)
21. agent_metrics_collector (sempre)
22. agent_github_pullrequest (sempre - ÚLTIMO E FINAL)

⚠️ APÓS CADA AGENTE: Imediatamente continuar para o próximo (não parar!)
⚠️ SÓ PARAR quando: X = 22 (agent_github_pullrequest concluído)
🚫 NUNCA PARAR por: "tokens", "demanda atendida", "completo" antes de 22/22

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
      currentTask: 'Executando master orchestrator - controle total dos agentes disponíveis',
      progress: 10,
      event: 'master_orchestrator_start',
      recentActivity: 'Master orchestrator assumindo controle total do pipeline',
      agentsCompleted: 0
    });

    // Start progress monitoring in background
    const progressMonitor = startProgressMonitoring(frontendFlowDir);

    // Execute agent with metrics collection
    const agentStartTime = Date.now();

    const result = await claude.executeAgent(
      'agent_master_orchestrator',
      projectPath,
      masterTask,
      {
        ...options,
        // Master orchestrator needs full context
        masterMode: true,
        demand: demand,
        frontendFlowDir: frontendFlowDir,
        frameworkInfo: frameworkInfo
      }
    );

    // Record metrics for master orchestrator
    if (metricsCollector) {
      await metricsCollector.recordAgentExecution('agent_master_orchestrator', {
        success: result.success,
        duration: Date.now() - agentStartTime,
        demand: demand,
        framework: frameworkInfo?.primary?.name || 'unknown'
      });
    }

    // Update health status
    if (healthMonitor) {
      await healthMonitor.performHealthCheck();
    }

    // Stop progress monitoring
    clearInterval(progressMonitor);

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

    // Clean up temp files after successful completion
    if (result.success) {
      console.log(chalk.yellow('🧹 Limpando arquivos temporários...'));
      await cleanupTempFiles(frontendFlowDir);
    }

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
    lastUpdate: timestamp,
    currentAgent: updates.currentAgent || contextData.currentAgent,
    currentTask: updates.currentTask || contextData.currentTask,
    progress: updates.progress || contextData.progress || 0,
    agentsCompleted: updates.agentsCompleted || contextData.agentsCompleted || 0,
    status: updates.status || contextData.status || 'RUNNING',
    totalAgents: 22,
    nextAgent: getNextAgent(updates.currentAgent),
    recentActivity: updates.recentActivity || contextData.recentActivity
  };

    await fs.writeJSON(contextFilePath, updatedContext, { spaces: 2 });

    // Simple history log entry (only major events)
    if (updates.event === 'agent_completed') {
      const logEntry = `[${timestamp}] Agent completed: ${updates.currentAgent} (${updates.agentsCompleted}/${updatedContext.totalAgents})\n`;
      await fs.appendFile(historyFilePath, logEntry);
    }

    // Only log state saves for important events, not every update
    if (updates.event === 'agent_completed' || updates.event === 'pipeline_start') {
      console.log(chalk.gray(`📝 Estado salvo em: ${stateFilePath}`));
    }
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

function startProgressMonitoring(frontendFlowDir) {
  const tempDir = path.join(frontendFlowDir, 'temp');
  let lastAgentCount = 0;
  let currentAgentIndex = 0;

  const agentList = [
    'agent_figma_extract',
    'agent_nlp_classifier',
    'agent_react_components',
    'agent_tailwind_estilization',
    'agent_responsiveness',
    'agent_accessibility',
    'agent_i_18_n',
    'agent_redux_toolkit',
    'agent_performance',
    'agent_security',
    'agent_animations',
    'agent_analytics',
    'agent_integration_tests',
    'agent_e_2_e_cypress',
    'agent_code_quality',
    'agent_github_pullrequest',
    'agent_github_flow',
    'agent_pipeline_optimizer',
    'agent_state_manager',
    'agent_metrics_collector',
    'agent_cleanup_manager'
  ];

  return setInterval(async () => {
    try {
      // Check if temp directory exists and has files
      if (await fs.pathExists(tempDir)) {
        const files = await fs.readdir(tempDir);
        const startFiles = files.filter(f => f.startsWith('agent_') && f.endsWith('_start.log'));
        const completeFiles = files.filter(f => f.startsWith('agent_') && f.endsWith('_complete.log'));

        // Extract agent name from start files to determine current agent
        const currentStartFile = startFiles.find(f => !completeFiles.some(cf =>
          cf.replace('_complete.log', '_start.log') === f
        ));

        // Disable automatic progress logging to prevent spam
        // Only track actual completion changes

        // Update completed agents count if it changed - minimal logging
        if (completeFiles.length > lastAgentCount) {
          lastAgentCount = completeFiles.length;
          const progress = Math.round((completeFiles.length / agentList.length) * 100);

          console.log(chalk.green(`✅ Agent ${completeFiles.length}/${agentList.length} completed (${progress}%)`));

          // Only update state file on major milestones to reduce noise
          if (completeFiles.length % 5 === 0 || completeFiles.length >= agentList.length) {
            await updateStateFile(frontendFlowDir, {
              status: completeFiles.length >= agentList.length ? 'COMPLETED' : 'EXECUTING',
              progress: progress,
              agentsCompleted: completeFiles.length,
              event: 'agent_completed',
              recentActivity: `${completeFiles.length} agentes concluídos de ${agentList.length}`
            });
          }
        }
      }
    } catch (error) {
      // Ignore monitoring errors to not disrupt pipeline
      console.log(chalk.yellow(`⚠️ Erro no monitoramento: ${error.message}`));
    }
  }, 3000); // Check every 3 seconds for more responsive updates
}

function getNextAgent(currentAgent) {
  const agentList = [
    'agent_figma_extract',
    'agent_nlp_classifier',
    'agent_react_components',
    'agent_tailwind_estilization',
    'agent_responsiveness',
    'agent_accessibility',
    'agent_i_18_n',
    'agent_redux_toolkit',
    'agent_performance',
    'agent_security',
    'agent_animations',
    'agent_analytics',
    'agent_integration_tests',
    'agent_e_2_e_cypress',
    'agent_code_quality',
    'agent_github_pullrequest',
    'agent_github_flow',
    'agent_pipeline_optimizer',
    'agent_state_manager',
    'agent_metrics_collector',
    'agent_cleanup_manager'
  ];

  if (!currentAgent) return agentList[0];

  const currentIndex = agentList.indexOf(currentAgent);
  if (currentIndex === -1 || currentIndex === agentList.length - 1) {
    return 'pipeline_complete';
  }

  return agentList[currentIndex + 1];
}

async function cleanupTempFiles(frontendFlowDir) {
  try {
    const tempDir = path.join(frontendFlowDir, 'temp');

    if (await fs.pathExists(tempDir)) {
      // Archive final state before cleanup
      const archiveDir = path.join(frontendFlowDir, 'archive');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = path.join(archiveDir, `pipeline-${timestamp}`);

      await fs.ensureDir(archiveDir);

      // Copy final state files to archive
      const stateFile = path.join(tempDir, 'current_pipeline_state.md');
      const contextFile = path.join(tempDir, 'execution_context.json');

      if (await fs.pathExists(stateFile)) {
        await fs.copy(stateFile, path.join(archivePath, 'final_state.md'));
      }

      if (await fs.pathExists(contextFile)) {
        await fs.copy(contextFile, path.join(archivePath, 'execution_context.json'));
      }

      // Remove temp directory
      await fs.remove(tempDir);

      console.log(chalk.green(`✅ Arquivos temporários limpos`));
      console.log(chalk.gray(`📁 Estado final arquivado em: ${archivePath}`));
    }
  } catch (error) {
    console.log(chalk.yellow(`⚠️ Erro na limpeza: ${error.message}`));
    // Continue execution even if cleanup fails
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

function determineProjectType(frameworkInfo, projectPath) {
  const secondary = frameworkInfo.secondary || [];

  const hasBackend = secondary.some(f =>
    f.name === 'NestJS' || f.name === 'Go' || f.name === 'Express'
  );

  const hasFrontend = frameworkInfo.primary.name !== 'Unknown' ||
    secondary.some(f =>
      f.name === 'React' || f.name === 'Vue' || f.name === 'Angular'
    );

  if (hasBackend && hasFrontend) {
    console.log(chalk.magenta('🔄 Full-Stack project detected'));
    return 'fullstack';
  } else if (hasBackend) {
    console.log(chalk.yellow('🔧 Backend project detected'));
    return 'backend';
  } else {
    console.log(chalk.cyan('🎨 Frontend project detected'));
    return 'frontend';
  }
}

module.exports = { runPipeline };