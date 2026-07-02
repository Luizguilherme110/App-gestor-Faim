import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@gestao_obras_dados';
const OBRAS_KEY = '@gestao_obras_projetos';

// Camada isolada de persistência. Concentrar o AsyncStorage aqui facilita
// trocar por SQLite/backend futuramente sem tocar na UI.

// ========== TRANSAÇÕES ==========

export const loadTransactions = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
    return [];
  }
};

export const saveTransactions = async (transactions) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error('Erro ao salvar transações:', error);
    throw new Error('Não foi possível salvar os dados.');
  }
};

/**
 * Remove todas as transações de uma obra específica
 * @param {string} nomObra - Nome da obra
 * @returns {Promise<void>}
 */
export const deleteTransactionsByObra = async (nomeObra) => {
  try {
    const transactions = await loadTransactions();
    const filtradas = transactions.filter((t) => t.categoria !== nomeObra);
    await saveTransactions(filtradas);
  } catch (error) {
    console.error('Erro ao deletar transações da obra:', error);
    throw error;
  }
};

// ========== OBRAS (PROJETOS) ==========

export const loadObras = async () => {
  try {
    const raw = await AsyncStorage.getItem(OBRAS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao carregar obras:', error);
    return [];
  }
};

export const saveObras = async (obras) => {
  try {
    await AsyncStorage.setItem(OBRAS_KEY, JSON.stringify(obras));
    return true;
  } catch (error) {
    console.error('Erro ao salvar obras:', error);
    throw new Error('Não foi possível salvar os dados.');
  }
};

/**
 * Força a sincronização de todos os dados com o storage
 * Útil para garantir que tudo está persistido
 */
export const forceSyncAllData = async () => {
  try {
    const transactions = await loadTransactions();
    const obras = await loadObras();
    await saveTransactions(transactions);
    await saveObras(obras);
    return { transactions, obras };
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    throw error;
  }
};
