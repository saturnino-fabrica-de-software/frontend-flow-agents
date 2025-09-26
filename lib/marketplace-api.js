const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');

class MarketplaceAPI {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.registryPath = path.join(__dirname, '..', 'marketplace', 'marketplace-registry.json');
    this.installsPath = path.join(process.cwd(), '.frontend-flow', 'marketplace', 'installs.json');
    this.server = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '..', 'marketplace', 'public')));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(chalk.gray(`[API] ${req.method} ${req.path}`));
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'healthy', version: '1.0.0' });
    });

    // Get all agents
    this.app.get('/api/agents', async (req, res) => {
      try {
        const registry = await this.loadRegistry();
        const { category, framework, verified, search } = req.query;

        let agents = [...registry.community_agents, ...registry.official_agents];

        // Apply filters
        if (category) {
          agents = agents.filter(a => a.category === category);
        }
        if (framework) {
          agents = agents.filter(a => a.frameworks?.includes(framework));
        }
        if (verified === 'true') {
          agents = agents.filter(a => a.verified);
        }
        if (search) {
          const searchLower = search.toLowerCase();
          agents = agents.filter(a =>
            a.name.toLowerCase().includes(searchLower) ||
            a.description.toLowerCase().includes(searchLower)
          );
        }

        res.json({
          total: agents.length,
          agents: agents
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get agent by ID
    this.app.get('/api/agents/:id', async (req, res) => {
      try {
        const registry = await this.loadRegistry();
        const allAgents = [...registry.community_agents, ...registry.official_agents];
        const agent = allAgents.find(a => a.id === req.params.id);

        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        res.json(agent);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Download agent
    this.app.post('/api/agents/:id/download', async (req, res) => {
      try {
        const registry = await this.loadRegistry();
        const allAgents = [...registry.community_agents, ...registry.official_agents];
        const agent = allAgents.find(a => a.id === req.params.id);

        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        // Increment download count
        agent.stats.downloads++;
        await this.saveRegistry(registry);

        // Record installation
        await this.recordInstallation(agent.id, req.body.projectPath);

        res.json({
          success: true,
          agent: agent,
          installation: {
            id: uuidv4(),
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Submit new agent
    this.app.post('/api/agents/submit', async (req, res) => {
      try {
        const { agent } = req.body;

        if (!agent || !agent.name || !agent.author) {
          return res.status(400).json({ error: 'Invalid agent data' });
        }

        const registry = await this.loadRegistry();

        // Generate ID
        agent.id = `agent-${agent.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        agent.verified = false;
        agent.submission_date = new Date().toISOString();
        agent.stats = {
          downloads: 0,
          stars: 0,
          issues: 0
        };

        registry.community_agents.push(agent);
        registry.stats.total_agents++;
        registry.stats.community_agents++;

        await this.saveRegistry(registry);

        res.json({
          success: true,
          agent_id: agent.id,
          message: 'Agent submitted for review'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Rate agent
    this.app.post('/api/agents/:id/rate', async (req, res) => {
      try {
        const { rating } = req.body;
        if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Invalid rating' });
        }

        const registry = await this.loadRegistry();
        const allAgents = [...registry.community_agents, ...registry.official_agents];
        const agent = allAgents.find(a => a.id === req.params.id);

        if (!agent) {
          return res.status(404).json({ error: 'Agent not found' });
        }

        // Simple rating calculation (could be improved with user tracking)
        if (!agent.rating) {
          agent.rating = { average: rating, count: 1 };
        } else {
          const total = agent.rating.average * agent.rating.count + rating;
          agent.rating.count++;
          agent.rating.average = total / agent.rating.count;
        }

        await this.saveRegistry(registry);

        res.json({
          success: true,
          new_rating: agent.rating
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get marketplace stats
    this.app.get('/api/stats', async (req, res) => {
      try {
        const registry = await this.loadRegistry();
        const installs = await this.loadInstalls();

        const stats = {
          ...registry.stats,
          recent_installs: installs.slice(-10),
          popular_categories: this.getPopularCategories(registry),
          trending_agents: this.getTrendingAgents(registry)
        };

        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // WebSocket for real-time updates
    this.app.get('/api/stream', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      // Send updates every 5 seconds
      const interval = setInterval(async () => {
        try {
          const registry = await this.loadRegistry();
          res.write(`data: ${JSON.stringify({ type: 'update', stats: registry.stats })}\n\n`);
        } catch (error) {
          // Silent fail
        }
      }, 5000);

      req.on('close', () => {
        clearInterval(interval);
      });
    });
  }

  async loadRegistry() {
    try {
      return await fs.readJSON(this.registryPath);
    } catch (error) {
      return {
        official_agents: [],
        community_agents: [],
        stats: {
          total_agents: 0,
          community_agents: 0,
          official_agents: 0
        }
      };
    }
  }

  async saveRegistry(registry) {
    await fs.writeJSON(this.registryPath, registry, { spaces: 2 });
  }

  async loadInstalls() {
    try {
      await fs.ensureDir(path.dirname(this.installsPath));
      return await fs.readJSON(this.installsPath);
    } catch (error) {
      return [];
    }
  }

  async recordInstallation(agentId, projectPath) {
    const installs = await this.loadInstalls();

    installs.push({
      agent_id: agentId,
      project_path: projectPath,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

    // Keep only last 1000 installs
    if (installs.length > 1000) {
      installs.shift();
    }

    await fs.writeJSON(this.installsPath, installs, { spaces: 2 });
  }

  getPopularCategories(registry) {
    const categories = {};
    const allAgents = [...registry.community_agents, ...registry.official_agents];

    allAgents.forEach(agent => {
      if (agent.category) {
        categories[agent.category] = (categories[agent.category] || 0) + 1;
      }
    });

    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  getTrendingAgents(registry) {
    const allAgents = [...registry.community_agents, ...registry.official_agents];

    return allAgents
      .sort((a, b) => (b.stats?.downloads || 0) - (a.stats?.downloads || 0))
      .slice(0, 5)
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        downloads: agent.stats?.downloads || 0
      }));
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(chalk.green(`🚀 Marketplace API running at http://localhost:${this.port}`));
        console.log(chalk.cyan(`📚 API Docs: http://localhost:${this.port}/api-docs`));
        resolve();
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log(chalk.yellow('🛑 Marketplace API stopped'));
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = MarketplaceAPI;