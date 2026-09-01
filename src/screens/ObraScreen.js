import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Icon from '../components/Icon';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import BottomSheet, { SheetOption } from '../components/BottomSheet';
import { radius, spacing, type, useTheme } from '../theme/theme';
import { filtrarPorMes, mesesDisponiveis } from '../utils/date';
import { exportarObraCSV, exportarObraPDF } from '../utils/exportObra';

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
  const { colors, mode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [editing, setEditing] = useState(null);
  const [exportMenu, setExportMenu] = useState(false);
  const [mesMenu, setMesMenu] = useState(false);
  const [exportando, setExportando] = useState(false);
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

  // Meses que têm lançamento nesta obra, do mais recente para o mais antigo.
  const meses = useMemo(() => mesesDisponiveis(visiveis), [visiveis]);

  const handleEdit = (item) => {
    setEditing(item);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ─── Exportação (apenas desta obra) ───
  const semMovimentacoes = () => {
    if (visiveis.length === 0) {
      Alert.alert('Nada para exportar', 'Esta obra ainda não tem movimentações.');
      return true;
    }
    return false;
  };

  const exportar = async (formato, fn) => {
    try {
      setExportando(true);
      await fn();
    } catch (error) {
      Alert.alert('Erro', error.message || `Não foi possível exportar em ${formato}.`);
    } finally {
      setExportando(false);
    }
  };

  // Excel passa por uma segunda pergunta: o cliente confere as contas mês a
  // mês, como um extrato de banco, então a planilha sai de um mês só.
  //
  // Fechar uma caixa deslizante e abrir outra no mesmo instante deixa dois
  // Modal montados ao mesmo tempo, o que trava a segunda no Android. Daí a
  // espera antes de abrir o seletor de mês.
  const abrirSeletorMes = () => {
    setExportMenu(false);
    if (semMovimentacoes()) return;
    setTimeout(() => setMesMenu(true), 300);
  };

  const exportarExcelDoMes = (periodo) => {
    setMesMenu(false);
    const lista = periodo ? filtrarPorMes(visiveis, periodo.chave) : visiveis;
    exportar('Excel', () => exportarObraCSV(obra, lista, periodo));
  };

  const exportarPDF = () => {
    setExportMenu(false);
    if (semMovimentacoes()) return;
    exportar('PDF', () => exportarObraPDF(obra, visiveis));
  };

  const header = (
    <View>
      <Dashboard
        totalGastos={totalGastos}
        totalGanhos={totalGanhos}
        saldo={saldo}
        labelSaldo="Saldo desta obra"
      />
      <TransactionForm
        editing={editing}
        obraFixa={obra.nome}
        onSubmit={addTransaction}
        onUpdate={updateTransaction}
        onCancelEdit={() => setEditing(null)}
      />
      <View style={styles.historicoRow}>
        {/* O nome da obra já está na barra de navegação — repetir aqui só
            encurtaria o espaço do título sem informar nada. */}
        <Text style={styles.historicoTitle}>Movimentações</Text>
        <TouchableOpacity
          style={[styles.btnExportar, exportando && styles.btnDisabled]}
          onPress={() => setExportMenu(true)}
          disabled={exportando}
          activeOpacity={0.7}
        >
          {exportando ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <Icon name="share" size={15} color={colors.primary} />
              <Text style={styles.btnExportarTxt}>Exportar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Barra de navegação de volta */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.btnVoltar}
          onPress={onVoltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a lista de obras"
        >
          <Icon name="chevron-left" size={20} color={colors.primary} />
          <Text style={styles.btnVoltarTxt}>Obras</Text>
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

      {/* Menu de exportação desta obra */}
      <BottomSheet
        visible={exportMenu}
        onClose={() => setExportMenu(false)}
        titulo="Exportar movimentações"
        subtitulo={obra.nome}
      >
        <SheetOption
          icone="grid"
          titulo="Planilha do Excel"
          descricao="Você escolhe o mês na próxima tela"
          onPress={abrirSeletorMes}
        />
        <SheetOption
          icone="file-text"
          titulo="PDF"
          descricao="Documento com todas as movimentações"
          onPress={exportarPDF}
        />
      </BottomSheet>

      {/* Seletor de mês da planilha */}
      <BottomSheet
        visible={mesMenu}
        onClose={() => setMesMenu(false)}
        titulo="Qual período?"
        subtitulo="A planilha sai só com os lançamentos do mês escolhido."
      >
        <SheetOption
          icone="layers"
          titulo="Tudo"
          descricao={`Todos os ${visiveis.length} lançamentos desta obra`}
          onPress={() => exportarExcelDoMes(null)}
        />
        {meses.map((mes) => (
          <SheetOption
            key={mes.chave}
            icone="calendar"
            titulo={mes.rotulo}
            descricao={mes.total === 1 ? '1 lançamento' : `${mes.total} lançamentos`}
            onPress={() => exportarExcelDoMes(mes)}
          />
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, paddingHorizontal: spacing.lg },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  btnVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    minWidth: 84,
  },
  btnVoltarTxt: { ...type.corpoForte, color: colors.primary },
  navTitulo: { ...type.corpoForte, flex: 1, textAlign: 'center', color: colors.textStrong },
  navSpacer: { width: 84 }, // balanceia o botão de voltar
  historicoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  historicoTitle: { ...type.titulo, flex: 1, color: colors.textStrong },
  btnExportar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: 40,
  },
  btnDisabled: { opacity: 0.6 },
  btnExportarTxt: { ...type.meta, fontWeight: '700', color: colors.primary },
});
