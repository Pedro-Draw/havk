import { addItem, getAll, getItem } from '../db/indexedDB';
import { statusForColumn } from './kanban';
import type { Empresa } from './workspace';

const FLAG = 'seedDemandasPorEmpresa';
let inflight: Promise<void> | null = null;

const BLUEPRINTS = [
  { title: 'Revisar o acesso da equipe', column: 'afazer', priority: 'alta' },
  { title: 'Organizar as pendências da semana', column: 'backlog', priority: 'media' },
  { title: 'Desbloquear a entrega atrasada', column: 'bloqueada', priority: 'urgente' },
  { title: 'Acompanhar o que está em execução', column: 'andamento', priority: 'alta' },
  { title: 'Validar o que foi para teste', column: 'teste', priority: 'media' },
  { title: 'Confirmar a entrega concluída', column: 'concluida', priority: 'baixa' },
  { title: 'Planejar o próximo ciclo', column: 'afazer', priority: 'media' },
] as const;

export function ensureCompanyDemandas(empresas: Empresa[]) {
  if (!inflight) {
    inflight = seedCompanyDemandas(empresas).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function seedCompanyDemandas(empresas: Empresa[]) {
  const flag = await getItem<{ key: string; value: string }>('preferencias', FLAG);
  if (flag?.value === '1' || empresas.length === 0) return;

  const existing = await getAll<{ empresaId?: string; title?: string }>('demandas');
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  existing.forEach((item) => {
    if (!item.empresaId) return;
    counts.set(item.empresaId, (counts.get(item.empresaId) || 0) + 1);
    if (item.title) seen.add(`${item.empresaId}::${item.title}`);
  });

  const now = new Date();
  for (const empresa of empresas) {
    let have = counts.get(empresa.id) || 0;
    for (let index = 0; index < BLUEPRINTS.length && have < BLUEPRINTS.length; index += 1) {
      const blueprint = BLUEPRINTS[index];
      const key = `${empresa.id}::${blueprint.title}`;
      if (seen.has(key)) continue;
      const prazo = new Date(now);
      prazo.setDate(prazo.getDate() + (index + 1) * 2);
      const createdAt = now.toISOString();
      await addItem('demandas', {
        id: crypto.randomUUID(),
        title: blueprint.title,
        description: `Tarefa de ${empresa.name} para conferir o quadro desta empresa e o espaço Geral.`,
        status: statusForColumn(blueprint.column),
        priority: blueprint.priority,
        empresaId: empresa.id,
        boardColumn: blueprint.column,
        boardOrder: have,
        progresso: blueprint.column === 'concluida' ? 100 : index * 12,
        prazo: prazo.toISOString(),
        tipo: 'feature',
        createdAt,
        updatedAt: createdAt,
      });
      seen.add(key);
      have += 1;
    }
  }

  await addItem('preferencias', { key: FLAG, value: '1' });
}
