import React, { forwardRef, useCallback, useMemo } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { spacing, type, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';
import TransactionItem from './TransactionItem';

// Lista de histórico. Confirma antes de excluir e delega a remoção ao pai.
// forwardRef expõe o FlatList (usado pelo App para rolar ao topo ao editar).
const TransactionList = forwardRef(function TransactionList(
  { transactions, onRemove, onEdit, ListHeaderComponent },
  ref,
) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const confirmarExclusao = useCallback(
    (item) => {
      Alert.alert(
        'Excluir registro',
        `Remover "${item.observacao?.trim() || item.categoria}" (${formatBRL(item.valor)})?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: async () => {
              try {
                await onRemove(item.id);
              } catch (e) {
                Alert.alert('Erro', 'Não foi possível excluir o registro.');
              }
            },
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
      initialNumToRender={20}
      maxToRenderPerBatch={20}
      windowSize={7}
      ListEmptyComponent={
        <View style={styles.vazio}>
          <Icon name="file-text" size={26} color={colors.textFaint} />
          <Text style={styles.vazioTitulo}>Nenhum lançamento ainda</Text>
          <Text style={styles.vazioSub}>
            Use o formulário acima para registrar o primeiro gasto ou venda.
          </Text>
        </View>
      }
    />
  );
});

export default TransactionList;

const makeStyles = (colors) => StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  vazio: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  vazioTitulo: { ...type.corpoForte, color: colors.text },
  vazioSub: { ...type.meta, color: colors.textMuted, textAlign: 'center' },
});
