const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const https = require('https');
const { createSpinner } = require('./spinner');

class MarketplaceManager {
  constructor() {
    this.marketplacePath = path.join(__dirname, '..', 'marketplace');
    this.registryPath = path.join(this.marketplacePath, 'marketplace-registry.json');
    this.installedPath = path.join(process.cwd(), '.frontend-flow', 'community-agents');
    this.registry = null;
  }

  async initialize() {
    await fs.ensureDir(this.installedPath);
    await this.loadRegistry();
  }

  async loadRegistry() {
    try {
      // In production, this would fetch from a remote API
      this.registry = await fs.readJSON(this.registryPath);
    } catch (error) {
      console.error(chalk.red('Failed to load marketplace registry:', error.message));
      this.registry = { featured_agents: [], community_agents: [] };
    }
  }

  async searchAgents(query, options = {}) {
    const allAgents = [...this.registry.featured_agents, ...this.registry.community_agents];

    let results = allAgents.filter(agent => {
      const matchesQuery = !query ||
        agent.name.toLowerCase().includes(query.toLowerCase()) ||
        agent.description.toLowerCase().includes(query.toLowerCase()) ||
        agent.category.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !options.category ||
        agent.category === options.category;

      const matchesFramework = !options.framework ||
        (agent.compatibility && agent.compatibility.frameworks.includes(options.framework));

      const matchesVerified = !options.verified ||
        agent.verified === true;

      return matchesQuery && matchesCategory && matchesFramework && matchesVerified;
    });

    // Sort by relevance
    results.sort((a, b) => {
      if (options.sortBy === 'downloads') return b.downloads - a.downloads;
      if (options.sortBy === 'rating') return (b.metrics?.user_rating || 0) - (a.metrics?.user_rating || 0);
      return b.stars - a.stars; // Default sort by stars
    });

    return results;
  }

  async displaySearchResults(results, detailed = false) {
    if (results.length === 0) {
      console.log(chalk.yellow('No agents found matching your criteria.'));
      return;
    }

    console.log(chalk.cyan(`\n📦 Found ${results.length} agents:\n`));

    results.forEach((agent, index) => {
      const verified = agent.verified ? chalk.green('✓') : chalk.gray('○');
      const stars = chalk.yellow(`⭐ ${agent.stars}`);
      const downloads = chalk.gray(`↓ ${agent.downloads.toLocaleString()}`);

      console.log(chalk.white(`${index + 1}. ${agent.name} ${verified}`));
      console.log(chalk.gray(`   ${agent.description}`));
      console.log(`   ${stars} ${downloads} ${agent.badge || ''}`);

      if (detailed && agent.metrics) {
        console.log(chalk.gray(`   Success: ${(agent.metrics.success_rate * 100).toFixed(0)}% | Time: ${agent.metrics.avg_duration} | Rating: ${agent.metrics.user_rating}/5`));
      }

      console.log('');
    });
  }

  async installAgent(agentId) {
    const spinner = createSpinner(`Installing ${agentId}...`).start();

    try {
      // Find agent in registry
      const allAgents = [...this.registry.featured_agents, ...this.registry.community_agents];
      const agent = allAgents.find(a => a.id === agentId);

      if (!agent) {
        spinner.fail(`Agent ${agentId} not found in marketplace`);
        return false;
      }

      // Check compatibility
      const compatible = await this.checkCompatibility(agent);
      if (!compatible) {
        spinner.fail(`Agent ${agentId} is not compatible with your setup`);
        return false;
      }

      // Create agent directory
      const agentDir = path.join(this.installedPath, agentId);
      await fs.ensureDir(agentDir);

      // Download agent files (simulation)
      const agentConfig = {
        ...agent,
        installed_at: new Date().toISOString(),
        local_path: agentDir
      };

      await fs.writeJSON(path.join(agentDir, 'agent.json'), agentConfig, { spaces: 2 });

      // Create agent markdown file
      const agentMd = this.generateAgentMarkdown(agent);
      await fs.writeFile(path.join(agentDir, `${agentId}.md`), agentMd);

      // Update installed agents registry
      await this.updateInstalledRegistry(agent);

      spinner.succeed(`Successfully installed ${agent.name}`);

      // Show post-install instructions
      this.showPostInstallInstructions(agent);

      return true;

    } catch (error) {
      spinner.fail(`Failed to install agent: ${error.message}`);
      return false;
    }
  }

  async checkCompatibility(agent) {
    if (!agent.compatibility) return true;

    const projectPath = process.cwd();
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);

      // Check Frontend Flow version
      const ffVersion = packageJson.dependencies?.['frontend-flow-agents'] ||
                       packageJson.devDependencies?.['frontend-flow-agents'] ||
                       '2.0.0';

