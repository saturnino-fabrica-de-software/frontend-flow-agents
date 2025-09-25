# Protocolo de Integração com Estado Vivo

## Para todos os agentes: Protocolo obrigatório de atualização de estado

### 1. Ao Iniciar (OBRIGATÓRIO)
```markdown
@state_manager:start|{agent_name}|{action_description}|{context}|{parallel_group}

Exemplo:
@state_manager:start|agent_react_components|Creating React component structure|Analyzing component requirements for Button component|group_1_core_development
@state_manager:start|agent_tailwind_estilization|Applying styling to component|Working with extracted design tokens|group_1_core_development
```

### 2. Durante Execução - Progresso (RECOMENDADO a cada 30s)
```markdown
@state_manager:progress|{progress_percent}|{current_action}|{issues}

Exemplo:
@state_manager:progress|45|Generating component props interface|No issues detected
@state_manager:progress|80|Applying TypeScript types|Minor warning: prop validation could be enhanced
```

### 3. Ao Finalizar (OBRIGATÓRIO)
```markdown
@state_manager:complete|{results}|{handoff_context}|{next_steps}

Exemplo:
@state_manager:complete|Button component created successfully with shadcn-ui base|Component ready for styling with extracted design tokens|Ready for agent_tailwind_estilization to apply visual styles
```

### 4. Em Caso de Erro (OBRIGATÓRIO)
```markdown
@state_manager:error|{error_type}|{solution_attempted}|{recovery_status}

Exemplo:
@state_manager:error|TypeScript compilation failed|Added missing type annotations for ButtonProps interface|Resolved - compilation successful, ready to continue
```

### 5. Quality Gates (OBRIGATÓRIO para agentes críticos)
```markdown
@state_manager:quality_gate|{gate_status}|{blocking_issues}|{resolution_required}

Exemplo:
@state_manager:quality_gate|BLOCKED|3 TypeScript errors detected in component|Manual review required - errors must be fixed before pipeline continues
@state_manager:quality_gate|PASSED|All quality checks successful|Pipeline approved to continue to next agent
```

## Localização dos Arquivos de Estado

- **Estado atual**: `.claude/temp/current_pipeline_state.md`
- **Contexto JSON**: `.claude/temp/execution_context.json`
- **História**: `.claude/temp/pipeline_history.log`
- **Backups**: `.claude/temp/backups/`

## Agentes que DEVEM integrar (todos):

1. **agent_nlp_classifier** - start/complete/error
2. **agent_pipeline_optimizer** - start/complete/error
3. **agent_master_orchestrator** - start/progress/complete/error
4. **agent_github_flow** - start/complete/error
5. **agent_figma_extract** - start/progress/complete/error
6. **agent_react_components** - start/progress/complete/error
7. **agent_redux_toolkit** - start/progress/complete/error
8. **agent_tailwind_estilization** - start/progress/complete/error
9. **agent_code_quality** - start/quality_gate/complete/error
10. **agent_security** - start/quality_gate/complete/error
11. **agent_accessibility** - start/complete/error
12. **agent_performance** - start/progress/complete/error
13. **agent_integration_tests** - start/progress/complete/error
14. **agent_e_2_e_cypress** - start/progress/complete/error
15. **agent_i18n** - start/complete/error
16. **agent_analytics** - start/complete/error
17. **agent_github_pullrequest** - start/complete/error

## Benefícios da Integração

✅ **Recuperação perfeita** após compactação de conversa
✅ **Monitoramento em tempo real** do progresso
✅ **Debugging avançado** com histórico completo
✅ **Handoff inteligente** entre agentes
✅ **Qualidade enterprise** com auditoria completa