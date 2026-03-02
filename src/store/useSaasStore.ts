import { create } from 'zustand';

type Demanda = {
  id: string;
  titulo: string;
  status: string;
  prioridade?: string;
  responsavel?: string;
};

type Nota = {
  id: string;
  titulo: string;
  conteudo: string;
};

type SaasState = {
  demandas: Demanda[];
  notas: Nota[];

  addDemanda: (d: Demanda) => void;
  updateDemanda: (id: string, data: Partial<Demanda>) => void;
  deleteDemanda: (id: string) => void;

  addNota: (n: Nota) => void;
  updateNota: (id: string, data: Partial<Nota>) => void;
  deleteNota: (id: string) => void;
};

export const useSaasStore = create<SaasState>((set) => ({
  demandas: [],
  notas: [],

  addDemanda: (d) =>
    set((state) => ({ demandas: [...state.demandas, d] })),

  updateDemanda: (id, data) =>
    set((state) => ({
      demandas: state.demandas.map((d) =>
        d.id === id ? { ...d, ...data } : d
      ),
    })),

  deleteDemanda: (id) =>
    set((state) => ({
      demandas: state.demandas.filter((d) => d.id !== id),
    })),

  addNota: (n) =>
    set((state) => ({ notas: [...state.notas, n] })),

  updateNota: (id, data) =>
    set((state) => ({
      notas: state.notas.map((n) =>
        n.id === id ? { ...n, ...data } : n
      ),
    })),

  deleteNota: (id) =>
    set((state) => ({
      notas: state.notas.filter((n) => n.id !== id),
    })),
}));