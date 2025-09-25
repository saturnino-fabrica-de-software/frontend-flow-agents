const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const chalk = require('chalk');
const ClaudeIntegration = require('./claude-integration');

async function checkSystemHealth() {
  console.log(chalk.blue('🏥 Frontend Flow - Verificação do Sistema'));
  console.log('');

  let allChecksPass = true;

  // Check Node.js version
  console.log(chalk.cyan('📦 Verificando Node.js...'));
  const nodeVersion = process.version;
  const nodeVersionMajor = parseInt(nodeVersion.slice(1).split('.')[0]);

  if (nodeVersionMajor >= 16) {
    console.log(chalk.green(`  ✅ Node.js ${nodeVersion} (compatível)`));
  } else {
    console.log(chalk.red(`  ❌ Node.js ${nodeVersion} (requer >= 16.0.0)`));
    allChecksPass = false;
  }

  // Check Claude Code integration
  console.log('');
  console.log(chalk.cyan('🤖 Verificando Claude Code...'));

  const claude = new ClaudeIntegration();
  const claudeAvailable = await claude.detectClaudeCode();

  if (claudeAvailable) {
    const claudeStatus = claude.getStatus();
    console.log(chalk.green(`  ✅ Claude Code encontrado: ${claudeStatus.path}`));
    console.log(chalk.gray(`     Agentes poderão executar com IA real`));
  } else {
    console.log(chalk.yellow('  ⚠️  Claude Code não encontrado'));
    console.log(chalk.gray('     Agentes executarão em modo simulação'));
    console.log(chalk.cyan('     💡 Para instalar: npm install -g claude-code'));
  }

  // Check Git
  console.log('');
  console.log(chalk.cyan('📋 Verificando Git...'));

  try {
    const gitVersion = await execPromise('git --version');
    console.log(chalk.green(`  ✅ ${gitVersion.trim()}`));
  } catch (error) {
    console.log(chalk.red('  ❌ Git não encontrado'));
    console.log(chalk.cyan('     💡 Instale Git para funcionalidades completas'));
    allChecksPass = false;
  }

  // Check NPM
  console.log('');
  console.log(chalk.cyan('📦 Verificando NPM...'));

  try {
    const npmVersion = await execPromise('npm --version');
    console.log(chalk.green(`  ✅ NPM v${npmVersion.trim()}`));
  } catch (error) {
    console.log(chalk.red('  ❌ NPM não encontrado'));
    allChecksPass = false;
  }

  // Check current project (if in one)
  console.log('');
  console.log(chalk.cyan('📁 Verificando projeto atual...'));

  const currentDir = process.cwd();
  const packageJsonPath = path.join(currentDir, 'package.json');
  const frontendFlowPath = path.join(currentDir, '.frontend-flow');

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJSON(packageJsonPath);
    console.log(chalk.green(`  ✅ Projeto: ${packageJson.name}`));

    // Check if it's a React project
    const isReact = packageJson.dependencies?.react || packageJson.devDependencies?.react;
    if (isReact) {
      console.log(chalk.green('  ✅ Projeto React detectado'));
    } else {
      console.log(chalk.yellow('  ⚠️  Projeto não-React (funcionalidade limitada)'));
    }

    // Check if Frontend Flow is initialized
    if (await fs.pathExists(frontendFlowPath)) {
      console.log(chalk.green('  ✅ Frontend Flow inicializado'));

      // Check agents
      const agentsPath = path.join(frontendFlowPath, 'agents');
      if (await fs.pathExists(agentsPath)) {
        const agentFiles = await fs.readdir(agentsPath);
        const agentCount = agentFiles.filter(f => f.endsWith('.md')).length;
        console.log(chalk.green(`  ✅ ${agentCount} agentes disponíveis`));
      }

    } else {
      console.log(chalk.yellow('  ⚠️  Frontend Flow não inicializado'));
      console.log(chalk.cyan('     💡 Execute: frontend-flow init'));
    }
  } else {
    console.log(chalk.gray('  ℹ️  Não está em um projeto NPM'));
  }

  // System recommendations
  console.log('');
  console.log(chalk.blue('💡 Recomendações do Sistema:'));

  if (!claudeAvailable) {
    console.log(chalk.yellow('  • Instale Claude Code para execução real dos agentes'));
    console.log(chalk.gray('    npm install -g claude-code'));
  }

  if (!await fs.pathExists(frontendFlowPath) && await fs.pathExists(packageJsonPath)) {
    console.log(chalk.yellow('  • Execute "frontend-flow init" para configurar o projeto'));
  }

  // Final status
  console.log('');
  if (allChecksPass) {
    console.log(chalk.green('🎉 Sistema saudável e pronto para uso!'));
  } else {
    console.log(chalk.yellow('⚠️  Sistema funcional com algumas limitações'));
    console.log(chalk.gray('   Resolva os problemas acima para funcionalidade completa'));
  }

  // Performance tips
  console.log('');
  console.log(chalk.blue('⚡ Dicas de Performance:'));
  console.log(chalk.gray('  • Use --verbose para debug detalhado'));
  console.log(chalk.gray('  • Use --dry-run para testar pipelines'));
  console.log(chalk.gray('  • Configure CLAUDE_PATH se Claude estiver em local customizado'));

  return allChecksPass;
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

module.exports = { checkSystemHealth };