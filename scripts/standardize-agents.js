#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const AGENTS_DIR = path.join(process.cwd(), '.frontend-flow', 'agents');

// Agent metadata mapping
const AGENT_METADATA = {
  'agent_react_components': {
    name: 'react-component-creator',
    description: 'React component specialist for creating TypeScript components with hooks, props, and best practices',
    tools: ['Read', 'Write', 'Edit', 'MultiEdit'],
    model: 'claude',
    category: 'frontend',
    keywords: ['react', 'component', 'jsx', 'tsx', 'hooks', 'props', 'typescript']
  },
  'agent_tailwind_estilization': {
    name: 'tailwind-style-master',
    description: 'Tailwind CSS styling expert for responsive, dark mode, and pixel-perfect designs',
    tools: ['Read', 'Edit', 'MultiEdit'],
    model: 'claude',
    category: 'frontend',
    keywords: ['tailwind', 'css', 'styling', 'responsive', 'dark-mode', 'theme']
  },
  'agent_typescript_typing': {
    name: 'typescript-type-master',
    description: 'TypeScript typing specialist for interfaces, generics, and type safety',
    tools: ['Read', 'Write', 'Edit'],
    model: 'claude',
    category: 'quality',
    keywords: ['typescript', 'types', 'interface', 'generics', 'type-safety']
  },
  'agent_performance': {
    name: 'performance-optimizer',
    description: 'Performance optimization expert for React apps, bundle size, and loading speed',
    tools: ['Read', 'Edit', 'Bash'],
    model: 'claude',
    category: 'quality',
    keywords: ['performance', 'optimize', 'speed', 'bundle', 'lazy-loading', 'memoization']
  },
  'agent_security': {
    name: 'security-auditor',
    description: 'Security specialist for vulnerability detection, authentication, and secure coding',
    tools: ['Read', 'Edit', 'Bash'],
    model: 'claude',
    category: 'quality',
    keywords: ['security', 'vulnerability', 'authentication', 'cors', 'xss', 'csrf']
  },
  'agent_integration_tests': {
    name: 'test-automation-expert',
    description: 'Testing specialist for unit, integration, and E2E tests with Jest/Vitest',
    tools: ['Read', 'Write', 'Edit', 'Bash'],
    model: 'claude',
    category: 'testing',
    keywords: ['test', 'jest', 'vitest', 'coverage', 'unit', 'integration']
  },
  'agent_deployment': {
    name: 'deployment-specialist',
    description: 'Deployment expert for CI/CD, Docker, Vercel, and cloud platforms',
    tools: ['Read', 'Write', 'Edit', 'Bash'],
    model: 'claude',
    category: 'infrastructure',
    keywords: ['deploy', 'docker', 'ci', 'cd', 'vercel', 'kubernetes']
  },
  'agent_github_pullrequest': {
    name: 'github-pr-manager',
    description: 'GitHub specialist for pull requests, commits, and repository management',
    tools: ['Bash', 'Read', 'Write'],
    model: 'claude',
    category: 'infrastructure',
    keywords: ['github', 'git', 'pr', 'pull-request', 'commit', 'branch']
  },
  'agent_ui_ux': {
    name: 'ui-ux-designer',
    description: 'UI/UX specialist for user experience, accessibility, and design systems',
    tools: ['Read', 'Edit'],
    model: 'claude',
    category: 'frontend',
    keywords: ['ui', 'ux', 'design', 'user-experience', 'accessibility', 'figma']
  },
  'agent_code_quality': {
    name: 'code-quality-guardian',
    description: 'Code quality enforcer for linting, formatting, and best practices',
    tools: ['Read', 'Edit', 'Bash'],
    model: 'claude',
    category: 'quality',
    keywords: ['quality', 'lint', 'format', 'eslint', 'prettier', 'standards']
  },
  'agent_documentation': {
    name: 'documentation-writer',
    description: 'Documentation specialist for README, API docs, and code comments',
    tools: ['Read', 'Write', 'Edit'],
    model: 'claude',
    category: 'utility',
    keywords: ['docs', 'documentation', 'readme', 'api', 'comments', 'jsdoc']
  },
  'agent_api_integration': {
    name: 'api-integration-expert',
    description: 'API integration specialist for REST, GraphQL, and real-time connections',
    tools: ['Read', 'Write', 'Edit', 'Bash'],
    model: 'claude',
    category: 'backend',
    keywords: ['api', 'rest', 'graphql', 'websocket', 'integration', 'axios']
  },
  'agent_database': {
    name: 'database-architect',
    description: 'Database specialist for schema design, queries, and optimization',
    tools: ['Read', 'Write', 'Edit', 'Bash'],
    model: 'claude',
    category: 'backend',
    keywords: ['database', 'sql', 'postgres', 'mongodb', 'schema', 'query']
  },
  'agent_cleanup_manager': {
    name: 'cleanup-orchestrator',
    description: 'Cleanup specialist for removing unused code, dependencies, and files',
    tools: ['Read', 'Edit', 'Bash'],
    model: 'claude',
    category: 'utility',
    keywords: ['cleanup', 'remove', 'unused', 'refactor', 'organize']
  },
  'agent_metrics_collector': {
    name: 'metrics-analytics',
    description: 'Metrics collection specialist for performance and usage analytics',
    tools: ['Read', 'Write', 'Bash'],
    model: 'claude',
    category: 'utility',
    keywords: ['metrics', 'analytics', 'telemetry', 'monitoring', 'stats']
  },
  'agent_master_orchestrator': {
    name: 'master-orchestrator',
    description: 'Master orchestrator for coordinating all agents and pipeline execution',
    tools: ['Read', 'Write', 'Edit', 'Bash'],
    model: 'claude',
    category: 'orchestration',
    keywords: ['orchestrate', 'coordinate', 'pipeline', 'master', 'control']
  },
  'agent_technical_roundtable': {
    name: 'technical-roundtable',
    description: 'Technical roundtable facilitator with 8 virtual specialists for architectural decisions',
    tools: ['Read', 'Write'],
    model: 'claude',
    category: 'orchestration',
    keywords: ['roundtable', 'architecture', 'discussion', 'consensus', 'decision']
  },
  'agent_nlp_classifier': {
    name: 'nlp-demand-classifier',
    description: 'NLP specialist for classifying and understanding user demands in natural language',
    tools: ['Read'],
    model: 'claude',
    category: 'orchestration',
    keywords: ['nlp', 'classify', 'natural-language', 'demand', 'understand']
  },
  'agent_auto_healing': {
    name: 'auto-healing-system',
    description: 'Auto-healing specialist for error recovery and self-correction',
    tools: ['Read', 'Edit', 'Bash'],
    model: 'claude',
    category: 'quality',
    keywords: ['healing', 'recovery', 'error', 'fix', 'auto-correct']
  },
  'agent_test_simple': {
    name: 'simple-test-runner',
    description: 'Simple test runner for basic validation and smoke tests',
    tools: ['Bash'],
    model: 'claude',
    category: 'testing',
    keywords: ['test', 'simple', 'validation', 'smoke', 'quick']
  },
  'agent_redux_toolkit': {
    name: 'redux-state-manager',
    description: 'Redux Toolkit specialist for state management and data flow',
    tools: ['Read', 'Write', 'Edit'],
    model: 'claude',
    category: 'frontend',
    keywords: ['redux', 'state', 'store', 'rtk', 'slice', 'reducer']
  }
};

