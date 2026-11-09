export const EMPRESA_SETORES = [
  'Tecnologia',
  'Design',
  'Marketing',
  'Consultoria',
  'Educação',
  'Saúde',
  'Varejo',
  'Indústria',
  'Construção',
  'Alimentação',
  'Jurídico',
  'Finanças',
  'Serviços',
  'Outro',
];

export const EMPRESA_PORTES = ['MEI', 'Pequena', 'Média', 'Grande'];

export const EMPRESA_TIPOS = ['Interna', 'Cliente', 'Parceira', 'Projeto'];

export const EMPRESA_ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export function withCurrent(options: string[], current?: string) {
  const value = current?.trim();
  if (!value || options.includes(value)) return options;
  return [value, ...options];
}
