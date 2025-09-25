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

    const spinner = createSpinner(`Executando ${agentName} via Claude Code`).start();

    try {
      // Prepare agent context
      spinner.updateMessage(`Preparando contexto para ${agentName}`);
      const agentContext = await this.prepareAgentContext(agentName, projectPath, context);

      // Execute via Claude Code
      spinner.updateMessage(`Claude processando ${agentName}...`);
      const result = await this.callClaudeCode(agentContext, projectPath, options);

      spinner.succeed(`${agentName} executado com sucesso`);
      return result;

    } catch (error) {
      spinner.fail(`Erro executando ${agentName}: ${error.message}`);

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

      console.log(chalk.blue('\n🤖 Iniciando sessão interativa com Claude Code...'));
      console.log(chalk.gray('Você pode interagir diretamente com o Claude durante a execução.\n'));

      // Launch Claude Code in interactive mode
      const claudeProcess = spawn(this.claudePath, [prompt], {
        cwd: projectPath,
        stdio: 'inherit', // Pass through stdin/stdout/stderr for interaction
        env: { ...process.env }
      });

      claudeProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: 'Interactive Claude Code session completed',
            agent: agentContext.agent,
            interactive: true
          });
        } else {
          reject(new Error(`Claude Code interactive session exited with code ${code}`));
        }
      });

      claudeProcess.on('error', (error) => {
        reject(new Error(`Failed to start interactive Claude Code: ${error.message}`));
      });
    });
  }

  shouldUseInteractiveMode(agentName) {
    // Agents that might benefit from interactive mode
    const interactiveAgents = [
      'agent_figma_extract',      // Might need design decisions
      'agent_github_flow',        // Might need PR confirmation
      'agent_github_pullrequest', // Definitely needs PR creation confirmation
      'agent_analytics'           // Might need tracking decisions
    ];

    return interactiveAgents.includes(agentName);
  }

  buildAgentPrompt(agentContext) {
    const { agent, task, definition, project } = agentContext;

    return `Acting as Frontend Flow ${agent}, execute this task: "${task}"

Context: This is a ${project.packageJson?.name || 'React'} project at ${project.path}

Please:
1. Analyze the current project structure
2. Execute the task according to best practices for ${agent}
3. Create/modify files as needed
4. Follow React/TypeScript conventions
5. Ensure code quality and consistency

Task: ${task}

Work in the current directory and make the necessary changes to complete this task effectively.`;
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