async function standardizeAgent(agentFile) {
  const filePath = path.join(AGENTS_DIR, agentFile);
  const content = await fs.readFile(filePath, 'utf8');
  const agentName = agentFile.replace('.md', '');

  // Check if already has frontmatter
  if (content.startsWith('---')) {
    console.log(chalk.yellow(`⏭️ ${agentName} already has frontmatter`));
    return false;
  }

  // Get metadata
  const metadata = AGENT_METADATA[agentName] || {
    name: agentName.replace(/_/g, '-'),
    description: `Specialist agent for ${agentName.replace(/_/g, ' ')}`,
    tools: ['Read', 'Write', 'Edit'],
    model: 'claude',
    category: 'general',
    keywords: agentName.split('_').filter(w => w !== 'agent')
  };

  // Create new content with frontmatter
  const frontmatter = `---
name: "${metadata.name}"
description: "${metadata.description}"
tools: ${metadata.tools.join(', ')}
model: ${metadata.model}
category: ${metadata.category}
keywords: ${metadata.keywords.join(', ')}
---

`;

  const newContent = frontmatter + content;
  await fs.writeFile(filePath, newContent);

  console.log(chalk.green(`✅ ${agentName} standardized`));
  return true;
}

async function main() {
  console.log(chalk.blue('🔧 Standardizing Agent Metadata'));
  console.log(chalk.gray('=' .repeat(50)));

  const files = await fs.readdir(AGENTS_DIR);
  const agentFiles = files.filter(f => f.endsWith('.md'));

  let updated = 0;
  let skipped = 0;

  for (const file of agentFiles) {
    const result = await standardizeAgent(file);
    if (result) {
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(chalk.gray('=' .repeat(50)));
  console.log(chalk.green(`✅ Updated: ${updated} agents`));
  console.log(chalk.yellow(`⏭️ Skipped: ${skipped} agents`));
  console.log(chalk.blue('🎉 Standardization complete!'));
}

main().catch(console.error);