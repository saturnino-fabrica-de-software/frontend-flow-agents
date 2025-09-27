const WebSocket = require('ws');
const http = require('http');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class FrontendFlowMonitorServer {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.dashboardPort = options.dashboardPort || 8081;
    this.connections = new Map();
    this.activePipelines = new Map();
    this.metrics = {
      componentsCreated: 0,
      avgBuildTime: 0,
      testCoverage: 85,
      bundleSize: 245,
      pipelinesCompleted: 0,
      successRate: 100
    };
  }

  async start() {
    try {
      // WebSocket Server
      this.wss = new WebSocket.Server({ port: this.port });
      this.wss.on('connection', this.handleConnection.bind(this));

      // Dashboard HTTP Server
      this.httpServer = http.createServer(this.handleHttpRequest.bind(this));
      this.httpServer.listen(this.dashboardPort);

      console.log(`🔴 Frontend Flow Monitor started:`);
      console.log(`📊 Dashboard: http://localhost:${this.dashboardPort}`);
      console.log(`🔌 WebSocket: ws://localhost:${this.port}`);

      return true;
    } catch (error) {
      console.error('Failed to start monitor server:', error.message);
      return false;
    }
  }

  handleConnection(ws, req) {
    const sessionId = this.generateSessionId();
    this.connections.set(sessionId, ws);

    // Send initial state
    ws.send(JSON.stringify({
      type: 'connection_established',
      sessionId,
      currentPipelines: Array.from(this.activePipelines.values()),
      metrics: this.metrics
    }));

    ws.on('close', () => this.connections.delete(sessionId));
  }

  async handleHttpRequest(req, res) {
    if (req.url === '/') {
      try {
        const dashboardPath = path.join(__dirname, '../../agents/monitoring/dashboard.html');
        const html = await fs.readFile(dashboardPath, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Dashboard not found');
      }
    } else if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.metrics));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }

  notifyPipelineStarted(pipelineData) {
    // Protect against missing demand
    if (!pipelineData || !pipelineData.demand) {
      console.warn(chalk.yellow('⚠️ Warning: pipelineData.demand is undefined'));
      pipelineData = pipelineData || {};
      pipelineData.demand = 'Unknown task';
    }

    const pipeline = {
      id: pipelineData.id,
      demand: pipelineData.demand,
      agents: (pipelineData.agents || []).map(name => ({
        name,
        status: 'pending',
        progress: 0
      })),
      startTime: new Date(),
      techStack: this.detectTechStack(pipelineData.demand),
      overallProgress: 0,
      estimatedCompletion: new Date(Date.now() + (5 * 60 * 1000)) // 5 min estimate
    };

    this.activePipelines.set(pipeline.id, pipeline);
    this.broadcast({
      type: 'pipeline_started',
      pipeline
    });

    this.broadcastLog('info', 'Pipeline', `Iniciado: ${pipeline.demand}`);
  }

  notifyAgentProgress(pipelineId, agentName, progress, status) {
    const pipeline = this.activePipelines.get(pipelineId);
    if (pipeline) {
      const agent = pipeline.agents.find(a => a.name === agentName);
      if (agent) {
        agent.progress = progress;
        agent.status = status;
        pipeline.overallProgress = this.calculateOverallProgress(pipeline);

        // Update ETA
        pipeline.estimatedCompletion = this.calculateETA(pipeline);
      }

      this.broadcast({
        type: 'agent_progress',
        pipelineId,
        agentName,
        progress,
        status,
        overallProgress: pipeline.overallProgress
      });

      if (progress === 100) {
        this.broadcastLog('success', agentName, 'Agente concluído');
      } else if (status === 'failed') {
        this.broadcastLog('error', agentName, 'Agente falhou');
      }
    }
  }

  notifyPipelineCompleted(pipelineId, results) {
    const pipeline = this.activePipelines.get(pipelineId);
    if (pipeline) {
      const duration = Date.now() - pipeline.startTime.getTime();

      this.activePipelines.delete(pipelineId);
      this.updateMetrics(results, duration);

      this.broadcast({
        type: 'pipeline_completed',
        pipelineId,
        duration: this.formatDuration(duration),
        results
      });

      this.broadcast({
        type: 'frontend_metrics',
        metrics: this.metrics
      });

      const status = results.success ? 'success' : 'error';
      const message = results.success ?
        `Concluído em ${this.formatDuration(duration)}` :
        `Falhou: ${results.error || 'Erro desconhecido'}`;

      this.broadcastLog(status, 'Pipeline', message);
    }
  }

  detectTechStack(demand) {
    const stack = ['React', 'TypeScript'];

    // Protect against undefined demand
    if (!demand) {
      console.warn(chalk.yellow('⚠️ Warning: demand is undefined in detectTechStack'));
      return stack;
    }

    const demandLower = demand.toLowerCase();

    if (demandLower.includes('tailwind') || demandLower.includes('estil')) {
      stack.push('TailwindCSS');
    }
    if (demandLower.includes('next')) {
      stack.push('Next.js');
    }
    if (demandLower.includes('redux') || demandLower.includes('estado')) {
      stack.push('Redux');
    }
    if (demandLower.includes('shadcn') || demandLower.includes('ui')) {
      stack.push('shadcn/ui');
    }

    return stack;
  }

  calculateOverallProgress(pipeline) {
    const totalProgress = pipeline.agents.reduce((sum, agent) => sum + (agent.progress || 0), 0);
    return Math.round(totalProgress / pipeline.agents.length);
  }

  calculateETA(pipeline) {
    const completedAgents = pipeline.agents.filter(a => a.progress === 100).length;
    const totalAgents = pipeline.agents.length;
    const elapsedTime = Date.now() - pipeline.startTime.getTime();

    if (completedAgents === 0) {
      return pipeline.estimatedCompletion; // Use initial estimate
    }

    const avgTimePerAgent = elapsedTime / completedAgents;
    const remainingAgents = totalAgents - completedAgents;
    const estimatedRemainingTime = remainingAgents * avgTimePerAgent;

    return new Date(Date.now() + estimatedRemainingTime);
  }

  updateMetrics(results, duration) {
    this.metrics.pipelinesCompleted++;
    this.metrics.componentsCreated += results.componentsCreated || 0;

    // Update average build time
    const newBuildTime = Math.round(duration / 1000);
    this.metrics.avgBuildTime = Math.round(
      (this.metrics.avgBuildTime + newBuildTime) / 2
    );

    // Update success rate
    if (results.success) {
      this.metrics.successRate = Math.min(100, this.metrics.successRate + 1);
    } else {
      this.metrics.successRate = Math.max(0, this.metrics.successRate - 5);
    }

    // Update other metrics based on results
    if (results.testCoverage) {
      this.metrics.testCoverage = results.testCoverage;
    }
    if (results.bundleSize) {
      this.metrics.bundleSize = results.bundleSize;
    }
  }

  broadcastLog(level, source, message) {
    this.broadcast({
      type: 'log_entry',
      level,
      source,
      message,
      timestamp: new Date()
    });
  }

  broadcast(message) {
    const data = JSON.stringify(message);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(data);
        } catch (error) {
          // Remove failed connections
          this.connections.delete(ws);
        }
      }
    });
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  }

  async stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }
    console.log('🔴 Frontend Flow Monitor stopped');
  }
}

module.exports = { FrontendFlowMonitorServer };