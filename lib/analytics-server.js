const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const WebSocket = require('ws');
const chalk = require('chalk');

class AnalyticsServer {
  constructor(options = {}) {
    this.port = options.port || 8082;
    this.wsPort = options.wsPort || 8083;
    this.dashboardPath = path.join(__dirname, '..', 'dashboard', 'analytics-dashboard.html');
    this.metricsPath = path.join(__dirname, '..', 'configs', 'agent-metrics.json');
    this.server = null;
    this.wss = null;
    this.metrics = {};
    this.liveData = {
      executions: [],
      currentAgents: [],
      errors: [],
      performance: []
    };
  }

  async start() {
    await this.loadMetrics();
    this.startHttpServer();
    this.startWebSocketServer();
    this.startMetricsCollection();

    console.log(chalk.green(`\n✨ Analytics Dashboard started!`));
    console.log(chalk.cyan(`📊 Dashboard: http://localhost:${this.port}`));
    console.log(chalk.cyan(`🔌 WebSocket: ws://localhost:${this.wsPort}`));
    console.log(chalk.gray(`\nPress Ctrl+C to stop the server\n`));
  }

  async loadMetrics() {
    try {
      this.metrics = await fs.readJSON(this.metricsPath);
    } catch (error) {
      console.error(chalk.red('Failed to load metrics:', error.message));
      this.metrics = { metrics: {}, badge_criteria: {} };
    }
  }

  startHttpServer() {
    this.server = http.createServer(async (req, res) => {
      if (req.url === '/' || req.url === '/dashboard') {
        try {
          const html = await fs.readFile(this.dashboardPath, 'utf-8');

          // Inject real metrics data
          const enhancedHtml = this.injectRealData(html);

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(enhancedHtml);
        } catch (error) {
          res.writeHead(500);
          res.end('Error loading dashboard');
        }
      } else if (req.url === '/api/metrics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getMetricsSummary()));
      } else if (req.url === '/api/live') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.liveData));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.server.listen(this.port);
  }

  startWebSocketServer() {
    this.wss = new WebSocket.Server({ port: this.wsPort });

    this.wss.on('connection', (ws) => {
      console.log(chalk.green('📡 Dashboard client connected'));

      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.getMetricsSummary()
      }));

      // Send live updates every 2 seconds
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'update',
            data: this.generateLiveUpdate()
          }));
        }
      }, 2000);

      ws.on('close', () => {
        clearInterval(interval);
        console.log(chalk.yellow('📡 Dashboard client disconnected'));
      });
    });
  }

  injectRealData(html) {
    const totalExecutions = this.calculateTotalExecutions();
    const avgSuccessRate = this.calculateAvgSuccessRate();
    const activeAgents = Object.keys(this.metrics.metrics || {}).length;

    // Replace placeholder values with real data
    html = html.replace('245,678', totalExecutions.toLocaleString());
    html = html.replace('94.3%', `${avgSuccessRate.toFixed(1)}%`);
    html = html.replace('<div class="value">45</div>', `<div class="value">${activeAgents}</div>`);

    return html;
  }

  calculateTotalExecutions() {
    const metrics = this.metrics.metrics || {};
    return Object.values(metrics).reduce((sum, agent) => sum + (agent.total_runs || 0), 0);
  }

  calculateAvgSuccessRate() {
    const metrics = this.metrics.metrics || {};
    const agents = Object.values(metrics);
    if (agents.length === 0) return 0;

    const totalSuccess = agents.reduce((sum, agent) => sum + (agent.success_rate || 0), 0);
    return (totalSuccess / agents.length) * 100;
  }

  getMetricsSummary() {
    const metrics = this.metrics.metrics || {};
    const topAgents = Object.entries(metrics)
      .sort((a, b) => b[1].total_runs - a[1].total_runs)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        ...data
      }));

    return {
      totalExecutions: this.calculateTotalExecutions(),
      avgSuccessRate: this.calculateAvgSuccessRate(),
      activeAgents: Object.keys(metrics).length,
      topAgents,
      recentActivity: this.liveData.executions.slice(-10),
      errorRate: this.calculateErrorRate(),
      performanceTrend: this.getPerformanceTrend()
    };
  }

  calculateErrorRate() {
    const metrics = this.metrics.metrics || {};
    const agents = Object.values(metrics);
    if (agents.length === 0) return 0;

    const totalErrors = agents.reduce((sum, agent) => {
      const errorRate = 1 - (agent.success_rate || 0);
      return sum + (errorRate * (agent.total_runs || 0));
    }, 0);

    const totalRuns = this.calculateTotalExecutions();
    return totalRuns > 0 ? (totalErrors / totalRuns) * 100 : 0;
  }

  getPerformanceTrend() {
    // Simulate performance trend data
    const hours = 24;
    const trend = [];
    const now = Date.now();

    for (let i = hours; i > 0; i--) {
      trend.push({
        timestamp: new Date(now - i * 3600000).toISOString(),
        avgDuration: 35 + Math.random() * 20,
        successRate: 90 + Math.random() * 10
      });
    }

    return trend;
  }

  generateLiveUpdate() {
    // Simulate live data updates
    const agents = Object.keys(this.metrics.metrics || {});
    const randomAgent = agents[Math.floor(Math.random() * agents.length)] || 'unknown';

    const execution = {
      agent: randomAgent,
      timestamp: new Date().toISOString(),
      duration: Math.floor(20 + Math.random() * 60),
      success: Math.random() > 0.1,
      user: `user_${Math.floor(Math.random() * 1000)}`
    };

    // Add to live data
    this.liveData.executions.push(execution);
    if (this.liveData.executions.length > 100) {
      this.liveData.executions.shift();
    }

    // Update current agents
    if (!this.liveData.currentAgents.includes(randomAgent)) {
      this.liveData.currentAgents.push(randomAgent);
      if (this.liveData.currentAgents.length > 5) {
        this.liveData.currentAgents.shift();
      }
    }

    return {
      execution,
      currentLoad: this.liveData.currentAgents.length,
      recentErrors: this.liveData.errors.slice(-5),
      performanceMetrics: {
        avgResponseTime: 35 + Math.random() * 15,
        throughput: Math.floor(100 + Math.random() * 50),
        activeConnections: this.wss ? this.wss.clients.size : 0
      }
    };
  }

  startMetricsCollection() {
    // Simulate continuous metrics collection
    setInterval(async () => {
      await this.loadMetrics(); // Reload metrics periodically

      // Simulate performance data collection
      this.liveData.performance.push({
        timestamp: new Date().toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        activeAgents: this.liveData.currentAgents.length
      });

      if (this.liveData.performance.length > 60) {
        this.liveData.performance.shift();
      }
    }, 5000);
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log(chalk.yellow('HTTP server stopped'));
    }

    if (this.wss) {
      this.wss.close();
      console.log(chalk.yellow('WebSocket server stopped'));
    }
  }
}

module.exports = AnalyticsServer;