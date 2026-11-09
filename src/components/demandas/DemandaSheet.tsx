import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown, ImagePlus, Paperclip, Pencil, Send, UserRound } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface SheetTask {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
  creatorAvatar?: string | null;
  seguidores?: string[];
}

interface Subtask {
  id: string;
  title?: string;
  description?: string;
  tipo?: string;
  status?: string;
}

const MAX_FILE = 2.5 * 1024 * 1024;

function useCompact() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)');
    const sync = () => setCompact(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return compact;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DemandaSheet({
  task,
  subtasks,
  following,
  onFollow,
  onEdit,
  onAddSubtask,
  onCompleteSubtask,
}: {
  task: SheetTask;
  subtasks: Subtask[];
  following: boolean;
  onFollow: () => void;
  onEdit: () => void;
  onAddSubtask: (title: string, note: string) => Promise<void> | void;
  onCompleteSubtask: (id: string) => void;
}) {
  const compact = useCompact();
  const user = useAppStore((state) => state.user);
  const membros = useAppStore((state) => state.membros);
  const demandas = useAppStore((state) => state.demandas);
  const chatMensagens = useAppStore((state) => state.chatMensagens);
  const addChatMensagem = useAppStore((state) => state.addChatMensagem);
  const updateDemanda = useAppStore((state) => state.updateDemanda);
  const fileRef = useRef<HTMLInputElement>(null);
  const sending = useRef(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<'todas' | 'comentarios' | 'arquivos' | 'tarefas'>('todas');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fileError, setFileError] = useState('');
  const [open, setOpen] = useState({ descricao: true, tarefas: !compact, arquivos: !compact, historico: !compact });

  useEffect(() => {
    if (!compact) setOpen({ descricao: true, tarefas: true, arquivos: true, historico: true });
  }, [compact]);

  const live = demandas.find((item) => item.id === task.id);
  const anexos = live?.anexos || [];
  const people = useMemo(() => {
    const ids = new Set(task.seguidores || []);
    return membros.filter((member) => ids.has(member.id)).slice(0, 4);
  }, [membros, task.seguidores]);
  const messages = chatMensagens
    .filter((item) => item.demandaId === task.id)
    .slice()
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const done = subtasks.filter((item) => item.status === 'concluida').length;
  const progress = subtasks.length ? Math.round((done / subtasks.length) * 100) : 0;
  const created = task.createdAt ? new Date(task.createdAt).toLocaleDateString('pt-BR') : 'Sem data';
  const term = search.trim().toLowerCase();

  const visibleMessages = messages.filter((item) => {
    if (tab === 'arquivos' || tab === 'tarefas') return false;
    if (term && !`${item.message} ${item.senderName || ''}`.toLowerCase().includes(term)) return false;
    const day = String(item.createdAt || '').slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });

  const send = async () => {
    const text = message.trim();
    if (!text || sending.current) return;
    sending.current = true;
    setMessage('');
    try {
      await addChatMensagem({
        message: text,
        demandaId: task.id,
        senderId: user?.id,
        senderName: user?.name || user?.email || 'Você',
        channel: task.id,
      });
      setTab('comentarios');
    } finally {
      sending.current = false;
    }
    setOpen((value) => ({ ...value, historico: true }));
  };

  const attach = async (list: FileList | null) => {
    const file = list?.[0];
    if (!file) return;
    if (file.size > MAX_FILE) {
      setFileError('O arquivo precisa ter até 2,5 MB.');
      return;
    }
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read'));
      reader.readAsDataURL(file);
    }).catch(() => '');
    if (!data) {
      setFileError('Não foi possível ler esse arquivo.');
      return;
    }
    setFileError('');
    const next = [...anexos, {
      id: crypto.randomUUID(),
      demandaId: task.id,
      name: file.name,
      type: file.type || 'application/octet-stream',
      data,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }];
    await updateDemanda(task.id, { anexos: next }, { silent: true });
    if (fileRef.current) fileRef.current.value = '';
    setOpen((value) => ({ ...value, arquivos: true }));
  };

  const addTask = async () => {
    if (!title.trim()) return;
    await onAddSubtask(title.trim(), note.trim());
    setTitle('');
    setNote('');
    setAdding(false);
  };

  const fold = (key: keyof typeof open, label: string, extra: string | null, body: ReactNode) => (
    <section className="demand-card">
      <button
        type="button"
        className="demand-fold"
        aria-expanded={open[key]}
        onClick={() => compact && setOpen((value) => ({ ...value, [key]: !value[key] }))}
      >
        <span>{label}</span>
        <span className="ml-auto flex items-center gap-2 text-sm text-[var(--text-muted)]">
          {extra}
          <ChevronDown size={16} className={`transition lg:hidden ${open[key] ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open[key] && <div className="demand-fold-body">{body}</div>}
    </section>
  );

  return (
    <div className="demand-sheet">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center">
          {task.creatorAvatar ? (
            <img src={task.creatorAvatar} alt="" className="demand-avatar" />
          ) : (
            <span className="demand-avatar">{(task.createdBy || 'H').slice(0, 1).toUpperCase()}</span>
          )}
          {people.map((person) => (
            person.avatar
              ? <img key={person.id} src={person.avatar} alt="" className="demand-avatar -ml-2" />
              : <span key={person.id} className="demand-avatar -ml-2">{person.name.slice(0, 1).toUpperCase()}</span>
          ))}
        </div>
        <span className="text-sm text-[var(--text-secondary)]">{created}</span>
        <button type="button" className={`demand-follow ml-auto ${following ? 'is-on' : ''}`} onClick={onFollow}>
          {following ? 'Seguindo' : 'Seguir'}
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {fold('descricao', 'Descrição do projeto', null, (
          <>
            <button type="button" className="demand-quiet mb-3" onClick={onEdit}>
              <Pencil size={14} /> Editar
            </button>
            <div className="whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]">
              {task.description || 'Sem descrição.'}
            </div>
          </>
        ))}
        {fold('tarefas', 'Tarefas', `${done}/${subtasks.length}`, (
          <>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[var(--hover)]">
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
            </div>
            <div className="space-y-2">
              {subtasks.length === 0 && <p className="text-sm text-[var(--text-muted)]">Nenhuma tarefa nesta demanda.</p>}
              {subtasks.map((item) => {
                const complete = item.status === 'concluida';
                return (
                  <article key={item.id} className="flex items-start gap-3 rounded-2xl px-1 py-2">
                    <button
                      type="button"
                      className={`demand-check ${complete ? 'is-on' : ''}`}
                      aria-label={complete ? 'Tarefa concluída' : 'Concluir tarefa'}
                      onClick={() => { if (!complete) onCompleteSubtask(item.id); }}
                    >
                      {complete ? <Check size={14} /> : null}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`font-medium ${complete ? 'text-[var(--text-muted)] line-through' : ''}`}>{item.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <span className="rounded-md border px-1.5 py-0.5" style={{ borderColor: 'var(--border)' }}>Tipo: {item.tipo || 'feature'}</span>
                        <span className="rounded-md border px-1.5 py-0.5" style={{ borderColor: 'var(--border)' }}>Status: {complete ? 'Concluída' : 'Aguardando'}</span>
                      </div>
                      {item.description && <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.description}</p>}
                    </div>
                    <UserRound size={16} className="mt-1 text-[var(--text-muted)]" />
                  </article>
                );
              })}
            </div>
            {adding && (
              <div className="mt-3 grid gap-2">
                <input className="havk-field px-3 py-2.5 text-sm" placeholder="O que precisa ser feito" value={title} onChange={(event) => setTitle(event.target.value)} />
                <textarea className="havk-field min-h-16 px-3 py-2.5 text-sm" placeholder="Detalhe para concluir" value={note} onChange={(event) => setNote(event.target.value)} />
              </div>
            )}
            <button type="button" className="demand-accent mt-3 w-full" onClick={() => (adding ? addTask() : setAdding(true))}>
              {adding ? 'Salvar tarefa' : '+ Nova tarefa'}
            </button>
          </>
        ))}
      </div>

      {fold('arquivos', 'Arquivos', String(anexos.length), (
        <>
          <div className="mb-3 flex justify-end">
            <button type="button" className="demand-quiet" onClick={() => fileRef.current?.click()}>
              <Paperclip size={14} /> Adicionar arquivo
            </button>
          </div>
          {fileError && <p className="mb-2 text-sm text-red-500">{fileError}</p>}
          {anexos.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nenhum arquivo ainda.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {anexos.map((file) => (
                <a key={file.id} href={file.data} download={file.name} className="demand-file">
                  {file.type.startsWith('image/') ? (
                    <img src={file.data} alt="" />
                  ) : (
                    <span className="demand-file-badge">PDF</span>
                  )}
                  <span className="mt-2 block truncate text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-[var(--text-muted)]">{file.type.split('/')[1]?.toUpperCase() || 'ARQ'} · {formatSize(file.size)}</span>
                </a>
              ))}
            </div>
          )}
        </>
      ))}

      {fold('historico', 'Histórico', null, (
        <>
          <div className="mb-3 flex gap-2 overflow-x-auto">
            {([
              ['todas', 'Todas'],
              ['comentarios', 'Comentários'],
              ['arquivos', 'Arquivos'],
              ['tarefas', 'Tarefas'],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" className={`demand-tab ${tab === id ? 'is-on' : ''}`} onClick={() => setTab(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <input className="havk-field px-3 py-2 text-sm" placeholder="Pesquisar no histórico" value={search} onChange={(event) => setSearch(event.target.value)} />
            <input type="date" className="havk-field px-3 py-2 text-sm" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="De" />
            <input type="date" className="havk-field px-3 py-2 text-sm" value={to} onChange={(event) => setTo(event.target.value)} aria-label="Até" />
            <button type="button" className="demand-accent px-4" onClick={() => setOpen((value) => ({ ...value, historico: true }))}>Buscar</button>
          </div>
          <div className="demand-history">
            {tab !== 'arquivos' && tab !== 'tarefas' && visibleMessages.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--text-muted)]">Sem mensagens no momento</p>
            )}
            {tab !== 'arquivos' && tab !== 'tarefas' && visibleMessages.map((item) => (
              <article key={item.id} className="flex gap-3 py-2">
                <span className="demand-avatar">{(item.senderName || 'V').slice(0, 1).toUpperCase()}</span>
                <div>
                  <p className="text-sm font-medium">{item.senderName || 'Você'}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{item.message}</p>
                </div>
              </article>
            ))}
            {(tab === 'todas' || tab === 'arquivos') && anexos.map((file) => (
              <p key={file.id} className="py-2 text-sm text-[var(--text-secondary)]">Arquivo adicionado: {file.name}</p>
            ))}
            {(tab === 'todas' || tab === 'tarefas') && subtasks.map((item) => (
              <p key={item.id} className="py-2 text-sm text-[var(--text-secondary)]">Tarefa: {item.title}</p>
            ))}
          </div>
          <div className="demand-composer">
            {user?.avatar ? <img src={user.avatar} alt="" className="demand-avatar" /> : <span className="demand-avatar">{(user?.name || 'V').slice(0, 1).toUpperCase()}</span>}
            <textarea
              className="havk-field min-h-11 flex-1 resize-none px-3 py-2.5 text-sm"
              placeholder="Digite sua mensagem"
              rows={1}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
            />
            <button type="button" className="demand-icon" aria-label="Anexar arquivo" onClick={() => fileRef.current?.click()}>
              <Paperclip size={16} />
            </button>
            <button type="button" className="demand-icon" aria-label="Anexar imagem" onClick={() => fileRef.current?.click()}>
              <ImagePlus size={16} />
            </button>
            <button type="button" className="demand-send" aria-label="Enviar mensagem" onClick={() => void send()}>
              <Send size={16} />
            </button>
          </div>
          <p className="mt-1 text-right text-[11px] text-[var(--text-muted)]">Shift+Enter quebra a linha. Enter envia.</p>
        </>
      ))}

      <input ref={fileRef} type="file" accept="image/*,.pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={(event) => void attach(event.target.files)} />
    </div>
  );
}
