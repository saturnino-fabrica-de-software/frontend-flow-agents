const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ContextualHelp {
  constructor() {
    this.helpDatabase = {
      errors: {
        type_mismatch: {
          description: 'TypeScript type mismatch error',
          common_causes: [
            'Incorrect prop types',
            'Missing type definitions',
            'Incompatible TypeScript versions'
          ],
          solutions: [
            'Check tsconfig.json strictness settings',
            'Ensure all props are correctly typed',
            'Run: npm run typecheck to identify issues',
            'Update @types/* packages'
          ],
          auto_fix: 'frontend-flow fix-types',
          related: ['typescript_config', 'prop_validation']
        },
        missing_dependency: {
          description: 'Required package not installed',
          common_causes: [
            'Package not in package.json',
            'npm install not run after clone',
            'Version conflicts'
          ],
          solutions: [
            'Run: npm install {package}',
            'Check package.json for the dependency',
            'Clear node_modules and reinstall',
            'Check npm registry availability'
          ],
          auto_fix: 'npm install',
          related: ['package_management', 'version_conflicts']
        },
        lint_error: {
          description: 'ESLint validation failed',
          common_causes: [
            'Code style violations',
            'Unused variables',
            'Missing semicolons or formatting'
          ],
          solutions: [
            'Run: npm run lint --fix',
            'Check .eslintrc configuration',
            'Install ESLint VS Code extension',
            'Format with Prettier first'
          ],
          auto_fix: 'npm run lint --fix',
          related: ['code_quality', 'formatting']
        },
        build_failed: {
          description: 'Build process failed',
          common_causes: [
            'Syntax errors',
            'Import/export issues',
            'Environment variable problems',
            'Out of memory'
          ],
          solutions: [
            'Check build logs for specific errors',
            'Verify all imports are correct',
            'Set NODE_OPTIONS=--max-old-space-size=4096',
            'Clear build cache'
          ],
          auto_fix: 'npm run clean && npm run build',
          related: ['webpack_config', 'performance']
        },
        test_failure: {
          description: 'Tests are failing',
          common_causes: [
            'Code changes broke tests',
            'Missing test setup',
            'Async timing issues',
            'Mock data problems'
          ],
          solutions: [
            'Run tests in watch mode: npm test --watch',
            'Update snapshots if needed',
            'Check test environment setup',
            'Review recent code changes'
          ],
          auto_fix: 'npm test -- --updateSnapshot',
          related: ['testing_strategies', 'test_coverage']
        }
      },
      concepts: {
        agent_pipeline: {
          description: 'How agents work together in a pipeline',
          explanation: 'Agents execute in a coordinated sequence, each handling specific tasks',
          key_points: [
            'Agents can run in parallel when independent',
            'Each agent decides if it should execute',
            'Results are passed between agents',
            'Failures trigger fallback mechanisms'
          ],
          examples: [
            'Component creation → Styling → Testing',
            'Analysis → Planning → Implementation → Validation'
          ],
          learn_more: 'docs/agent-pipeline.md'
        },
        mcp_integration: {
          description: 'Model Context Protocol integration',
          explanation: 'MCPs provide specialized capabilities to agents',
          key_points: [
            'MCPs are Claude plugins',
            'Each MCP offers specific tools',
            'Agents can require specific MCPs',
            'Fallback to simulation without MCPs'
          ],
          examples: [
            'shadcn-ui MCP for component library',
            'Context7 MCP for documentation'
          ],
          learn_more: 'docs/mcp-integration.md'
        },
        collaboration_patterns: {
          description: 'How agents collaborate',
          explanation: 'Multiple patterns for agent coordination',
          key_points: [
            'Hierarchical teams with supervisors',
            'Consensus voting for decisions',
            'Reflection loops for improvement',
            'Error recovery collaboration'
          ],
          examples: [
            'UI team: components + styling + animations',
            'Quality team: testing + security + performance'
          ],
          learn_more: 'configs/collaboration-patterns.json'
        }
      },
      commands: {
        'frontend-flow': {
          description: 'Main command to run the pipeline',
          usage: 'frontend-flow "your task description"',
          options: [
            '--dry-run: Simulate without executing',
            '--verbose: Show detailed output',
            '--educational: Enable learning mode',
            '--enhanced: Use enhanced mode',
            '--agent=NAME: Use specific agent'
          ],
          examples: [
            'frontend-flow "create login form"',
            'frontend-flow "optimize performance" --verbose',
            'frontend-flow --educational "implement dark mode"'
          ]
        },
        'frontend-flow init': {
          description: 'Initialize Frontend Flow in project',
          usage: 'frontend-flow init [options]',
          options: [
            '--force: Overwrite existing config',
            '--template=NAME: Use specific template'
          ],
          examples: [
            'frontend-flow init',
            'frontend-flow init --template=e-commerce'
          ]
        },
        'frontend-flow marketplace': {
          description: 'Access agent marketplace',
          usage: 'frontend-flow marketplace [action]',
          options: [
            'search: Find agents',
            'install: Install an agent',
            'list: Show installed agents',
            'submit: Submit your agent'
          ],
          examples: [
            'frontend-flow marketplace search stripe',
            'frontend-flow marketplace install agent-stripe-integration'
          ]
        }
      },
      troubleshooting: {
        performance: {
          symptoms: ['Slow execution', 'High memory usage', 'Timeouts'],
          diagnostics: [
            'Check system resources',
            'Review agent metrics',
            'Monitor with dashboard'
          ],
          solutions: [
            'Increase memory allocation',
            'Disable unnecessary agents',
            'Use --dry-run to test first',
            'Clear cache with frontend-flow clean'
          ]
        },
        compatibility: {
          symptoms: ['Agent not found', 'Version conflicts', 'Framework mismatch'],
          diagnostics: [
            'Check Frontend Flow version',
            'Verify framework detection',
            'Review agent requirements'
          ],
          solutions: [
            'Update Frontend Flow: npm update -g frontend-flow-agents',
            'Check framework support in docs',
            'Install required MCPs'
          ]
        }
      }
    };

    this.contextStack = [];
    this.recentErrors = [];
  }

  async getHelp(context, detailed = false) {
    // Determine help type from context
    const helpType = this.determineHelpType(context);

    if (!helpType) {
      return this.getGeneralHelp();
    }

    const helpContent = this.findHelpContent(helpType, context);

    if (!helpContent) {
      return this.suggestAlternatives(context);
    }

    return this.formatHelp(helpContent, detailed);
  }

  determineHelpType(context) {
    if (context.error) return 'error';
    if (context.command) return 'command';
    if (context.concept) return 'concept';
    if (context.troubleshoot) return 'troubleshooting';
    return null;
  }

  findHelpContent(type, context) {
    switch (type) {
      case 'error':
        return this.findErrorHelp(context.error);
      case 'command':
        return this.helpDatabase.commands[context.command];
      case 'concept':
        return this.helpDatabase.concepts[context.concept];
      case 'troubleshooting':
        return this.helpDatabase.troubleshooting[context.troubleshoot];
      default:
        return null;
    }
  }

  findErrorHelp(error) {
    // Try to match error message to known errors
    const errorMessage = error.message || error.toString().toLowerCase();

    for (const [key, helpContent] of Object.entries(this.helpDatabase.errors)) {
      if (errorMessage.includes(key.replace('_', ' '))) {
        return helpContent;
      }
    }

    // Check for common patterns
    if (errorMessage.includes('type')) return this.helpDatabase.errors.type_mismatch;
    if (errorMessage.includes('cannot find module')) return this.helpDatabase.errors.missing_dependency;
    if (errorMessage.includes('lint')) return this.helpDatabase.errors.lint_error;
    if (errorMessage.includes('build')) return this.helpDatabase.errors.build_failed;
    if (errorMessage.includes('test')) return this.helpDatabase.errors.test_failure;

    return null;
  }

  formatHelp(helpContent, detailed) {
    let output = [];

    output.push(chalk.cyan('\n💡 Contextual Help'));
    output.push(chalk.gray('─'.repeat(50)));

    if (helpContent.description) {
      output.push(chalk.white(`\n📋 ${helpContent.description}`));
    }

    if (helpContent.explanation) {
      output.push(chalk.gray(`\n${helpContent.explanation}`));
    }

    if (helpContent.common_causes) {
      output.push(chalk.yellow('\n🔍 Common Causes:'));
      helpContent.common_causes.forEach(cause => {
        output.push(chalk.gray(`   • ${cause}`));
      });
    }

    if (helpContent.solutions) {
      output.push(chalk.green('\n✅ Solutions:'));
      helpContent.solutions.forEach((solution, index) => {
        output.push(chalk.white(`   ${index + 1}. ${solution}`));
      });
    }

    if (helpContent.auto_fix) {
      output.push(chalk.blue(`\n🔧 Quick Fix: ${helpContent.auto_fix}`));
    }

    if (detailed) {
      if (helpContent.examples) {
        output.push(chalk.cyan('\n📝 Examples:'));
        helpContent.examples.forEach(example => {
          output.push(chalk.gray(`   ${example}`));
        });
      }

      if (helpContent.options) {
        output.push(chalk.cyan('\n⚙️ Options:'));
        helpContent.options.forEach(option => {
          output.push(chalk.gray(`   ${option}`));
        });
      }

      if (helpContent.key_points) {
        output.push(chalk.cyan('\n📌 Key Points:'));
        helpContent.key_points.forEach(point => {
          output.push(chalk.gray(`   • ${point}`));
        });
      }
    }

    if (helpContent.related) {
      output.push(chalk.magenta(`\n🔗 Related Topics: ${helpContent.related.join(', ')}`));
    }

    if (helpContent.learn_more) {
      output.push(chalk.blue(`\n📚 Learn More: ${helpContent.learn_more}`));
    }

    return output.join('\n');
  }

  suggestAlternatives(context) {
    const suggestions = [];

    // Find similar topics
    const allTopics = [
      ...Object.keys(this.helpDatabase.errors),
      ...Object.keys(this.helpDatabase.commands),
      ...Object.keys(this.helpDatabase.concepts)
    ];

    const contextString = JSON.stringify(context).toLowerCase();

    allTopics.forEach(topic => {
      if (contextString.includes(topic.replace('_', ' ').toLowerCase())) {
        suggestions.push(topic);
      }
    });

    if (suggestions.length > 0) {
      return chalk.yellow(`\n💡 Did you mean: ${suggestions.join(', ')}?\n`) +
             chalk.gray('Try: frontend-flow help <topic>');
    }

    return this.getGeneralHelp();
  }

  getGeneralHelp() {
    return chalk.cyan(`
🚀 Frontend Flow Help System

Common Commands:
  frontend-flow "task"        - Run a task
  frontend-flow init         - Initialize project
  frontend-flow status       - Show pipeline status
  frontend-flow doctor       - Check system health
  frontend-flow marketplace  - Browse agent marketplace

Help Topics:
  Errors: ${Object.keys(this.helpDatabase.errors).slice(0, 3).join(', ')}...
  Concepts: ${Object.keys(this.helpDatabase.concepts).slice(0, 3).join(', ')}...
  Commands: ${Object.keys(this.helpDatabase.commands).slice(0, 3).join(', ')}...

For detailed help: frontend-flow help <topic>
Documentation: https://frontend-flow.dev/docs
    `);
  }

  async trackError(error) {
    this.recentErrors.push({
      timestamp: new Date().toISOString(),
      error: error.message || error,
      stack: error.stack
    });

    // Keep only last 10 errors
    if (this.recentErrors.length > 10) {
      this.recentErrors.shift();
    }

    // Auto-suggest help for the error
    const help = await this.getHelp({ error }, false);
    if (help && help !== this.getGeneralHelp()) {
      console.log(help);
    }
  }

  async provideProactiveSuggestion(action, result) {
    // Provide suggestions based on action results
    const suggestions = {
      component_created: [
        'Add tests with: frontend-flow "add tests for the component"',
        'Style with: frontend-flow "apply dark mode styling"',
        'Document with: frontend-flow "generate storybook stories"'
      ],
      test_passed: [
        'Increase coverage: frontend-flow "improve test coverage"',
        'Add E2E tests: frontend-flow "create cypress tests"'
      ],
      build_success: [
        'Optimize bundle: frontend-flow "optimize bundle size"',
        'Deploy: frontend-flow "deploy to production"'
      ]
    };

    const relevantSuggestions = suggestions[action];

    if (relevantSuggestions && Math.random() > 0.7) { // 30% chance to suggest
      console.log(chalk.cyan('\n💡 Next Steps:'));
      relevantSuggestions.forEach(suggestion => {
        console.log(chalk.gray(`   • ${suggestion}`));
      });
    }
  }

  async generateHelpDocument(topic) {
    const helpContent = this.findHelpContent('concept', { concept: topic }) ||
                       this.findHelpContent('command', { command: topic }) ||
                       this.findHelpContent('error', { error: { message: topic } });

    if (!helpContent) {
      return null;
    }

    const markdown = `# ${topic}

${helpContent.description || ''}

${helpContent.explanation || ''}

${helpContent.common_causes ? '## Common Causes\n' + helpContent.common_causes.map(c => `- ${c}`).join('\n') : ''}

${helpContent.solutions ? '## Solutions\n' + helpContent.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n') : ''}

${helpContent.examples ? '## Examples\n```bash\n' + helpContent.examples.join('\n') + '\n```' : ''}

${helpContent.auto_fix ? `## Quick Fix\n\`${helpContent.auto_fix}\`` : ''}

${helpContent.learn_more ? `\n[Learn More](${helpContent.learn_more})` : ''}
`;

    const docPath = path.join(process.cwd(), '.frontend-flow', 'help', `${topic}.md`);
    await fs.ensureDir(path.dirname(docPath));
    await fs.writeFile(docPath, markdown);

    console.log(chalk.green(`\n📄 Help document generated: ${docPath}`));

    return markdown;
  }
}

module.exports = ContextualHelp;