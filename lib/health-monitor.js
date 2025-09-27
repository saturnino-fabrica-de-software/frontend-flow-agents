const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { createSpinner } = require('./spinner');

class HealthMonitor {
  constructor() {
    this.healthDataPath = path.join(process.cwd(), '.frontend-flow', 'health');
    this.metricsPath = path.join(__dirname, '..', 'configs', 'agent-metrics.json');
    this.versionsPath = path.join(__dirname, '..', 'configs', 'agent-versions.json');
    this.thresholdsPath = path.join(__dirname, '..', 'configs', 'health-thresholds.json');
    this.healthStatus = {};
    this.alerts = [];
    this.thresholds = null;
  }

  async initialize() {
    await fs.ensureDir(this.healthDataPath);
    await this.loadThresholds();
    await this.loadHealthData();
    // Don't start monitoring automatically - it creates infinite loops
    // await this.startMonitoring();
  }

  async loadThresholds() {
    try {
      if (await fs.pathExists(this.thresholdsPath)) {
        const config = await fs.readJSON(this.thresholdsPath);
        this.thresholds = config.thresholds;
        this.monitoringConfig = config.monitoring;
        this.recoveryConfig = config.recovery;
      } else {
        // Use defaults if config doesn't exist
        this.thresholds = {
          critical: {
            success_rate: 0.70,
            response_time_ms: 120000,
            error_rate: 0.30
          },
          warning: {
            success_rate: 0.85,
            response_time_ms: 60000,
            error_rate: 0.15
          }
        };
      }
    } catch (error) {
      console.error(chalk.yellow('⚠️ Using default thresholds'));
    }
  }

  async loadHealthData() {
    const healthFile = path.join(this.healthDataPath, 'current-health.json');

    if (await fs.pathExists(healthFile)) {
      this.healthStatus = await fs.readJSON(healthFile);
    } else {
      this.healthStatus = await this.initializeHealthStatus();
    }
  }

  async initializeHealthStatus() {
    const metrics = await fs.readJSON(this.metricsPath);
    const versions = await fs.readJSON(this.versionsPath);

    const status = {};

    for (const [agentName, agentMetrics] of Object.entries(metrics.metrics)) {
      status[agentName] = {
        health: this.calculateHealth(agentMetrics),
        last_check: new Date().toISOString(),
        metrics: {
          success_rate: agentMetrics.success_rate,
          avg_duration: agentMetrics.avg_duration,
          total_runs: agentMetrics.total_runs,
          error_trend: 'stable'
        },
        version: versions.agents[agentName]?.current || 'unknown',
        dependencies: this.checkDependencies(agentMetrics.dependencies),
        status_history: []
      };
    }

    return status;
  }

  calculateHealth(metrics) {
    const successRate = metrics.success_rate || 0;
    const avgDurationMs = parseInt(metrics.avg_duration) * 1000;

    if (successRate < this.thresholds.critical.success_rate ||
        avgDurationMs > this.thresholds.critical.response_time) {
      return 'critical';
    }

    if (successRate < this.thresholds.warning.success_rate ||
        avgDurationMs > this.thresholds.warning.response_time) {
      return 'warning';
    }

    return 'healthy';
  }

  async checkDependencies(dependencies) {
    if (!dependencies || dependencies.length === 0) {
      return { status: 'none', missing: [] };
    }

    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!await fs.pathExists(packageJsonPath)) {
      return { status: 'unknown', missing: [] };
    }

    const packageJson = await fs.readJSON(packageJsonPath);
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const missing = dependencies.filter(dep => !allDeps[dep]);

