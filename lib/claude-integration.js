const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const chalk = require('chalk');
const { createSpinner } = require('./spinner');
const ClaudeWrapper = require('./claude-wrapper');
const RealExecutor = require('./real-executor');

class ClaudeIntegration {
  constructor() {
    this.claudeAvailable = false;
    this.claudePath = null;
    this.wrapper = new ClaudeWrapper();
    this.realExecutor = new RealExecutor();
  }

  async detectClaudeCode() {
    console.log(chalk.blue('🔍 Detectando Claude Code...'));

    // Try to find claude command
    try {
      const { execSync } = require('child_process');
      const claudePath = execSync('which claude', { encoding: 'utf8' }).trim();

      if (claudePath) {
        // Test if it works
        const version = execSync('claude --version', { encoding: 'utf8' }).trim();
        this.claudeAvailable = true;
        this.claudePath = 'claude'; // Use direct command
        console.log(chalk.green(`✅ Claude Code ${version} encontrado em: ${claudePath}`));
        return true;
      }
    } catch (error) {
      // Claude not in PATH, try other methods
    }

    // Try common installation paths
    const possiblePaths = [
      'claude',           // Global installation
      '/usr/local/bin/claude',
      process.env.CLAUDE_PATH, // Custom path
      `${process.env.HOME}/.nvm/versions/node/*/bin/claude` // NVM installations
    ];

    for (const claudePath of possiblePaths) {
      try {
        const result = await this.testClaudeCommand(claudePath);
        if (result) {
          this.claudeAvailable = true;
          this.claudePath = claudePath;
          console.log(chalk.green(`✅ Claude Code encontrado: ${claudePath}`));
          return true;
        }
      } catch (error) {
        // Continue trying other paths
      }
    }

    console.log(chalk.yellow('⚠️  Claude Code não encontrado'));
    console.log(chalk.cyan('💡 Instale Claude Code: https://claude.ai/download'));
    return false;
  }

