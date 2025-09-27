const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

/**
 * Mesa Técnica com output em tempo real e interativo
 */
class RealtimeTechnicalRoundtable {
  constructor() {
    this.specialists = [
      { name: 'Patrick', role: 'Frontend Arquitetura', emoji: '🎨', color: 'cyan' },
      { name: 'André', role: 'Frontend Performance', emoji: '⚡', color: 'yellow' },
      { name: 'Saturnino', role: 'Frontend Escalabilidade', emoji: '💻', color: 'blue' },
      { name: 'Philipe', role: 'Mobile', emoji: '📱', color: 'magenta' },
      { name: 'Mateus', role: 'Backend', emoji: '🌐', color: 'green' },
      { name: 'Avner', role: 'DevOps', emoji: '🔧', color: 'gray' },
      { name: 'Guilherme', role: 'Infraestrutura', emoji: '🏗️', color: 'white' },
      { name: 'Wander', role: 'UX', emoji: '♿', color: 'cyan' },
      { name: 'Viviane', role: 'QA', emoji: '🎯', color: 'yellow' },
      { name: 'Marcelo', role: 'Security', emoji: '🔒', color: 'red' },
      { name: 'Bruno', role: 'Product Manager', emoji: '👨‍💼', color: 'blue' },
      { name: 'Deivis', role: 'Business', emoji: '💰', color: 'green' },
      { name: 'Carlos', role: 'Tech Lead', emoji: '👨‍💻', color: 'magenta' }
    ];

    this.currentTime = 0;
    this.typingSpeed = 10; // ms per character
    this.thinkingDelay = 800; // ms between specialists
  }

  async execute(demand, options = {}) {
    this.clearScreen();
    await this.showHeader(demand);
    await this.delay(1000);

    // Phase 1: Specialist Analysis
    await this.showPhase('📊 Análises dos Especialistas', 'cyan');
    await this.conductSpecialistAnalysis(demand);

    // Phase 2: Generate Hypotheses
    await this.delay(1500);
    await this.showPhase('💡 Gerando 3 Hipóteses Técnicas', 'yellow');
    await this.generateHypotheses(demand);

    // Phase 3: Critical Analysis
    await this.delay(1500);
    await this.showPhase('🔍 Análise Crítica', 'red');
    await this.criticalAnalysis();

    // Phase 4: Optimized Solution
    await this.delay(1500);
    await this.showPhase('🏆 Solução Otimizada Final', 'green');
    await this.generateOptimizedSolution(demand);

    await this.showFooter();
  }

  clearScreen() {
    console.clear();
  }

  async showHeader(demand) {
    console.log(chalk.cyan.bold('\n' + '━'.repeat(60)));
    await this.typeWriter('🧠 Mesa Técnica Frontend Flow', 'white', 30);
    console.log(chalk.gray('\n📝 Demanda: ') + chalk.white(`"${demand}"`));
    console.log(chalk.gray('⏰ Início: ') + chalk.white(new Date().toLocaleTimeString('pt-BR')));
    console.log(chalk.cyan.bold('━'.repeat(60) + '\n'));
  }

  async showPhase(title, color) {
    console.log('\n');
    await this.typeWriter(title, color, 20);
    console.log(chalk.gray('\n' + '─'.repeat(50) + '\n'));
    await this.delay(500);
  }

  async conductSpecialistAnalysis(demand) {
    const analyses = this.generateAnalyses(demand);

    for (let i = 0; i < this.specialists.length; i++) {
      const specialist = this.specialists[i];
      const analysis = analyses[i];

      // Show specialist thinking
      process.stdout.write(chalk.gray(`[${this.getTime()}] `));
      process.stdout.write(specialist.emoji + ' ');
      process.stdout.write(chalk[specialist.color].bold(`${specialist.name} `));
      process.stdout.write(chalk.gray(`(${specialist.role})`));
      process.stdout.write(chalk.gray(' pensando'));

      // Animate thinking dots
      for (let j = 0; j < 3; j++) {
        await this.delay(200);
        process.stdout.write(chalk.gray('.'));
      }

      // Clear thinking message and show analysis
      process.stdout.write('\r' + ' '.repeat(80) + '\r');

      // Show timestamp and specialist
      process.stdout.write(chalk.gray(`[${this.getTime()}] `));
      process.stdout.write(specialist.emoji + ' ');
      process.stdout.write(chalk[specialist.color].bold(`${specialist.name} `));
      process.stdout.write(chalk.gray(`(${specialist.role}):\n`));

      // Type the analysis with indentation
      const lines = analysis.split('\n');
      for (const line of lines) {
        await this.typeWriter('        ' + line, 'white', this.typingSpeed);
      }

      console.log(''); // New line after each specialist
      await this.delay(this.thinkingDelay);
    }
  }

