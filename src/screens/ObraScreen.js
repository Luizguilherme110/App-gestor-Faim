import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dashboard from '../components/Dashboard';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { colors, spacing } from '../theme/theme';

// Tela dedicada para uma obra específica.
// Recebe transactions e CRUD via props (estado compartilhado com App.js),
// evitando que adições aqui não reflitam na HomeScreen.
export default function ObraScreen({
  obra,
  transactions,
  loading,
  addTransaction,
  updateTransaction,
  removeTransaction,
  onVoltar,
}) {

  const [editing, setEditing] = useState(null);
  const listRef = useRef(null);

  // Filtra apenas as transações desta obra
  const visiveis = useMemo(
    () => transactions.filter((t) => t.categoria === obra.nome),
    [transactions, obra.nome],
  );

  // Totais da obra específica
  const { totalGastos, totalGanhos, saldo } = useMemo(() => {
    let g = 0, r = 0;
    for (const t of visiveis) {
      const v = Number(t.valor) || 0;
      if (t.tipo === 'GASTO') g += v;
      else r += v;
    }
    return { totalGastos: g, totalGanhos: r, saldo: r - g };
  }, [visiveis]);

  const handleEdit = (item) => {
    setEditing(item);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const header = (
    <View>
      <Dashboard totalGastos={totalGastos} totalGanhos={totalGanhos} saldo={saldo} />
      <TransactionForm
        editing={editing}
        obraFixa={obra.nome}
        onSubmit={addTransaction}
        onUpdate={updateTransaction}
        onCancelEdit={() => setEditing(null)}
      />
      <Text style={styles.historicoTitle}>Movimentações — {obra.nome}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Barra de navegação de volta */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.btnVoltar} onPress={onVoltar}>
          <Text style={styles.btnVoltarTxt}>← Obras</Text>
        </TouchableOpacity>
        <Text style={styles.navTitulo} numberOfLines={1}>{obra.nome}</Text>
        <View style={styles.navSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <TransactionList
            ref={listRef}
            transactions={visiveis}
            onRemove={removeTransaction}
            onEdit={handleEdit}
            ListHeaderComponent={header}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, paddingHorizontal: spacing.lg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  btnVoltar: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minWidth: 80,
    justifyContent: 'center',
    marginLeft: -spacing.lg,
  },
  btnVoltarTxt: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  navTitulo: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.text,
  },
  navSpacer: { width: 60 }, // balanceia o botão de voltar
  historicoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