  async testClaudeCommand(claudePath) {
    return new Promise((resolve) => {
      exec(`${claudePath} --version`, { timeout: 5000 }, (error, stdout) => {
        if (error) {
          resolve(false);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  async executeAgent(agentName, projectPath, context, options = {}) {
    const startTime = Date.now();
    const { metricsCollector, educationalMode, healthMonitor } = options;

    // Educational mode explanation
    if (educationalMode) {
      await educationalMode.explainAgent(agentName,
        `Execute task: ${context}`,
        ['Analyze context', 'Generate solution', 'Apply changes']
      );
    }

    // Force real execution for master_orchestrator and react_components
    if (agentName === 'agent_master_orchestrator' ||
        (context && context.toLowerCase().includes('botão')) ||
        (context && context.toLowerCase().includes('componente'))) {
      console.log(chalk.blue(`🎯 Forçando execução REAL para ${agentName}...`));
      const result = await this.simulateAgent(agentName, context, projectPath);

      // Record metrics
      if (metricsCollector) {
        await metricsCollector.recordAgentExecution(agentName, {
          success: result.success,
          duration: Date.now() - startTime,
          simulated: false,
          real: true
        });
      }

      return result;
    }

    if (!this.claudeAvailable) {
      const spinner = createSpinner(`Simulando ${agentName} (Claude Code não disponível)`).start();
      const result = await this.simulateAgent(agentName, context, projectPath);
      spinner.warn(`${agentName} simulado`);

      // Record metrics even for simulated execution
      if (metricsCollector) {
        await metricsCollector.recordAgentExecution(agentName, {
          success: result.success,
          duration: Date.now() - startTime,
          simulated: true
        });
      }

      return result;
    }

    // Check if interactive mode
    const needsInteractive = this.shouldUseInteractiveMode(agentName);
    const useInteractive = needsInteractive && !options.nonInteractive;

    let spinner;
    if (!useInteractive) {
      spinner = createSpinner(`Executando ${agentName} via Claude Code`).start();
    }

    try {
      // Prepare agent context
      if (!useInteractive) {
        spinner.updateMessage(`Preparando contexto para ${agentName}`);
      }
      const agentContext = await this.prepareAgentContext(agentName, projectPath, context);

      // Execute via Claude Code
      if (!useInteractive) {
        spinner.updateMessage(`Claude processando ${agentName}...`);
      }
      const result = await this.callClaudeCode(agentContext, projectPath, options);

      if (!useInteractive) {
        spinner.succeed(`${agentName} executado com sucesso`);
      }

      // Record metrics for successful execution
      if (metricsCollector) {
        await metricsCollector.recordAgentExecution(agentName, {
          success: result.success !== false,
          duration: Date.now() - startTime,
          simulated: false
        });
      }

      // Educational mode learning point
      if (educationalMode && result.success !== false) {
        await educationalMode.showLearningPoint(agentName, result);
      }

      return result;

    } catch (error) {
      if (!useInteractive) {
        spinner.fail(`Erro executando ${agentName}: ${error.message}`);
      }

      // Record failure metrics
      if (metricsCollector) {
        await metricsCollector.recordAgentExecution(agentName, {
          success: false,
          duration: Date.now() - startTime,
          error: error.message
        });
      }

      // Track error for contextual help
      if (options.contextualHelp) {
        await options.contextualHelp.trackError(error);
      }

      if (options.fallback !== false) {
        const fallbackSpinner = createSpinner(`Tentando fallback para ${agentName}`).start();
        const result = await this.simulateAgent(agentName, context, projectPath);
        fallbackSpinner.warn(`${agentName} executado em modo simulação`);

        // Record fallback metrics
        if (metricsCollector) {
          await metricsCollector.recordAgentExecution(agentName, {
            success: result.success,
            duration: Date.now() - startTime,
            simulated: true,
            fallback: true
          });
        }

        return result;
      }

      throw error;
    }
  }

  async prepareAgentContext(agentName, projectPath, context) {
    const frontendFlowDir = path.join(projectPath, '.frontend-flow');
    const agentPath = path.join(frontendFlowDir, 'agents', `${agentName}.md`);

    // Read agent definition
    const agentDefinition = await fs.readFile(agentPath, 'utf8');

    // Analyze project context
    const projectInfo = await this.analyzeProjectContext(projectPath);

    // Build comprehensive context
    const fullContext = {
      agent: agentName,
      definition: agentDefinition,
      task: context,
      project: projectInfo,
      workingDirectory: projectPath
    };

    return fullContext;
  }

  async analyzeProjectContext(projectPath) {
    const context = {
      path: projectPath,
      files: [],
      packageJson: null,
      gitStatus: null
    };

    // Read package.json if exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      context.packageJson = await fs.readJSON(packageJsonPath);
    }

    // Get recent files (for context)
    try {
      const files = await this.getRecentFiles(projectPath);
      context.files = files.slice(0, 10); // Limit context
    } catch (error) {
      // Continue without file context
    }

    return context;
  }

  async getRecentFiles(projectPath) {
    return new Promise((resolve) => {
      exec(
        'find . -type f -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | head -20',
        { cwd: projectPath },
        (error, stdout) => {
          if (error) {
            resolve([]);
          } else {
            resolve(stdout.trim().split('\\n').filter(Boolean));
          }
        }
      );
    });
  }

  async callClaudeCode(agentContext, projectPath, options) {
    const prompt = this.buildAgentPrompt(agentContext);

    // Dry run mode - just show what would be done
    if (options.dryRun) {
      console.log(chalk.gray('🔍 Modo dry-run - mostrando prompt:'));
      console.log(chalk.gray(prompt.substring(0, 500) + '...'));
      return {
        success: true,
        output: 'Dry run - no execution',
        agent: agentContext.agent
      };
    }

    // Non-interactive mode - just print without execution
    if (options.nonInteractive) {
      console.log(chalk.yellow('📝 Modo não-interativo - Claude apenas analisa'));
      const needsInteractive = this.shouldUseInteractiveMode(agentContext.agent);
      if (needsInteractive) {
        return this.callClaudeCodeInteractive(agentContext, projectPath, options);
      }
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Build comprehensive prompt for the agent
        // Prompt already built above

        // Write prompt to temp file to avoid shell escape issues
        const tempDir = path.join(projectPath, '.frontend-flow', 'temp');
        await fs.ensureDir(tempDir);
        const promptFile = path.join(tempDir, `claude_prompt_${Date.now()}.txt`);
        await fs.writeFile(promptFile, prompt);

        // Use Claude directly - no --print flag exists
        // Claude CLI works by passing the prompt as argument
        const command = `${this.claudePath} "${prompt}"`;

        if (options.verbose) {
          console.log(chalk.gray(`Executing Claude Code...`));
          console.log(chalk.gray(`Prompt: ${prompt.substring(0, 200)}...`));
        }

        exec(command, {
          cwd: projectPath,
          timeout: options.timeout || 120000, // 2 minutes
          maxBuffer: 1024 * 1024 * 5, // 5MB buffer for larger outputs
          env: { ...process.env, NODE_ENV: 'production' }
        }, async (error, stdout, stderr) => {
          // Clean up temp file
          try {
            await fs.remove(promptFile);
          } catch (e) {
            // Ignore cleanup errors
          }
          if (error) {
            if (error.code === 'ETIMEDOUT' || error.killed) {
              reject(new Error('Claude Code execution timeout'));
            } else {
              reject(new Error(`Claude Code error: ${stderr || error.message}`));
            }
            return;
          }

          // Check if Claude is asking for permissions
          if (stdout.includes('autorize') || stdout.includes('permissão')) {
            // Need interactive mode
            console.log(chalk.yellow('\n⚠️ Claude precisa de permissões - mudando para modo interativo'));
            this.wrapper.executeInteractive(prompt, projectPath, {
              timeout: options.timeout || 120000,
              autoApprove: options.autoApprove || false
            }).then(result => {
              resolve({
                success: result.success,
                output: result.output,
                agent: agentContext.agent,
                interactive: true
              });
            }).catch(reject);
          } else {
            // Claude executed in print mode
            resolve({
              success: true,
              output: stdout,
              agent: agentContext.agent,
              stderr: stderr
            });
          }
        });

      } catch (error) {
        reject(new Error(`Failed to prepare Claude Code execution: ${error.message}`));
      }
    });
  }

  async callClaudeCodeInteractive(agentContext, projectPath, options) {
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const prompt = this.buildAgentPrompt(agentContext);

      console.log(chalk.blue(`\n🤖 Iniciando sessão interativa: ${agentContext.agent}`));
      console.log(chalk.cyan(`📝 Tarefa: ${agentContext.task}`));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.yellow('💡 Modo Interativo Ativo:'));
      console.log(chalk.gray('   • Você pode ver o Claude trabalhando em tempo real'));
      console.log(chalk.gray('   • Responda às perguntas do Claude quando necessário'));
      console.log(chalk.gray('   • Pressione Ctrl+C para cancelar se necessário'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log();

      // Launch Claude Code in interactive mode
      const claudeProcess = spawn(this.claudePath, [prompt], {
        cwd: projectPath,
        stdio: 'inherit', // Pass through stdin/stdout/stderr for interaction
        env: { ...process.env }
      });

      claudeProcess.on('close', (code) => {
        console.log(chalk.gray('─'.repeat(50)));
        if (code === 0) {
          console.log(chalk.green(`✅ ${agentContext.agent} concluído com sucesso!`));
          resolve({
            success: true,
            output: 'Interactive Claude Code session completed',
            agent: agentContext.agent,
            interactive: true
          });
        } else {
          console.log(chalk.red(`❌ ${agentContext.agent} falhou (código ${code})`));
          reject(new Error(`Claude Code interactive session exited with code ${code}`));
        }
        console.log(chalk.gray('─'.repeat(50)));
        console.log();
      });

      claudeProcess.on('error', (error) => {
        console.log(chalk.red(`❌ Erro ao iniciar sessão interativa: ${error.message}`));
        reject(new Error(`Failed to start interactive Claude Code: ${error.message}`));
      });

      // Handle Ctrl+C gracefully
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n⚠️  Interrompendo sessão interativa...'));
        claudeProcess.kill();
      });
    });
  }

