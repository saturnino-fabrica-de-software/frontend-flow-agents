const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const https = require('https');

class Telemetry {
  constructor() {
    this.enabled = process.env.FRONTEND_FLOW_TELEMETRY !== 'false';
    this.sessionId = uuidv4();
    this.userId = null;
    this.endpoint = process.env.TELEMETRY_ENDPOINT || 'https://telemetry.frontend-flow.dev/v1/events';
    this.batchSize = 50;
    this.flushInterval = 60000; // 1 minute
    this.events = [];
    this.metadata = null;

    if (this.enabled) {
      this.initialize();
    }
  }

  async initialize() {
    // Load or create user ID
    await this.loadUserId();

    // Collect system metadata
    this.metadata = await this.collectMetadata();

    // Setup batch processing
    this.startBatchProcessor();

    // Register shutdown handler
    process.on('beforeExit', () => this.flush());
    process.on('SIGINT', () => this.flush());
    process.on('SIGTERM', () => this.flush());
  }

  async loadUserId() {
    const userIdPath = path.join(os.homedir(), '.frontend-flow', 'telemetry-id');

    try {
      if (await fs.pathExists(userIdPath)) {
        this.userId = await fs.readFile(userIdPath, 'utf8');
      } else {
        this.userId = uuidv4();
        await fs.ensureDir(path.dirname(userIdPath));
        await fs.writeFile(userIdPath, this.userId);
      }
    } catch (error) {
      this.userId = 'anonymous';
    }
  }

  async collectMetadata() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      memory: Math.round(os.totalmem() / (1024 * 1024 * 1024)), // GB
      osVersion: os.release(),
      ci: this.detectCI(),
      docker: await this.detectDocker(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale
    };
  }

  detectCI() {
    const ciEnvVars = [
      'CI',
      'CONTINUOUS_INTEGRATION',
      'JENKINS',
      'TRAVIS',
      'CIRCLECI',
      'GITHUB_ACTIONS',
      'GITLAB_CI',
      'BUILDKITE',
      'DRONE'
    ];

    for (const envVar of ciEnvVars) {
      if (process.env[envVar]) {
        return envVar.toLowerCase().replace(/_/g, '-');
      }
    }

    return false;
  }

  async detectDocker() {
    try {
      await fs.access('/.dockerenv');
      return true;
    } catch {
      return false;
    }
  }

  track(eventName, properties = {}) {
    if (!this.enabled) return;

    const event = {
      id: uuidv4(),
      name: eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties: {
        ...properties,
        ...this.metadata
      }
    };

    this.events.push(event);

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  trackCommand(command, options = {}) {
    this.track('command_executed', {
      command,
      options: Object.keys(options),
      hasOptions: Object.keys(options).length > 0
    });
  }

  trackAgent(agentName, success, duration, error = null) {
    this.track('agent_executed', {
      agent: agentName,
      success,
      duration,
      error: error ? error.message : null
    });
  }

  trackPipeline(demand, result, duration) {
    this.track('pipeline_completed', {
      demand: this.sanitizeDemand(demand),
      success: result.success,
      duration,
      agentsExecuted: result.agentsExecuted,
      filesModified: result.filesModified
    });
  }

  trackError(error, context = {}) {
    this.track('error_occurred', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      ...context
    });
  }

  trackPerformance(metrics) {
    this.track('performance_metrics', {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      ...metrics
    });
  }

  sanitizeDemand(demand) {
    // Remove sensitive information from demands
    return demand
      .replace(/api[_-]?key[s]?\s*[:=]\s*['"][^'"]+['"]/gi, 'API_KEY=***')
      .replace(/password[s]?\s*[:=]\s*['"][^'"]+['"]/gi, 'PASSWORD=***')
      .replace(/token[s]?\s*[:=]\s*['"][^'"]+['"]/gi, 'TOKEN=***')
      .substring(0, 200); // Limit length
  }

  startBatchProcessor() {
    this.batchInterval = setInterval(() => {
      if (this.events.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  async flush() {
    if (!this.enabled || this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      // Silent fail - don't interrupt user flow
      if (process.env.DEBUG_TELEMETRY) {
        console.error('Telemetry error:', error);
      }
    }
  }

  async sendEvents(events) {
    const data = JSON.stringify({
      events,
      version: require('../package.json').version
    });

    return new Promise((resolve, reject) => {
      const url = new URL(this.endpoint);

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'User-Agent': 'FrontendFlow/2.0'
        },
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        res.on('data', () => {});
        res.on('end', () => {
          resolve();
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  async getAnonymousStats() {
    // Return anonymized statistics for display
    return {
      totalEvents: this.events.length,
      sessionDuration: Date.now() - this.startTime,
      platform: this.metadata?.platform,
      nodeVersion: this.metadata?.nodeVersion
    };
  }

  disable() {
    this.enabled = false;
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
  }
}

// Singleton instance
let telemetryInstance = null;

module.exports = {
  getTelemetry: () => {
    if (!telemetryInstance) {
      telemetryInstance = new Telemetry();
    }
    return telemetryInstance;
  },
  Telemetry
};