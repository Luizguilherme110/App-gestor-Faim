import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadTransactions, saveTransactions } from '../services/storage';
import { generateId } from '../utils/id';

export const TIPO = {
  GASTO: 'GASTO',
  RECEITA: 'RECEITA',
};

// Hook que centraliza estado + persistência + cálculos dos lançamentos.
// A UI só consome o que precisa, sem saber de onde vêm os dados.
export const useTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const dados = await loadTransactions();
        if (ativo) setTransactions(dados);
      } catch (e) {
        if (ativo) setError('Não foi possível carregar os dados.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Persiste e atualiza o estado de forma atômica. Em caso de falha de
  // gravação, o estado não é alterado (evita "sumiço" silencioso de dados).
  const persist = useCallback(async (proximaLista) => {
    await saveTransactions(proximaLista);
    setTransactions(proximaLista);
  }, []);

  const addTransaction = useCallback(
    async ({ tipo, valor, categoria, observacao }) => {
      const nova = {
        id: generateId(),
        tipo,
        valor,
        categoria: categoria.trim(),
        observacao: observacao.trim(),
        createdAt: new Date().toISOString(),
      };
      await persist([nova, ...transactions]);
      return nova;
    },
    [transactions, persist],
  );

  const updateTransaction = useCallback(
    async (id, { tipo, valor, categoria, observacao }) => {
      const proxima = transactions.map((t) =>
        t.id === id
          ? {
              ...t,
              tipo,
              valor,
              categoria: categoria.trim(),
              observacao: observacao.trim(),
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      await persist(proxima);
    },
    [transactions, persist],
  );

  const removeTransaction = useCallback(
    async (id) => {
      await persist(transactions.filter((t) => t.id !== id));
    },
    [transactions, persist],
  );

  // Totais derivados — memoizados para não recalcular a cada render.
  const { totalGastos, totalGanhos, saldo } = useMemo(() => {
    let gastos = 0;
    let ganhos = 0;
    for (const t of transactions) {
      const v = Number(t.valor) || 0;
      if (t.tipo === TIPO.GASTO) gastos += v;
      else if (t.tipo === TIPO.RECEITA) ganhos += v;
    }
    return { totalGastos: gastos, totalGanhos: ganhos, saldo: ganhos - gastos };
  }, [transactions]);

  return {
    transactions,
    loading,
    error,
    totalGastos,
    totalGanhos,
    saldo,
    addTransaction,
    updateTransaction,
    removeTransaction,
  };
};
