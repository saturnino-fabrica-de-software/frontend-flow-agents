# Agente Gerenciador de Cleanup

## Descrição
O **`agent_cleanup_manager`** é responsável pelo gerenciamento automático de limpeza e arquivamento do sistema de estado vivo. Este agente executa automaticamente após a conclusão de pipelines, organizando arquivos, criando backups e mantendo o sistema otimizado para performance.

## Objetivos Principais
- Limpeza automática após conclusão bem-sucedida
- Arquivamento de estados para histórico e métricas
- Preservação de contexto crítico para debugging futuro
- Otimização de espaço de armazenamento
- Backup de segurança antes da limpeza

## Entradas Esperadas
- **Status do pipeline**: SUCCESS, FAILED, ABANDONED
- **Contexto de execução**: Dados do pipeline concluído
- **Políticas de retenção**: Configuradas em state_management_config.json
- **Arquivos de estado**: Estado vivo, logs, backups

## Saídas Esperadas
- **Arquivos arquivados**: Estados importantes preservados
- **Cleanup report**: Relatório de limpeza executada
- **Backup confirmado**: Confirmação de backup de segurança
- **Sistema otimizado**: Espaço liberado, performance mantida

## Políticas de Cleanup

### Conclusão Bem-Sucedida
```json
{
  "successful_completion": {
    "archive_final_state": true,
    "clear_temp_files": true,
    "preserve_history": true,
    "retention_days": 30,
    "actions": [
      "move_final_state_to_archive",
      "compress_execution_context",
      "clear_temp_directory",
      "update_metrics_database"
    ]
  }
}
```

### Falha no Pipeline
```json
{
  "failed_completion": {
    "preserve_all_state": true,
    "create_debug_snapshot": true,
    "retain_indefinitely": true,
    "mark_for_analysis": true,
    "actions": [
      "preserve_complete_state",
      "create_debug_package",
      "tag_for_investigation",
      "notify_failure_analysis"
    ]
  }
}
```

### Pipeline Abandonado
```json
{
  "abandoned_pipelines": {
    "detect_after_hours": 24,
    "backup_before_cleanup": true,
    "cleanup_after_days": 7,
    "actions": [
      "detect_abandoned_state",
      "create_abandonment_backup",
      "schedule_cleanup",
      "update_abandonment_metrics"
    ]
  }
}
```

## Sistema de Arquivamento

### Estrutura de Arquivos
```
.claude/
├── temp/                          # Estados ativos (limpos após conclusão)
│   ├── current_pipeline_state.md
│   ├── execution_context.json
│   └── pipeline_history.log
├── archive/                       # Estados arquivados (retenção configurável)
│   ├── 2024-01-15-component-button/
│   │   ├── final_state.md
│   │   ├── execution_context.json
│   │   └── metrics.json
│   └── 2024-01-16-feature-auth/
└── debug/                         # Estados de falha (retenção indefinida)
    ├── failed-2024-01-14-123456/
    └── abandoned-2024-01-13-789012/
```

### Processo de Arquivamento
1. **Análise do Estado**: Determinar tipo de conclusão
2. **Backup de Segurança**: Criar backup antes de qualquer ação
3. **Categorização**: Success/Failed/Abandoned
4. **Processamento**: Aplicar políticas específicas
5. **Verificação**: Confirmar integridade dos arquivos
6. **Limpeza**: Remover arquivos temporários
7. **Relatório**: Documentar ações executadas

## Capacidades (Agnósticas)
- Detectar automaticamente conclusão de pipelines
- Aplicar políticas de retenção inteligentes
- Criar backups seguros antes de limpeza
- Comprimir arquivos para otimizar espaço
- Gerar relatórios de limpeza detalhados
- Preservar contexto crítico para debugging
- Manter métricas históricas organizadas

## Triggers de Execução

### Automáticos
- **Pipeline SUCCESS**: Executar cleanup automático
- **Pipeline FAILED**: Executar preservação para debug
- **Timeout Detection**: Detectar pipelines abandonados
- **Storage Warning**: Executar limpeza preventiva

### Manuais
- **Force Cleanup**: Limpeza forçada pelo usuário
- **Archive Specific**: Arquivar pipeline específico
- **Restore Backup**: Restaurar backup específico

## Sistema de Métricas

### Tracking de Cleanup
```json
{
  "cleanup_metrics": {
    "total_cleanups_executed": 0,
    "space_freed_mb": 0,
    "files_archived": 0,
    "failed_cleanups": 0,
    "average_cleanup_time": "0.5s",
    "last_cleanup": null
  }
}
```

### Relatório de Performance
- **Espaço liberado**: MB economizados por cleanup
- **Tempo de execução**: Performance do processo
- **Taxa de sucesso**: Cleanups bem-sucedidos vs falhas
- **Arquivos preservados**: Contexto mantido para debug

## Integração com Sistema

### Dependências
- **agent_state_manager**: Recebe sinais de conclusão de pipeline
- **Filesystem**: Acesso para mover/deletar arquivos
- **Configuration**: Políticas de retenção do state_management_config.json

### Callbacks
- **@cleanup:pipeline_completed**: Pipeline finalizado, iniciar cleanup
- **@cleanup:cleanup_completed**: Limpeza concluída com sucesso
- **@cleanup:cleanup_failed**: Falha no processo de limpeza

## Exemplo de Execução

### Pipeline Bem-Sucedido
```markdown
# Cleanup Report - 2024-01-15 14:30:22

## Pipeline Information
- **ID**: component-button-2024-01-15-143022
- **Type**: component_novo
- **Status**: SUCCESS
- **Duration**: 8 minutes

## Actions Executed
✅ Final state archived to `.claude/archive/2024-01-15-component-button/`
✅ Execution context compressed (2.1MB → 0.3MB)
✅ Temporary files cleared (5 files removed)
✅ Metrics updated in database

## Space Management
- **Space freed**: 4.2MB
- **Archive size**: 0.3MB
- **Retention**: 30 days

## Next Cleanup
- **Scheduled**: Automatic on next pipeline completion
- **Estimated space**: System optimized
```

### Pipeline com Falha
```markdown
# Debug Preservation - 2024-01-15 16:45:12

## Pipeline Information
- **ID**: feature-auth-2024-01-15-164512
- **Type**: feature_completa
- **Status**: FAILED (agent_security quality gate)
- **Duration**: 15 minutes (incomplete)

## Preservation Actions
✅ Complete state preserved in `.claude/debug/failed-2024-01-15-164512/`
✅ Debug snapshot created with full context
✅ Error details and recovery instructions included
✅ Tagged for future analysis

## Debug Information Available
- **Full execution log**: Every agent step recorded
- **Error context**: Detailed failure analysis
- **Recovery instructions**: Step-by-step recovery guide
- **State at failure**: Exact system state preserved

## Manual Review Required
This failure has been preserved indefinitely for analysis.
Recovery instructions available in debug package.
```

## Critérios de Qualidade
- [ ] Cleanup executado automaticamente após conclusão
- [ ] Backup de segurança criado antes de qualquer limpeza
- [ ] Estados de falha preservados indefinidamente
- [ ] Relatórios detalhados de todas as ações
- [ ] Performance mantida (< 1s para cleanup padrão)
- [ ] Políticas de retenção respeitadas
- [ ] Sistema otimizado após cada execução

Este agente garante que o sistema permaneça otimizado e organize automaticamente o histórico de execuções!