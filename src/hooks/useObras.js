import { useCallback, useEffect, useState } from 'react';
import { loadObras, saveObras } from '../services/storage';
import { generateId } from '../utils/id';

// Hook que gerencia a lista de obras (projetos).
// Cada obra tem: id, nome, criadoEm.
export const useObras = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await loadObras();
        if (ativo) setObras(dados);
      } catch (e) {
        if (ativo) setError('Não foi possível carregar as obras.');
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

  // Usado para restaurar um backup completo, substituindo a lista inteira.
  const substituirTodas = useCallback(async (novasObras) => {
    await persist(novasObras);
  }, [persist]);

  const addObra = useCallback(async (nome) => {
    const nova = {
      id: generateId(),
      nome: nome.trim(),
      criadoEm: new Date().toISOString(),
    };
    await persist([nova, ...obras]);
    return nova;
  }, [obras, persist]);

  const removeObra = useCallback(async (id) => {
    await persist(obras.filter((o) => o.id !== id));
  }, [obras, persist]);

  const renameObra = useCallback(async (id, novoNome) => {
    await persist(obras.map((o) => o.id === id ? { ...o, nome: novoNome.trim() } : o));
  }, [obras, persist]);

  return { obras, loading, error, addObra, removeObra, renameObra, substituirTodas };
};