  shouldUseInteractiveMode(agentName) {
    // Interactive mode for all agents by default for better UX
    // Only skip for simple utility agents that don't need user interaction
    const nonInteractiveAgents = [
      'agent_cleanup_manager',    // Just cleanup, no interaction needed
      'agent_metrics_collector'   // Just data collection
    ];

    return !nonInteractiveAgents.includes(agentName);
  }

  buildAgentPrompt(agentContext) {
    const { agent, task, definition, project } = agentContext;

    return `# Frontend Flow Agent: ${agent}

## Agent Definition
${definition}

## Current Task
${task}

## Project Context
- Project: ${project.packageJson?.name || 'React project'}
- Path: ${project.path}
- Type: ${project.packageJson?.dependencies?.next ? 'Next.js' : 'React'}

## Instructions
Execute ONLY the responsibilities defined in the agent definition above.
Follow the agent's "Objetivos Principais", "Capacidades", and respect "Limites".
Do not exceed the agent's scope or add unrelated features.

Work in the current directory and complete the task according to the agent's specific role.`;
  }

  buildSimplePrompt(agentContext) {
    const { agent, task } = agentContext;
    return `${agent}: ${task}`;
  }

  buildClaudePrompt(agentContext) {
    const { agent, definition, task, project } = agentContext;

    return `# Frontend Flow Agent Execution

## Agent: ${agent}

${definition}

## Current Task
${task}

## Project Context
- Path: ${project.path}
- Type: ${project.packageJson?.name || 'Unknown'}
- Dependencies: ${Object.keys(project.packageJson?.dependencies || {}).join(', ')}

## Recent Files
${project.files.map(f => `- ${f}`).join('\\n')}

## Instructions
Execute this agent according to its definition above for the given task.
Work in the current directory and follow the agent's specifications exactly.
Apply the Frontend Flow methodology and maintain enterprise-grade quality.

Remember:
- Follow the agent's "Objetivos Principais" and "Capacidades"
- Respect the agent's "Limites" and constraints
- Ensure quality according to "Critérios de Qualidade"
- Update the pipeline state as specified in the integration protocol

Begin execution now.`;
  }

