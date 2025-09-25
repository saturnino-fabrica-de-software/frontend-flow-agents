const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

async function analyzeProject(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  let packageJson = {};

  if (await fs.pathExists(packageJsonPath)) {
    packageJson = await fs.readJSON(packageJsonPath);
  }

  const analysis = {
    path: projectPath,
    name: packageJson.name || path.basename(projectPath),
    type: await detectFramework(projectPath, packageJson),
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
    structure: await analyzeStructure(projectPath),
    hasTypeScript: await hasTypeScript(projectPath, packageJson),
    hasTailwind: await hasTailwind(projectPath, packageJson),
    hasESLint: await hasESLint(projectPath, packageJson),
    hasPrettier: await hasPrettier(projectPath, packageJson),
    gitRepository: await hasGitRepository(projectPath)
  };

  return analysis;
}

async function detectFramework(projectPath, packageJson) {
  // Next.js
  if (packageJson.dependencies?.next || packageJson.devDependencies?.next) {
    const nextConfigExists = await fs.pathExists(path.join(projectPath, 'next.config.js'));
    const appDirExists = await fs.pathExists(path.join(projectPath, 'app'));
    return nextConfigExists ? (appDirExists ? 'nextjs-app' : 'nextjs-pages') : 'nextjs';
  }

  // Vite
  if (packageJson.devDependencies?.vite) {
    return 'vite-react';
  }

  // Create React App
  if (packageJson.dependencies?.['react-scripts']) {
    return 'create-react-app';
  }

  // Generic React
  if (packageJson.dependencies?.react) {
    return 'react';
  }

  // Check for config files
  if (await fs.pathExists(path.join(projectPath, 'next.config.js'))) {
    return 'nextjs';
  }

  if (await fs.pathExists(path.join(projectPath, 'vite.config.js'))) {
    return 'vite-react';
  }

  return 'unknown';
}

async function analyzeStructure(projectPath) {
  const structure = {
    hasSourceDir: false,
    hasComponentsDir: false,
    hasUtilsDir: false,
    hasTypesDir: false,
    hasStylesDir: false,
    hasPagesDir: false,
    hasPublicDir: false
  };

  // Common directories to check
  const dirsToCheck = [
    { key: 'hasSourceDir', paths: ['src', 'source'] },
    { key: 'hasComponentsDir', paths: ['components', 'src/components'] },
    { key: 'hasUtilsDir', paths: ['utils', 'src/utils', 'lib', 'src/lib'] },
    { key: 'hasTypesDir', paths: ['types', 'src/types', '@types'] },
    { key: 'hasStylesDir', paths: ['styles', 'src/styles', 'css'] },
    { key: 'hasPagesDir', paths: ['pages', 'src/pages'] },
    { key: 'hasPublicDir', paths: ['public'] }
  ];

  for (const { key, paths } of dirsToCheck) {
    for (const dirPath of paths) {
      if (await fs.pathExists(path.join(projectPath, dirPath))) {
        structure[key] = true;
        break;
      }
    }
  }

  return structure;
}

async function hasTypeScript(projectPath, packageJson) {
  // Check dependencies
  if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript) {
    return true;
  }

  // Check for config files
  const tsConfigExists = await fs.pathExists(path.join(projectPath, 'tsconfig.json'));
  if (tsConfigExists) {
    return true;
  }

  // Check for .ts/.tsx files
  const tsFiles = glob.sync('**/*.{ts,tsx}', {
    cwd: projectPath,
    ignore: ['node_modules/**', 'dist/**', 'build/**']
  });

  return tsFiles.length > 0;
}

async function hasTailwind(projectPath, packageJson) {
  // Check dependencies
  if (packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss) {
    return true;
  }

  // Check for config file
  return await fs.pathExists(path.join(projectPath, 'tailwind.config.js'));
}

async function hasESLint(projectPath, packageJson) {
  // Check dependencies
  if (packageJson.devDependencies?.eslint) {
    return true;
  }

  // Check for config files
  const configFiles = [
    '.eslintrc.js',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    'eslint.config.js'
  ];

  for (const configFile of configFiles) {
    if (await fs.pathExists(path.join(projectPath, configFile))) {
      return true;
    }
  }

  return false;
}

async function hasPrettier(projectPath, packageJson) {
  // Check dependencies
  if (packageJson.devDependencies?.prettier) {
    return true;
  }

  // Check for config files
  const configFiles = [
    '.prettierrc',
    '.prettierrc.js',
    '.prettierrc.json',
    '.prettierrc.yml',
    '.prettierrc.yaml',
    'prettier.config.js'
  ];

  for (const configFile of configFiles) {
    if (await fs.pathExists(path.join(projectPath, configFile))) {
      return true;
    }
  }

  return false;
}

async function hasGitRepository(projectPath) {
  return await fs.pathExists(path.join(projectPath, '.git'));
}

module.exports = { analyzeProject, detectFramework };