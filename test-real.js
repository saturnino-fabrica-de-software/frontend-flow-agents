#!/usr/bin/env node

const ClaudeWrapper = require('./lib/claude-wrapper');

async function test() {
  console.log('🧪 Testando Claude Wrapper com permissões...\n');

  const wrapper = new ClaudeWrapper();
  const prompt = `Por favor, crie um arquivo chamado test-output.txt com o conteúdo "Sistema Frontend Flow funcionando com Claude Real!" e depois liste os arquivos do diretório.`;

  try {
    console.log('📝 Prompt:', prompt);
    console.log('\n⚠️  IMPORTANTE: Quando Claude pedir permissão, digite "yes" e pressione Enter\n');

    const result = await wrapper.executeInteractive(prompt, process.cwd(), {
      timeout: 30000,
      autoApprove: false // User needs to approve manually
    });

    console.log('\n✅ Execução concluída!');
    console.log('Output:', result.output);

    // Check if file was created
    const fs = require('fs');
    if (fs.existsSync('test-output.txt')) {
      console.log('\n🎉 SUCESSO! Arquivo criado pelo Claude');
      const content = fs.readFileSync('test-output.txt', 'utf8');
      console.log('Conteúdo:', content);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();