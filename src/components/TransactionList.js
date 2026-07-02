import React, { forwardRef, useCallback } from 'react';
import { Alert, FlatList, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme/theme';
import { formatBRL } from '../utils/currency';
import TransactionItem from './TransactionItem';

// Lista de histórico. Confirma antes de excluir e delega a remoção ao pai.
// forwardRef expõe o FlatList (usado pelo App para rolar ao topo ao editar).
const TransactionList = forwardRef(function TransactionList(
  { transactions, onRemove, onEdit, ListHeaderComponent },
  ref,
) {
  const confirmarExclusao = useCallback(
    (item) => {
      Alert.alert(
        'Excluir registro',
        `Remover "${item.categoria}" (${formatBRL(item.valor)})?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => onRemove(item.id),
          },
        ],
      );
    },
    [onRemove],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TransactionItem item={item} onEdit={onEdit} onDelete={confirmarExclusao} />
    ),
    [onEdit, confirmarExclusao],
  );

  return (
    <FlatList
      ref={ref}
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <Text style={styles.empty}>Nenhum registro feito ainda.</Text>
      }
    />
  );
});

export default TransactionList;

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl },
  empty: {
    textAlign: 'center',
    color: colors.textFaint,
    marginTop: spacing.xl,
  },
});
