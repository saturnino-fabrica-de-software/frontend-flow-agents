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

  console.log(chalk.blue('🧠 Classificando demanda...'));

  // Simulate NLP classification (this would integrate with actual Claude API)
  const classification = await classifyDemand(demand, projectInfo);

  console.log(chalk.green(`✅ Classificado como: ${classification.type}`));
  console.log(chalk.cyan(`📝 Pipeline: ${classification.pipeline.join(' → ')}`));

  if (options.dryRun) {
    console.log(chalk.yellow('🔍 Modo dry-run - simulando execução...'));
    return simulatePipelineExecution(classification, projectPath);
  }

  // Update state file
  await updateStateFile(frontendFlowDir, {
    status: 'RUNNING',
    demand: demand,
    classification: classification,
    startTime: new Date().toISOString()
  });

  // Execute pipeline with Claude integration
  const result = await executePipeline(classification, projectPath, frontendFlowDir, claude, options);

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

async function classifyDemand(demand, projectInfo) {
  const demandLower = demand.toLowerCase();

  // Build base pipeline with essential agents
  let pipeline = ['agent_react_components', 'agent_tailwind_estilization'];
  let type = 'component_novo';

  // Context-aware agent selection
  const agentSelectors = {
    // GitHub integration - only if git repo exists
    github: () => {
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

async function executePipeline(classification, projectPath, frontendFlowDir, claude, options) {
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
      const result = await claude.executeAgent(group[0], projectPath, `Executar ${group[0]}`, agentOptions);
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
          return claude.executeAgent(agent, projectPath, `Executar ${agent}`, agentOptions);
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
  const stateFilePath = path.join(frontendFlowDir, 'temp', 'current_pipeline_state.md');

  // This would update the live state file with current progress
  // For now, we just log the update
  console.log(chalk.gray(`📝 Estado atualizado: ${JSON.stringify(updates)}`));
}

function simulatePipelineExecution(classification, projectPath) {
  return {
    agentsExecuted: classification.pipeline.length,
    filesModified: 0,
    duration: '0s (simulação)',
    pullRequest: null
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