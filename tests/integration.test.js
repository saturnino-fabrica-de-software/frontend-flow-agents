const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

describe('Frontend Flow Integration Tests', () => {
  const testProjectPath = path.join(__dirname, 'test-project');
  const frontendFlowPath = path.join(__dirname, '..', 'bin', 'frontend-flow');

  beforeAll(async () => {
    await fs.ensureDir(testProjectPath);
    await fs.writeJSON(path.join(testProjectPath, 'package.json'), {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      }
    });
  });

  afterAll(async () => {
    await fs.remove(testProjectPath);
  });

  describe('CLI Commands', () => {
    it('should show help', async () => {
      const result = await runCommand(['--help']);
      expect(result.stdout).toContain('Orquestrador de agentes IA');
      expect(result.code).toBe(0);
    });

    it('should detect framework', async () => {
      const result = await runCommand(['detect-framework'], testProjectPath);
      expect(result.stdout).toContain('React');
      expect(result.code).toBe(0);
    });

    it('should show marketplace stats', async () => {
      const result = await runCommand(['marketplace', 'stats']);
      expect(result.stdout).toContain('Marketplace Statistics');
      expect(result.code).toBe(0);
    });

    it('should perform health check', async () => {
      const result = await runCommand(['health'], testProjectPath);
      expect(result.stdout).toContain('Health check');
      expect(result.code).toBe(0);
    }, 10000);
  });

  describe('Pipeline Execution', () => {
    it('should initialize project', async () => {
      const result = await runCommand(['init'], testProjectPath);
      expect(result.code).toBe(0);

      const configExists = await fs.pathExists(
        path.join(testProjectPath, '.frontend-flow')
      );
      expect(configExists).toBe(true);
    });

    it('should handle dry-run mode', async () => {
      const result = await runCommand(
        ['--dry-run', 'create a button'],
        testProjectPath
      );
      expect(result.stdout).toContain('dry-run');
      expect(result.code).toBe(0);
    });

    it('should activate educational mode', async () => {
      const result = await runCommand(
        ['--educational', '--dry-run', 'test task'],
        testProjectPath
      );
      expect(result.code).toBe(0);
    });
  });

  describe('Module Integration', () => {
    it('should integrate metrics collector', async () => {
      const MetricsCollector = require('../lib/metrics-collector');
      const collector = new MetricsCollector();

      await collector.initialize();
      await collector.recordAgentExecution('test', { success: true });

      expect(collector.sessionMetrics['test']).toBeDefined();
    });

    it('should integrate framework detector', async () => {
      const FrameworkDetector = require('../lib/framework-detector');
      const detector = new FrameworkDetector();

      await detector.loadConfig();
      const result = await detector.detectFramework(testProjectPath);

      expect(result.primary.name).toBe('React');
    });

    it('should integrate health monitor', async () => {
      const HealthMonitor = require('../lib/health-monitor');
      const monitor = new HealthMonitor();

      monitor.healthDataPath = path.join(testProjectPath, '.health-test');
      await monitor.initialize();
      await monitor.stopMonitoring();

      expect(monitor.healthStatus).toBeDefined();
    });
  });

  // Helper function to run CLI commands
  function runCommand(args, cwd = process.cwd()) {
    return new Promise((resolve) => {
      const child = spawn('node', [frontendFlowPath, ...args], {
        cwd,
        env: { ...process.env, NO_COLOR: '1' }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        child.kill();
        resolve({ code: -1, stdout, stderr, timeout: true });
      }, 5000);
    });
  }
});