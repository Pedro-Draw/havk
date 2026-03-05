#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process"; // Para rodar comandos externos como ESLint se disponível

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_PATH = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const NOW = new Date();
const REPORT_FILE = path.join(process.cwd(), `relatorio_projeto_${NOW.toISOString().replace(/[:.]/g, "-")}.txt`);

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx",
  ".py", ".php", ".java", ".go", ".rs", ".rb",
  ".vue", ".svelte", ".astro",
  ".css", ".scss", ".less", ".module.css",
]);

const EXCLUDE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".turbo",
  ".git",
  "coverage",
  "__tests__",
  "tests",
  "e2e",
  "cypress",
  ".vercel",
  ".yarn",
  ".pnpm",
  "venv",
  ".venv",
  ".idea",
  ".vscode",
]);

const report = [];
const stats = {
  totalFiles: 0,
  codeFiles: 0,
  totalLines: 0,
  largeFiles: 0,
  warnings: [],
  todos: [],
  potentialBugs: [],
};

/**
 * @param {string} filePath
 * @param {string} content
 */
function analyzeFile(filePath, content) {
  stats.codeFiles++;
  const lines = content.split(/\r?\n/).length;
  stats.totalLines += lines;

  const relativePath = path.relative(PROJECT_PATH, filePath);
  const ext = path.extname(filePath).toLowerCase();

  const problems = [];
  const bugs = [];

  // -------------------------------
  // Problemas comuns em produção
  // -------------------------------
  if (content.includes("console.log(") || content.includes("console.debug(")) {
    problems.push("console.log/debug presente (pode vazar dados sensíveis ou poluir logs)");
  }

  if (content.includes("debugger;")) {
    problems.push("debugger; presente (pode pausar execução em prod)");
  }

  if (content.includes("TODO") || content.includes("FIXME") || content.includes("HACK")) {
    const count = (content.match(/TODO|FIXME|HACK/g) || []).length;
    stats.todos.push({ file: relativePath, count });
    problems.push(`Possíveis anotações pendentes (${count})`);
  }

  // Arquivos muito grandes
  if (lines > 600) {
    problems.push(`Arquivo grande: ${lines} linhas (dificulta manutenção)`);
    if (lines > 1200) stats.largeFiles++;
  }

  // -------------------------------
  // Checks específicos para React/TSX (botões, lógicas, etc.)
  // -------------------------------
  if (ext === ".tsx" || ext === ".jsx") {
    // Botões sem ação (onClick vazio ou ausente)
    const buttonMatches = content.match(/<button[^>]*>/g) || [];
    buttonMatches.forEach((btn) => {
      if (!btn.includes("onClick") && !btn.includes("type=\"submit\"")) {
        bugs.push("Botão sem onClick (pode não fazer nada)");
      } else if (btn.includes("onClick={() => {}}") || btn.includes("onClick={() => console")) {
        bugs.push("onClick vazio ou só com console (botão provavelmente inoperante)");
      }
    });

    // Inputs/forms sem validação básica
    if (content.includes("<form") && !content.includes("useForm") && !content.includes("validate") && !content.includes("onSubmit")) {
      bugs.push("Form sem handler de submit ou validação aparente (pode permitir dados inválidos)");
    }

    // useEffect sem dependências (pode causar loops infinitos)
    const effectMatches = (content.match(/useEffect\(\(\) => \{/g) || []).length;
    if (effectMatches > 0) {
      bugs.push(`useEffect sem array de dependências (${effectMatches} ocorrências) - risco de loop infinito`);
    }

    // Props não usadas ou tipagem fraca
    if (content.includes(": any") || content.includes("any)")) {
      const anyCount = (content.match(/: any\b/g) || []).length;
      if (anyCount > 5) {
        bugs.push(`Uso excessivo de : any (${anyCount}) - perde benefícios do TypeScript`);
      }
    }

    // Loops potenciais sem condição de saída
    if (content.includes("while (true") || content.includes("for (;;)")) {
      bugs.push("Loop infinito detectado (while true ou for (;;))");
    }

    // Condicionais incompletos
    const ifCount = (content.match(/\bif \(/g) || []).length;
    const elseCount = (content.match(/\belse\b/g) || []).length;
    if (ifCount > elseCount + 2) {
      problems.push("Muitos ifs sem else - pode faltar handling de casos");
    }

    // Chaves hardcoded (API keys, secrets)
    if (content.match(/AIza[0-9A-Za-z-_]{35}/) || content.match(/sk-[0-9a-zA-Z]{40}/)) {
      bugs.push("Possível chave API hardcoded (risco de segurança)");
    }

    // Lógicas mal feitas: ex. setState dentro de loop sem condição
    if (content.includes("setState") && (content.includes("for(") || content.includes("while("))) {
      bugs.push("setState dentro de loop - pode causar re-renders excessivos ou loops");
    }
  }

  // -------------------------------
  // Checks gerais para TS/JS
  // -------------------------------
  if (ext === ".ts" || ext === ".tsx") {
    if (content.includes("null!") || content.includes("undefined!")) {
      bugs.push("Uso de non-null assertion (!) - pode mascarar null/undefined errors");
    }
  }

  // Integração simples com ESLint se instalado
  try {
    execSync(`npx eslint --quiet ${filePath}`, { stdio: "ignore" });
  } catch (err) {
    if (err.status) {
      bugs.push("Falhas no ESLint (rode 'npx eslint' para detalhes)");
    }
  }

  if (problems.length > 0) {
    stats.warnings.push({
      file: relativePath,
      problems,
      lineCount: lines,
    });
  }

  if (bugs.length > 0) {
    stats.potentialBugs.push({
      file: relativePath,
      bugs,
      lineCount: lines,
    });
  }
}

/**
 * @param {string} dir
 */
function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`Não foi possível ler diretório: ${dir}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (CODE_EXTENSIONS.has(ext)) {
        stats.totalFiles++;
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          analyzeFile(fullPath, content);
        } catch (err) {
          console.warn(`Falha ao ler ${fullPath}`);
        }
      }
    }
  }
}

function generateReport() {
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("              RELATÓRIO DE ANÁLISE AVANÇADA DO PROJETO SaaS");
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("");
  report.push(`Caminho analisado : ${PROJECT_PATH}`);
  report.push(`Data              : ${NOW.toLocaleString("pt-BR")}`);
  report.push(`Gerado por        : análise estática avançada v1.2`);
  report.push("");

  walk(PROJECT_PATH);

  report.push("ESTATÍSTICAS GERAIS");
  report.push("───────────────────");
  report.push(`Arquivos totais encontrados .........: ${stats.totalFiles.toLocaleString()}`);
  report.push(`Arquivos de código analisados ........: ${stats.codeFiles.toLocaleString()}`);
  report.push(`Total de linhas de código ............: ${stats.totalLines.toLocaleString()}`);
  report.push(`Arquivos muito grandes (>1200 linhas): ${stats.largeFiles}`);
  report.push("");

  // TODOs
  if (stats.todos.length > 0) {
    report.push("ANOTAÇÕES PENDENTES (TODO/FIXME/HACK)");
    report.push("─────────────────────────────────────");
    stats.todos
      .sort((a, b) => b.count - a.count)
      .slice(0, 30)
      .forEach(item => {
        report.push(`${item.count.toString().padStart(3)} × ${item.file}`);
      });
    if (stats.todos.length > 30) {
      report.push(`... e mais ${stats.todos.length - 30} arquivos`);
    }
    report.push("");
  }

  // Problemas encontrados
  report.push("PROBLEMAS E MELHORIAS SUGERIDAS");
  report.push("───────────────────────────────");
  if (stats.warnings.length === 0) {
    report.push("Nenhum problema significativo encontrado ✓");
  } else {
    stats.warnings
      .sort((a, b) => b.problems.length - a.problems.length || a.file.localeCompare(b.file))
      .forEach(item => {
        report.push("");
        report.push(`📄 ${item.file}  (${item.lineCount} linhas)`);
        item.problems.forEach(p => report.push(`   ⚠  ${p}`));
      });
  }

  // Bugs potenciais
  report.push("");
  report.push("BUGS POTENCIAIS DETECTADOS (BOTÕES, LÓGICAS, ETC.)");
  report.push("───────────────────────────────────────────");
  if (stats.potentialBugs.length === 0) {
    report.push("Nenhum bug potencial detectado estaticamente ✓");
  } else {
    stats.potentialBugs
      .sort((a, b) => b.bugs.length - a.bugs.length || a.file.localeCompare(b.file))
      .forEach(item => {
        report.push("");
        report.push(`📄 ${item.file}  (${item.lineCount} linhas)`);
        item.bugs.forEach(b => report.push(`   🐛 ${b}`));
      });
  }

  report.push("");
  report.push("RECOMENDAÇÕES GERAIS");
  report.push("────────────────────");
  report.push("- Rode ESLint completo: npx eslint . --ext .js,.jsx,.ts,.tsx");
  report.push("- Verifique dead code: npx knip");
  report.push("- Adicione testes E2E com Playwright para validar botões e fluxos reais");
  report.push("- Monitore prod com Sentry para bugs runtime");

  report.push("");
  report.push("═══════════════════════════════════════════════════════════════");
  report.push("               Fim do relatório");
  report.push("═══════════════════════════════════════════════════════════════");

  try {
    fs.writeFileSync(REPORT_FILE, report.join("\n"), "utf-8");
    console.log("\nRelatório gerado com sucesso!");
    console.log("→", REPORT_FILE);
  } catch (err) {
    console.error("Erro ao salvar relatório:", err.message);
  }
}

// ────────────────────────────────────────────────
console.log("Iniciando análise avançada do projeto...");
generateReport();