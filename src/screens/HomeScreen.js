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
import Dashboard from '../components/Dashboard';
import Icon from '../components/Icon';
import ObraCard from '../components/ObraCard';
import { useObras } from '../hooks/useObras';
import { radius, spacing, type, useTheme } from '../theme/theme';
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

  // Menu de opções (caixa deslizante) — backup, ajuda, atualização.
  const [menuVisivel, setMenuVisivel] = useState(false);

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

  // ─── Menu de opções (backup / ajuda / atualização) ───
  const abrirMenu = () => setMenuVisivel(true);
  const fecharMenu = () => setMenuVisivel(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Cabeçalho do app: identidade à esquerda, ações à direita, uma linha só. */}
      <View style={styles.appbar}>
        <Text style={styles.appTitulo}>Gestor de Obras</Text>
        <View style={styles.appbarAcoes}>
          <TouchableOpacity
            style={styles.btnIcone}
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel="Alternar modo claro e escuro"
          >
            <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={19} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnIcone, processando && styles.btnDisabled]}
            onPress={abrirMenu}
            disabled={processando}
            accessibilityRole="button"
            accessibilityLabel="Abrir opções"
          >
            {processando ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon name="settings" size={19} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

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
                <Icon name="alert-triangle" size={16} color={colors.expense} />
                <Text style={styles.erroBannerTxt}>{erroCarregamento}</Text>
              </View>
            )}

            <Dashboard
              totalGastos={totalGastos}
              totalGanhos={totalGanhos}
              saldo={saldoGeral}
              labelSaldo="Saldo geral"
            />

            {/* Cabeçalho da lista de obras */}
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>Minhas obras</Text>
              <TouchableOpacity
                style={styles.btnNova}
                onPress={() => setCriando((v) => !v)}
                activeOpacity={0.8}
              >
                <Icon
                  name={criando ? 'x' : 'plus'}
                  size={16}
                  color={colors.onPrimary}
                />
                <Text style={styles.btnNovaTxt}>{criando ? 'Fechar' : 'Nova obra'}</Text>
              </TouchableOpacity>
            </View>

            {/* Campo para criar nova obra */}
            {criando && (
              <View style={styles.novaObraRow}>
                <TextInput
                  style={styles.novaObraInput}
                  placeholder="Ex: Edifício Alpha"
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
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnCriarTxt}>Criar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* A dica de toque longo vive aqui, uma vez, em vez de repetida
                dentro de cada card da lista. */}
            {obras.length > 0 && (
              <Text style={styles.dica}>Segure um card para renomear ou excluir a obra.</Text>
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
              <Icon name="layers" size={28} color={colors.textFaint} />
              <Text style={styles.vazioCabecalho}>Nenhuma obra criada</Text>
              <Text style={styles.vazioSub}>
                Toque em "Nova obra" para começar a registrar gastos e vendas.
              </Text>
            </View>
          )
        }
      />
      </KeyboardAvoidingView>
      )}

      {/* Menu de opções (backup, ajuda, atualização) */}
      <BottomSheet
        visible={menuVisivel}
        onClose={fecharMenu}
        titulo="Opções"
      >
        <SheetOption
          icone="hard-drive"
          titulo="Salvar cópia de segurança"
          descricao="Guarda todos os dados em um arquivo"
          onPress={handleExportarBackup}
        />
        <SheetOption
          icone="download"
          titulo="Restaurar cópia de segurança"
          descricao="Recupera os dados de um arquivo salvo"
          onPress={handleImportarBackup}
        />
        <SheetOption
          icone="help-circle"
          titulo="Como usar o app"
          descricao="Guia rápido para começar"
          onPress={() => {
            fecharMenu();
            setTimeout(() => setAjudaVisivel(true), 300);
          }}
        />
        <SheetOption
          icone="refresh-cw"
          titulo="Buscar atualização"
          descricao="Verifica se há uma versão mais nova"
          onPress={handleBuscarAtualizacao}
        />
      </BottomSheet>

      {/* Menu de ações da obra (toque longo no card) */}
      <BottomSheet
        visible={!!obraMenu}
        onClose={fecharObraMenu}
        titulo={obraMenu?.nome}
        subtitulo={
          obraMenuEtapa === 'excluir'
            ? 'Escolha o que fazer com os lançamentos desta obra.'
            : 'O que deseja fazer?'
        }
      >
        {obraMenuEtapa === 'acoes' ? (
          <>
            <SheetOption
              icone="edit-3"
              titulo="Renomear obra"
              onPress={() => obraMenu && promptRenomear(obraMenu)}
            />
            <SheetOption
              icone="trash-2"
              titulo="Excluir obra"
              destrutivo
              onPress={() => setObraMenuEtapa('excluir')}
            />
          </>
        ) : (
          <>
            <SheetOption
              icone="folder"
              titulo="Excluir só a obra"
              descricao="Mantém os lançamentos no histórico"
              onPress={() => obraMenu && excluirObra(obraMenu, false)}
            />
            <SheetOption
              icone="trash-2"
              titulo="Excluir obra e lançamentos"
              descricao="Apaga tudo desta obra, sem volta"
              destrutivo
              onPress={() => obraMenu && excluirObra(obraMenu, true)}
            />
            <TouchableOpacity style={styles.sheetVoltar} onPress={() => setObraMenuEtapa('acoes')}>
              <Icon name="chevron-left" size={16} color={colors.textMuted} />
              <Text style={styles.sheetVoltarTxt}>Voltar</Text>
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
                activeOpacity={0.8}
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
  flex: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  appTitulo: { ...type.titulo, fontSize: 19, color: colors.textStrong, flex: 1 },
  appbarAcoes: { flexDirection: 'row', gap: spacing.xs },
  btnIcone: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },

  erroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.expenseBg,
    borderWidth: 1,
    borderColor: colors.expense,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  erroBannerTxt: { ...type.meta, flex: 1, color: colors.expense, fontWeight: '600' },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },

  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  secaoTitulo: { ...type.titulo, color: colors.textStrong, flex: 1 },
  btnNova: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    minHeight: 42,
  },
  btnNovaTxt: { ...type.meta, fontWeight: '700', color: colors.onPrimary },

  novaObraRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  novaObraInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
  },
  btnCriar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 48,
  },
  btnCriarDisabled: { backgroundColor: colors.borderStrong },
  btnCriarTxt: { ...type.corpoForte, fontWeight: '700', color: colors.onPrimary },

  dica: { ...type.micro, color: colors.textFaint, marginBottom: spacing.md },

  sheetVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    minHeight: 48,
  },
  sheetVoltarTxt: { ...type.corpoForte, color: colors.textMuted },

  vazio: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  vazioCabecalho: { ...type.corpoForte, color: colors.text },
  vazioSub: { ...type.meta, color: colors.textMuted, textAlign: 'center' },

  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  modalTitulo: { ...type.titulo, color: colors.textStrong },
  modalSub: { ...type.meta, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  modalInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    fontSize: 16,
    color: colors.text,
    minHeight: 48,
    marginBottom: spacing.lg,
  },
  modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  modalBtnCancelar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 44,
  },
  modalBtnCancelarTxt: { ...type.corpoForte, color: colors.textMuted },
  modalBtnConfirmar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    minHeight: 44,
  },
  modalBtnConfirmarTxt: { ...type.corpoForte, fontWeight: '700', color: colors.onPrimary },
});
