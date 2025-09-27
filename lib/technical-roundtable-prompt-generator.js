const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

/**
 * Gera o prompt para o Claude Code CLI executar a mesa técnica
 */
class TechnicalRoundtablePromptGenerator {
  constructor() {
    this.specialists = [
      { name: 'Patrick', role: 'Frontend Arquitetura', focus: 'Design systems, componentes React, patterns avançados, shadcn/ui' },
      { name: 'André', role: 'Frontend Performance', focus: 'Bundle optimization, React performance, Core Web Vitals, lazy loading' },
      { name: 'Saturnino', role: 'Frontend Escalabilidade', focus: 'Type safety, arquitetura complexa, escalabilidade, code splitting' },
      { name: 'Philipe', role: 'Mobile', focus: 'React Native, PWA, responsive design, mobile-first' },
      { name: 'Mateus', role: 'Backend', focus: 'Go, NestJS, Node.js, APIs, microserviços, data fetching' },
      { name: 'Avner', role: 'DevOps', focus: 'Build, deploy, CI/CD, Docker, automation' },
      { name: 'Guilherme', role: 'Infraestrutura', focus: 'CDN, caching, database performance, server optimization' },
      { name: 'Wander', role: 'UX', focus: 'Acessibilidade, micro-interações, user experience, usabilidade' },
      { name: 'Viviane', role: 'QA', focus: 'Testing strategies, automation, edge cases, quality assurance' },
      { name: 'Marcelo', role: 'Security', focus: 'Vulnerabilidades, OWASP, validação de inputs, auth patterns' },
      { name: 'Bruno', role: 'Product Manager', focus: 'Requirements, user stories, acceptance criteria, roadmap' },
      { name: 'Deivis', role: 'Business', focus: 'Cost analysis, ROI, market impact, business value' },
      { name: 'Carlos', role: 'Tech Lead', focus: 'Technical decisions, architecture patterns, best practices' }
    ];
  }

  generatePrompt(demand, projectPath) {
    console.log(chalk.cyan('\n🎬 Preparando Mesa Técnica Frontend Flow'));
    console.log(chalk.gray(`📝 Demanda: "${demand}"`));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    const prompt = `# Mesa Técnica Frontend Flow - 13 Especialistas

## 🎯 Demanda a Analisar
"${demand}"

## 👥 Você representa 13 especialistas que vão analisar esta demanda:

### Frontend Core (4 especialistas)
1. **Patrick (Frontend Arquitetura)**: Design systems, componentes React, patterns avançados, shadcn/ui
2. **André (Frontend Performance)**: Bundle optimization, React performance, Core Web Vitals, lazy loading
3. **Saturnino (Frontend Escalabilidade)**: Type safety, arquitetura complexa, escalabilidade, code splitting
4. **Philipe (Mobile)**: React Native, PWA, responsive design, mobile-first

### Backend & Infraestrutura (3 especialistas)
5. **Mateus (Backend)**: Go, NestJS, Node.js, APIs, microserviços, data fetching
6. **Avner (DevOps)**: Build, deploy, CI/CD, Docker, automation
7. **Guilherme (Infraestrutura)**: CDN, caching, database performance, server optimization

### UX & Qualidade (3 especialistas)
8. **Wander (UX)**: Acessibilidade, micro-interações, user experience, usabilidade
9. **Viviane (QA)**: Testing strategies, automation, edge cases, quality assurance
10. **Marcelo (Security)**: Vulnerabilidades, OWASP, validação de inputs, auth patterns

### Negócios & Produto (3 especialistas)
11. **Bruno (Product Manager)**: Requirements, user stories, acceptance criteria, roadmap
12. **Deivis (Business)**: Cost analysis, ROI, market impact, business value
13. **Carlos (Tech Lead)**: Technical decisions, architecture patterns, best practices

## 📋 MISSÃO DA MESA TÉCNICA

### 1️⃣ FASE 1: Análises Individuais (13 análises)
Cada especialista deve analisar a demanda "${demand}" do seu ponto de vista específico.

FORMATO EXATO para cada especialista:
\`\`\`
[HH:MM] 👤 Nome (Função)
        [Análise específica de 2-3 linhas sobre a demanda considerando sua especialidade]
\`\`\`

### 2️⃣ FASE 2: Gerar 3 Hipóteses Técnicas Diferentes
Com base nas análises, criar 3 abordagens possíveis:

**Hipótese A) Abordagem Simples/Rápida**
- Solução mais direta e rápida de implementar
- Menor complexidade técnica
- MVP ou prova de conceito

**Hipótese B) Abordagem Intermediária/Balanceada**
- Equilíbrio entre complexidade e benefícios
- Solução robusta mas não over-engineered
- Boa relação custo-benefício

**Hipótese C) Abordagem Avançada/Completa**
- Solução enterprise-grade
- Todas as features e otimizações
- Máxima escalabilidade e performance

### 3️⃣ FASE 3: Críticas Técnicas
Identificar problemas/limitações de CADA hipótese:
- **Crítica A**: [principais problemas da abordagem simples]
- **Crítica B**: [principais problemas da abordagem intermediária]
- **Crítica C**: [principais problemas da abordagem avançada]

### 4️⃣ FASE 4: Solução Otimizada Final
Combinar os pontos fortes das 3 hipóteses, eliminando os defeitos identificados:

**🏆 Solução Recomendada:**
- Arquitetura proposta (detalhada)
- Stack tecnológico específico
- Padrões e práticas recomendadas
- Considerações de segurança
- Estratégia de testes
- Timeline estimado

**📋 Checklist de Implementação:**
1. [Passo 1 específico]
2. [Passo 2 específico]
3. [Passo 3 específico]
4. [Passo 4 específico]
5. [Passo 5 específico]

**⚡ Agentes Frontend Flow Recomendados:**
- agent_[nome]: [por que este agente]
- agent_[nome]: [por que este agente]
- agent_[nome]: [por que este agente]
- agent_[nome]: [por que este agente]
- agent_[nome]: [por que este agente]

## ⚠️ REGRAS IMPORTANTES:
1. SEMPRE responder ESPECIFICAMENTE sobre: "${demand}"
2. NÃO usar respostas genéricas - cada análise deve ser ÚNICA para esta demanda
3. Considerar o contexto React/TypeScript/Tailwind do Frontend Flow
4. As críticas devem ser REAIS e identificar problemas verdadeiros
5. A solução final deve ser IMPLEMENTÁVEL e não apenas conceitual
6. Incluir código de exemplo quando relevante

## 🎯 Contexto do Projeto
- Path: ${projectPath}
- Stack: React, TypeScript, Tailwind CSS, shadcn/ui
- Pipeline: Frontend Flow Enhanced v2.0
- Objetivo: Desenvolvimento frontend de alta qualidade

Agora, conduza a mesa técnica completa seguindo as 4 fases acima.`;

    return prompt;
  }

  async savePromptToFile(prompt, projectPath) {
    const tempDir = path.join(projectPath, '.frontend-flow', 'temp');
    await fs.ensureDir(tempDir);

    const promptFile = path.join(tempDir, `roundtable_prompt_${Date.now()}.txt`);
    await fs.writeFile(promptFile, prompt, 'utf8');

    return promptFile;
  }
}

module.exports = TechnicalRoundtablePromptGenerator;