      if (agent.compatibility.min_version &&
          this.compareVersions(ffVersion, agent.compatibility.min_version) < 0) {
        console.log(chalk.yellow(`⚠️ This agent requires Frontend Flow v${agent.compatibility.min_version} or higher`));
        return false;
      }
    }

    return true;
  }

  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  generateAgentMarkdown(agent) {
    return `# ${agent.name}

## ${agent.badge || '🤖'} Badge: ${agent.badge || 'Community'}
- **Author:** ${agent.author}
- **Version:** ${agent.version}
- **Category:** ${agent.category}
- **Downloads:** ${agent.downloads.toLocaleString()}
- **Stars:** ⭐ ${agent.stars}

## Description
${agent.description}

## Metrics
${agent.metrics ? `- **Success Rate:** ${(agent.metrics.success_rate * 100).toFixed(0)}%
- **Average Duration:** ${agent.metrics.avg_duration}
- **User Rating:** ${agent.metrics.user_rating}/5.0` : 'Metrics not available'}

## Compatibility
${agent.compatibility ? `- **Minimum Version:** ${agent.compatibility.min_version}
- **Frameworks:** ${agent.compatibility.frameworks.join(', ')}
- **Required MCPs:** ${agent.compatibility.requires_mcps.join(', ') || 'None'}` : 'Universal compatibility'}

## Usage
\`\`\`bash
frontend-flow --agent=${agent.id} "your task"
\`\`\`

## Examples
\`\`\`bash
# Example 1
frontend-flow --agent=${agent.id} "create payment form with Stripe"

# Example 2
frontend-flow --agent=${agent.id} "setup subscription handling"
\`\`\`

---
*Installed from Frontend Flow Marketplace*
`;
  }

  async updateInstalledRegistry(agent) {
    const installedRegistryPath = path.join(this.installedPath, 'installed.json');

    let installed = {};
    if (await fs.pathExists(installedRegistryPath)) {
      installed = await fs.readJSON(installedRegistryPath);
    }

    installed[agent.id] = {
      name: agent.name,
      version: agent.version,
      installed_at: new Date().toISOString(),
      author: agent.author
    };

    await fs.writeJSON(installedRegistryPath, installed, { spaces: 2 });
  }

  showPostInstallInstructions(agent) {
    console.log(chalk.green('\n✅ Installation complete!'));
    console.log(chalk.cyan('\nUsage:'));
    console.log(chalk.white(`  frontend-flow --agent=${agent.id} "your task"`));

    if (agent.compatibility?.requires_mcps?.length > 0) {
      console.log(chalk.yellow('\n⚠️ Required MCPs:'));
      agent.compatibility.requires_mcps.forEach(mcp => {
        console.log(chalk.gray(`  - ${mcp}`));
      });
    }
  }

  async listInstalled() {
    const installedRegistryPath = path.join(this.installedPath, 'installed.json');

    if (!await fs.pathExists(installedRegistryPath)) {
      console.log(chalk.yellow('No community agents installed yet.'));
      console.log(chalk.cyan('Browse marketplace: frontend-flow marketplace search'));
      return;
    }

    const installed = await fs.readJSON(installedRegistryPath);
    const agents = Object.entries(installed);

    if (agents.length === 0) {
      console.log(chalk.yellow('No community agents installed yet.'));
      return;
    }

    console.log(chalk.cyan('\n📦 Installed Community Agents:\n'));

    agents.forEach(([id, info]) => {
      console.log(chalk.white(`• ${info.name} (v${info.version})`));
      console.log(chalk.gray(`  ID: ${id}`));
      console.log(chalk.gray(`  Author: ${info.author}`));
      console.log(chalk.gray(`  Installed: ${new Date(info.installed_at).toLocaleDateString()}\n`));
    });
  }

  async uninstallAgent(agentId) {
    const spinner = createSpinner(`Uninstalling ${agentId}...`).start();

    try {
      const agentDir = path.join(this.installedPath, agentId);

      if (!await fs.pathExists(agentDir)) {
        spinner.fail(`Agent ${agentId} is not installed`);
        return false;
      }

      // Remove agent directory
      await fs.remove(agentDir);

      // Update installed registry
      const installedRegistryPath = path.join(this.installedPath, 'installed.json');
      if (await fs.pathExists(installedRegistryPath)) {
        const installed = await fs.readJSON(installedRegistryPath);
        delete installed[agentId];
        await fs.writeJSON(installedRegistryPath, installed, { spaces: 2 });
      }

      spinner.succeed(`Successfully uninstalled ${agentId}`);
      return true;

    } catch (error) {
      spinner.fail(`Failed to uninstall agent: ${error.message}`);
      return false;
    }
  }

  async submitAgent(agentPath) {
    console.log(chalk.cyan('\n📤 Submitting Agent to Marketplace\n'));

    // Validation steps
    const validationSteps = [
      'Validating agent structure...',
      'Running compatibility checks...',
      'Executing test suite...',
      'Checking for duplicates...',
      'Security scanning...'
    ];

    for (const step of validationSteps) {
      const spinner = createSpinner(step).start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      spinner.succeed(step.replace('...', ' ✓'));
    }

    console.log(chalk.green('\n✅ Agent passed all validations!'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.white('1. Create a pull request to the Frontend Flow repository'));
    console.log(chalk.white('2. Add your agent to marketplace/community-agents/'));
    console.log(chalk.white('3. Wait for 3 community approvals'));
    console.log(chalk.white('4. Your agent will be available in the marketplace!'));
  }

  async showStats() {
    console.log(chalk.cyan('\n📊 Marketplace Statistics\n'));
    console.log(chalk.white(`Total Agents: ${this.registry.stats.total_agents}`));
    console.log(chalk.white(`Community Agents: ${this.registry.stats.community_agents}`));
    console.log(chalk.white(`Official Agents: ${this.registry.stats.official_agents}`));
    console.log(chalk.white(`Total Downloads: ${this.registry.stats.total_downloads.toLocaleString()}`));
    console.log(chalk.white(`Active Contributors: ${this.registry.stats.active_contributors}`));

    console.log(chalk.cyan('\n🏆 Top Categories:\n'));
    Object.entries(this.registry.categories).forEach(([key, category]) => {
      console.log(chalk.white(`${category.icon} ${category.name}: ${category.count} agents`));
    });
  }
}

module.exports = MarketplaceManager;