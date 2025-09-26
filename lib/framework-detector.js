const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

class FrameworkDetector {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'configs', 'framework-support.json');
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const config = await fs.readJSON(this.configPath);
      this.frameworks = config.supported_frameworks;
      this.detection = config.detection;
      this.mappings = config.agent_mappings;
    } catch (error) {
      console.error(chalk.red('Failed to load framework config:', error.message));
      this.frameworks = {};
    }
  }

  async detectFramework(projectPath) {
    console.log(chalk.blue('🔍 Detecting project framework...'));

    const detectedFrameworks = [];

    // Strategy 1: Check package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      detectedFrameworks.push(...this.detectFromPackageJson(dependencies));
    }

    // Strategy 2: Check config files
    const configFiles = await this.detectFromConfigFiles(projectPath);
    detectedFrameworks.push(...configFiles);

    // Strategy 3: Check file extensions
    const filePatterns = await this.detectFromFilePatterns(projectPath);
    detectedFrameworks.push(...filePatterns);

    // Determine primary framework
    const primaryFramework = this.determinePrimaryFramework(detectedFrameworks);

    return {
      primary: primaryFramework,
      all: [...new Set(detectedFrameworks)],
      confidence: this.calculateConfidence(detectedFrameworks, primaryFramework)
    };
  }

  detectFromPackageJson(dependencies) {
    const detected = [];
    const indicators = this.detection.strategies.find(s => s.name === 'package.json').indicators;

    for (const [framework, deps] of Object.entries(indicators)) {
      if (deps.some(dep => dependencies[dep])) {
        detected.push(framework);
      }
    }

    return detected;
  }

  async detectFromConfigFiles(projectPath) {
    const detected = [];
    const configStrategy = this.detection.strategies.find(s => s.name === 'config-files');

    for (const [framework, files] of Object.entries(configStrategy.files)) {
      for (const file of files) {
        if (await fs.pathExists(path.join(projectPath, file))) {
          detected.push(framework);
          break;
        }
      }
    }

    return detected;
  }

  async detectFromFilePatterns(projectPath) {
    const detected = [];
    const patternStrategy = this.detection.strategies.find(s => s.name === 'file-extensions');

    for (const [framework, patterns] of Object.entries(patternStrategy.patterns)) {
      for (const pattern of patterns) {
        const files = glob.sync(path.join(projectPath, 'src', '**', pattern), { nodir: true });
        if (files.length > 0) {
          detected.push(framework);
          break;
        }
      }
    }

    return detected;
  }

  determinePrimaryFramework(detectedFrameworks) {
    // Priority order
    const priority = ['next', 'nuxt', 'angular', 'sveltekit', 'react', 'vue', 'svelte', 'solid'];

    for (const framework of priority) {
      if (detectedFrameworks.includes(framework)) {
        return framework;
      }
    }

    return detectedFrameworks[0] || 'react'; // Default to React
  }

  calculateConfidence(detectedFrameworks, primaryFramework) {
    if (!primaryFramework) return 0;

    const occurrences = detectedFrameworks.filter(f => f === primaryFramework).length;
    const totalStrategies = this.detection.strategies.length;

    return Math.min(100, Math.round((occurrences / totalStrategies) * 100));
  }

  async displayDetectionResult(result) {
    console.log(chalk.green('\n✅ Framework Detection Complete'));
    console.log(chalk.gray('─'.repeat(50)));

    const frameworkInfo = this.getFrameworkInfo(result.primary);

    console.log(chalk.cyan(`🎯 Primary Framework: ${frameworkInfo.displayName}`));
    console.log(chalk.yellow(`📊 Confidence: ${result.confidence}%`));

    if (result.all.length > 1) {
      console.log(chalk.gray(`🔧 Also detected: ${result.all.filter(f => f !== result.primary).join(', ')}`));
    }

    // Show framework features
    if (frameworkInfo.features) {
      console.log(chalk.blue('\n📋 Framework Features:'));
      frameworkInfo.features.forEach(feature => {
        console.log(chalk.gray(`  • ${feature}`));
      });
    }

    // Show recommended agents
    const agents = this.getRecommendedAgents(result.primary);
    if (agents.length > 0) {
      console.log(chalk.magenta('\n🤖 Optimized Agents:'));
      agents.forEach(agent => {
        console.log(chalk.gray(`  • ${agent}`));
      });
    }

    return frameworkInfo;
  }

  getFrameworkInfo(framework) {
    // Check if it's a variant
    for (const [baseFramework, config] of Object.entries(this.frameworks)) {
      if (config.variants && config.variants[framework]) {
        return {
          base: baseFramework,
          variant: framework,
          displayName: config.variants[framework].name,
          features: config.variants[framework].features,
          version: config.variants[framework].versions[0]
        };
      }
    }

    // It's a base framework
    if (this.frameworks[framework]) {
      return {
        base: framework,
        variant: null,
        displayName: this.frameworks[framework].name,
        features: ['standard'],
        version: this.frameworks[framework].versions[0]
      };
    }

    return {
      base: 'react',
      variant: null,
      displayName: 'React',
      features: ['standard'],
      version: '18.x'
    };
  }

  getRecommendedAgents(framework) {
    const agents = [];

    // Get base framework agents
    const baseMapping = this.mappings[this.getBaseFramework(framework)];
    if (baseMapping) {
      agents.push(...Object.values(baseMapping));
    }

    // Get variant-specific agents
    const frameworkInfo = this.getFrameworkInfo(framework);
    if (frameworkInfo.variant) {
      const variantConfig = this.frameworks[frameworkInfo.base].variants[frameworkInfo.variant];
      if (variantConfig && variantConfig.agents_adaptation) {
        agents.push(...Object.keys(variantConfig.agents_adaptation));
      }
    }

    return [...new Set(agents)];
  }

  getBaseFramework(framework) {
    for (const [base, config] of Object.entries(this.frameworks)) {
      if (config.variants && config.variants[framework]) {
        return base;
      }
    }
    return framework;
  }

  async adaptAgentsForFramework(framework, agents) {
    const frameworkInfo = this.getFrameworkInfo(framework);
    const adaptedAgents = [];

    for (const agent of agents) {
      // Check if there's a framework-specific version
      if (frameworkInfo.variant) {
        const variantConfig = this.frameworks[frameworkInfo.base].variants[frameworkInfo.variant];
        if (variantConfig && variantConfig.agents_adaptation && variantConfig.agents_adaptation[agent]) {
          adaptedAgents.push({
            original: agent,
            adapted: variantConfig.agents_adaptation[agent],
            framework: frameworkInfo.displayName
          });
        } else {
          adaptedAgents.push({
            original: agent,
            adapted: agent,
            framework: 'generic'
          });
        }
      } else {
        adaptedAgents.push({
          original: agent,
          adapted: agent,
          framework: 'generic'
        });
      }
    }

    return adaptedAgents;
  }

  supportsFramework(framework) {
    return !!this.getFrameworkInfo(framework).base;
  }

  async suggestMigration(fromFramework, toFramework) {
    const conversionKey = `${fromFramework}_to_${toFramework}`;
    const conversionTemplates = require(this.configPath).conversion_templates;

    if (conversionTemplates[conversionKey]) {
      const template = conversionTemplates[conversionKey];

      console.log(chalk.cyan(`\n🔄 Migration Path: ${fromFramework} → ${toFramework}`));
      console.log(chalk.gray('─'.repeat(50)));

      console.log(chalk.yellow('📋 Conversion Mappings:'));
      for (const [from, to] of Object.entries(template.mappings)) {
        console.log(chalk.gray(`  ${from} → ${to}`));
      }

      console.log(chalk.blue('\n🤖 Required Agents:'));
      template.agents.forEach(agent => {
        console.log(chalk.gray(`  • ${agent}`));
      });

      return template;
    }

    console.log(chalk.yellow(`⚠️ No direct migration path from ${fromFramework} to ${toFramework}`));
    return null;
  }
}

module.exports = FrameworkDetector;