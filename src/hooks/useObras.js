import { useCallback, useEffect, useState } from 'react';
import { loadObras, saveObras, deleteTransactionsByObra } from '../services/storage';
import { generateId } from '../utils/id';

// Hook que gerencia a lista de obras (projetos).
// Cada obra tem: id, nome, criadoEm.
export const useObras = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await loadObras();
        if (ativo) setObras(dados);
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  const persist = useCallback(async (proxima) => {
    await saveObras(proxima);
    setObras(proxima);
  }, []);

  const addObra = useCallback(async (nome) => {
    const nova = {
      id: generateId(),
      nome: nome.trim(),
      criadoEm: new Date().toISOString(),
    };
    await persist([nova, ...obras]);
    return nova;
  }, [obras, persist]);

  const removeObra = useCallback(async (id, deletarTransacoes = false) => {
    const obraADeletar = obras.find((o) => o.id === id);
    if (obraADeletar && deletarTransacoes) {
      try {
        await deleteTransactionsByObra(obraADeletar.nome);
      } catch (error) {
        console.error('Erro ao deletar transações:', error);
      }
    }
    await persist(obras.filter((o) => o.id !== id));
  }, [obras, persist]);

  const renameObra = useCallback(async (id, novoNome) => {
    await persist(obras.map((o) => o.id === id ? { ...o, nome: novoNome.trim() } : o));
  }, [obras, persist]);

  return { obras, loading, addObra, removeObra, renameObra };
};
