import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTransactions } from './src/hooks/useTransactions';
import { ThemeProvider } from './src/theme/theme';
import HomeScreen from './src/screens/HomeScreen';
import ObraScreen from './src/screens/ObraScreen';

export default function App() {
  const {
    transactions,
    loading,
    error,
    addTransaction,
    updateTransaction,
    removeTransaction,
    renameCategoria,
    removeByCategoria,
    substituirTodas: substituirTransacoes,
  } = useTransactions();

  // Navegação: null = HomeScreen, { id, nome } = ObraScreen
  const [obraAberta, setObraAberta] = useState(null);

  return (
    <ThemeProvider>
    <SafeAreaProvider>
      {obraAberta ? (
        <ObraScreen
          obra={obraAberta}
          transactions={transactions}
          loading={loading}
          addTransaction={addTransaction}
          updateTransaction={updateTransaction}
          removeTransaction={removeTransaction}
          onVoltar={() => setObraAberta(null)}
        />
      ) : (
        <HomeScreen
          transactions={transactions}
          transactionsLoading={loading}
          transactionsError={error}
          renameTransactionsCategoria={renameCategoria}
          removeTransactionsByCategoria={removeByCategoria}
          substituirTransacoes={substituirTransacoes}
          onAbrirObra={(obra) => setObraAberta(obra)}
        />
      )}
    </SafeAreaProvider>
    </ThemeProvider>
  );
}
