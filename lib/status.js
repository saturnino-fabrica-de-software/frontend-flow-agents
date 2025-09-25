const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function showStatus(projectPath) {
  const frontendFlowDir = path.join(projectPath, '.frontend-flow');

  if (!await fs.pathExists(frontendFlowDir)) {
    console.log(chalk.red('❌ Frontend Flow não inicializado neste projeto'));
    console.log(chalk.cyan('💡 Execute: frontend-flow init'));
    return;
  }

  const stateFilePath = path.join(frontendFlowDir, 'temp', 'current_pipeline_state.md');

  if (await fs.pathExists(stateFilePath)) {
    console.log(chalk.blue('📊 Status do Pipeline:'));
    console.log('');

    const stateContent = await fs.readFile(stateFilePath, 'utf8');
    console.log(stateContent);
  } else {
    console.log(chalk.yellow('⚠️  Nenhum pipeline ativo'));
    console.log(chalk.cyan('💡 Execute: frontend-flow "sua demanda" para iniciar'));
  }

  // Show project info
  const projectConfigPath = path.join(frontendFlowDir, 'project_config.json');
  if (await fs.pathExists(projectConfigPath)) {
    const projectConfig = await fs.readJSON(projectConfigPath);

    console.log('');
    console.log(chalk.blue('🔧 Configuração do Projeto:'));
    console.log(`   Tipo: ${projectConfig.project_type}`);
    console.log(`   Inicializado: ${new Date(projectConfig.initialized).toLocaleString('pt-BR')}`);
    console.log(`   GitHub Auto: ${projectConfig.settings.auto_github ? '✅' : '❌'}`);
    console.log(`   Execução Paralela: ${projectConfig.settings.parallel_execution ? '✅' : '❌'}`);
  }
}

module.exports = { showStatus };