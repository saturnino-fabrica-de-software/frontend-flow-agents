const fs = require('fs-extra');
const path = require('path');

class NLPClassifier {
  constructor() {
    this.agentPatterns = new Map();
    this.initialized = false;
  }

  async initialize(agentsPath) {
    if (this.initialized) return;

    // Load all agent definitions dynamically
    const agentFiles = await fs.readdir(agentsPath);

    for (const file of agentFiles) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(agentsPath, file), 'utf8');
        const agentName = file.replace('.md', '');

        // Extract keywords from agent definition
        const keywords = this.extractKeywords(content);
        this.agentPatterns.set(agentName, keywords);
      }
    }

    this.initialized = true;
    console.log(`NLP Classifier initialized with ${this.agentPatterns.size} agents`);
  }

  extractKeywords(content) {
    const keywords = new Set();

    // Extract from description
    const descMatch = content.match(/description:\s*"([^"]+)"/);
    if (descMatch) {
      const words = descMatch[1].toLowerCase().split(/\s+/);
      words.forEach(w => keywords.add(w));
    }

    // Extract from responsibilities
    const respMatch = content.match(/## (?:Responsabilidades|Objectives|Purpose)([\s\S]*?)##/);
    if (respMatch) {
      const words = respMatch[1].toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
      words.forEach(w => keywords.add(w));
    }

    // Add specific trigger words for each agent type
    this.addAgentSpecificKeywords(content, keywords);

    return keywords;
  }

  addAgentSpecificKeywords(content, keywords) {
    const agentName = content.match(/name:\s*"([^"]+)"/)?.[1];

    if (!agentName) return;

    // Add specific keywords for new agents
    const specificKeywords = {
      'mcp-memory-manager': ['memory', 'persistent', 'context', 'remember', 'learning', 'history'],
      'playwright-validator': ['test', 'testing', 'validate', 'validation', 'e2e', 'playwright', 'visual'],
      'accessibility-auditor': ['accessibility', 'a11y', 'wcag', 'aria', 'accessible', 'inclusive'],
      'pwa-builder': ['pwa', 'progressive', 'offline', 'service-worker', 'manifest', 'install'],
      'figma-design-extractor': ['figma', 'design', 'tokens', 'extract', 'ui', 'ux'],
      'nestjs-backend': ['nestjs', 'nest', 'backend', 'api', 'rest', 'graphql', 'microservice'],
      'golang-backend': ['golang', 'go', 'backend', 'microservice', 'grpc', 'performance'],
      // Original agents
      'react-components': ['react', 'component', 'jsx', 'tsx', 'hooks', 'props'],
      'tailwind-estilization': ['tailwind', 'style', 'css', 'styling', 'theme', 'responsive'],
      'security': ['security', 'vulnerability', 'auth', 'authentication', 'cors', 'xss'],
      'performance': ['performance', 'optimize', 'speed', 'fast', 'lazy', 'bundle'],
      'typescript-typing': ['typescript', 'types', 'interface', 'typing', 'generics'],
      'integration-tests': ['test', 'testing', 'jest', 'vitest', 'coverage'],
      'github-pullrequest': ['github', 'pr', 'pull-request', 'git', 'commit'],
      'deployment': ['deploy', 'deployment', 'ci', 'cd', 'docker', 'kubernetes']
    };

    const agentKey = Object.keys(specificKeywords).find(key =>
      agentName.toLowerCase().includes(key.split('-')[0])
    );

    if (agentKey && specificKeywords[agentKey]) {
      specificKeywords[agentKey].forEach(kw => keywords.add(kw));
    }
  }

  classifyDemand(demand, projectType = 'fullstack') {
    if (!this.initialized) {
      throw new Error('NLP Classifier not initialized');
    }

    const demandLower = demand.toLowerCase();
    const matchedAgents = new Map();

    // Score each agent based on keyword matches
    for (const [agentName, keywords] of this.agentPatterns) {
      let score = 0;

      for (const keyword of keywords) {
        if (demandLower.includes(keyword)) {
          score += keyword.length > 5 ? 2 : 1; // Longer keywords get higher score
        }
      }

      if (score > 0) {
        matchedAgents.set(agentName, score);
      }
    }

    // Sort agents by score
    const sortedAgents = Array.from(matchedAgents.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([agent]) => agent);

    // Determine pipeline based on demand and project type
    const pipeline = this.determinePipeline(demand, sortedAgents, projectType);

    return {
      demand,
      projectType,
      classification: this.classifyType(demand),
      confidence: this.calculateConfidence(sortedAgents, demand),
      suggestedAgents: sortedAgents.slice(0, 5),
      pipeline,
      isBackendTask: this.isBackendTask(demand),
      isFrontendTask: this.isFrontendTask(demand),
      isFullStackTask: this.isFullStackTask(demand)
    };
  }

  classifyType(demand) {
    const demandLower = demand.toLowerCase();

    if (demandLower.includes('component') || demandLower.includes('ui')) {
      return 'component_creation';
    }
    if (demandLower.includes('test') || demandLower.includes('validate')) {
      return 'testing';
    }
    if (demandLower.includes('style') || demandLower.includes('css') || demandLower.includes('tailwind')) {
      return 'styling';
    }
    if (demandLower.includes('api') || demandLower.includes('backend') || demandLower.includes('nest') || demandLower.includes('go')) {
      return 'backend';
    }
    if (demandLower.includes('deploy') || demandLower.includes('ci') || demandLower.includes('cd')) {
      return 'deployment';
    }
    if (demandLower.includes('accessibility') || demandLower.includes('a11y')) {
      return 'accessibility';
    }
    if (demandLower.includes('pwa') || demandLower.includes('offline')) {
      return 'progressive_web_app';
    }
    if (demandLower.includes('security') || demandLower.includes('auth')) {
      return 'security';
    }
    if (demandLower.includes('performance') || demandLower.includes('optimize')) {
      return 'optimization';
    }

    return 'general_development';
  }

  calculateConfidence(agents, demand) {
    if (agents.length === 0) return 0.3;
    if (agents.length === 1) return 0.7;
    if (agents.length >= 3) return 0.95;
    return 0.85;
  }

  determinePipeline(demand, agents, projectType) {
    const pipeline = [];

    // Always start with Technical Roundtable for complex tasks
    if (this.isComplexTask(demand)) {
      pipeline.push('agent_technical_roundtable');
    }

    // Add NLP classifier
    pipeline.push('agent_nlp_classifier');

    // Add matched agents
    agents.slice(0, 5).forEach(agent => {
      if (!pipeline.includes(agent)) {
        pipeline.push(agent);
      }
    });

    // Add quality assurance at the end
    if (!pipeline.includes('agent_code_quality')) {
      pipeline.push('agent_code_quality');
    }

    // Add deployment if needed
    if (demand.toLowerCase().includes('deploy')) {
      pipeline.push('agent_deployment');
    }

    return pipeline;
  }

  isComplexTask(demand) {
    const complexKeywords = ['system', 'architecture', 'full', 'complete', 'entire', 'all', 'integration'];
    const demandLower = demand.toLowerCase();
    return complexKeywords.some(kw => demandLower.includes(kw));
  }

  isBackendTask(demand) {
    const backendKeywords = ['api', 'backend', 'server', 'database', 'nest', 'golang', 'microservice', 'rest', 'graphql'];
    const demandLower = demand.toLowerCase();
    return backendKeywords.some(kw => demandLower.includes(kw));
  }

  isFrontendTask(demand) {
    const frontendKeywords = ['component', 'ui', 'ux', 'react', 'vue', 'angular', 'style', 'css', 'tailwind', 'frontend'];
    const demandLower = demand.toLowerCase();
    return frontendKeywords.some(kw => demandLower.includes(kw));
  }

  isFullStackTask(demand) {
    return this.isBackendTask(demand) && this.isFrontendTask(demand);
  }

  async updateAgentKnowledge(agentName, newKeywords) {
    // Update agent patterns with new learned keywords
    if (this.agentPatterns.has(agentName)) {
      const current = this.agentPatterns.get(agentName);
      newKeywords.forEach(kw => current.add(kw));
    }
  }
}

module.exports = NLPClassifier;