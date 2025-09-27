const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Converts Frontend Flow agents to Claude-compatible format
 */
class AgentConverter {
  constructor() {
    this.agentMetadata = {
      agent_react_components: {
        name: 'react-components',
        description: 'Create React components with TypeScript and shadcn-ui',
        tools: 'Read, Write, Edit, MultiEdit, Bash, Grep, Glob',
        model: 'sonnet',
        priority: 'high'
      },
      agent_tailwind_estilization: {
        name: 'tailwind-styles',
        description: 'Apply Tailwind CSS styling and design system patterns',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'high'
      },
      agent_responsiveness: {
        name: 'responsive-design',
        description: 'Implement responsive design with breakpoints and mobile-first approach',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_animations: {
        name: 'animations',
        description: 'Add animations and transitions with Framer Motion or CSS',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_accessibility: {
        name: 'accessibility',
        description: 'Ensure WCAG compliance and accessibility best practices',
        tools: 'Read, Write, Edit, MultiEdit, Bash',
        model: 'sonnet',
        priority: 'high'
      },
      agent_performance: {
        name: 'performance',
        description: 'Optimize performance, bundle size, and Core Web Vitals',
        tools: 'Read, Write, Edit, Bash, Grep',
        model: 'sonnet',
        priority: 'high'
      },
      agent_security: {
        name: 'security',
        description: 'Analyze and fix security vulnerabilities (OWASP Top 10)',
        tools: 'Read, Write, Edit, Bash, Grep',
        model: 'sonnet',
        priority: 'critical'
      },
      agent_code_quality: {
        name: 'code-quality',
        description: 'Ensure code quality with linting, formatting, and type checking',
        tools: 'Read, Write, Edit, Bash',
        model: 'sonnet',
        priority: 'high'
      },
      agent_integration_tests: {
        name: 'integration-tests',
        description: 'Create integration tests with Vitest or Jest',
        tools: 'Read, Write, Edit, Bash',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_e_2_e_cypress: {
        name: 'e2e-tests',
        description: 'Create end-to-end tests with Cypress',
        tools: 'Read, Write, Edit, Bash',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_redux_toolkit: {
        name: 'redux-toolkit',
        description: 'Implement state management with Redux Toolkit',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_state_manager: {
        name: 'state-manager',
        description: 'Manage pipeline state and execution flow',
        tools: 'Read, Write, Edit',
        model: 'sonnet',
        priority: 'system'
      },
      agent_figma_extract: {
        name: 'figma-extract',
        description: 'Extract design tokens and styles from Figma',
        tools: 'Read, Write, WebFetch',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_i_18_n: {
        name: 'i18n',
        description: 'Implement internationalization with i18next',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_analytics: {
        name: 'analytics',
        description: 'Implement analytics tracking and event monitoring',
        tools: 'Read, Write, Edit',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_github_flow: {
        name: 'github-flow',
        description: 'Manage GitHub workflow with issues and branches',
        tools: 'Bash, mcp__github__*',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_github_pullrequest: {
        name: 'github-pr',
        description: 'Create and manage GitHub pull requests',
        tools: 'Bash, mcp__github__*',
        model: 'sonnet',
        priority: 'normal'
      },
      agent_master_orchestrator: {
        name: 'master-orchestrator',
        description: 'Main orchestration agent for Frontend Flow pipeline',
        tools: 'Read, Write, Edit, Bash, Task',
        model: 'sonnet',
        priority: 'critical'
      },
      agent_pipeline_optimizer: {
        name: 'pipeline-optimizer',
        description: 'Optimize pipeline execution and parallelization',
        tools: 'Read, Write, Task',
        model: 'sonnet',
        priority: 'system'
      },
      agent_cleanup_manager: {
        name: 'cleanup-manager',
        description: 'Manage temporary files and cleanup operations',
        tools: 'Read, Bash',
        model: 'sonnet',
        priority: 'low'
      },
      agent_metrics_collector: {
        name: 'metrics-collector',
        description: 'Collect and analyze pipeline metrics',
        tools: 'Read, Write',
        model: 'sonnet',
        priority: 'system'
      },
      // Backend agents
      agent_api_designer: {
        name: 'api-designer',
        description: 'Design RESTful and GraphQL APIs with OpenAPI specs',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'high'
      },
      agent_database_architect: {
        name: 'database-architect',
        description: 'Database modeling, migrations, and optimization',
        tools: 'Read, Write, Edit, Bash',
        model: 'sonnet',
        priority: 'high'
      },
      agent_microservices: {
        name: 'microservices',
        description: 'Microservices architecture and communication patterns',
        tools: 'Read, Write, Edit, MultiEdit',
        model: 'sonnet',
        priority: 'high'
      },
      // DevOps agents
      agent_kubernetes_orchestrator: {
        name: 'kubernetes',
        description: 'Kubernetes deployment and orchestration',
        tools: 'Read, Write, Edit, Bash',
        model: 'sonnet',
        priority: 'critical'
      },
      agent_cicd_pipeline: {
        name: 'cicd-pipeline',
        description: 'CI/CD pipeline configuration for GitHub Actions, GitLab CI',
        tools: 'Read, Write, Edit',
        model: 'sonnet',
        priority: 'high'
      },
      agent_terraform_infra: {
        name: 'terraform',
        description: 'Infrastructure as Code with Terraform',
        tools: 'Read, Write, Edit, Bash',
        model: 'sonnet',
        priority: 'high'
      },
      agent_monitoring_observability: {
        name: 'monitoring',
        description: 'Setup monitoring with Prometheus, Grafana, ELK',
        tools: 'Read, Write, Edit',
        model: 'sonnet',
        priority: 'high'
      },
      // Security agents
      agent_penetration_tester: {
        name: 'penetration-tester',
        description: 'Automated penetration testing and vulnerability scanning',
        tools: 'Read, Write, Bash, WebFetch',
        model: 'sonnet',
        priority: 'critical'
      },
      agent_secrets_vault: {
        name: 'secrets-vault',
        description: 'Secure secrets management and encryption',
        tools: 'Read, Write, Edit',
        model: 'sonnet',
        priority: 'critical'
      },
      agent_compliance_auditor: {
        name: 'compliance-auditor',
        description: 'LGPD, GDPR, SOC2 compliance checking',
        tools: 'Read, Write',
        model: 'sonnet',
        priority: 'high'
      }
    };
  }

  async convertAgentFile(agentPath, outputPath) {
    const agentName = path.basename(agentPath, '.md');
    const metadata = this.agentMetadata[agentName] || this.generateDefaultMetadata(agentName);

    const originalContent = await fs.readFile(agentPath, 'utf8');

    // Create Claude-compatible frontmatter
    const frontmatter = `---
name: "${metadata.name}"
description: "${metadata.description}"
tools: ${metadata.tools}
model: ${metadata.model}
priority: ${metadata.priority}
execution: automatic
integration: "frontend-flow"
---

`;

    // Remove existing badges and metrics section if present (first 15 lines usually)
    let cleanContent = originalContent;
    const lines = originalContent.split('\n');

    // Check if first lines contain badges/metrics
    if (lines[2]?.includes('Badge:') || lines[3]?.includes('Taxa de Sucesso:')) {
      // Skip the badge section (usually first 15 lines)
      const contentStart = lines.findIndex(line => line.startsWith('## Descrição'));
      if (contentStart > 0) {
        cleanContent = lines.slice(contentStart - 1).join('\n');
      }
    }

    const finalContent = frontmatter + cleanContent;

    await fs.writeFile(outputPath, finalContent, 'utf8');
    return metadata.name;
  }

  generateDefaultMetadata(agentName) {
    // Generate default metadata for agents not in the list
    const cleanName = agentName.replace('agent_', '').replace(/_/g, '-');

    return {
      name: cleanName,
      description: `Frontend Flow agent: ${cleanName}`,
      tools: 'Read, Write, Edit',
      model: 'sonnet',
      priority: 'normal'
    };
  }

  async convertAllAgents(agentsDir) {
    console.log(chalk.blue('🔄 Convertendo agentes para formato Claude...'));

    const files = await fs.readdir(agentsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    let converted = 0;
    for (const file of mdFiles) {
      const filePath = path.join(agentsDir, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        const name = await this.convertAgentFile(filePath, filePath);
        console.log(chalk.green(`  ✓ ${file} → ${name}`));
        converted++;
      }
    }

    // Also convert agents in subdirectories
    const subdirs = ['claude-enhanced', 'monitoring', 'backend', 'devops', 'security', 'data'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(agentsDir, subdir);
      if (await fs.pathExists(subdirPath)) {
        const subfiles = await fs.readdir(subdirPath);
        for (const file of subfiles.filter(f => f.endsWith('.md'))) {
          const filePath = path.join(subdirPath, file);
          const name = await this.convertAgentFile(filePath, filePath);
          console.log(chalk.green(`  ✓ ${subdir}/${file} → ${name}`));
          converted++;
        }
      }
    }

    console.log(chalk.cyan(`\n📊 Total de agentes convertidos: ${converted}`));
    return converted;
  }
}

module.exports = AgentConverter;