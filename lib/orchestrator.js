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
  // Simple classification logic (would be enhanced with actual NLP)
  const demandLower = demand.toLowerCase();

  let type = 'component_novo';
  let pipeline = ['agent_github_flow', 'agent_react_components', 'agent_tailwind_estilization', 'agent_code_quality'];

  // Feature patterns
  if (demandLower.includes('dashboard') || demandLower.includes('página') || demandLower.includes('tela')) {
    type = 'feature_completa';
    pipeline = [
      'agent_github_flow',
      'agent_react_components',
      'agent_redux_toolkit',
      'agent_tailwind_estilization',
      'agent_analytics',
      'agent_code_quality',
      'agent_integration_tests',
      'agent_github_pullrequest'
    ];
  }
  // Performance patterns
  else if (demandLower.includes('performance') || demandLower.includes('otimizar')) {
    type = 'performance_focus';
    pipeline = [
      'agent_github_flow',
      'agent_performance',
      'agent_code_quality',
      'agent_integration_tests',
      'agent_github_pullrequest'
    ];
  }
  // Refactoring patterns
  else if (demandLower.includes('refator') || demandLower.includes('melhorar')) {
    type = 'refatoracao';
    pipeline = [
      'agent_github_flow',
      'agent_code_quality',
      'agent_security',
      'agent_performance',
      'agent_integration_tests',
      'agent_github_pullrequest'
    ];
  }
  // UI/UX patterns
  else if (demandLower.includes('design') || demandLower.includes('responsiv')) {
    type = 'ui_ux_focus';
    pipeline = [
      'agent_github_flow',
      'agent_figma_extract',
      'agent_tailwind_estilization',
      'agent_responsiveness',
      'agent_accessibility',
      'agent_code_quality',
      'agent_github_pullrequest'
    ];
  }
  // Default component
  else {
    pipeline = [
      'agent_github_flow',
      'agent_react_components',
      'agent_tailwind_estilization',
      'agent_accessibility',
      'agent_code_quality',
      'agent_github_pullrequest'
    ];
  }

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
      const result = await claude.executeAgent(group[0], projectPath, `Executar ${group[0]}`, options);
      if (result.success) {
        filesModified += result.filesCreated || 1;
      }
      agentsExecuted++;
    } else {
      console.log(chalk.cyan(`⚡ Execução paralela: ${group.join(' + ')}`));
      const results = await Promise.all(
        group.map(agent => claude.executeAgent(agent, projectPath, `Executar ${agent}`, options))
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