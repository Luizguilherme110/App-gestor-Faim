import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TIPO } from '../hooks/useTransactions';
import { spacing, tabular, type, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';
import { formatDate } from '../utils/date';

// Linha do extrato.
//  - toque curto  → editar (onEdit)
//  - toque longo  → excluir (onDelete)
//
// Cada lançamento era um card com sombra e barra colorida à esquerda. Numa
// lista longa isso vira ruído, então virou linha com divisor: o que distingue
// uma linha da outra é a anotação e o valor, não a moldura.
//
// Dentro de uma obra, `categoria` é sempre o nome da própria obra — repetir
// isso em toda linha não informa nada. Por isso a anotação vem primeiro, e a
// categoria só aparece como reserva quando não há anotação.
function TransactionItem({ item, onEdit, onDelete }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const ehGasto = item.tipo === TIPO.GASTO;
  const cor = ehGasto ? colors.expense : colors.income;

  // Compatível com registros antigos (que salvavam `data` como string pt-BR).
  const dataExibida = item.createdAt ? formatDate(item.createdAt) : item.data || '';
  const titulo = item.observacao?.trim() || item.categoria || 'Sem descrição';

  return (
    <TouchableOpacity
      style={styles.linha}
      onPress={() => onEdit(item)}
      onLongPress={() => onDelete(item)}
      delayLongPress={500}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityHint="Toque para editar. Toque longo para excluir."
    >
      <View style={styles.info}>
        <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>
        {!!dataExibida && <Text style={styles.data}>{dataExibida}</Text>}
      </View>
      <Text style={[styles.valor, { color: cor }]}>
        {ehGasto ? '-' : '+'} {formatBRL(item.valor)}
      </Text>
    </TouchableOpacity>
  );
}

// Memoizado: cada item só re-renderiza se seus próprios dados mudarem.
export default React.memo(TransactionItem);

const makeStyles = (colors) => StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  info: { flex: 1 },
  titulo: { ...type.corpoForte, color: colors.textStrong },
  data: { ...type.meta, color: colors.textMuted, marginTop: 2 },
  valor: { ...type.corpoForte, ...tabular, fontWeight: '700' },
});
