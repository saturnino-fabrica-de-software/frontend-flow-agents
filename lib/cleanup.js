const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

async function cleanTemp(projectPath, options = {}) {
  const frontendFlowDir = path.join(projectPath, '.frontend-flow');
  const tempDir = path.join(frontendFlowDir, 'temp');

  if (!await fs.pathExists(tempDir)) {
    console.log(chalk.yellow('⚠️  Diretório temp não encontrado'));
    return;
  }

  let filesRemoved = 0;
  let spaceFreed = 0;

  // Clean temporary files
  const tempFiles = await fs.readdir(tempDir);
  for (const file of tempFiles) {
    const filePath = path.join(tempDir, file);

    // Skip backups directory unless --all flag
    if (file === 'backups' && !options.all) {
      continue;
    }

    // Skip current state file unless --all flag
    if (file === 'current_pipeline_state.md' && !options.all) {
      continue;
    }

    const stats = await fs.stat(filePath);
    spaceFreed += stats.size;

    await fs.remove(filePath);
    filesRemoved++;

    console.log(chalk.gray(`  Removido: ${file}`));
  }

  // Clean cache if --all flag
  if (options.all) {
    const cacheDir = path.join(frontendFlowDir, 'cache');
    if (await fs.pathExists(cacheDir)) {
      const cacheStats = await getDirSize(cacheDir);
      spaceFreed += cacheStats.size;
      filesRemoved += cacheStats.files;

      await fs.emptyDir(cacheDir);
      console.log(chalk.gray('  Cache limpo'));
    }
  }

  console.log('');
  console.log(chalk.green(`✅ ${filesRemoved} arquivos removidos`));
  console.log(chalk.cyan(`💾 ${formatBytes(spaceFreed)} liberados`));
}

async function getDirSize(dirPath) {
  let size = 0;
  let files = 0;

  const items = await fs.readdir(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = await fs.stat(itemPath);

    if (stats.isDirectory()) {
      const subDir = await getDirSize(itemPath);
      size += subDir.size;
      files += subDir.files;
    } else {
      size += stats.size;
      files++;
    }
  }

  return { size, files };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = { cleanTemp };