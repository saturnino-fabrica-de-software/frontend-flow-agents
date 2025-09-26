const { spawn } = require('child_process');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

class ClaudeWrapper {
  constructor() {
    this.claudePath = 'claude';
  }

  /**
   * Execute Claude in interactive mode allowing user to approve permissions
   */
  async executeInteractive(prompt, projectPath, options = {}) {
    if (!options.silent) {
      console.log(chalk.cyan('\n╔════════════════════════════════════════════════════════╗'));
      console.log(chalk.cyan('║         🤖 MODO INTERATIVO COM CLAUDE ATIVO 🤖        ║'));
      console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝'));

      if (options.autoApprove) {
        console.log(chalk.magenta('\n⚡ AUTO-APPROVE ATIVADO - Todas as ações serão aprovadas'));
        console.log(chalk.red('⚠️  CUIDADO: Claude executará TODAS as ações automaticamente!\n'));
      } else {
        console.log(chalk.yellow('\n📋 Claude solicitará permissão para:'));
        console.log(chalk.gray('   • Criar ou modificar arquivos'));
        console.log(chalk.gray('   • Executar comandos'));
        console.log(chalk.gray('   • Instalar dependências\n'));
        console.log(chalk.green('✅ Quando solicitado:'));
        console.log(chalk.green('   Digite "yes" ou "y" para aprovar'));
        console.log(chalk.red('   Digite "no" ou "n" para recusar\n'));
      }
    }

    return new Promise((resolve, reject) => {
      // Start Claude in interactive mode
      const claude = spawn(this.claudePath, [], {
        cwd: projectPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      // Send the prompt to Claude
      claude.stdin.write(prompt);
      claude.stdin.write('\n');

      // Setup readline to handle Claude's output
      const rl = readline.createInterface({
        input: claude.stdout,
        output: process.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        output += line + '\n';

        // Check if Claude is asking for permission
        if (line.includes('autorize') || line.includes('permissão') || line.includes('approve')) {
          console.log(chalk.yellow('\n🔐 Claude solicitando permissão...'));

          if (options.autoApprove) {
            // Auto-approve if configured
            console.log(chalk.green('✅ Auto-aprovando ação...'));
            claude.stdin.write('yes\n');
          } else {
            // Ask user for permission
            console.log(chalk.cyan('Digite "yes" para aprovar ou "no" para recusar:'));

            const userRl = readline.createInterface({
              input: process.stdin,
              output: process.stdout
            });

            userRl.question('> ', (answer) => {
              claude.stdin.write(answer + '\n');
              userRl.close();
            });
          }
        }
      });

      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      claude.on('close', (code) => {
        rl.close();

        if (code === 0) {
          resolve({
            success: true,
            output: output,
            code: code
          });
        } else {
          reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
        }
      });

      // Handle timeout
      if (options.timeout) {
        setTimeout(() => {
          claude.kill();
          reject(new Error('Claude execution timeout'));
        }, options.timeout);
      }
    });
  }

  /**
   * Execute Claude with auto-approval of permissions (careful!)
   */
  async executeWithAutoApproval(prompt, projectPath, options = {}) {
    console.log(chalk.magenta('\n⚡ Modo Auto-Approval ativado'));
    console.log(chalk.yellow('⚠️  CUIDADO: Todas as ações serão aprovadas automaticamente!'));

    // Create a temporary script that auto-approves
    const tempScript = path.join(projectPath, '.frontend-flow', 'temp', 'claude-auto.sh');
    await fs.ensureDir(path.dirname(tempScript));

    const scriptContent = `#!/bin/bash
echo "${prompt.replace(/"/g, '\\"')}" | claude | while IFS= read -r line; do
  echo "$line"
  if [[ "$line" == *"autorize"* ]] || [[ "$line" == *"permissão"* ]]; then
    echo "yes"
  fi
done`;

    await fs.writeFile(tempScript, scriptContent);
    await fs.chmod(tempScript, '755');

    return new Promise((resolve, reject) => {
      const process = spawn('bash', [tempScript], {
        cwd: projectPath
      });

      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', async (code) => {
        // Clean up temp script
        try {
          await fs.remove(tempScript);
        } catch (e) {
          // Ignore
        }

        if (code === 0) {
          resolve({
            success: true,
            output: output,
            code: code
          });
        } else {
          reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * Execute Claude in batch mode with predefined responses
   */
  async executeBatch(prompts, projectPath, options = {}) {
    const results = [];

    for (const prompt of prompts) {
      console.log(chalk.blue(`\n📝 Executando: ${prompt.name || 'Task'}`));

      try {
        const result = await this.executeInteractive(prompt.content, projectPath, {
          ...options,
          autoApprove: prompt.autoApprove || options.autoApproveAll
        });

        results.push({
          name: prompt.name,
          success: true,
          output: result.output
        });
      } catch (error) {
        results.push({
          name: prompt.name,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = ClaudeWrapper;