import React, { useState } from 'react';
import { useTransactions } from './src/hooks/useTransactions';
import HomeScreen from './src/screens/HomeScreen';
import ObraScreen from './src/screens/ObraScreen';

export default function App() {
  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    removeTransaction,
  } = useTransactions();

  // Navegação: null = HomeScreen, { id, nome } = ObraScreen
  const [obraAberta, setObraAberta] = useState(null);

  if (obraAberta) {
    return (
      <ObraScreen
        obra={obraAberta}
        transactions={transactions}
        loading={loading}
        addTransaction={addTransaction}
        updateTransaction={updateTransaction}
        removeTransaction={removeTransaction}
        onVoltar={() => setObraAberta(null)}
      />
    );
  }

  return (
    <HomeScreen
      transactions={transactions}
      onAbrirObra={(obra) => setObraAberta(obra)}
    />
  );
}
