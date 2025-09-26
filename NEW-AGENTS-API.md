# 📚 API Documentation - New Full-Stack Agents v2.2

## 🧠 agent_mcp_memory_manager

### Purpose
Persistent memory and continuous learning system using MCP Memory protocol.

### Activation
```bash
frontend-flow "remember this architectural decision for future sessions"
```

### Capabilities
- **Persistent Context**: Preserves decisions across sessions
- **Pattern Learning**: Tracks success/failure patterns
- **Knowledge Sharing**: Shares solutions between projects
- **Auto Recovery**: Instant state restoration

### Integration
```javascript
// Automatically integrated when MCP Memory is available
const memory = await mcp__memory__retrieve('project_context');
await mcp__memory__store('decision', architecturalChoice);
```

---

## 🎭 agent_playwright_validation

### Purpose
Automated visual and functional testing using Playwright MCP.

### Activation
```bash
frontend-flow "validate login flow with visual regression testing"
```

### Capabilities
- **Visual Testing**: Screenshot comparison and regression detection
- **Cross-Browser**: Tests on Chromium, Firefox, WebKit
- **User Flows**: Complete E2E flow validation
- **Accessibility**: WCAG compliance testing

### Configuration
```json
{
  "browsers": ["chromium", "firefox", "webkit"],
  "viewport": { "width": 1280, "height": 720 }
}
```

---

## ♿ agent_accessibility

### Purpose
Automatic WCAG compliance and inclusive design implementation.

### Activation
```bash
frontend-flow "ensure accessibility compliance for dashboard"
```

### Capabilities
- **ARIA Attributes**: Auto-adds proper ARIA labels
- **Keyboard Navigation**: Ensures keyboard accessibility
- **Screen Reader**: Optimizes for screen readers
- **Color Contrast**: Validates WCAG AA/AAA compliance

### Example Output
```jsx
// Before
<button onClick={handleClick}>Submit</button>

// After
<button
  onClick={handleClick}
  aria-label="Submit form"
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Submit
</button>
```

---

## 📱 agent_pwa_progressive

### Purpose
Transform React apps into Progressive Web Apps with offline capabilities.

### Activation
```bash
frontend-flow "convert app to PWA with offline support"
```

### Capabilities
- **Service Workers**: Intelligent caching strategies
- **Offline Mode**: Full offline functionality
- **Push Notifications**: Native push support
- **Install Prompts**: App installation flow

### Generated Files
- `manifest.json` - PWA manifest
- `service-worker.js` - Service worker with Workbox
- `offline.html` - Offline fallback page

---

## 🎨 agent_figma_extract

### Purpose
Extract design tokens and specifications directly from Figma.

### Activation
```bash
frontend-flow "extract design system from Figma file"
```

### Capabilities
- **Design Tokens**: Colors, typography, spacing
- **Component Specs**: Exact dimensions and properties
- **Asset Export**: Images and icons
- **Style Guide**: Auto-generated style documentation

### Output Format
```javascript
{
  "colors": {
    "primary": "#007AFF",
    "secondary": "#5856D6"
  },
  "typography": {
    "heading1": {
      "fontSize": "32px",
      "lineHeight": "40px",
      "fontWeight": 700
    }
  }
}
```

---

## 🏗️ agent_nestjs_backend

### Purpose
Enterprise-grade backend development with NestJS.

### Activation
```bash
frontend-flow "create NestJS API with authentication"
```

### Capabilities
- **Module Architecture**: Clean module-based structure
- **Decorators**: TypeScript decorators for routing
- **Dependency Injection**: Built-in DI container
- **GraphQL/REST**: Both API paradigms supported

### Example Generation
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard)
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }
}
```

---

## ⚡ agent_golang_backend

### Purpose
High-performance microservices development in Go.

### Activation
```bash
frontend-flow "create Go microservice with gRPC"
```

### Capabilities
- **Goroutines**: Concurrent processing
- **Channels**: Type-safe communication
- **Performance**: Optimized for speed
- **Microservices**: Service mesh ready

### Example Generation
```go
func (s *Server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    user, err := s.db.FindUser(ctx, req.Id)
    if err != nil {
        return nil, status.Error(codes.NotFound, "user not found")
    }
    return &pb.User{
        Id:    user.ID,
        Name:  user.Name,
        Email: user.Email,
    }, nil
}
```

---

## 🔗 Integration Examples

### Combining Multiple Agents
```bash
# Full-stack PWA with testing
frontend-flow "create accessible PWA with NestJS backend and Playwright tests"

# This activates:
# 1. agent_pwa_progressive - PWA setup
# 2. agent_accessibility - WCAG compliance
# 3. agent_nestjs_backend - API creation
# 4. agent_playwright_validation - E2E tests
```

### Memory-Enhanced Development
```bash
# Learn from past decisions
frontend-flow "use the authentication pattern from our last project"

# MCP Memory Manager retrieves and applies previous patterns
```

### Design-to-Code Pipeline
```bash
# From Figma to accessible React
frontend-flow "implement Figma design with full accessibility"

# Activates:
# 1. agent_figma_extract - Gets design tokens
# 2. agent_react_components - Creates components
# 3. agent_accessibility - Ensures WCAG compliance
```

---

## 📊 Performance Metrics

| Agent | Success Rate | Avg Duration | Memory Usage |
|-------|-------------|--------------|--------------|
| MCP Memory | 98% | 2s | 10MB |
| Playwright | 95% | 45s | 150MB |
| Accessibility | 97% | 15s | 20MB |
| PWA | 96% | 30s | 25MB |
| Figma | 94% | 20s | 30MB |
| NestJS | 95% | 35s | 40MB |
| Golang | 96% | 25s | 15MB |

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g frontend-flow-agents@latest

# Initialize in your project
frontend-flow init

# Use any new agent
frontend-flow "make my app accessible and offline-capable"
```

## 🔧 Configuration

All new agents can be configured in their respective config files:
- `configs/mcp-memory-config.json`
- `configs/playwright-config.json`
- `configs/accessibility-config.json`
- `configs/pwa-config.json`
- `configs/backend-config.json`

## 📝 Notes

- All new agents follow the v4.0 workflow with Technical Roundtable validation
- MCP integrations require corresponding MCP servers to be available
- Backend agents (NestJS/Go) create separate backend projects when needed
- PWA features require HTTPS in production