  generateAnalyses(demand) {
    if (demand.toLowerCase().includes('fetch') && demand.toLowerCase().includes('axios')) {
      return [
        'Fetch é nativo, zero dependências. Axios adiciona 15KB mas oferece\ninterceptors e melhor DX. Para TypeScript, fetch com wrapper pode ser suficiente.',
        'Bundle size crítico! Fetch: 0KB vs Axios: 15KB. Core Web Vitals\nfavorecem fetch nativo. Axios só se justifica com features avançadas.',
        'TypeScript com fetch requer types manuais. Axios tem types built-in.\nPara projetos grandes, prefiro fetch com wrapper tipado customizado.',
        'React Native: fetch funciona com quirks. Axios abstrai diferenças.\nPWAs: fetch com Service Workers é superior para cache offline.',
        'Interceptors do Axios superiores para auth tokens e retry logic.\nUpload progress só existe no Axios nativamente.',
        'Axios facilita logging centralizado. Fetch requer mais boilerplate.\nPara debugging em produção, Axios é mais rastreável.',
        'Timeout: Axios built-in, fetch precisa AbortController manual.\nPara microserviços com timeouts variados, Axios é mais prático.',
        'Cancel requests importantes para UX. Axios tem API mais simples.\nProgress bar para uploads só com Axios facilmente.',
        'Testing: Axios mais fácil de mockar. Fetch com MSW é melhor\nmas setup complexo. Para E2E, ambos equivalentes.',
        'CSRF: Axios tem suporte built-in. Fetch precisa config manual.\nXSS: ambos seguros se usados corretamente.',
        'Features como retry automático economizam desenvolvimento.\nTime-to-market: Axios mais rápido inicialmente.',
        'Custo: Fetch = zero, manutenção própria. Axios = dependência externa.\nROI depende da complexidade das integrações.',
        'Decisão arquitetural: simplicidade vs features. Para 80% dos casos,\nfetch é suficiente. Axios para casos complexos específicos.'
      ];
    }

    // Default analysis for other demands
    return this.specialists.map((s, i) =>
      `Analisando "${demand}" sob a perspectiva de ${s.role.toLowerCase()}.\nConsiderações técnicas específicas da área.`
    );
  }

  async generateHypotheses(demand) {
    const hypotheses = [
      {
        title: 'A) Abordagem Minimalista',
        description: 'Fetch nativo com wrapper customizado leve',
        code: `const api = {\n  get: (url) => fetch(url).then(r => r.json()),\n  post: (url, data) => fetch(url, {...}).then(r => r.json())\n}`,
        pros: '✅ Zero dependências, controle total, bundle mínimo',
        cons: '❌ Mais código inicial, features manuais'
      },
      {
        title: 'B) Abordagem Completa',
        description: 'Axios com todas as features',
        code: `import axios from 'axios';\naxios.interceptors.request.use(...);\naxios.defaults.timeout = 5000;`,
        pros: '✅ Features prontas, menos código, ótima DX',
        cons: '❌ 15KB extra no bundle, vendor lock-in'
      },
      {
        title: 'C) Abordagem Híbrida',
        description: 'Biblioteca moderna leve (Ky/Wretch)',
        code: `import ky from 'ky'; // 5KB apenas\nconst api = ky.create({prefixUrl: '...'});`,
        pros: '✅ Melhor dos dois mundos, bundle pequeno',
        cons: '❌ Menos conhecido, comunidade menor'
      }
    ];

    for (const hypothesis of hypotheses) {
      await this.showHypothesis(hypothesis);
      await this.delay(1000);
    }
  }

