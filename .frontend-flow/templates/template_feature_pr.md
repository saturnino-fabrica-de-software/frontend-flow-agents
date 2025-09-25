# {PR_TYPE}: {FEATURE_NAME}

## 📋 Resumo
Este PR implementa a feature completa `{FEATURE_NAME}` incluindo componentes, estado global, internacionalização, analytics e todos os requisitos de qualidade.

## ✅ Pipeline Executado
- [x] **figma_extract** - Design tokens extraídos do Figma
- [x] **react_components** - Componentes base criados
- [x] **redux_toolkit** - Estado global configurado ({REDUX_SLICES})
- [x] **tailwind_estilization** - UI implementada com design system
- [x] **performance** - Otimizações aplicadas ({OPTIMIZATIONS})
- [x] **accessibility** - WCAG compliance garantido
- [x] **i18n** - Internacionalização configurada ({LANGUAGES})
- [x] **security** - Auditoria de segurança aprovada
- [x] **code_quality** - Quality gate aprovado ✅
- [x] **integration_tests** - Testes de integração ({COVERAGE}% cobertura)
- [x] **analytics** - PostHog e Clarity configurados

## 🎯 Funcionalidades Entregues
- {FEATURE_FUNCTIONALITY_1}
- {FEATURE_FUNCTIONALITY_2}
- {FEATURE_FUNCTIONALITY_3}

## 🏗️ Componentes Criados
- `{COMPONENT_1}` - {COMPONENT_1_DESCRIPTION}
- `{COMPONENT_2}` - {COMPONENT_2_DESCRIPTION}
- `{COMPONENT_3}` - {COMPONENT_3_DESCRIPTION}

## 🗄️ Estado Global (Redux)
- **{SLICE_NAME}**: {SLICE_DESCRIPTION}
  - Actions: {ACTIONS_LIST}
  - Estado: {STATE_PROPERTIES}

## 🌍 Internacionalização
- **Idiomas suportados**: {SUPPORTED_LANGUAGES}
- **Strings traduzíveis**: {I18N_KEYS_COUNT} chaves
- **Namespace**: `{I18N_NAMESPACE}`

## 📊 Analytics Implementado
- **PostHog Events**:
  - {POSTHOG_EVENT_1}
  - {POSTHOG_EVENT_2}
  - {POSTHOG_EVENT_3}
- **Clarity**: Sessões sendo rastreadas
- **Métricas**: Jornada completa do usuário

## 📁 Arquivos Modificados/Criados
### Componentes
- `src/components/{feature}/` - Componentes da feature
- `src/types/{feature}.ts` - Tipagens TypeScript

### Estado Global
- `src/store/slices/{feature}Slice.ts` - Redux slice
- `src/store/index.ts` - Store configurada

### Testes
- `src/components/{feature}/*.test.tsx` - Testes integração
- `cypress/e2e/{feature}.cy.ts` - Testes E2E

### Internacionalização
- `src/locales/pt/{feature}.json` - Traduções português
- `src/locales/en/{feature}.json` - Traduções inglês

### Analytics
- `src/analytics/{feature}Events.ts` - Eventos PostHog
- {ADDITIONAL_FILES}

## 📊 Quality Gates ✅
- **Lint**: 0 erros
- **TypeScript**: 0 erros de tipagem
- **Build**: Compilação bem-sucedida
- **Unit Tests**: {UNIT_TESTS} passando
- **Integration Tests**: {INTEGRATION_TESTS} passando
- **E2E Tests**: {E2E_TESTS} passando
- **Security**: Sem vulnerabilidades
- **Accessibility**: 100% WCAG compliance
- **Performance**: {PERFORMANCE_SCORE}

## 🚀 Como Testar

### Testes Automatizados
```bash
# Todos os testes
npm test

# Testes específicos da feature
npm test src/components/{feature}

# E2E tests
npm run cypress:run -- --spec "cypress/e2e/{feature}.cy.ts"

# Quality checks
npm run lint
npm run type-check
npm run build
```

### Teste Manual
1. {MANUAL_TEST_STEP_1}
2. {MANUAL_TEST_STEP_2}
3. {MANUAL_TEST_STEP_3}

### Testando Analytics
- Abrir PostHog dashboard
- Verificar eventos: {POSTHOG_EVENTS_TO_CHECK}
- Confirmar Clarity está capturando sessões

## 📝 Issues Relacionadas
{RELATED_ISSUES_LIST}

## 🎨 Preview da Feature
{FEATURE_PREVIEW_DESCRIPTION}

## 📏 Métricas de Impacto
- **Bundle size increase**: {BUNDLE_INCREASE}
- **Performance impact**: {PERFORMANCE_IMPACT}
- **Test coverage total**: {TOTAL_COVERAGE}%
- **New dependencies**: {NEW_DEPENDENCIES}

## 🔄 Breaking Changes
{BREAKING_CHANGES_LIST}

## 📚 Documentação Atualizada
- [ ] README.md atualizado
- [ ] Documentação de componentes
- [ ] Guia de analytics configurado

---
*PR criado automaticamente pelo pipeline de feature completa*