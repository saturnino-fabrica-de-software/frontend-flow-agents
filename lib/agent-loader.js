const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class AgentLoader {
  constructor() {
    this.agents = new Map();
    this.agentMetadata = new Map();
    this.initialized = false;
  }

  async initialize(projectPath) {
    if (this.initialized) return;

    const agentsPath = path.join(projectPath, '.frontend-flow', 'agents');

    if (!await fs.pathExists(agentsPath)) {
      throw new Error(`Agents directory not found at ${agentsPath}`);
    }

    // Load all agent files
    const files = await fs.readdir(agentsPath);
    const agentFiles = files.filter(f => f.endsWith('.md'));

    console.log(chalk.blue(`📂 Loading ${agentFiles.length} agents...`));

    for (const file of agentFiles) {
      const filePath = path.join(agentsPath, file);
      const content = await fs.readFile(filePath, 'utf8');
      const agentName = file.replace('.md', '');

      // Parse agent metadata
      const metadata = this.parseAgentMetadata(content, agentName);
      this.agents.set(agentName, content);
      this.agentMetadata.set(agentName, metadata);
    }

    this.initialized = true;
    console.log(chalk.green(`✅ Loaded ${this.agents.size} agents successfully`));

    // Log agent categories
    this.logAgentCategories();
  }

  parseAgentMetadata(content, agentName) {
    const metadata = {
      name: agentName,
      type: 'general',
      category: 'development',
      tools: [],
      model: 'claude',
      dependencies: [],
      keywords: []
    };

    // Extract metadata from frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];

      // Extract name
      const nameMatch = frontmatter.match(/name:\s*"([^"]+)"/);
      if (nameMatch) metadata.name = nameMatch[1];

      // Extract description
      const descMatch = frontmatter.match(/description:\s*"([^"]+)"/);
      if (descMatch) metadata.description = descMatch[1];

      // Extract tools
      const toolsMatch = frontmatter.match(/tools:\s*(.+)/);
      if (toolsMatch) {
        metadata.tools = toolsMatch[1].split(',').map(t => t.trim());
      }

      // Extract model
      const modelMatch = frontmatter.match(/model:\s*(\w+)/);
      if (modelMatch) metadata.model = modelMatch[1];
    }

    // Extract category from metadata or categorize
    const categoryMatch = content.match(/category:\s*(\w+)/);
    if (categoryMatch) {
      metadata.category = categoryMatch[1];
    } else {
      metadata.category = this.categorizeAgent(agentName, content);
    }

    metadata.type = this.determineAgentType(agentName, content);

    // Extract keywords for NLP
    metadata.keywords = this.extractKeywords(content);

    return metadata;
  }

  categorizeAgent(agentName, content) {
    const name = agentName.toLowerCase();
    const contentLower = content.toLowerCase();

    // Frontend agents
    if (name.includes('react') || name.includes('vue') || name.includes('angular') ||
        name.includes('component') || name.includes('ui') || name.includes('frontend')) {
      return 'frontend';
    }

    // Backend agents
    if (name.includes('backend') || name.includes('nestjs') || name.includes('golang') ||
        name.includes('api') || name.includes('database') || name.includes('server')) {
      return 'backend';
    }

    // Testing agents
    if (name.includes('test') || name.includes('playwright') || name.includes('cypress') ||
        name.includes('validation')) {
      return 'testing';
    }

    // Infrastructure agents
    if (name.includes('deploy') || name.includes('docker') || name.includes('kubernetes') ||
        name.includes('ci') || name.includes('cd')) {
      return 'infrastructure';
    }

    // Quality agents
    if (name.includes('quality') || name.includes('security') || name.includes('accessibility') ||
        name.includes('performance')) {
      return 'quality';
    }

    // Utility agents
    if (name.includes('cleanup') || name.includes('metrics') || name.includes('monitor')) {
      return 'utility';
    }

    // Special agents
    if (name.includes('mcp') || name.includes('memory') || name.includes('figma') ||
        name.includes('pwa')) {
      return 'special';
    }

    // Orchestration agents
    if (name.includes('orchestrator') || name.includes('roundtable') || name.includes('nlp')) {
      return 'orchestration';
    }

    return 'general';
  }

  determineAgentType(agentName, content) {
    const name = agentName.toLowerCase();

    if (name.includes('master') || name.includes('orchestrator')) return 'master';
    if (name.includes('roundtable')) return 'coordinator';
    if (name.includes('nlp') || name.includes('classifier')) return 'classifier';

    return 'worker';
  }

  extractKeywords(content) {
    const keywords = new Set();

    // Extract from content
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !this.isCommonWord(w));

    words.forEach(w => keywords.add(w));

    return Array.from(keywords).slice(0, 20); // Limit to top 20 keywords
  }

  isCommonWord(word) {
    const common = ['the', 'this', 'that', 'with', 'from', 'will', 'when', 'where', 'which', 'while'];
    return common.includes(word);
  }

  logAgentCategories() {
    const categories = {};

    for (const [name, metadata] of this.agentMetadata) {
      const category = metadata.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(name);
    }

    console.log(chalk.cyan('\n📊 Agent Categories:'));
    for (const [category, agents] of Object.entries(categories)) {
      console.log(chalk.gray(`  ${category}: ${agents.length} agents`));
    }
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  getAgentMetadata(name) {
    return this.agentMetadata.get(name);
  }

  getAllAgents() {
    return Array.from(this.agents.keys());
  }

  getAgentsByCategory(category) {
    const agents = [];
    for (const [name, metadata] of this.agentMetadata) {
      if (metadata.category === category) {
        agents.push(name);
      }
    }
    return agents;
  }

  getAgentsByType(type) {
    const agents = [];
    for (const [name, metadata] of this.agentMetadata) {
      if (metadata.type === type) {
        agents.push(name);
      }
    }
    return agents;
  }

  findAgentsByKeywords(keywords) {
    const scores = new Map();

    for (const [name, metadata] of this.agentMetadata) {
      let score = 0;

      keywords.forEach(keyword => {
        if (metadata.keywords.includes(keyword.toLowerCase())) {
          score += 1;
        }
        if (name.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2; // Higher weight for name match
        }
        if (metadata.description && metadata.description.toLowerCase().includes(keyword.toLowerCase())) {
          score += 1.5;
        }
      });

      if (score > 0) {
        scores.set(name, score);
      }
    }

    // Sort by score and return
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }

  // Dynamic pipeline builder
  buildPipeline(demand, projectType = 'fullstack') {
    const pipeline = [];
    const demandLower = demand.toLowerCase();

    // Always start with technical roundtable for complex tasks
    if (this.isComplexDemand(demand)) {
      pipeline.push('agent_technical_roundtable');
    }

    // Add NLP classifier
    pipeline.push('agent_nlp_classifier');

    // Determine primary agents based on demand
    if (demandLower.includes('component') || demandLower.includes('ui') ||
        demandLower.includes('botão') || demandLower.includes('button') ||
        demandLower.includes('card') || demandLower.includes('criar')) {
      pipeline.push('agent_react_components');
      pipeline.push('agent_tailwind_estilization');
    }

    if (demandLower.includes('test') || demandLower.includes('validate')) {
      if (this.agents.has('agent_playwright_validation')) {
        pipeline.push('agent_playwright_validation');
      } else {
        pipeline.push('agent_integration_tests');
      }
    }

    if (demandLower.includes('accessibility') || demandLower.includes('a11y')) {
      pipeline.push('agent_accessibility');
    }

    if (demandLower.includes('pwa') || demandLower.includes('offline')) {
      pipeline.push('agent_pwa_progressive');
    }

    if (demandLower.includes('figma') || demandLower.includes('design')) {
      pipeline.push('agent_figma_extract');
    }

    if (demandLower.includes('nestjs') || demandLower.includes('nest')) {
      pipeline.push('agent_nestjs_backend');
    }

    if (demandLower.includes('golang') || demandLower.includes('go ')) {
      pipeline.push('agent_golang_backend');
    }

    // Add quality checks
    if (!pipeline.includes('agent_code_quality')) {
      pipeline.push('agent_code_quality');
    }

    // Add deployment if mentioned
    if (demandLower.includes('deploy')) {
      pipeline.push('agent_deployment');
    }

    // Add memory manager for complex tasks
    if (this.isComplexDemand(demand) && this.agents.has('agent_mcp_memory_manager')) {
      pipeline.push('agent_mcp_memory_manager');
    }

    return pipeline.filter(agent => this.agents.has(agent));
  }

  isComplexDemand(demand) {
    const complexIndicators = [
      'full', 'complete', 'system', 'application',
      'multiple', 'integrate', 'architecture', 'complex'
    ];
    const demandLower = demand.toLowerCase();
    return complexIndicators.some(indicator => demandLower.includes(indicator));
  }

  getStats() {
    return {
      total: this.agents.size,
      byCategory: this.getStatsByCategory(),
      byType: this.getStatsByType()
    };
  }

  getStatsByCategory() {
    const stats = {};
    for (const metadata of this.agentMetadata.values()) {
      stats[metadata.category] = (stats[metadata.category] || 0) + 1;
    }
    return stats;
  }

  getStatsByType() {
    const stats = {};
    for (const metadata of this.agentMetadata.values()) {
      stats[metadata.type] = (stats[metadata.type] || 0) + 1;
    }
    return stats;
  }
}

module.exports = AgentLoader;