  async showHypothesis(hypothesis) {
    console.log(chalk.yellow.bold(`\n${hypothesis.title}`));
    await this.typeWriter(hypothesis.description, 'white', 15);

    console.log(chalk.gray('\nCódigo:'));
    const codeLines = hypothesis.code.split('\n');
    for (const line of codeLines) {
      console.log(chalk.green('  ' + line));
      await this.delay(100);
    }

    await this.delay(300);
    await this.typeWriter(hypothesis.pros, 'green', 15);
    await this.typeWriter(hypothesis.cons, 'red', 15);
  }

  async criticalAnalysis() {
    const critiques = [
      { target: 'A', critique: 'Reinventar a roda, manutenção custosa, bugs potenciais' },
      { target: 'B', critique: 'Bundle desnecessário para casos simples, vendor lock-in' },
      { target: 'C', critique: 'Documentação limitada, risco de abandono do projeto' }
    ];

    for (const { target, critique } of critiques) {
      process.stdout.write(chalk.red(`• Hipótese ${target}: `));
      await this.delay(500);
      await this.typeWriter(critique, 'yellow', this.typingSpeed);
    }
  }

  async generateOptimizedSolution(demand) {
    console.log(chalk.green.bold('\nDecisão Contextual:\n'));

    const decisions = [
      {
        context: '🚀 Aplicações Simples',
        solution: 'Fetch nativo com wrapper mínimo',
        reason: 'Performance máxima, zero dependências'
      },
      {
        context: '🏢 Enterprise Complex',
        solution: 'Axios sem hesitação',
        reason: 'Features críticas, time-to-market'
      },
      {
        context: '⚡ Performance Crítica',
        solution: 'Fetch otimizado + Service Workers',
        reason: 'Cada KB importa, cache avançado'
      }
    ];

    for (const decision of decisions) {
      console.log(chalk.cyan(decision.context));
      await this.typeWriter(`→ ${decision.solution}`, 'white', 15);
      console.log(chalk.gray(`  Motivo: ${decision.reason}\n`));
      await this.delay(800);
    }

    // Final recommendation with animation
    console.log(chalk.green.bold('\n📊 Recomendação Final:\n'));

    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    process.stdout.write('Calculando melhor opção ');

    for (let i = 0; i < 20; i++) {
      process.stdout.write(chalk.cyan(spinner[i % spinner.length]));
      await this.delay(100);
      process.stdout.write('\b');
    }

    process.stdout.write('\r' + ' '.repeat(30) + '\r');

    await this.typeWriter(
      '✅ Para 80% dos casos → Fetch nativo é suficiente\n' +
      '✅ Para 20% dos casos → Axios se justifica plenamente',
      'green',
      20
    );

    console.log(chalk.yellow.bold('\n\n🎯 Regra de Ouro:'));
    await this.typeWriter(
      '"Comece com fetch. Migre para Axios apenas quando\n' +
      'precisar de features específicas que justifiquem os 15KB extras."',
      'white',
      15
    );
  }

  async showFooter() {
    console.log(chalk.cyan.bold('\n' + '━'.repeat(60)));
    console.log(chalk.green('✅ Mesa Técnica Concluída'));
    console.log(chalk.gray('⏱️ Duração: ') + chalk.white(this.formatTime(this.currentTime)));
    console.log(chalk.gray('📊 Consenso: ') + chalk.green('ALCANÇADO'));
    console.log(chalk.cyan.bold('━'.repeat(60) + '\n'));
  }

  async typeWriter(text, color = 'white', speed = 20) {
    const colored = chalk[color](text);
    for (let i = 0; i < text.length; i++) {
      process.stdout.write(colored[i]);
      await this.delay(speed);
    }
    console.log('');
  }

  getTime() {
    const minutes = Math.floor(this.currentTime / 60000);
    const seconds = Math.floor((this.currentTime % 60000) / 1000);
    this.currentTime += 1500; // Increment time
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RealtimeTechnicalRoundtable;