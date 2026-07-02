# App Faim — Gestão de Obras & Vendas

Aplicativo mobile de gestão financeira voltado para construtoras e incorporadoras. Permite controlar gastos e receitas por obra (projeto), exportar relatórios e receber atualizações remotas (OTA).

---

## Stack Técnica

| Item | Versão |
|---|---|
| React Native | 0.86.0 |
| Expo SDK | ~57.0.1 |
| React | 19.2.3 |
| Node.js (dev) | 24+ |
| Build | EAS Build (cloud) |
| Updates | EAS Update (OTA) |

---

## Estrutura de Pastas

```
App.js                        # Raiz — navegação e estado global de transações
app.json                      # Configuração Expo (plugins, pacote Android, OTA)
eas.json                      # Perfis de build e update (preview / production)
index.js                      # Entry point (registerRootComponent)

src/
  screens/
    HomeScreen.js             # Tela inicial: lista de obras + resumo geral
    ObraScreen.js             # Tela de uma obra: transações + formulário

  components/
    Dashboard.js              # Cards de totais (gastos / receitas / saldo)
    ObraCard.js               # Card de uma obra na lista
    TransactionForm.js        # Formulário de cadastro/edição de transação
    TransactionItem.js        # Item individual na lista de transações
    TransactionList.js        # FlatList de transações
    FilterBar.js              # Barra de filtro (se utilizada)
    VoiceNoteButton.js        # Botão de reconhecimento de voz (🎤)

  hooks/
    useObras.js               # Estado + CRUD de obras (projetos)
    useTransactions.js        # Estado + CRUD de transações

  services/
    storage.js                # Camada de persistência (AsyncStorage)

  utils/
    currency.js               # formatBRL, extractDigits, formatDigitsAsCurrency
    date.js                   # formatDate
    export.js                 # Gera CSV e dispara compartilhamento
    format.js                 # Utilitários gerais de formatação
    id.js                     # generateId (UUID)

  theme/
    theme.js                  # Design tokens: colors, spacing, radius, shadow
```

---

## Navegação

A navegação é feita por **estado simples** em `App.js` — sem React Navigation.

```
App.js
 ├── obraAberta === null  →  <HomeScreen>
 └── obraAberta !== null  →  <ObraScreen obra={obraAberta}>
```

`HomeScreen` chama `onAbrirObra(obra)` → App seta `obraAberta`.  
`ObraScreen` chama `onVoltar()` → App seta `obraAberta = null`.

---

## Modelos de Dados

### Obra
```js
{
  id: string,          // UUID gerado por generateId()
  nome: string,        // Nome da obra (ex: "Residencial Vila Nova")
  criadoEm: string,   // ISO 8601
}
```

### Transação
```js
{
  id: string,          // UUID
  tipo: 'GASTO' | 'RECEITA',
  valor: number,       // Em reais (ex: 1500.00)
  categoria: string,   // Nome da obra à qual pertence (chave de relacionamento)
  observacao: string,  // Anotação livre
  createdAt: string,  // ISO 8601
  updatedAt?: string, // ISO 8601 (presente apenas após edição)
}
```

> **Relacionamento Obra ↔ Transação:** feito por `transacao.categoria === obra.nome`.  
> Não há FK por ID — se renomear a obra, as transações antigas ficam órfãs.  
> Isso é uma limitação conhecida; para corrigir futuramente use `obraId`.

---

## Persistência

Arquivo: `src/services/storage.js`  
Biblioteca: `@react-native-async-storage/async-storage`

| Chave AsyncStorage | Conteúdo |
|---|---|
| `@gestao_obras_dados` | Array de transações (JSON) |
| `@gestao_obras_projetos` | Array de obras (JSON) |

**Funções exportadas:**
- `loadTransactions()` / `saveTransactions(list)`
- `loadObras()` / `saveObras(list)`
- `deleteTransactionsByObra(nomeObra)` — remove todas as transações de uma obra pelo nome

---

## Hooks

### `useTransactions` (`src/hooks/useTransactions.js`)
Gerencia o estado global de todas as transações. Carrega do AsyncStorage no mount.

```js
const {
  transactions,   // Transaction[]
  loading,        // boolean
  error,          // string | null
  totalGastos,    // number
  totalGanhos,    // number
  saldo,          // number
  addTransaction,     // async ({ tipo, valor, categoria, observacao }) => Transaction
  updateTransaction,  // async (id, payload) => void
  removeTransaction,  // async (id) => void
} = useTransactions();
```

### `useObras` (`src/hooks/useObras.js`)
Gerencia o estado da lista de obras.

```js
const {
  obras,      // Obra[]
  loading,    // boolean
  addObra,    // async (nome) => Obra
  removeObra, // async (id, deletarTransacoes?: boolean) => void
  renameObra, // async (id, novoNome) => void
} = useObras();
```

`removeObra(id, true)` chama `deleteTransactionsByObra` antes de remover a obra.

