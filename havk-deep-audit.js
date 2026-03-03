#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MAX_FILE_SIZE = 12000; // limita leitura para evitar arquivos gigantes
const OUTPUT_FILE = "havk-audit-report.json";

const report = {
  projectInfo: {},
  structure: [],
  architecture: {
    usesZustand: false,
    usesIndexedDB: false,
    usesLocalStorage: false,
    usesContext: false,
    hasLayoutSystem: false,
    hasAuthFlow: false
  },
  stateInsights: {},
  potentialProblems: [],
  improvementAreas: [],
  fileSummaries: {}
};

/* ================================
   SCAN PROJECT STRUCTURE
================================ */

function scanStructure(dir, relative = "") {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const relPath = path.join(relative, file);

    if (file === "node_modules" || file.startsWith(".")) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      report.structure.push("📁 " + relPath);
      scanStructure(fullPath, relPath);
    } else {
      report.structure.push("📄 " + relPath);
      analyzeFile(fullPath, relPath);
    }
  }
}

/* ================================
   ANALYZE FILE CONTENT
================================ */

function analyzeFile(fullPath, relPath) {
  try {
    const stats = fs.statSync(fullPath);

    if (stats.size > MAX_FILE_SIZE) {
      report.fileSummaries[relPath] = {
        note: "Arquivo muito grande - resumido",
        size: stats.size
      };
      return;
    }

    const content = fs.readFileSync(fullPath, "utf8");

    // Arquitetura
    if (content.includes("zustand")) report.architecture.usesZustand = true;
    if (content.includes("indexedDB")) report.architecture.usesIndexedDB = true;
    if (content.includes("localStorage")) report.architecture.usesLocalStorage = true;
    if (content.includes("createContext")) report.architecture.usesContext = true;
    if (content.includes("Layout")) report.architecture.hasLayoutSystem = true;
    if (content.includes("login") || content.includes("signup")) report.architecture.hasAuthFlow = true;

    // Problemas potenciais
    if (content.includes("any")) {
      report.potentialProblems.push(`Uso de 'any' em ${relPath}`);
    }

    if (content.includes("useEffect(") && !content.includes("cleanup")) {
      report.potentialProblems.push(`Possível memory leak em ${relPath}`);
    }

    // Resumo inteligente do arquivo
    report.fileSummaries[relPath] = {
      lines: content.split("\n").length,
      hasAPI: content.includes("fetch") || content.includes("axios"),
      hasMock: content.includes("mock") || content.includes("fake"),
      hasAI: content.includes("AI"),
      hasState: content.includes("useState") || content.includes("useAppStore"),
      hasRouting: content.includes("Route")
    };

  } catch (err) {
    report.potentialProblems.push(`Erro ao ler ${relPath}`);
  }
}

/* ================================
   INSIGHTS FINAIS
================================ */

function finalizeInsights() {
  if (!report.architecture.hasLayoutSystem) {
    report.improvementAreas.push("Criar AppLayout global inteligente");
  }

  if (!report.architecture.usesIndexedDB) {
    report.improvementAreas.push("Implementar camada de persistência robusta");
  }

  if (!report.architecture.usesZustand) {
    report.improvementAreas.push("Adicionar state management global");
  }

  if (!report.architecture.hasAuthFlow) {
    report.improvementAreas.push("Criar fluxo completo de autenticação fake");
  }

  report.projectInfo = {
    totalFiles: report.structure.length,
    timestamp: new Date().toISOString()
  };
}

/* ================================
   RUN
================================ */

scanStructure(ROOT);
finalizeInsights();

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));

console.log(`\n✅ Relatório gerado com sucesso: ${OUTPUT_FILE}\n`);