const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  // Obter informações do último commit
  const commitHash = execSync('git log -1 --format="%H"').toString().trim().replace(/"/g, '');
  const commitDate = execSync('git log -1 --format="%cd" --date=format:"%d/%m/%Y %H:%M:%S"').toString().trim().replace(/"/g, '');
  const commitMessage = execSync('git log -1 --format="%s"').toString().trim().replace(/"/g, '');

  const buildInfo = {
    commitHash: commitHash.substring(0, 7), // Hash curto
    commitDate,
    commitMessage,
    buildDate: new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };

  // Criar arquivo build-info.json na pasta public
  const outputPath = path.join(__dirname, '../public/build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

  console.log('✓ Build info gerado com sucesso:');
  console.log(`  Commit: ${buildInfo.commitHash}`);
  console.log(`  Data: ${buildInfo.commitDate}`);
  console.log(`  Mensagem: ${buildInfo.commitMessage}`);
} catch (error) {
  console.error('Erro ao gerar build info:', error.message);

  // Gerar arquivo com informações padrão em caso de erro
  const fallbackInfo = {
    commitHash: 'unknown',
    commitDate: new Date().toLocaleString('pt-BR'),
    commitMessage: 'Build local',
    buildDate: new Date().toLocaleString('pt-BR')
  };

  const outputPath = path.join(__dirname, '../public/build-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(fallbackInfo, null, 2));
}
