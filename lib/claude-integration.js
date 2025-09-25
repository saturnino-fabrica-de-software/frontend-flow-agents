const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const chalk = require('chalk');

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
      console.log(chalk.yellow(`⚠️  Simulando ${agentName} (Claude Code não disponível)`));
      return this.simulateAgent(agentName, context);
    }

    console.log(chalk.blue(`🤖 Executando ${agentName} via Claude Code...`));

    try {
      // Prepare agent context
      const agentContext = await this.prepareAgentContext(agentName, projectPath, context);

      // Execute via Claude Code
      const result = await this.callClaudeCode(agentContext, projectPath, options);

      console.log(chalk.green(`✅ ${agentName} executado com sucesso`));
      return result;

    } catch (error) {
      console.error(chalk.red(`❌ Erro executando ${agentName}:`), error.message);

      if (options.fallback !== false) {
        console.log(chalk.yellow(`🔄 Tentando fallback para ${agentName}...`));
        return this.simulateAgent(agentName, context);
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
    return new Promise((resolve, reject) => {
      // Prepare Claude Code command
      const prompt = this.buildClaudePrompt(agentContext);

      // Write prompt to temporary file
      const tempPromptFile = path.join(projectPath, '.frontend-flow', 'temp', 'current_prompt.txt');
      fs.writeFileSync(tempPromptFile, prompt);

      // Execute Claude Code
      const claudeProcess = spawn(this.claudePath.split(' ')[0], [
        ...this.claudePath.split(' ').slice(1),
        tempPromptFile
      ], {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      claudeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.verbose) {
          process.stdout.write(chalk.gray(data.toString()));
        }
      });

      claudeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        if (options.verbose) {
          process.stderr.write(chalk.red(data.toString()));
        }
      });

      claudeProcess.on('close', (code) => {
        // Clean up temp file
        fs.remove(tempPromptFile).catch(() => {});

        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            agent: agentContext.agent
          });
        } else {
          reject(new Error(`Claude Code exited with code ${code}. Error: ${stderr}`));
        }
      });

      claudeProcess.on('error', (error) => {
        // Clean up temp file
        fs.remove(tempPromptFile).catch(() => {});
        reject(new Error(`Failed to execute Claude Code: ${error.message}`));
      });

      // Set timeout
      setTimeout(() => {
        claudeProcess.kill();
        reject(new Error('Claude Code execution timeout'));
      }, options.timeout || 60000); // 1 minute default for faster testing
    });
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