---

## Telas

### HomeScreen
- Mostra resumo financeiro geral (total gastos, receitas, saldo)
- Lista todas as obras com totais individuais
- **Toque simples** na obra → abre ObraScreen
- **Toque longo** (500ms) → menu de opções (renomear / excluir)
- Botão **"+ Nova"** → campo inline para criar obra
- Botão **"📊 Exportar"** → gera CSV e abre compartilhamento

### ObraScreen
- Exibe Dashboard com totais da obra específica
- Formulário de cadastro de transação no topo
- Lista de transações filtradas por `categoria === obra.nome`
- **Toque simples** na transação → modo edição no formulário
- **Toque longo** na transação → confirmação de exclusão
- Botão **"← Obras"** no navbar para voltar

---

## Exportação (CSV)

Arquivo: `src/utils/export.js`  
Usa `expo-file-system/legacy` (API legada — necessário o `/legacy` no import).  
Usa `expo-sharing` para abrir o menu de compartilhamento nativo.

Gera um arquivo `.txt` com formato CSV por obra:
- Seção por obra com tabela `Data, Tipo, Valor, Observação`
- Resumo por obra (gastos, receitas, saldo)
- Resumo geral de todas as obras no final

> **Atenção:** Importar de `expo-file-system` sem `/legacy` lança erro em runtime no Expo SDK 57+.

---

## Reconhecimento de Voz

Arquivo: `src/components/VoiceNoteButton.js`  
Biblioteca: `expo-speech-recognition`

- **Web:** usa Web Speech API nativa do browser
- **Native:** usa `ExpoSpeechRecognitionModule` com idioma `pt-BR`
- Pede permissão de microfone automaticamente antes de iniciar
- Transcrição é inserida no campo "Observação" do formulário
- **Não funciona no Expo Go** — requer build nativo (APK/IPA)

---

## Build & Deploy

### Pré-requisitos
```bash
npm install -g eas-cli
eas login  # conta: leg110
```

### Gerar APK para teste (preview)
```bash
eas build --platform android --profile preview
```

### Gerar APK de produção
```bash
eas build --platform android --profile production
```

### Enviar atualização OTA (sem novo APK)
```bash
eas update --branch preview --message "descrição do que mudou"
```
O app verifica atualizações ao abrir e aplica na próxima inicialização.

> **OTA funciona apenas para mudanças em JavaScript/assets.**  
> Mudanças em código nativo (novos pacotes nativos, permissões) exigem novo APK.

---

## Configurações EAS

**`eas.json`**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  }
}
```

**`app.json` — campos importantes**
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/5d063a32-ecc3-4a89-acc8-c2277449d476"
    },
    "runtimeVersion": { "policy": "appVersion" },
    "android": { "package": "com.leg110.appfaim" },
    "plugins": ["expo-audio", "expo-speech-recognition"],
    "extra": { "eas": { "projectId": "5d063a32-ecc3-4a89-acc8-c2277449d476" } }
  }
}
```

---

## Dependências Principais

| Pacote | Finalidade |
|---|---|
| `@react-native-async-storage/async-storage` | Persistência local de dados |
| `expo-file-system` | Criação de arquivos para exportação (usar `/legacy`) |
| `expo-sharing` | Compartilhamento nativo de arquivos |
| `expo-speech-recognition` | Reconhecimento de voz (STT) |
| `expo-audio` | Áudio (permissões de microfone) |
| `expo-updates` | OTA updates |
| `react-native-safe-area-context` | SafeAreaView sem deprecation warning |

---

## Conta EAS

- **Usuário:** `leg110`
- **Projeto:** `@leg110/app-faim`
- **Project ID:** `5d063a32-ecc3-4a89-acc8-c2277449d476`
- **Dashboard:** https://expo.dev/accounts/leg110/projects/app-faim

---

## Problemas Conhecidos e Soluções

| Problema | Causa | Solução |
|---|---|---|
| `writeAsStringAsync is deprecated` | Import sem `/legacy` | `import * as FileSystem from 'expo-file-system/legacy'` |
| `SafeAreaView deprecated` | Import do react-native | Usar `react-native-safe-area-context` + `SafeAreaProvider` no App.js |
| Voice não funciona no Expo Go | Módulo nativo não compilado | Funciona apenas em build EAS (APK) |
| Gradle build fail | Pacotes nativos incompatíveis | Verificar `app.json` plugins e package.json |
| Transações órfãs após renomear obra | Relacionamento por nome, não por ID | Limitação atual — não renomear obras que já têm transações |

---

## Fluxo de Desenvolvimento

```
1. Editar código JS
2. Testar no Expo Go (funcionalidades sem módulos nativos)
   npm start → escanear QR code
3. Para funcionalidades nativas (voice):
   eas build --platform android --profile preview
4. Para atualizar o APK instalado:
   eas update --branch preview --message "o que mudou"
```
