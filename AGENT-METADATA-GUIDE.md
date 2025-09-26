# 📋 Agent Metadata Guide - Full-Stack Flow v2.2

## 🎯 Purpose
This guide documents the metadata structure for all agents to ensure proper recognition by Claude and the NLP classifier.

## 📦 Metadata Structure

Every agent MUST have a YAML frontmatter block with these fields:

```yaml
---
name: "agent-unique-name"
description: "Clear description of agent's purpose and capabilities"
tools: Read, Write, Edit, MultiEdit, Bash, [MCP tools]
model: claude
category: frontend|backend|testing|quality|infrastructure|utility|orchestration|special
keywords: keyword1, keyword2, keyword3
---
```

## 📊 Categories

### Frontend (8 agents)
- `agent_react_components` - React component creation
- `agent_tailwind_estilization` - Tailwind CSS styling
- `agent_ui_ux` - UI/UX design
- `agent_redux_toolkit` - State management
- `agent_animations` - Animations and transitions
- `agent_responsiveness` - Responsive design
- `agent_i_18_n` - Internationalization
- `agent_state_manager` - State management

### Backend (4 agents)
- `agent_api_integration` - API integration
- `agent_database` - Database operations
- `agent_nestjs_backend` - NestJS development
- `agent_golang_backend` - Go development

### Testing (4 agents)
- `agent_integration_tests` - Test automation
- `agent_test_simple` - Simple tests
- `agent_playwright_validation` - Playwright E2E
- `agent_e_2_e_cypress` - Cypress E2E

### Quality (5 agents)
- `agent_security` - Security auditing
- `agent_performance` - Performance optimization
- `agent_code_quality` - Code quality
- `agent_accessibility` - WCAG compliance
- `agent_auto_healing` - Error recovery

### Infrastructure (3 agents)
- `agent_deployment` - Deployment & CI/CD
- `agent_github_pullrequest` - GitHub management
- `agent_github_flow` - Git workflows

### Utility (3 agents)
- `agent_documentation` - Documentation
- `agent_cleanup_manager` - Code cleanup
- `agent_metrics_collector` - Metrics collection

### Orchestration (3 agents)
- `agent_master_orchestrator` - Master controller
- `agent_technical_roundtable` - Technical decisions
- `agent_nlp_classifier` - Demand classification

### Special (4 agents)
- `agent_mcp_memory_manager` - Persistent memory
- `agent_pwa_progressive` - PWA transformation
- `agent_figma_extract` - Design extraction
- `agent_analytics` - Analytics tracking

## 🔧 Tools Reference

### Standard Tools
- `Read` - Read files
- `Write` - Write files
- `Edit` - Edit single location
- `MultiEdit` - Edit multiple locations
- `Bash` - Execute commands

### MCP Tools
- `mcp__memory__store` - Store in memory
- `mcp__memory__retrieve` - Retrieve from memory
- `mcp__memory__search` - Search memory
- `mcp__playwright__*` - Playwright browser control
- `mcp__context7__*` - Documentation retrieval
- `mcp__ide__*` - IDE integration

## 🏷️ Keywords Best Practices

1. **Primary Keywords**: The main technology/framework
   - Example: `react`, `nestjs`, `golang`

2. **Action Keywords**: What the agent does
   - Example: `create`, `optimize`, `test`, `deploy`

3. **Domain Keywords**: Area of expertise
   - Example: `frontend`, `backend`, `security`, `performance`

4. **Technology Keywords**: Specific tools/libraries
   - Example: `typescript`, `tailwind`, `jest`, `docker`

## 📝 Example Agent Metadata

### Frontend Agent Example
```yaml
---
name: "react-component-creator"
description: "React component specialist for creating TypeScript components with hooks, props, and best practices"
tools: Read, Write, Edit, MultiEdit
model: claude
category: frontend
keywords: react, component, jsx, tsx, hooks, props, typescript
---
```

### Backend Agent Example
```yaml
---
name: "nestjs-backend-specialist"
description: "NestJS backend specialist for enterprise-grade APIs, microservices, and scalable TypeScript server applications"
tools: Read, Write, Edit, MultiEdit, Bash, mcp__context7__get-library-docs
model: claude
category: backend
keywords: nestjs, backend, api, rest, graphql, microservice, typescript
---
```

### Testing Agent Example
```yaml
---
name: "playwright-validator"
description: "Playwright MCP validation agent for visual regression testing, cross-browser compatibility, and UI validation"
tools: Read, Bash, mcp__ide__getDiagnostics
model: claude
category: testing
keywords: playwright, test, e2e, visual, regression, browser, validation
---
```

## 🔍 NLP Classification

The NLP classifier uses these metadata fields to:
1. **Match keywords** against user demands
2. **Score relevance** based on description
3. **Build pipelines** using category relationships
4. **Select tools** required for the task

## ✅ Validation Checklist

For each agent, verify:
- [ ] Has YAML frontmatter block
- [ ] `name` is unique and descriptive
- [ ] `description` clearly explains purpose
- [ ] `tools` lists all required tools
- [ ] `model` is set (usually `claude`)
- [ ] `category` matches one of the defined categories
- [ ] `keywords` include relevant search terms

## 🚀 Integration Points

### 1. Agent Loader (`lib/agent-loader.js`)
- Reads metadata from frontmatter
- Categorizes agents dynamically
- Builds agent registry

### 2. NLP Classifier (`lib/nlp-classifier.js`)
- Uses keywords for demand matching
- Scores agents by relevance
- Suggests optimal pipeline

### 3. Orchestrator (`lib/orchestrator.js`)
- Loads agents via Agent Loader
- Uses NLP classification
- Executes dynamic pipeline

### 4. Claude Integration (`lib/claude-integration.js`)
- Passes agent metadata to Claude
- Uses tools from metadata
- Respects agent constraints

## 📊 Current Statistics

- **Total Agents**: 29
- **With Metadata**: 29 (100%)
- **Categories**: 8
- **Average Keywords**: 6 per agent
- **Most Common Tool**: Read (100%)
- **MCP Integrations**: 5 agents

## 🔄 Metadata Update Process

1. Edit agent file's frontmatter
2. Run standardization: `node scripts/standardize-agents.js`
3. Verify with: `node test-v22-complete.js`
4. Test NLP: `./bin/frontend-flow --dry-run "your test demand"`

## 🎯 Benefits of Proper Metadata

1. **Claude Recognition**: Claude understands agent capabilities
2. **Smart Pipeline**: NLP builds optimal agent sequence
3. **Tool Selection**: Right tools for each task
4. **Performance**: Faster agent discovery
5. **Maintainability**: Easy to add/update agents
6. **Documentation**: Self-documenting system

---

This metadata system ensures all 29 agents are properly recognized and utilized by the Full-Stack Flow orchestration system.