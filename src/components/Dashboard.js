import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, tabular, type, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';

// Painel de resumo financeiro. Componente puro de apresentação, usado tanto na
// HomeScreen (totais de todas as obras) quanto na ObraScreen (uma obra só).
//
// O saldo é a resposta que o usuário abre o app para ver, então ele é o número
// grande no topo. Gastos e vendas ficam abaixo, como decomposição, separados
// por uma linha em vez de caixas coloridas.
export default function Dashboard({
  totalGastos,
  totalGanhos,
  saldo,
  labelSaldo = 'Saldo disponível',
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const corSaldo = saldo < 0 ? colors.expense : colors.income;

  return (
    <View style={styles.painel}>
      <Text style={styles.saldoLabel}>{labelSaldo}</Text>
      <Text style={[styles.saldoValor, { color: corSaldo }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatBRL(saldo)}
      </Text>

      <View style={styles.divisor} />

      <View style={styles.linha}>
        <View style={styles.coluna}>
          <Text style={styles.colunaLabel}>Gastos</Text>
          <Text style={[styles.colunaValor, { color: colors.expense }]} numberOfLines={1}>
            {formatBRL(totalGastos)}
          </Text>
        </View>

        <View style={styles.separadorVertical} />

        <View style={styles.coluna}>
          <Text style={styles.colunaLabel}>Vendas na planta</Text>
          <Text style={[styles.colunaValor, { color: colors.income }]} numberOfLines={1}>
            {formatBRL(totalGanhos)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  painel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  saldoLabel: { ...type.meta, color: colors.textMuted },
  saldoValor: { ...type.display, ...tabular, marginTop: spacing.xs },
  divisor: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  linha: { flexDirection: 'row', alignItems: 'stretch' },
  coluna: { flex: 1 },
  separadorVertical: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  colunaLabel: { ...type.micro, color: colors.textMuted },
  colunaValor: { ...type.valor, ...tabular, marginTop: 2 },
});