    return {
      status: missing.length === 0 ? 'satisfied' : 'missing',
      missing
    };
  }

  async startMonitoring() {
    // Set up periodic health checks
    this.monitorInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }

  async stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }

  async performHealthCheck() {
    const spinner = createSpinner('Performing health check...').start();

    try {
      for (const [agentName, status] of Object.entries(this.healthStatus)) {
        // Update metrics
        const currentMetrics = await this.getCurrentMetrics(agentName);
        status.metrics = currentMetrics;

        // Calculate new health status
        const newHealth = this.calculateHealth(currentMetrics);

        // Check for status changes
        if (newHealth !== status.health) {
          this.handleHealthChange(agentName, status.health, newHealth);
          status.health = newHealth;
        }

        // Update history
        status.status_history.push({
          timestamp: new Date().toISOString(),
          health: newHealth,
          metrics: currentMetrics
        });

        // Keep only last 100 history entries
        if (status.status_history.length > 100) {
          status.status_history.shift();
        }

        status.last_check = new Date().toISOString();
      }

      await this.saveHealthData();
      spinner.succeed('Health check completed');

      if (this.alerts.length > 0) {
        this.displayAlerts();
      }

    } catch (error) {
      spinner.fail(`Health check failed: ${error.message}`);
    }
  }

  async getCurrentMetrics(agentName) {
    // In production, this would fetch real-time metrics
    const metricsFile = await fs.readJSON(this.metricsPath);
    const agentMetrics = metricsFile.metrics[agentName] || {};

    // Simulate some variance in metrics
    return {
      success_rate: Math.max(0, Math.min(1, agentMetrics.success_rate + (Math.random() - 0.5) * 0.05)),
      avg_duration: agentMetrics.avg_duration,
      total_runs: agentMetrics.total_runs + Math.floor(Math.random() * 10),
      error_trend: this.calculateErrorTrend(agentName)
    };
  }

  calculateErrorTrend(agentName) {
    const history = this.healthStatus[agentName]?.status_history || [];

    if (history.length < 5) return 'stable';

    const recentErrors = history.slice(-5).map(h => 1 - h.metrics.success_rate);
    const trend = recentErrors[4] - recentErrors[0];

    if (trend > 0.05) return 'increasing';
    if (trend < -0.05) return 'decreasing';
    return 'stable';
  }

  handleHealthChange(agentName, oldHealth, newHealth) {
    const alert = {
      timestamp: new Date().toISOString(),
      agent: agentName,
      change: `${oldHealth} → ${newHealth}`,
      severity: newHealth === 'critical' ? 'high' : 'medium'
    };

    this.alerts.push(alert);

    // Log immediate alert
    if (newHealth === 'critical') {
      console.log(chalk.red(`\n🚨 CRITICAL: ${agentName} health degraded to critical!`));
    } else if (newHealth === 'warning') {
      console.log(chalk.yellow(`\n⚠️ WARNING: ${agentName} health changed to warning`));
    } else if (oldHealth === 'critical' && newHealth === 'healthy') {
      console.log(chalk.green(`\n✅ RECOVERED: ${agentName} is now healthy`));
    }
  }

  displayAlerts() {
    console.log(chalk.cyan('\n🔔 Health Alerts:'));
    console.log(chalk.gray('─'.repeat(50)));

    this.alerts.slice(-5).forEach(alert => {
      const color = alert.severity === 'high' ? chalk.red : chalk.yellow;
      console.log(color(`[${new Date(alert.timestamp).toLocaleTimeString()}] ${alert.agent}: ${alert.change}`));
    });

    // Clear displayed alerts
    this.alerts = [];
  }

  async saveHealthData() {
    const healthFile = path.join(this.healthDataPath, 'current-health.json');
    await fs.writeJSON(healthFile, this.healthStatus, { spaces: 2 });

    // Also save a timestamped backup
    const backupFile = path.join(
      this.healthDataPath,
      `health_${new Date().toISOString().split('T')[0]}.json`
    );
    await fs.writeJSON(backupFile, this.healthStatus, { spaces: 2 });
  }

  async generateHealthReport() {
    console.log(chalk.cyan('\n📊 Agent Health Report'));
    console.log(chalk.gray('═'.repeat(60)));

    const healthSummary = {
      healthy: 0,
      warning: 0,
      critical: 0
    };

    for (const [agentName, status] of Object.entries(this.healthStatus)) {
      healthSummary[status.health]++;

      const healthIcon = {
        healthy: chalk.green('✅'),
        warning: chalk.yellow('⚠️'),
        critical: chalk.red('🚨')
      }[status.health];

      console.log(`\n${healthIcon} ${chalk.white(agentName)}`);
      console.log(chalk.gray('─'.repeat(40)));
      console.log(chalk.white(`  Health: ${status.health}`));
      console.log(chalk.white(`  Success Rate: ${(status.metrics.success_rate * 100).toFixed(1)}%`));
      console.log(chalk.white(`  Avg Duration: ${status.metrics.avg_duration}`));
      console.log(chalk.white(`  Total Runs: ${status.metrics.total_runs.toLocaleString()}`));
      console.log(chalk.white(`  Error Trend: ${status.metrics.error_trend}`));
      console.log(chalk.white(`  Version: ${status.version}`));

      if (status.dependencies.status === 'missing' && status.dependencies.missing.length > 0) {
        console.log(chalk.red(`  Missing Dependencies: ${status.dependencies.missing.join(', ')}`));
      }

      // Show recent issues if any
      const recentIssues = this.getRecentIssues(agentName);
      if (recentIssues.length > 0) {
        console.log(chalk.yellow(`  Recent Issues:`));
        recentIssues.forEach(issue => {
          console.log(chalk.gray(`    - ${issue}`));
        });
      }
    }

    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.cyan('Summary:'));
    console.log(chalk.green(`  Healthy: ${healthSummary.healthy}`));
    console.log(chalk.yellow(`  Warning: ${healthSummary.warning}`));
    console.log(chalk.red(`  Critical: ${healthSummary.critical}`));

    const overallHealth = this.calculateOverallHealth(healthSummary);
    console.log(chalk.white(`\n  Overall System Health: ${overallHealth}`));

    return {
      summary: healthSummary,
      overall: overallHealth,
      details: this.healthStatus
    };
  }

  getRecentIssues(agentName) {
    const issues = [];
    const status = this.healthStatus[agentName];

    if (status.metrics.success_rate < 0.9) {
      issues.push(`Low success rate: ${(status.metrics.success_rate * 100).toFixed(1)}%`);
    }

    if (status.metrics.error_trend === 'increasing') {
      issues.push('Error rate is increasing');
    }

    if (parseInt(status.metrics.avg_duration) > 60) {
      issues.push(`Slow response time: ${status.metrics.avg_duration}`);
    }

    return issues;
  }

  calculateOverallHealth(summary) {
    const total = summary.healthy + summary.warning + summary.critical;

    if (total === 0) return 'Unknown';

    const healthScore = (summary.healthy * 1 + summary.warning * 0.5 + summary.critical * 0) / total;

    if (healthScore >= 0.9) return chalk.green('Excellent');
    if (healthScore >= 0.7) return chalk.green('Good');
    if (healthScore >= 0.5) return chalk.yellow('Fair');
    return chalk.red('Poor');
  }

  async performRecovery(agentName) {
    console.log(chalk.cyan(`\n🔧 Attempting recovery for ${agentName}...`));

    const spinner = createSpinner('Running recovery procedures...').start();

    try {
      // Step 1: Clear cache
      await this.clearAgentCache(agentName);

      // Step 2: Reset agent state
      await this.resetAgentState(agentName);

      // Step 3: Verify dependencies
      await this.verifyDependencies(agentName);

      // Step 4: Test agent
      const testResult = await this.testAgent(agentName);

      if (testResult.success) {
        spinner.succeed(`Recovery successful for ${agentName}`);
        this.healthStatus[agentName].health = 'healthy';
        await this.saveHealthData();
        return true;
      } else {
        spinner.fail(`Recovery failed for ${agentName}: ${testResult.error}`);
        return false;
      }

    } catch (error) {
      spinner.fail(`Recovery error: ${error.message}`);
      return false;
    }
  }

  async clearAgentCache(agentName) {
    const cachePath = path.join(this.healthDataPath, 'cache', agentName);
    if (await fs.pathExists(cachePath)) {
      await fs.remove(cachePath);
    }
  }

  async resetAgentState(agentName) {
    // Reset agent-specific state
    this.healthStatus[agentName].status_history = [];
    this.healthStatus[agentName].last_check = new Date().toISOString();
  }

  async verifyDependencies(agentName) {
    const deps = this.healthStatus[agentName].dependencies;
    if (deps.status === 'missing' && deps.missing.length > 0) {
      console.log(chalk.yellow(`\n📦 Missing dependencies for ${agentName}: ${deps.missing.join(', ')}`));
      console.log(chalk.cyan('Install them with: npm install ' + deps.missing.join(' ')));
      throw new Error('Missing dependencies');
    }
  }

  async testAgent(agentName) {
    // Simulate agent testing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Random success for simulation
    const success = Math.random() > 0.3;

    return {
      success,
      error: success ? null : 'Test execution failed'
    };
  }
}

module.exports = HealthMonitor;