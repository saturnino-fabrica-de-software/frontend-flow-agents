#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const AGENTS_DIR = path.join(process.cwd(), '.frontend-flow', 'agents');

// Fixes for agents with issues
const FIXES = {
  'agent_accessibility.md': {
    category: 'quality',
    keywords: 'accessibility, a11y, wcag, aria, inclusive, screen-reader'
  },
  'agent_analytics.md': {
    category: 'utility'
  },
  'agent_animations.md': {
    category: 'frontend'
  },
  'agent_e_2_e_cypress.md': {
    category: 'testing'
  },
  'agent_figma_extract.md': {
    category: 'special',
    keywords: 'figma, design, tokens, extract, ui, ux'
  },
  'agent_github_flow.md': {
    category: 'infrastructure'
  },
  'agent_golang_backend.md': {
    category: 'backend',
    keywords: 'golang, go, backend, microservice, grpc, performance'
  },
  'agent_i_18_n.md': {
    category: 'frontend'
  },
  'agent_mcp_memory_manager.md': {
    category: 'special',
    keywords: 'memory, persistent, context, learning, mcp, knowledge'
  },
  'agent_nestjs_backend.md': {
    category: 'backend',
    keywords: 'nestjs, nest, backend, api, rest, graphql, microservice'
  },
  'agent_pipeline_optimizer.md': {
    category: 'orchestration'
  },
  'agent_playwright_validation.md': {
    category: 'testing',
    keywords: 'playwright, test, e2e, visual, regression, browser'
  },
  'agent_pwa_progressive.md': {
    category: 'special',
    keywords: 'pwa, progressive, offline, service-worker, manifest, install'
  },
  'agent_responsiveness.md': {
    category: 'frontend'
  },
  'agent_state_manager.md': {
    category: 'frontend'
  }
};

async function fixAgent(agentFile, fixes) {
  const filePath = path.join(AGENTS_DIR, agentFile);
  let content = await fs.readFile(filePath, 'utf8');

  // Update category
  if (fixes.category) {
    content = content.replace(/category:\s*\w+/, `category: ${fixes.category}`);
  }

  // Update keywords
  if (fixes.keywords) {
    content = content.replace(/keywords:\s*.+/, `keywords: ${fixes.keywords}`);
  }

  await fs.writeFile(filePath, content);
  console.log(chalk.green(`✅ Fixed ${agentFile.replace('.md', '')}`));
}

async function main() {
  console.log(chalk.blue('🔧 Fixing Agent Metadata'));
  console.log(chalk.gray('=' .repeat(50)));

  for (const [file, fixes] of Object.entries(FIXES)) {
    await fixAgent(file, fixes);
  }

  console.log(chalk.gray('=' .repeat(50)));
  console.log(chalk.green(`✅ Fixed ${Object.keys(FIXES).length} agents`));
  console.log(chalk.blue('🎉 Metadata fixes complete!'));
}

main().catch(console.error);