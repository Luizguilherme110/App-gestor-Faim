import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  ActivityIndicator,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ObraCard from '../components/ObraCard';
import { useObras } from '../hooks/useObras';
import { colors, radius, shadow, spacing } from '../theme/theme';
import { formatBRL } from '../utils/currency';
import { exportarParaExcel } from '../utils/export';

// Tela inicial — lista de obras com resumo financeiro.
// `transactions` vem do App para calcular os totais por obra.
// `onAbrirObra(obra)` navega para a ObraScreen.
export default function HomeScreen({ transactions, onAbrirObra }) {
  const { obras, loading, addObra, removeObra, renameObra } = useObras();
  const [novaObra, setNovaObra] = useState('');
  const [criando, setCriando] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Totais globais de todas as obras
  const { totalGastos, totalGanhos, saldoGeral } = useMemo(() => {
    let g = 0, r = 0;
    for (const t of transactions) {
      const v = Number(t.valor) || 0;
      if (t.tipo === 'GASTO') g += v;
      else r += v;
    }
    return { totalGastos: g, totalGanhos: r, saldoGeral: r - g };
  }, [transactions]);

  // Totais por obra (agrupa transações pelo nome da obra)
  const totaisPorObra = useMemo(() => {
    const mapa = {};
    for (const t of transactions) {
      const nome = t.categoria || '';
      if (!mapa[nome]) mapa[nome] = { gastos: 0, ganhos: 0 };
      const v = Number(t.valor) || 0;
      if (t.tipo === 'GASTO') mapa[nome].gastos += v;
      else mapa[nome].ganhos += v;
    }
    return mapa;
  }, [transactions]);

  const handleCriarObra = async () => {
    if (!novaObra.trim()) return;
    await addObra(novaObra);
    setNovaObra('');
    setCriando(false);
  };

  const handleExportar = async () => {
    try {
      setExportando(true);
      await exportarParaExcel(obras, transactions);
      Alert.alert('Sucesso', 'Planilha exportada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível exportar a planilha.');
    } finally {
      setExportando(false);
    }
  };

  const handleLongPress = (obra) => {
    const opcoes = ['Renomear', 'Excluir obra', 'Cancelar'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opcoes, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (i) => { if (i === 0) promptRenomear(obra); if (i === 1) confirmarExcluir(obra); },
      );
    } else {
      Alert.alert(obra.nome, 'O que deseja fazer?', [
        { text: 'Renomear', onPress: () => promptRenomear(obra) },
        { text: 'Excluir obra', style: 'destructive', onPress: () => confirmarExcluir(obra) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const promptRenomear = (obra) => {
    Alert.prompt
      ? Alert.prompt('Renomear obra', 'Novo nome:', (novo) => {
          if (novo?.trim()) renameObra(obra.id, novo);
        }, 'plain-text', obra.nome)
      : Alert.alert('Renomear', 'Use o campo de nova obra para criar um substituto.');
  };

  const confirmarExcluir = (obra) => {
    Alert.alert(
      '⚠️ Excluir obra',
      `Tem certeza que quer remover "${obra.nome}"?\n\nEscolha se deseja manter ou deletar os lançamentos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Deletar (mantendo transações)', 
          onPress: () => removeObra(obra.id, false)
        },
        { 
          text: 'Deletar tudo', 
          style: 'destructive', 
          onPress: () => removeObra(obra.id, true),
        },
      ],
    );
  };

  const saldoNegativo = saldoGeral < 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={obras}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* Resumo geral */}
            <View style={styles.resumo}>
              <Text style={styles.resumoTitulo}>Gestão de Obras & Vendas</Text>
              <View style={styles.resumoRow}>
                <View style={[styles.resumoCard, { backgroundColor: colors.expenseBg }]}>
                  <Text style={styles.resumoLabel}>Total Gastos</Text>
                  <Text style={[styles.resumoValor, { color: colors.expense }]}>
                    {formatBRL(totalGastos)}
                  </Text>
                </View>
                <View style={[styles.resumoCard, { backgroundColor: colors.incomeBg }]}>
                  <Text style={styles.resumoLabel}>Total Receitas</Text>
                  <Text style={[styles.resumoValor, { color: colors.income }]}>
                    {formatBRL(totalGanhos)}
                  </Text>
                </View>
              </View>
              <Text style={styles.saldoGeral}>
                Saldo Geral:{' '}
                <Text style={{ color: saldoNegativo ? colors.expense : colors.income }}>
                  {formatBRL(saldoGeral)}
                </Text>
              </Text>
            </View>

            {/* Cabeçalho da lista de obras */}
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Minhas Obras</Text>
              <View style={styles.botoesHeader}>
                <TouchableOpacity
                  style={[styles.btnExportar, exportando && styles.btnExportarDisabled]}
                  onPress={handleExportar}
                  disabled={exportando || obras.length === 0}
                >
                  {exportando ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.btnExportarTxt}>📊 Exportar</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnNova}
                  onPress={() => setCriando((v) => !v)}
                >
                  <Text style={styles.btnNovaTxt}>{criando ? '✕' : '+ Nova'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Campo para criar nova obra */}
            {criando && (
              <View style={styles.novaObraRow}>
                <TextInput
                  style={styles.novaObraInput}
                  placeholder="Nome da obra (ex: Edifício Alpha)"
                  placeholderTextColor={colors.textFaint}
                  value={novaObra}
                  onChangeText={setNovaObra}
                  autoFocus
                  onSubmitEditing={handleCriarObra}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.btnCriar, !novaObra.trim() && styles.btnCriarDisabled]}
                  onPress={handleCriarObra}
                  disabled={!novaObra.trim()}
                >
                  <Text style={styles.btnCriarTxt}>Criar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
        renderItem={({ item: obra }) => {
          const totais = totaisPorObra[obra.nome] || { gastos: 0, ganhos: 0 };
          return (
            <ObraCard
              obra={obra}
              gastos={totais.gastos}
              ganhos={totais.ganhos}
              saldo={totais.ganhos - totais.gastos}
              onPress={() => onAbrirObra(obra)}
              onLongPress={() => handleLongPress(obra)}
            />
          );
        }}
        ListEmptyComponent={
          !loading && (
            <View style={styles.vazio}>
              <Text style={styles.vazioCabecalho}>Nenhuma obra criada</Text>
              <Text style={styles.vazioSub}>
                Toque em "+ Nova Obra" para começar.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.lg },
  resumo: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    ...shadow,
  },
  resumoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resumoRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  resumoCard: { flex: 1, padding: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  resumoLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  resumoValor: { fontSize: 15, fontWeight: 'bold', marginTop: 2 },
  saldoGeral: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  secaoTitulo: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  botoesHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  btnExportar: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnExportarDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  btnExportarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  btnNova: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  btnNovaTxt: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  novaObraRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  novaObraInput: {
    flex: 1,
    backgroundColor: colors.inputBg,
    padding: spacing.md,
    borderRadius: radius.sm,
    fontSize: 15,
    color: colors.text,
  },
  btnCriar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  btnCriarDisabled: { backgroundColor: colors.border },
  btnCriarTxt: { color: '#fff', fontWeight: 'bold' },
  vazio: { alignItems: 'center', marginTop: 48 },
  vazioCabecalho: { fontSize: 16, fontWeight: 'bold', color: colors.textMuted, marginBottom: spacing.sm },
  vazioSub: { color: colors.textFaint, textAlign: 'center' },
});
