const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

/**
 * Gera o prompt otimizado para Claude executar a mesa técnica
 */
class TechnicalRoundtableClaudePrompt {
  constructor() {
    this.specialists = [
      { name: 'Patrick', role: 'Frontend Arquitetura', focus: 'Design systems, React patterns, shadcn/ui' },
      { name: 'André', role: 'Frontend Performance', focus: 'Bundle optimization, React performance, Core Web Vitals' },
      { name: 'Saturnino', role: 'Frontend Escalabilidade', focus: 'TypeScript, arquitetura, code splitting' },
      { name: 'Philipe', role: 'Mobile', focus: 'React Native, PWA, responsive design' },
      { name: 'Mateus', role: 'Backend', focus: 'APIs, microserviços, data fetching' },
      { name: 'Avner', role: 'DevOps', focus: 'CI/CD, Docker, automation' },
      { name: 'Guilherme', role: 'Infraestrutura', focus: 'CDN, caching, performance' },
      { name: 'Wander', role: 'UX', focus: 'Acessibilidade, user experience' },
      { name: 'Viviane', role: 'QA', focus: 'Testing, automation, quality' },
      { name: 'Marcelo', role: 'Security', focus: 'OWASP, auth patterns' },
      { name: 'Bruno', role: 'Product Manager', focus: 'Requirements, roadmap' },
      { name: 'Deivis', role: 'Business', focus: 'ROI, business value' },
      { name: 'Carlos', role: 'Tech Lead', focus: 'Architecture, best practices' }
    ];
  }

  generatePrompt(demand, projectPath) {
    console.log(chalk.cyan('\n🎬 Preparando prompt otimizado para Claude...'));
    console.log(chalk.gray(`📝 Demanda: "${demand}"`));

    // Prompt mais direto e claro para o Claude
    const prompt = `Analise a seguinte questão técnica: "${demand}"

Faça uma análise como se fosse uma mesa técnica com 13 especialistas diferentes. Para cada especialista, forneça uma perspectiva única:

ESPECIALISTAS:
${this.specialists.map((s, i) => `${i + 1}. ${s.name} (${s.role}): ${s.focus}`).join('\n')}

FORMATO DA RESPOSTA:

## 📊 Análises dos Especialistas

${this.specialists.map(s => `**${s.name} (${s.role}):**
[Análise específica sobre "${demand}" considerando ${s.focus}]`).join('\n\n')}

## 💡 3 Hipóteses

**A) Abordagem Simples**
[Solução básica e rápida]

**B) Abordagem Intermediária**
[Solução balanceada]

**C) Abordagem Avançada**
[Solução completa enterprise]

## 🔍 Críticas
- **A**: [problemas da abordagem simples]
- **B**: [problemas da abordagem intermediária]
- **C**: [problemas da abordagem avançada]

## 🏆 Solução Otimizada Final

Considerando as análises e críticas, a melhor abordagem seria:
[Solução detalhada combinando o melhor de cada hipótese]

**Implementação:**
1. [Passo específico 1]
2. [Passo específico 2]
3. [Passo específico 3]
4. [Passo específico 4]
5. [Passo específico 5]

**Agentes Recomendados:**
- agent_react_components: [justificativa]
- agent_security: [justificativa]
- agent_integration_tests: [justificativa]

Contexto: Projeto React com TypeScript e Tailwind CSS em ${projectPath}

Agora execute esta análise completa para a demanda: "${demand}"`;

    return prompt;
  }

  async savePromptToFile(prompt, projectPath) {
    const tempDir = path.join(projectPath, '.frontend-flow', 'temp');
    await fs.ensureDir(tempDir);

    const promptFile = path.join(tempDir, `claude_roundtable_${Date.now()}.txt`);
    await fs.writeFile(promptFile, prompt, 'utf8');

    console.log(chalk.green(`✅ Prompt salvo em: ${promptFile}`));
    return promptFile;
  }
}

module.exports = TechnicalRoundtableClaudePrompt;