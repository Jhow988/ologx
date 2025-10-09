import React, { useState, useEffect } from 'react';

interface BuildInfo {
  commitHash: string;
  commitDate: string;
  commitMessage: string;
  buildDate: string;
}

const Footer: React.FC = () => {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null);

  useEffect(() => {
    // Carregar informações do build
    fetch('/build-info.json')
      .then(res => res.json())
      .then(data => setBuildInfo(data))
      .catch(err => {
        console.error('Erro ao carregar build info:', err);
        // Fallback para data atual se não conseguir carregar
        setBuildInfo({
          commitHash: 'dev',
          commitDate: new Date().toLocaleString('pt-BR'),
          commitMessage: 'Desenvolvimento local',
          buildDate: new Date().toLocaleString('pt-BR')
        });
      });
  }, []);

  if (!buildInfo) return null;

  return (
    <div
      className="fixed bottom-2 right-2 text-[10px] text-gray-400 dark:text-gray-600 font-mono bg-white dark:bg-dark-bg-secondary px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-dark-border z-40"
      title={`Commit: ${buildInfo.commitHash}\nMensagem: ${buildInfo.commitMessage}\nBuild: ${buildInfo.buildDate}`}
    >
      v{buildInfo.commitHash} • {buildInfo.commitDate}
    </div>
  );
};

export default Footer;
