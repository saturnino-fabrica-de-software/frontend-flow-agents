const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const NLPClassifier = require('../lib/nlp-classifier');
const AgentLoader = require('../lib/agent-loader');

describe('Real Integration Tests', () => {
  const projectPath = process.cwd();
  const agentsPath = path.join(projectPath, '.frontend-flow', 'agents');

  describe('NLP Classifier', () => {
    let nlp;

    beforeAll(async () => {
      nlp = new NLPClassifier();
      await nlp.initialize(agentsPath);
    });

    test('should classify React component creation correctly', () => {
      const result = nlp.classifyDemand('criar botão de login');
      expect(result.classification).toBe('component_creation');
      expect(result.suggestedAgents).toContain('agent_react_components');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('should classify backend API correctly', () => {
      const result = nlp.classifyDemand('criar API REST com NestJS');
      expect(result.classification).toBe('backend');
      expect(result.suggestedAgents).toContain('agent_nestjs_backend');
    });

    test('should classify PWA transformation correctly', () => {
      const result = nlp.classifyDemand('transformar em PWA offline');
      expect(result.classification).toBe('progressive_web_app');
      expect(result.suggestedAgents).toContain('agent_pwa_progressive');
    });

    test('should identify full-stack tasks', () => {
      const result = nlp.classifyDemand('criar app completo com frontend React e backend NestJS');
      expect(result.isFullStackTask).toBe(true);
    });
  });

  describe('Agent Loader', () => {
    let loader;

    beforeAll(async () => {
      loader = new AgentLoader();
      await loader.initialize(projectPath);
    });

    test('should load exactly 29 agents', () => {
      expect(loader.getAllAgents()).toHaveLength(29);
    });

    test('should preserve metadata categories', () => {
      const metadata = loader.getAgentMetadata('agent_react_components');
      expect(metadata).toBeDefined();
      expect(metadata.category).toBe('frontend');
    });

    test('should find agents by keywords', () => {
      const agents = loader.findAgentsByKeywords(['react', 'component']);
      expect(agents).toContain('agent_react_components');
    });

    test('should build dynamic pipeline', () => {
      const pipeline = loader.buildPipeline('criar botão com testes', 'frontend');
      expect(pipeline).toContain('agent_react_components');
      // Should include either playwright or integration tests
      const hasTestAgent = pipeline.includes('agent_integration_tests') ||
                          pipeline.includes('agent_playwright_validation');
      expect(hasTestAgent).toBe(true);
      expect(pipeline.length).toBeGreaterThan(2);
    });
  });

  describe('Claude Integration', () => {
    test('should detect Claude CLI', async () => {
      const ClaudeIntegration = require('../lib/claude-integration');
      const claude = new ClaudeIntegration();
      const detected = await claude.detectClaudeCode();

      // May or may not have Claude installed
      expect(typeof detected).toBe('boolean');
      if (detected) {
        expect(claude.claudePath).toBeTruthy();
      }
    });
  });

  describe('End-to-End Flow', () => {
    test('should execute dry-run without errors', (done) => {
      const child = spawn('./bin/frontend-flow', [
        '--dry-run',
        'criar componente de teste'
      ], {
        cwd: projectPath,
        timeout: 10000
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        expect(code).toBe(0);
        expect(output).toContain('agents loaded dynamically');
        expect(errorOutput).toBe('');
        done();
      });
    }, 30000);
  });

  describe('Metadata Validation', () => {
    test('all agents should have valid metadata', async () => {
      const files = await fs.readdir(agentsPath);
      const agentFiles = files.filter(f => f.endsWith('.md'));

      for (const file of agentFiles) {
        const content = await fs.readFile(path.join(agentsPath, file), 'utf8');

        expect(content).toMatch(/^---/);
        expect(content).toMatch(/name:\s*"[^"]+"/);
        expect(content).toMatch(/description:\s*"[^"]+"/);
        expect(content).toMatch(/tools:/);
        expect(content).toMatch(/model:/);
        expect(content).toMatch(/category:/);
        expect(content).toMatch(/keywords:/);
      }
    });
  });
});

// Run a specific real-world scenario
describe('Real Scenarios', () => {
  test('React component creation flow', () => {
    const nlp = new NLPClassifier();
    const loader = new AgentLoader();
    const projectPath = process.cwd();
    const agentsPath = path.join(projectPath, '.frontend-flow', 'agents');

    return Promise.all([
      nlp.initialize(agentsPath),
      loader.initialize(projectPath)
    ]).then(() => {
      const demand = 'criar card de produto com imagem, título e preço';
      const classification = nlp.classifyDemand(demand);
      const pipeline = loader.buildPipeline(demand, 'frontend');

      expect(classification.classification).toBe('component_creation');
      expect(pipeline[0]).toBe('agent_nlp_classifier');
      expect(pipeline).toContain('agent_react_components');
      expect(pipeline).toContain('agent_tailwind_estilization');
      expect(pipeline).toContain('agent_code_quality');
    });
  });
});