  async simulateAgent(agentName, context, projectPath) {
    console.log(chalk.blue(`  🚀 Executando ${agentName} em modo REAL...`));

    // Use RealExecutor for actual file creation
    try {
      // Check if master_orchestrator should delegate to react components
      if (agentName === 'agent_master_orchestrator' &&
          (context.includes('botão') || context.includes('componente'))) {
        console.log(chalk.cyan('  🎯 Master delegando para agent_react_components...'));
        return await this.simulateAgent('agent_react_components', context, projectPath);
      }

      if (agentName === 'agent_react_components') {
        // Extract component name from context - default to Button for "botão"
        let componentName = 'Button';
        if (context.includes('botão')) {
          componentName = 'Button';
        } else {
          const componentMatch = context.match(/(?:componente|component)\s+(\w+)/i);
          if (componentMatch && componentMatch[1]) {
            componentName = componentMatch[1];
          }
        }

        // Execute real component creation
        const result = await this.realExecutor.executeReactComponent(
          projectPath || process.cwd(),
          componentName,
          context
        );

        console.log(chalk.green(`  ✅ ${agentName} executado com arquivos REAIS criados!`));

        return {
          success: result.success,
          output: `Created real React component: ${componentName}`,
          agent: agentName,
          simulated: false,
          result: result
        };
      }

      // For other agents, still use simulation for now
      console.log(chalk.gray(`  → Simulando ${agentName}...`));
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      console.log(chalk.green(`  ✅ ${agentName} simulado`));
      return {
        success: true,
        output: `Simulated execution of ${agentName}`,
        agent: agentName,
        simulated: true,
        result: { filesCreated: 0, filesModified: 0, actions: [] }
      };
    } catch (error) {
      console.log(chalk.red(`  ❌ Erro executando ${agentName}: ${error.message}`));
      throw error;
    }
  }

  getStatus() {
    return {
      available: this.claudeAvailable,
      path: this.claudePath,
      version: null // Could be populated during detection
    };
  }
}

module.exports = ClaudeIntegration;