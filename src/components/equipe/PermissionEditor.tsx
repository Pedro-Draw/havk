import RoundCheck from '../ui/RoundCheck';
import { ALL_PERMISSION_IDS, PERMISSION_SECTIONS } from '../../lib/permissions';

interface PermissionEditorProps {
  admin: boolean;
  permissions: string[];
  onAdmin: (value: boolean) => void;
  onPermissions: (value: string[]) => void;
}

export default function PermissionEditor({ admin, permissions, onAdmin, onPermissions }: PermissionEditorProps) {
  const selected = new Set(permissions);
  const allOn = ALL_PERMISSION_IDS.every((id) => selected.has(id));

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(permissions);
    if (checked) next.add(id);
    else next.delete(id);
    onPermissions(ALL_PERMISSION_IDS.filter((item) => next.has(item)));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
        <RoundCheck
          checked={admin}
          label="Administrador"
          hint="Acesso completo. As demais permissões ficam incluídas."
          onChange={onAdmin}
        />
      </div>

      {admin ? (
        <p className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          Administrador ativo. Esta pessoa vê todos os menus e pode criar, editar, excluir e exportar.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">Marque cada acesso desta pessoa.</p>
            <button
              type="button"
              className="text-sm font-medium text-violet-300"
              onClick={() => onPermissions(allOn ? [] : [...ALL_PERMISSION_IDS])}
            >
              {allOn ? 'Limpar seleção' : 'Selecionar todas'}
            </button>
          </div>
          {PERMISSION_SECTIONS.map((section) => (
            <section key={section.id} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{section.title}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {section.items.map((item) => (
                  <RoundCheck
                    key={item.id}
                    checked={selected.has(item.id)}
                    label={item.label}
                    hint={item.hint}
                    onChange={(checked) => toggle(item.id, checked)}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
