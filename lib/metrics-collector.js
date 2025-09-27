const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class MetricsCollector {
  constructor() {
    this.metricsPath = path.join(process.cwd(), '.frontend-flow', 'metrics');
    this.configPath = path.join(__dirname, '..', 'configs', 'agent-metrics.json');
    this.sessionMetrics = {};
    this.startTime = Date.now();
  }

  async initialize() {
    await fs.ensureDir(this.metricsPath);
    await this.loadMetrics();
  }

  async loadMetrics() {
    try {
      if (await fs.pathExists(this.configPath)) {
        const data = await fs.readJSON(this.configPath);
        this.metrics = data.metrics || {};
        this.badgeCriteria = data.badge_criteria || {};
      }
    } catch (error) {
      console.error(chalk.yellow('⚠️ Could not load metrics:', error.message));
      this.metrics = {};
    }
  }

  async recordAgentExecution(agentName, data = {}) {
    const { success = true, duration = 0, error = null, simulated = false, framework = 'unknown' } = data;
    if (!this.sessionMetrics[agentName]) {
      this.sessionMetrics[agentName] = {
        executions: 0,
        successes: 0,
        failures: 0,
        totalDuration: 0,
        errors: []
      };
    }

    const agentSession = this.sessionMetrics[agentName];
    agentSession.executions++;

    if (success) {
      agentSession.successes++;
    } else {
      agentSession.failures++;
      if (error) {
        agentSession.errors.push({
          timestamp: new Date().toISOString(),
          message: error.message || error
        });
      }
    }

    agentSession.totalDuration += duration;
    agentSession.avgDuration = Math.round(agentSession.totalDuration / agentSession.executions);

    // Update global metrics
    await this.updateGlobalMetrics(agentName, success, duration);
  }

  async updateGlobalMetrics(agentName, success, duration) {
    if (!this.metrics) {
      this.metrics = {};
    }
    if (!this.metrics[agentName]) {
      this.metrics[agentName] = {
        total_runs: 0,
        success_rate: 0,
        avg_duration: '0s',
        last_updated: new Date().toISOString().split('T')[0]
      };
    }

    const agent = this.metrics[agentName];
    agent.total_runs++;

    // Update success rate
    const currentSuccesses = Math.round(agent.success_rate * (agent.total_runs - 1));
    const newSuccesses = currentSuccesses + (success ? 1 : 0);
    agent.success_rate = parseFloat((newSuccesses / agent.total_runs).toFixed(2));

    // Update average duration
    const currentAvgMs = parseInt(agent.avg_duration) * 1000;
    const totalDuration = currentAvgMs * (agent.total_runs - 1) + duration;
    agent.avg_duration = `${Math.round(totalDuration / agent.total_runs / 1000)}s`;

    agent.last_updated = new Date().toISOString().split('T')[0];
  }

  getAgentBadge(agentName) {
    const agent = this.metrics[agentName];
    if (!agent) return '🔧 Beta';

    // Check badge criteria
    if (agent.success_rate >= 0.93 && agent.total_runs >= 10000) {
      return '🏆 Gold Standard';
    }
    if (agent.success_rate >= 0.95 && agent.badge?.includes('Security')) {
      return '🛡️ Security First';
    }
    if (parseInt(agent.avg_duration) <= 30 && agent.performance_score >= 85) {
      return '⚡ Performance';
    }
    if (agent.success_rate >= 0.85 && agent.total_runs >= 5000) {
      return '🥈 Silver Grade';
    }

    return agent.badge || '🔧 Beta';
  }

  async saveMetrics() {
    try {
      const metricsData = {
        metrics: this.metrics || {},
        badge_criteria: this.badgeCriteria || {},
        last_updated: new Date().toISOString()
      };
      await fs.writeJSON(this.configPath, metricsData, { spaces: 2 });
      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to save metrics:', error.message));
      return false;
    }
  }

  async generateReport() {
    const sessionDuration = Math.round((Date.now() - this.startTime) / 1000);

    console.log(chalk.cyan('\n📊 Session Metrics Report'));
    console.log(chalk.gray('─'.repeat(50)));

    console.log(chalk.white(`⏱️  Session Duration: ${sessionDuration}s`));
    console.log(chalk.white(`🤖 Agents Executed: ${Object.keys(this.sessionMetrics).length}`));

    let totalExecutions = 0;
    let totalSuccesses = 0;

    for (const [agentName, metrics] of Object.entries(this.sessionMetrics)) {
      totalExecutions += metrics.executions;
      totalSuccesses += metrics.successes;

      const successRate = ((metrics.successes / metrics.executions) * 100).toFixed(1);
      const badge = this.getAgentBadge(agentName);

      console.log(chalk.gray('\n─'.repeat(50)));
      console.log(chalk.blue(`${badge} ${agentName}`));
      console.log(chalk.white(`  Executions: ${metrics.executions}`));
      console.log(chalk.green(`  Success Rate: ${successRate}%`));
      console.log(chalk.yellow(`  Avg Duration: ${metrics.avgDuration}ms`));

      if (metrics.errors.length > 0) {
        console.log(chalk.red(`  Errors: ${metrics.errors.length}`));
        metrics.errors.slice(0, 3).forEach(err => {
          console.log(chalk.red(`    - ${err.message}`));
        });
      }
    }

    console.log(chalk.gray('\n' + '═'.repeat(50)));
    const overallSuccess = ((totalSuccesses / totalExecutions) * 100).toFixed(1);
    console.log(chalk.green(`✅ Overall Success Rate: ${overallSuccess}%`));
    console.log(chalk.cyan(`📈 Total Executions: ${totalExecutions}`));

    // Save session report
    await this.saveSessionReport();
  }

  async saveSessionReport() {
    const reportPath = path.join(
      this.metricsPath,
      `session_${new Date().toISOString().replace(/:/g, '-')}.json`
    );

    const report = {
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - this.startTime) / 1000),
      metrics: this.sessionMetrics,
      summary: {
        totalAgents: Object.keys(this.sessionMetrics).length,
        totalExecutions: Object.values(this.sessionMetrics).reduce((sum, m) => sum + m.executions, 0),
        totalSuccesses: Object.values(this.sessionMetrics).reduce((sum, m) => sum + m.successes, 0),
        totalFailures: Object.values(this.sessionMetrics).reduce((sum, m) => sum + m.failures, 0)
      }
    };

    await fs.writeJSON(reportPath, report, { spaces: 2 });

    // Update global metrics file
    await this.saveGlobalMetrics();
  }

  async saveGlobalMetrics() {
    const data = {
      metrics: this.metrics,
      badge_criteria: this.badgeCriteria,
      last_session: new Date().toISOString()
    };

    await fs.writeJSON(this.configPath, data, { spaces: 2 });
  }

  async displayAgentMetrics(agentName) {
    const agent = this.metrics[agentName];
    if (!agent) {
      console.log(chalk.yellow(`⚠️ No metrics available for ${agentName}`));
      return;
    }

    const badge = this.getAgentBadge(agentName);

    console.log(chalk.cyan(`\n📊 Metrics for ${agentName}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(`${badge} Badge: ${badge}`));
    console.log(chalk.white(`📈 Total Runs: ${agent.total_runs.toLocaleString()}`));
    console.log(chalk.green(`✅ Success Rate: ${(agent.success_rate * 100).toFixed(1)}%`));
    console.log(chalk.yellow(`⏱️  Avg Duration: ${agent.avg_duration}`));

    if (agent.user_rating) {
      const stars = '⭐'.repeat(Math.round(agent.user_rating));
      console.log(chalk.white(`⭐ Rating: ${stars} ${agent.user_rating}/5.0`));
    }

    if (agent.performance_score) {
      console.log(chalk.blue(`🚀 Performance Score: ${agent.performance_score}/100`));
    }

    if (agent.common_errors && agent.common_errors.length > 0) {
      console.log(chalk.red(`\n⚠️ Common Errors:`));
      agent.common_errors.forEach(error => {
        console.log(chalk.red(`  - ${error}`));
      });
    }

    if (agent.dependencies && agent.dependencies.length > 0) {
      console.log(chalk.gray(`\n📦 Dependencies: ${agent.dependencies.join(', ')}`));
    }

    console.log(chalk.gray(`\n🕐 Last Updated: ${agent.last_updated}`));
  }
}

module.exports = MetricsCollector;