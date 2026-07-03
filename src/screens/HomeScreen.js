import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import AjudaModal from '../components/AjudaModal';
import BottomSheet, { SheetOption } from '../components/BottomSheet';
import ObraCard from '../components/ObraCard';
import { useObras } from '../hooks/useObras';
import { radius, shadow, spacing, useTheme } from '../theme/theme';
import { formatBRL } from '../utils/currency';
import { PERIODOS, filtrarPorPeriodo } from '../utils/date';
import { exportarParaExcel } from '../utils/export';
import { exportarBackup, lerArquivoBackup } from '../utils/backup';

// Tela inicial — lista de obras com resumo financeiro.
// `transactions` vem do App para calcular os totais por obra.
// `onAbrirObra(obra)` navega para a ObraScreen.
export default function HomeScreen({
  transactions,
  transactionsLoading,
  transactionsError,
  onAbrirObra,
  renameTransactionsCategoria,
  removeTransactionsByCategoria,
  substituirTransacoes,
}) {
  const { colors, mode, toggle } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    obras,
    loading: obrasLoading,
    error: obrasError,
    addObra,
    removeObra,
    renameObra,
    substituirTodas: substituirObras,
  } = useObras();
  const [novaObra, setNovaObra] = useState('');
  const [criando, setCriando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [obraRenomeando, setObraRenomeando] = useState(null);
  const [novoNomeObra, setNovoNomeObra] = useState('');
  const renomearInputRef = useRef(null);

  // Menu de opções (caixa deslizante). etapa: 'principal' → lista de ações;
  // 'periodo' → escolha do período do relatório.
  const [menuVisivel, setMenuVisivel] = useState(false);
  const [menuEtapa, setMenuEtapa] = useState('principal');

  // Menu de ações de uma obra (toque longo no card).
  // etapa: 'acoes' → renomear/excluir; 'excluir' → confirmar exclusão.
  const [obraMenu, setObraMenu] = useState(null);
  const [obraMenuEtapa, setObraMenuEtapa] = useState('acoes');

  const [ajudaVisivel, setAjudaVisivel] = useState(false);

  const loading = obrasLoading || transactionsLoading;
  const erroCarregamento = obrasError || transactionsError;

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

  const nomeJaExiste = (nome, ignorarId) =>
    obras.some(
      (o) => o.id !== ignorarId && o.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    );

  const handleCriarObra = async () => {
    if (!novaObra.trim()) return;
    if (nomeJaExiste(novaObra)) {
      Alert.alert('Nome já existe', 'Já existe uma obra com esse nome.');
      return;
    }
    try {
      await addObra(novaObra);
      setNovaObra('');
      setCriando(false);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível criar a obra.');
    }
  };

  // ─── Menu de opções (exportar / backup) ───
  const abrirMenu = () => {
    setMenuEtapa('principal');
    setMenuVisivel(true);
  };
  const fecharMenu = () => setMenuVisivel(false);

  const irParaEscolhaPeriodo = () => {
    if (obras.length === 0) {
      fecharMenu();
      Alert.alert('Nenhuma obra', 'Crie uma obra antes de exportar o relatório.');
      return;
    }
    setMenuEtapa('periodo');
  };

  const exportarComPeriodo = async (periodo) => {
    fecharMenu();
    try {
      setProcessando(true);
      const transacoesFiltradas = filtrarPorPeriodo(transactions, periodo);
      await exportarParaExcel(obras, transacoesFiltradas);
      Alert.alert('Pronto', 'Planilha gerada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível gerar a planilha.');
    } finally {
      setProcessando(false);
    }
  };

  const handleExportarBackup = async () => {
    fecharMenu();
    try {
      setProcessando(true);
      await exportarBackup();
      Alert.alert('Pronto', 'Cópia de segurança criada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível criar a cópia de segurança.');
    } finally {
      setProcessando(false);
    }
  };

  const handleImportarBackup = () => {
    fecharMenu();
    Alert.alert(
      'Restaurar cópia de segurança',
      'Isso vai substituir TODAS as obras e lançamentos atuais pelos dados do arquivo escolhido. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Substituir tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessando(true);
              const dados = await lerArquivoBackup();
              if (!dados) return;
              await substituirTransacoes(dados.transactions);
              await substituirObras(dados.obras);
              Alert.alert('Pronto', 'Dados restaurados com sucesso!');
            } catch (error) {
              Alert.alert('Erro', error.message || 'Não foi possível restaurar a cópia.');
            } finally {
              setProcessando(false);
            }
          },
        },
      ],
    );
  };

  const handleBuscarAtualizacao = async () => {
    fecharMenu();
    // Só funciona no app instalado (build EAS). No modo de desenvolvimento
    // ou no Expo Go, o expo-updates fica desligado.
    if (__DEV__ || !Updates.isEnabled) {
      Alert.alert(
        'Indisponível aqui',
        'A busca por atualizações só funciona no app instalado no celular.',
      );
      return;
    }
    try {
      setProcessando(true);
      const resultado = await Updates.checkForUpdateAsync();
      if (resultado.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          'Atualização disponível',
          'Uma nova versão foi baixada. O app vai reiniciar para aplicar.',
          [{ text: 'Reiniciar agora', onPress: () => Updates.reloadAsync() }],
        );
      } else {
        Alert.alert('Tudo em dia', 'Você já está usando a versão mais recente.');
      }
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível buscar atualizações. Verifique sua conexão.');
    } finally {
      setProcessando(false);
    }
  };

  // ─── Menu de ações da obra (toque longo) ───
  const handleLongPress = (obra) => {
    setObraMenuEtapa('acoes');
    setObraMenu(obra);
  };
  const fecharObraMenu = () => setObraMenu(null);

  const excluirObra = async (obra, apagarLancamentos) => {
    fecharObraMenu();
    try {
      if (apagarLancamentos) await removeTransactionsByCategoria(obra.nome);
      await removeObra(obra.id);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível excluir a obra.');
    }
  };

  const renomear = async (obra, novoNome) => {
    const nome = novoNome.trim();
    if (!nome) return;
    if (nomeJaExiste(nome, obra.id)) {
      Alert.alert('Nome já existe', 'Já existe uma obra com esse nome.');
      return;
    }
    try {
      await renameTransactionsCategoria(obra.nome, nome);
      await renameObra(obra.id, nome);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível renomear a obra.');
    }
  };

  const promptRenomear = (obra) => {
    fecharObraMenu();
    // Aguarda a caixa deslizante fechar antes de abrir o próximo modal/prompt
    // (evita conflito de dois modais abertos ao mesmo tempo no Android).
    setTimeout(() => {
      if (Platform.OS === 'ios' && Alert.prompt) {
        Alert.prompt('Renomear obra', 'Novo nome:', (novo) => {
          if (novo?.trim()) renomear(obra, novo);
        }, 'plain-text', obra.nome);
      } else {
        setNovoNomeObra(obra.nome);
        setObraRenomeando(obra);
        setTimeout(() => renomearInputRef.current?.focus(), 100);
      }
    }, 300);
  };

  const confirmarRenomear = async () => {
    if (!novoNomeObra.trim() || !obraRenomeando) return;
    await renomear(obraRenomeando, novoNomeObra);
    setObraRenomeando(null);
    setNovoNomeObra('');
  };

  const saldoNegativo = saldoGeral < 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <FlatList
        data={obras}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            {!!erroCarregamento && (
              <View style={styles.erroBanner}>
                <Text style={styles.erroBannerTxt}>⚠️ {erroCarregamento}</Text>
              </View>
            )}

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
                  style={styles.btnTema}
                  onPress={toggle}
                  accessibilityLabel="Alternar modo claro e escuro"
                >
                  <Text style={styles.btnTemaTxt}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSecundario, processando && styles.btnDisabled]}
                  onPress={abrirMenu}
                  disabled={processando}
                >
                  {processando ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={styles.btnSecundarioTxt}>⚙️ Opções</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnNova}
                  onPress={() => setCriando((v) => !v)}
                >
                  <Text style={styles.btnNovaTxt}>{criando ? '✕ Fechar' : '+ Nova obra'}</Text>
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
              <Text style={styles.vazioEmoji}>🏗️</Text>
              <Text style={styles.vazioCabecalho}>Nenhuma obra criada</Text>
              <Text style={styles.vazioSub}>
                Toque em "+ Nova obra" para começar.
              </Text>
            </View>
          )
        }
      />
      </KeyboardAvoidingView>
      )}

      {/* Menu de opções (exportar planilha, backup) */}
      <BottomSheet
        visible={menuVisivel}
        onClose={fecharMenu}
        titulo={menuEtapa === 'periodo' ? 'Período do relatório' : 'Opções'}
        subtitulo={
          menuEtapa === 'periodo'
            ? 'Quais lançamentos incluir na planilha?'
            : undefined
        }
      >
        {menuEtapa === 'principal' ? (
          <>
            <SheetOption
              icone="📊"
              titulo="Exportar planilha"
              descricao="Gera um relatório para abrir no Excel"
              onPress={irParaEscolhaPeriodo}
            />
            <SheetOption
              icone="💾"
              titulo="Salvar cópia de segurança"
              descricao="Guarda todos os dados em um arquivo"
              onPress={handleExportarBackup}
            />
            <SheetOption
              icone="📥"
              titulo="Restaurar cópia de segurança"
              descricao="Recupera os dados de um arquivo salvo"
              onPress={handleImportarBackup}
            />
            <SheetOption
              icone="❓"
              titulo="Como usar o app"
              descricao="Guia rápido para começar"
              onPress={() => {
                fecharMenu();
                setTimeout(() => setAjudaVisivel(true), 300);
              }}
            />
            <SheetOption
              icone="🔄"
              titulo="Buscar atualização"
              descricao="Verifica se há uma versão mais nova"
              onPress={handleBuscarAtualizacao}
            />
          </>
        ) : (
          <>
            <SheetOption icone="📅" titulo="Tudo" descricao="Todos os lançamentos" onPress={() => exportarComPeriodo(PERIODOS.TUDO)} />
            <SheetOption icone="📅" titulo="Este mês" onPress={() => exportarComPeriodo(PERIODOS.ESTE_MES)} />
            <SheetOption icone="📅" titulo="Mês passado" onPress={() => exportarComPeriodo(PERIODOS.MES_PASSADO)} />
            <SheetOption icone="📅" titulo="Últimos 3 meses" onPress={() => exportarComPeriodo(PERIODOS.ULTIMOS_3_MESES)} />
            <TouchableOpacity style={styles.sheetVoltar} onPress={() => setMenuEtapa('principal')}>
              <Text style={styles.sheetVoltarTxt}>← Voltar</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheet>

      {/* Menu de ações da obra (toque longo no card) */}
      <BottomSheet
        visible={!!obraMenu}
        onClose={fecharObraMenu}
        titulo={obraMenu?.nome}
        subtitulo={
          obraMenuEtapa === 'excluir'
            ? 'Tem certeza? Escolha o que fazer com os lançamentos desta obra.'
            : 'O que deseja fazer?'
        }
      >
        {obraMenuEtapa === 'acoes' ? (
          <>
            <SheetOption
              icone="✏️"
              titulo="Renomear obra"
              onPress={() => obraMenu && promptRenomear(obraMenu)}
            />
            <SheetOption
              icone="🗑️"
              titulo="Excluir obra"
              destrutivo
              onPress={() => setObraMenuEtapa('excluir')}
            />
          </>
        ) : (
          <>
            <SheetOption
              icone="📂"
              titulo="Excluir só a obra"
              descricao="Mantém os lançamentos no histórico"
              onPress={() => obraMenu && excluirObra(obraMenu, false)}
            />
            <SheetOption
              icone="🗑️"
              titulo="Excluir obra e lançamentos"
              descricao="Apaga tudo desta obra, sem volta"
              destrutivo
              onPress={() => obraMenu && excluirObra(obraMenu, true)}
            />
            <TouchableOpacity style={styles.sheetVoltar} onPress={() => setObraMenuEtapa('acoes')}>
              <Text style={styles.sheetVoltarTxt}>← Voltar</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheet>

      {/* Modal de renomear (Android — Alert.prompt não existe) */}
      <Modal
        visible={!!obraRenomeando}
        transparent
        animationType="fade"
        onRequestClose={() => setObraRenomeando(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitulo}>Renomear obra</Text>
            <Text style={styles.modalSub}>Nome atual: {obraRenomeando?.nome}</Text>
            <TextInput
              ref={renomearInputRef}
              style={styles.modalInput}
              value={novoNomeObra}
              onChangeText={setNovoNomeObra}
              placeholder="Novo nome"
              placeholderTextColor={colors.textFaint}
              onSubmitEditing={confirmarRenomear}
              returnKeyType="done"
            />
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={() => setObraRenomeando(null)}
              >
                <Text style={styles.modalBtnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirmar}
                onPress={confirmarRenomear}
              >
                <Text style={styles.modalBtnConfirmarTxt}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AjudaModal visible={ajudaVisivel} onClose={() => setAjudaVisivel(false)} />
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  btnTema: {
    backgroundColor: colors.inputBg,
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTemaTxt: { fontSize: 18 },
  flex: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  erroBanner: {
    backgroundColor: colors.expenseBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  erroBannerTxt: { color: colors.expense, fontWeight: '600', fontSize: 13 },
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
  btnSecundario: {
    backgroundColor: colors.primaryBg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnSecundarioTxt: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  btnNova: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnNovaTxt: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sheetVoltar: {
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  sheetVoltarTxt: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
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
  vazioEmoji: { fontSize: 48, marginBottom: spacing.md },
  vazioCabecalho: { fontSize: 16, fontWeight: 'bold', color: colors.textMuted, marginBottom: spacing.sm },
  vazioSub: { color: colors.textFaint, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...shadow,
  },
  modalTitulo: { fontSize: 17, fontWeight: 'bold', color: colors.text, marginBottom: spacing.xs },
  modalSub: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.inputBg,
    padding: spacing.md,
    borderRadius: radius.sm,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  modalBtnCancelar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  modalBtnCancelarTxt: { color: colors.textMuted, fontWeight: '600', fontSize: 15 },
  modalBtnConfirmar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  modalBtnConfirmarTxt: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
