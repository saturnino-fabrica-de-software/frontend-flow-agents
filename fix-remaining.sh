#!/bin/bash

# Fix agent_figma_extract
sed -i '' '5a\
category: special\
keywords: figma, design, tokens, extract, ui, ux' .frontend-flow/agents/agent_figma_extract.md

# Fix agent_golang_backend
sed -i '' '5a\
category: backend\
keywords: golang, go, backend, microservice, grpc, performance' .frontend-flow/agents/agent_golang_backend.md

# Fix agent_mcp_memory_manager
sed -i '' '5a\
category: special\
keywords: memory, persistent, context, learning, mcp, knowledge' .frontend-flow/agents/agent_mcp_memory_manager.md

# Fix agent_nestjs_backend
sed -i '' '5a\
category: backend\
keywords: nestjs, nest, backend, api, rest, graphql, microservice' .frontend-flow/agents/agent_nestjs_backend.md

# Fix agent_playwright_validation
sed -i '' '5a\
category: testing\
keywords: playwright, test, e2e, visual, regression, browser' .frontend-flow/agents/agent_playwright_validation.md

# Fix agent_pwa_progressive
sed -i '' '5a\
category: special\
keywords: pwa, progressive, offline, service-worker, manifest, install' .frontend-flow/agents/agent_pwa_progressive.md

echo "✅ Fixed all remaining agents"
