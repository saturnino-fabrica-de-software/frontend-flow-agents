const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const chalk = require('chalk');
const { createSpinner } = require('./spinner');

class ClaudeIntegration {
  constructor() {
    this.claudeAvailable = false;
    this.claudePath = null;
  }

  async detectClaudeCode() {
    console.log(chalk.blue('🔍 Detectando Claude Code...'));

    // Try common installation paths
    const possiblePaths = [
      'claude',           // Global installation
      'npx claude',       // NPX
      '/usr/local/bin/claude',
      process.env.CLAUDE_PATH // Custom path
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
    console.log(chalk.cyan('💡 Instale Claude Code: npm install -g @anthropic-ai/claude-code'));
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
    if (!this.claudeAvailable) {
      const spinner = createSpinner(`Simulando ${agentName} (Claude Code não disponível)`).start();
      const result = await this.simulateAgent(agentName, context);
      spinner.warn(`${agentName} simulado`);
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
      return result;

    } catch (error) {
      if (!useInteractive) {
        spinner.fail(`Erro executando ${agentName}: ${error.message}`);
      }

      if (options.fallback !== false) {
        const fallbackSpinner = createSpinner(`Tentando fallback para ${agentName}`).start();
        const result = await this.simulateAgent(agentName, context);
        fallbackSpinner.warn(`${agentName} executado em modo simulação`);
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
    // Check if interactive mode is needed (for complex agents that might need user input)
    const needsInteractive = this.shouldUseInteractiveMode(agentContext.agent);

    if (needsInteractive && !options.nonInteractive) {
      return this.callClaudeCodeInteractive(agentContext, projectPath, options);
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Build comprehensive prompt for the agent
        const prompt = this.buildAgentPrompt(agentContext);

        // Write prompt to temp file to avoid shell escape issues
        const tempDir = path.join(projectPath, '.frontend-flow', 'temp');
        await fs.ensureDir(tempDir);
        const promptFile = path.join(tempDir, `claude_prompt_${Date.now()}.txt`);
        await fs.writeFile(promptFile, prompt);

        // Use Claude Code with prompt file instead of inline string
        const command = `${this.claudePath} --print --permission-mode acceptEdits < "${promptFile}"`;

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

          // Claude Code executed successfully
          resolve({
            success: true,
            output: stdout,
            agent: agentContext.agent,
            stderr: stderr
          });
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

  async simulateAgent(agentName, context) {
    console.log(chalk.gray(`  → Simulando ${agentName}...`));

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));

    console.log(chalk.green(`  ✅ ${agentName} simulado`));

    return {
      success: true,
      output: `Simulated execution of ${agentName}`,
      agent: agentName,
      simulated: true
    };
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