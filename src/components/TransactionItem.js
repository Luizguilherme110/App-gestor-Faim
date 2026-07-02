import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TIPO } from '../hooks/useTransactions';
import { colors, radius, spacing } from '../theme/theme';
import { formatBRL } from '../utils/currency';
import { formatDate } from '../utils/date';

// Item da lista.
//  - toque curto  → editar (onEdit)
//  - toque longo  → excluir (onDelete)
function TransactionItem({ item, onEdit, onDelete }) {
  const ehGasto = item.tipo === TIPO.GASTO;
  const cor = ehGasto ? colors.expense : colors.income;

  // Compatível com registros antigos (que salvavam `data` como string pt-BR).
  const dataExibida = item.createdAt ? formatDate(item.createdAt) : item.data || '';

  return (
    <TouchableOpacity
      style={[styles.item, { borderLeftColor: cor }]}
      onPress={() => onEdit(item)}
      onLongPress={() => onDelete(item)}
      delayLongPress={350}
    >
      <View style={styles.info}>
        <Text style={styles.categoria}>{item.categoria}</Text>
        {(dataExibida || item.observacao) && (
          <Text style={styles.data} numberOfLines={2}>
            {dataExibida}
            {item.observacao ? ` — ${item.observacao}` : ''}
          </Text>
        )}
      </View>
      <Text style={[styles.valor, { color: cor }]}>
        {ehGasto ? '- ' : '+ '}
        {formatBRL(item.valor)}
      </Text>
    </TouchableOpacity>
  );
}

// Memoizado: cada item só re-renderiza se seus próprios dados mudarem.
export default React.memo(TransactionItem);

const styles = StyleSheet.create({
  item: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  info: { flex: 1, paddingRight: spacing.sm },
  categoria: { fontSize: 15, fontWeight: '600', color: colors.text },
  data: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  valor: { fontSize: 15, fontWeight: 'bold' },
});
