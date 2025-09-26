const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

class EducationalMode {
  constructor(options = {}) {
    this.configPath = path.join(__dirname, '..', 'configs', 'educational-mode.json');
    this.enabled = options.enabled || false;
    this.verbosity = options.verbosity || 'standard';
    this.interactive = options.interactive || false;
    this.config = null;
    this.learningHistory = [];
    this.currentPath = null;
  }

  async initialize() {
    await this.loadConfig();

    if (this.enabled) {
      console.log(chalk.magenta('\n🎓 Educational Mode Activated'));
      console.log(chalk.cyan(`📚 Verbosity: ${this.verbosity}`));
      console.log(chalk.cyan(`🔄 Interactive: ${this.interactive ? 'Yes' : 'No'}\n`));

      if (this.interactive) {
        await this.selectLearningPath();
      }
    }
  }

  async loadConfig() {
    try {
      this.config = await fs.readJSON(this.configPath);
    } catch (error) {
      console.error(chalk.red('Failed to load educational config:', error.message));
      this.config = { settings: {}, templates: {} };
    }
  }

  async selectLearningPath() {
    const paths = Object.keys(this.config.learning_paths);

    const { selectedPath } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPath',
        message: '📚 Select your learning path:',
        choices: paths.map(path => ({
          name: `${this.config.learning_paths[path].name} - ${path}`,
          value: path
        }))
      }
    ]);

    this.currentPath = this.config.learning_paths[selectedPath];
    console.log(chalk.green(`\n✅ Learning path selected: ${this.currentPath.name}`));
    console.log(chalk.gray(`   Modules: ${this.currentPath.modules.length}`));
  }

  async explainDecision(decision) {
    if (!this.enabled) return;

    const verbosityLevel = this.config.settings.verbosity.levels[this.verbosity];

    if (!verbosityLevel.details.includes('decision_reasoning')) return;

    const template = this.config.templates.decision_explanation.format;
    const explanation = template
      .replace('{title}', decision.title)
      .replace('{reasoning}', decision.reasoning)
      .replace('{confidence}', decision.confidence || 85)
      .replace('{alternatives}', decision.alternatives?.join(', ') || 'None considered')
      .replace('{choice}', decision.choice)
      .replace('{impact}', decision.impact || 'Standard implementation');

    console.log(chalk.blue('\n' + explanation));

    if (this.config.settings.explanations.show_risks && decision.risks) {
      console.log(chalk.yellow(`\n⚠️ Potential Risks: ${decision.risks.join(', ')}`));
    }

    if (this.config.settings.learning_resources.enabled && decision.resources) {
      console.log(chalk.cyan('\n📖 Learn More:'));
      decision.resources.forEach(resource => {
        console.log(chalk.gray(`   • ${resource}`));
      });
    }

    if (this.interactive && this.config.settings.interactive_mode.features.pause_points.enabled) {
      await this.pauseForInput();
    }

    this.learningHistory.push({
      type: 'decision',
      timestamp: new Date().toISOString(),
      data: decision
    });
  }

  async explainAgent(agentName, purpose, process) {
    if (!this.enabled) return;

    const verbosityLevel = this.config.settings.verbosity.levels[this.verbosity];

    if (!verbosityLevel.details.includes('agent_selection')) return;

    console.log(chalk.cyan(`\n🤖 Agent Activated: ${agentName}`));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(chalk.white(`📋 Purpose: ${purpose}`));
    console.log(chalk.white(`⚙️ Process:`));

    if (Array.isArray(process)) {
      process.forEach((step, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${step}`));
      });
    } else {
      console.log(chalk.gray(`   ${process}`));
    }

    if (this.verbosity === 'detailed' || this.verbosity === 'expert') {
      await this.showAgentInternals(agentName);
    }

    this.learningHistory.push({
      type: 'agent',
      timestamp: new Date().toISOString(),
      data: { agentName, purpose, process }
    });
  }

  async showLearningPoint(agentName, result) {
    if (!this.enabled) return;

    const verbosityLevel = this.config.settings.verbosity.levels[this.verbosity];

    if (verbosityLevel.learning_points) {
      console.log(chalk.green(`\n✨ Learning Point from ${agentName}:`));
      console.log(chalk.gray(`   Result: ${result.success ? 'Success' : 'Failed'}`));

      if (result.learnings) {
        result.learnings.forEach(learning => {
          console.log(chalk.yellow(`   💡 ${learning}`));
        });
      }
    }
  }

  async showAgentInternals(agentName) {
    console.log(chalk.blue('\n🔧 Technical Details:'));

    const internals = {
      'agent_react_components': {
        techniques: ['Component composition', 'Props drilling prevention', 'Type safety'],
        patterns: ['Functional components', 'Custom hooks', 'Memoization'],
        dependencies: ['React', 'TypeScript', 'shadcn-ui']
      },
      'agent_tailwind_estilization': {
        techniques: ['Utility-first CSS', 'Responsive design', 'Dark mode'],
        patterns: ['Mobile-first', 'Component variants', 'Custom utilities'],
        dependencies: ['TailwindCSS', 'PostCSS']
      },
      'agent_redux_toolkit': {
        techniques: ['Immutable updates', 'Normalized state', 'Async thunks'],
        patterns: ['Slices', 'RTK Query', 'Entity adapters'],
        dependencies: ['Redux Toolkit', 'React-Redux']
      }
    };

    const details = internals[agentName] || {
      techniques: ['Standard implementation'],
      patterns: ['Best practices'],
      dependencies: ['Core libraries']
    };

    console.log(chalk.gray('   Techniques: ' + details.techniques.join(', ')));
    console.log(chalk.gray('   Patterns: ' + details.patterns.join(', ')));
    console.log(chalk.gray('   Dependencies: ' + details.dependencies.join(', ')));
  }

  async explainError(error, solution) {
    if (!this.enabled) return;

    console.log(chalk.red('\n⚠️ Learning Opportunity - Error Encountered'));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(chalk.white(`❌ What Happened: ${error.message || error}`));
    console.log(chalk.yellow(`🔍 Why It Happened: ${error.cause || 'Unknown cause'}`));
    console.log(chalk.green(`✅ How We Fixed It: ${solution}`));

    if (this.verbosity === 'detailed' || this.verbosity === 'expert') {
      console.log(chalk.blue('\n💡 Prevention Tips:'));
      const tips = this.getPreventionTips(error);
      tips.forEach(tip => {
        console.log(chalk.gray(`   • ${tip}`));
      });
    }

    this.learningHistory.push({
      type: 'error',
      timestamp: new Date().toISOString(),
      data: { error: error.message, solution }
    });
  }

  getPreventionTips(error) {
    const errorType = error.type || 'generic';

    const tips = {
      'type_error': [
        'Use TypeScript strict mode',
        'Define interfaces for all data structures',
        'Avoid using any type'
      ],
      'dependency_error': [
        'Keep dependencies up to date',
        'Use lockfiles (package-lock.json)',
        'Check compatibility before installing'
      ],
      'syntax_error': [
        'Use a linter (ESLint)',
        'Enable editor syntax highlighting',
        'Format code with Prettier'
      ],
      'generic': [
        'Test code frequently',
        'Use version control',
        'Read error messages carefully'
      ]
    };

    return tips[errorType] || tips.generic;
  }

  async showAlternatives(chosen, alternatives, reasoning) {
    if (!this.enabled) return;
    if (!this.config.settings.explanations.show_alternatives) return;

    console.log(chalk.cyan('\n🔄 Alternatives Considered:'));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(chalk.green(`✓ Chosen: ${chosen}`));
    console.log(chalk.white(`   Reason: ${reasoning}`));

    if (alternatives && alternatives.length > 0) {
      console.log(chalk.yellow('\n✗ Alternatives:'));
      alternatives.forEach(alt => {
        console.log(chalk.gray(`   • ${alt.name}: ${alt.reason_rejected}`));
      });
    }

    if (this.interactive && this.config.settings.interactive_mode.features.exploration_mode.enabled) {
      const { explore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'explore',
          message: 'Would you like to explore an alternative approach?',
          default: false
        }
      ]);

      if (explore) {
        await this.exploreAlternative(alternatives);
      }
    }
  }

  async exploreAlternative(alternatives) {
    if (!alternatives || alternatives.length === 0) {
      console.log(chalk.yellow('No alternatives available to explore.'));
      return;
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select an alternative to explore:',
        choices: alternatives.map(alt => ({
          name: `${alt.name} - ${alt.description}`,
          value: alt
        }))
      }
    ]);

    console.log(chalk.blue(`\n📖 Exploring: ${selected.name}`));
    console.log(chalk.white(`Description: ${selected.description}`));
    console.log(chalk.white(`Pros: ${selected.pros?.join(', ') || 'N/A'}`));
    console.log(chalk.white(`Cons: ${selected.cons?.join(', ') || 'N/A'}`));
    console.log(chalk.white(`Use Case: ${selected.use_case || 'General purpose'}`));

    if (selected.code_example) {
      console.log(chalk.cyan('\nCode Example:'));
      console.log(chalk.gray(selected.code_example));
    }
  }

  async pauseForInput() {
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '⏸️ Paused for learning. Continue?',
        default: true
      }
    ]);

    if (!shouldContinue) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            'View glossary',
            'See current learning path',
            'Review decisions made',
            'Continue execution',
            'Exit'
          ]
        }
      ]);

      await this.handlePauseAction(action);
    }
  }

  async handlePauseAction(action) {
    switch (action) {
      case 'View glossary':
        this.showGlossary();
        await this.pauseForInput();
        break;
      case 'See current learning path':
        this.showLearningPath();
        await this.pauseForInput();
        break;
      case 'Review decisions made':
        this.showLearningHistory();
        await this.pauseForInput();
        break;
      case 'Exit':
        process.exit(0);
        break;
      default:
        // Continue execution
        break;
    }
  }

  showGlossary() {
    console.log(chalk.cyan('\n📚 Glossary of Terms:'));
    console.log(chalk.gray('─'.repeat(50)));

    Object.entries(this.config.glossary.terms).forEach(([term, definition]) => {
      console.log(chalk.white(`\n${term}:`));
      console.log(chalk.gray(`   ${definition}`));
    });
  }

  showLearningPath() {
    if (!this.currentPath) {
      console.log(chalk.yellow('No learning path selected.'));
      return;
    }

    console.log(chalk.cyan(`\n📖 Current Learning Path: ${this.currentPath.name}`));
    console.log(chalk.gray('─'.repeat(50)));

    this.currentPath.modules.forEach((module, index) => {
      console.log(chalk.white(`\n${index + 1}. ${module.title}`));
      console.log(chalk.gray(`   Topics: ${module.topics.join(', ')}`));
      console.log(chalk.gray(`   Time: ${module.estimated_time}`));
    });
  }

  showLearningHistory() {
    console.log(chalk.cyan('\n📜 Learning History:'));
    console.log(chalk.gray('─'.repeat(50)));

    if (this.learningHistory.length === 0) {
      console.log(chalk.yellow('No decisions recorded yet.'));
      return;
    }

    this.learningHistory.slice(-10).forEach(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();

      switch (entry.type) {
        case 'decision':
          console.log(chalk.blue(`[${time}] Decision: ${entry.data.title}`));
          break;
        case 'agent':
          console.log(chalk.green(`[${time}] Agent: ${entry.data.agentName}`));
          break;
        case 'error':
          console.log(chalk.red(`[${time}] Error: ${entry.data.error}`));
          break;
      }
    });
  }

  async generateLearningReport() {
    const report = {
      session: {
        start: this.learningHistory[0]?.timestamp,
        end: new Date().toISOString(),
        duration: this.learningHistory.length
      },
      statistics: {
        decisions_made: this.learningHistory.filter(e => e.type === 'decision').length,
        agents_used: [...new Set(this.learningHistory.filter(e => e.type === 'agent').map(e => e.data.agentName))].length,
        errors_encountered: this.learningHistory.filter(e => e.type === 'error').length
      },
      key_learnings: this.extractKeyLearnings(),
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(process.cwd(), '.frontend-flow', 'learning-report.json');
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJSON(reportPath, report, { spaces: 2 });

    console.log(chalk.green('\n📊 Learning Report Generated'));
    console.log(chalk.gray(`   Saved to: ${reportPath}`));

    return report;
  }

  extractKeyLearnings() {
    return this.learningHistory
      .filter(e => e.type === 'decision')
      .slice(-5)
      .map(e => ({
        decision: e.data.title,
        reasoning: e.data.reasoning,
        confidence: e.data.confidence
      }));
  }

  generateRecommendations() {
    const errorCount = this.learningHistory.filter(e => e.type === 'error').length;
    const recommendations = [];

    if (errorCount > 5) {
      recommendations.push('Consider reviewing error handling patterns');
    }

    if (this.verbosity === 'minimal') {
      recommendations.push('Try detailed verbosity for deeper understanding');
    }

    if (!this.interactive) {
      recommendations.push('Enable interactive mode for hands-on learning');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great progress! Consider exploring advanced topics');
    }

    return recommendations;
  }
}

module.exports = EducationalMode;