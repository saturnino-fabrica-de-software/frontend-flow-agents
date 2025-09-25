const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function initProject(projectPath, options = {}) {
  const frontendFlowDir = path.join(projectPath, '.frontend-flow');

  // Check if already initialized
  if (await fs.pathExists(frontendFlowDir) && !options.force) {
    throw new Error('Projeto já inicializado. Use --force para sobrescrever.');
  }

  // Create directory structure
  await fs.ensureDir(path.join(frontendFlowDir, 'temp'));
  await fs.ensureDir(path.join(frontendFlowDir, 'temp', 'backups'));
  await fs.ensureDir(path.join(frontendFlowDir, 'cache'));

  // Copy configurations
  const configsDir = path.join(__dirname, '../configs');
  const agentsDir = path.join(__dirname, '../agents');
  const templatesDir = path.join(__dirname, '../templates');

  await fs.copy(configsDir, path.join(frontendFlowDir, 'configs'));
  await fs.copy(agentsDir, path.join(frontendFlowDir, 'agents'));
  await fs.copy(templatesDir, path.join(frontendFlowDir, 'templates'));

  // Create project-specific config
  const projectConfig = {
    version: '1.0.0',
    initialized: new Date().toISOString(),
    project_path: projectPath,
    project_type: await detectProjectType(projectPath),
    settings: {
      auto_github: true,
      auto_cleanup: true,
      verbose_logging: false,
      parallel_execution: true
    }
  };

  await fs.writeJSON(
    path.join(frontendFlowDir, 'project_config.json'),
    projectConfig,
    { spaces: 2 }
  );

  // Initialize state file
  const initialState = `# 🚀 Frontend Flow - Sistema Pronto

*Sistema de agentes IA autônomo inicializado*

---

**🎯 Status**: READY | **📊 Progresso**: 0% | **⏱️ Tempo**: --
**🎨 Demanda Original**: "Aguardando primeira solicitação"
**⏳ Estimativa**: Será calculada após análise
**🔄 Última Atualização**: ${new Date().toLocaleString('pt-BR')}

---

## 📋 Sistema Configurado

| Campo | Valor |
|-------|--------|
| **Projeto** | ${path.basename(projectPath)} |
| **Tipo Detectado** | ${projectConfig.project_type} |
| **Agentes Disponíveis** | 22 agentes enterprise |
| **Status do Sistema** | ✅ Pronto para uso |

## 🚀 Próximo Passo

Execute uma demanda:
\`\`\`bash
frontend-flow "sua demanda aqui"
\`\`\`

Exemplos:
- "criar botão de login responsivo"
- "implementar dashboard com analytics"
- "otimizar performance da listagem"

---

*📝 Sistema Frontend Flow inicializado com sucesso*
*🏆 Nível Enterprise 11/10 ativo*`;

  await fs.writeFile(
    path.join(frontendFlowDir, 'temp', 'current_pipeline_state.md'),
    initialState
  );

  return projectConfig;
}

async function detectProjectType(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJSON(packageJsonPath);

    // Next.js
    if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
      return 'nextjs';
    }

    // Vite
    if (packageJson.devDependencies?.vite) {
      return 'vite';
    }

    // Create React App
    if (packageJson.dependencies?.['react-scripts']) {
      return 'create-react-app';
    }

    // Generic React
    if (packageJson.dependencies?.react) {
      return 'react';
    }
  }

  // Check for framework-specific files
  if (await fs.pathExists(path.join(projectPath, 'next.config.js'))) {
    return 'nextjs';
  }

  if (await fs.pathExists(path.join(projectPath, 'vite.config.js'))) {
    return 'vite';
  }

  return 'unknown';
}

module.exports = { initProject, detectProjectType };