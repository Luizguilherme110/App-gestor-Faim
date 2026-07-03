import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { loadObras, loadTransactions } from '../services/storage';

const VERSAO_BACKUP = 1;

// Gera um arquivo JSON com todos os dados (obras + lançamentos) e abre o
// compartilhamento nativo, permitindo salvar em Drive/Arquivos/etc.
export const exportarBackup = async () => {
  const [obras, transactions] = await Promise.all([loadObras(), loadTransactions()]);

  const payload = {
    versao: VERSAO_BACKUP,
    exportadoEm: new Date().toISOString(),
    obras,
    transactions,
  };

  const timestamp = new Date().toISOString().split('T')[0];
  const fileName = `Backup_AppFaim_${timestamp}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar backup',
      UTI: 'public.json',
    });
  } else {
    throw new Error('Compartilhamento não disponível no seu dispositivo.');
  }
};

// Abre o seletor de arquivos, lê e valida um backup. Não grava nada —
// quem chama decide como aplicar os dados (via os hooks, não direto no storage).
export const lerArquivoBackup = async () => {
  const resultado = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (resultado.canceled) return null;

  const arquivo = resultado.assets?.[0];
  if (!arquivo) return null;

  const conteudo = await FileSystem.readAsStringAsync(arquivo.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let dados;
  try {
    dados = JSON.parse(conteudo);
  } catch (e) {
    throw new Error('Arquivo inválido: não é um JSON de backup reconhecível.');
  }

  if (!Array.isArray(dados.obras) || !Array.isArray(dados.transactions)) {
    throw new Error('Arquivo de backup inválido ou de uma versão incompatível.');
  }

  return dados;
};
