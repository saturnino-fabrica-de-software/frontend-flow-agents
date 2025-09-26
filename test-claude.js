#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

// Teste simples do Claude CLI
const testPrompt = `Create a simple file called test-claude.txt with the content "Claude is working!" and then list files in current directory.`;

console.log('Testing Claude CLI...');
console.log('Prompt:', testPrompt);

// Test with echo and pipe
const claude = spawn('bash', ['-c', `echo "${testPrompt}" | claude --print`], {
  cwd: process.cwd()
});

claude.stdout.on('data', (data) => {
  console.log('Claude output:', data.toString());
});

claude.stderr.on('data', (data) => {
  console.error('Claude error:', data.toString());
});

claude.on('close', (code) => {
  console.log('Claude exited with code', code);

  // Check if file was created
  if (fs.existsSync('test-claude.txt')) {
    console.log('✅ SUCCESS! File created by Claude');
    const content = fs.readFileSync('test-claude.txt', 'utf8');
    console.log('File content:', content);
  } else {
    console.log('❌ File was not created');
  }
});