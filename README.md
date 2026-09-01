# App Faim — Gestão de Obras & Vendas

Aplicativo mobile de gestão financeira para construtoras e incorporadoras. Controla gastos e receitas por obra, exporta planilha e PDF por obra (com recorte mensal) e recebe atualizações remotas (OTA).

Distribuição: APK entregue direto ao cliente, sem loja.

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

Sem React Navigation, sem biblioteca de estado, sem framework de teste.

---

## Estrutura de Pastas

```
App.js                        # Raiz — navegação e estado global de transações
app.json                      # Configuração Expo (plugins, pacote Android, OTA)
eas.json                      # Perfis de build e update
metro.config.js               # Resolve tslib no bundle web (ver Problemas Conhecidos)
index.js                      # Entry point (registerRootComponent)

src/
  screens/
    HomeScreen.js             # Lista de obras + resumo geral + menu de opções
    ObraScreen.js             # Uma obra: lançamentos, formulário e exportação

  components/
    Dashboard.js              # Painel de saldo, gastos e vendas (usado nas 2 telas)
    ObraCard.js               # Card de uma obra na lista da HomeScreen
    TransactionForm.js        # Formulário de cadastro/edição de lançamento
    TransactionItem.js        # Linha do extrato
    TransactionList.js        # FlatList de lançamentos
    BottomSheet.js            # Caixa deslizante + SheetOption (menus do app)
    AjudaModal.js             # Guia "Como usar o app"
    VoiceNoteButton.js        # Ditado de anotação por voz
    Icon.js                   # Única porta de entrada para ícones (Feather)

  hooks/
    useObras.js               # Estado + CRUD de obras
    useTransactions.js        # Estado + CRUD de lançamentos

  services/
    storage.js                # Camada de persistência (AsyncStorage)

  utils/
    currency.js               # formatBRL, extractDigits, formatDigitsAsCurrency
    date.js                   # formatDate + agrupamento por mês
    exportObra.js             # Exportação de uma obra: CSV e PDF
    backup.js                 # Cópia de segurança em JSON (exportar / restaurar)
    id.js                     # generateId
    export.js                 # NÃO USADO — ver Dívida Técnica
    format.js                 # NÃO USADO — ver Dívida Técnica

  theme/
    theme.js                  # Design tokens + ThemeProvider (claro/escuro)
```

---

## Navegação

Navegação por **estado simples** em `App.js`, sem React Navigation.

```
App.js
 ├── obraAberta === null  →  <HomeScreen>
 └── obraAberta !== null  →  <ObraScreen obra={obraAberta}>
```

`HomeScreen` chama `onAbrirObra(obra)` → App seta `obraAberta`.
`ObraScreen` chama `onVoltar()` → App seta `obraAberta = null`.

As transações vivem no `App.js` e descem por props para as duas telas. Isso é o que faz um lançamento criado na ObraScreen aparecer no total da HomeScreen sem recarregar nada.

---

## Modelos de Dados

### Obra
```js
{
  id: string,          // gerado por generateId()
  nome: string,        // ex: "Residencial Vila Nova"
  criadoEm: string,    // ISO 8601
}
```

### Transação
```js
{
  id: string,
  tipo: 'GASTO' | 'RECEITA',
  valor: number,       // em reais (ex: 1500.00)
  categoria: string,   // nome da obra à qual pertence
  observacao: string,  // anotação livre
  createdAt: string,   // ISO 8601
  updatedAt?: string,  // ISO 8601, presente apenas após edição
  data?: string,       // LEGADO: versões antigas gravavam "dd/mm/aaaa" aqui
}
```

> **Registros legados.** Versões antigas do app gravavam a data como texto
> pt-BR em `data`, sem `createdAt`. `TransactionItem` e `dataDoLancamento`
> (em `date.js`) tratam os dois formatos. Qualquer código novo que leia data
> de lançamento deve usar `dataDoLancamento(t)`, nunca `new Date(t.createdAt)`
> direto, senão os registros antigos somem do resultado.

> **Relacionamento Obra ↔ Transação:** por `transacao.categoria === obra.nome`,
> não por ID. Renomear ou excluir uma obra exige atualizar as transações
> junto — `useTransactions` expõe `renameCategoria` e `removeByCategoria`
> para isso, e a `HomeScreen` chama as duas. Migrar para `obraId` continua
> sendo a correção definitiva.

---

## Persistência

Arquivo: `src/services/storage.js`
Biblioteca: `@react-native-async-storage/async-storage`

| Chave AsyncStorage | Conteúdo |
|---|---|
| `@gestao_obras_dados` | Array de transações (JSON) |
| `@gestao_obras_projetos` | Array de obras (JSON) |
| `@gestao_obras_tema` | `"light"` ou `"dark"` (definida em `theme.js`) |

**Funções exportadas:**
- `loadTransactions()` / `saveTransactions(list)`
- `loadObras()` / `saveObras(list)`
- `forceSyncAllData()` — não usado, ver Dívida Técnica

> **Não renomeie estas chaves.** Uma atualização OTA troca só o JavaScript e
> não encosta no armazenamento do aparelho, então os dados do cliente
> sobrevivem a qualquer publicação. Renomear uma chave, porém, faz os dados
> existentes deixarem de ser encontrados — na prática, apaga tudo para o
> usuário.

---

## Hooks

### `useTransactions` (`src/hooks/useTransactions.js`)
Estado global de todos os lançamentos. Carrega do AsyncStorage no mount.

```js
const {
  transactions,       // Transaction[]
  loading,            // boolean
  error,              // string | null
  totalGastos,        // number
  totalGanhos,        // number
  saldo,              // number
  addTransaction,     // async ({ tipo, valor, categoria, observacao }) => Transaction
  updateTransaction,  // async (id, payload) => void
  removeTransaction,  // async (id) => void
  renameCategoria,    // async (nomeAntigo, nomeNovo) => void
  removeByCategoria,  // async (nomeObra) => void
  substituirTodas,    // async (lista) => void   — usado ao restaurar backup
} = useTransactions();
```

Gravação e estado andam juntos: `persist` só chama `setTransactions` depois de `saveTransactions` ter sucesso. Se a gravação falhar, o estado não muda, evitando que a UI mostre um dado que não foi salvo.

### `useObras` (`src/hooks/useObras.js`)

```js
const {
  obras,            // Obra[]
  loading,          // boolean
  error,            // string | null
  addObra,          // async (nome) => Obra
  removeObra,       // async (id) => void
  renameObra,       // async (id, novoNome) => void
  substituirTodas,  // async (lista) => void   — usado ao restaurar backup
} = useObras();
```

`removeObra` remove **apenas** a obra. Apagar os lançamentos junto é decisão da tela: a `HomeScreen` pergunta ao usuário e chama `removeByCategoria` antes, quando ele escolhe apagar tudo.

---

## Design System

Arquivo: `src/theme/theme.js`. Nenhuma cor, tamanho de fonte ou espaçamento deve ser escrito solto num componente.

**Tokens exportados**

| Token | Conteúdo |
|---|---|
| `lightColors` / `darkColors` | Paletas completas, mesmos nomes de papel nas duas |
| `spacing` | `xs 4, sm 8, md 12, lg 16, xl 24, xxl 32` |
| `radius` | `sm 10, md 14, lg 20, full 999` |
| `type` | `display, valor, titulo, corpo, corpoForte, meta, micro` |
| `tabular` | `fontVariant: ['tabular-nums']` para valores em dinheiro |
| `shadowFlutuante` | Sombra do que flutua: bottom sheet e modal |

**Regras da direção visual**

- Neutro grafite sem viés azul, com um único accent: `#c2410c` no claro, `#fb7a3c` no escuro. Use `colors.onPrimary` no texto sobre o accent — no escuro ele é quase-preto, e branco ali seria ilegível.
- Vermelho é gasto, verde é receita. Isso é semântico, não decorativo.
- Cor entra no número, não no fundo. Caixa com fundo colorido só em estado de erro.
- Card comum usa `borderWidth: 1`, não sombra. Sombra só no que realmente flutua.
- Todo valor em dinheiro leva `...tabular`, senão a coluna de valores dança conforme os dígitos.
- Alvo de toque com no mínimo 44px.

**Ícones**

Família única: Feather, via `@expo/vector-icons`. Sempre pelo componente `src/components/Icon.js`, nunca importando outra família direto. O import é por subpath (`@expo/vector-icons/Feather`) para que só a fonte Feather entre no bundle, e não todas as famílias.

**Tema claro/escuro**

`ThemeProvider` no `App.js`, `useTheme()` nos componentes. A preferência é salva em `@gestao_obras_tema`. Os estilos são montados por `makeStyles(colors)` dentro de um `useMemo` dependente de `colors`, para recalcular na troca de tema.

---

## Telas

### HomeScreen
- Barra do app com o título, botão de tema e botão de opções
- Painel `Dashboard` com saldo geral, total de gastos e total de vendas
- Lista de obras com saldo e totais de cada uma
- **Toque** no card → abre a ObraScreen
- **Toque longo** (500ms) → menu de renomear / excluir
- Botão **"Nova obra"** → campo em linha para criar
- Menu de **Opções** → cópia de segurança, restaurar, ajuda, buscar atualização

### ObraScreen
- `Dashboard` com os totais dessa obra
- Formulário de lançamento no topo
- Extrato filtrado por `categoria === obra.nome`
- **Toque** no lançamento → carrega no formulário para editar
- **Toque longo** → confirmação de exclusão
- Botão **"Exportar"** → escolhe planilha ou PDF

---

## Exportação

Arquivo: `src/utils/exportObra.js`. A exportação é **por obra**, feita dentro da ObraScreen.

### Planilha (CSV)

Fluxo de dois passos: **Exportar → Planilha do Excel → escolher o mês**.

O cliente confere as contas mês a mês, como um extrato de banco, então a planilha sai de um mês só. A opção **Tudo** mantém o comportamento antigo.

```
Obra;Edifício Alpha
Período;Setembro de 2026
Exportado em;01/09/2026, 14:38:43

Data;Tipo;Valor;Observação
03/09/2026;GASTO;R$ 1.200,00;Cimento
20/09/2026;RECEITA;R$ 8.000,00;Apto 21

Total de Gastos;R$ 1.200,00
Total de Receitas;R$ 8.000,00
Saldo;R$ 6.800,00
Total de Movimentações;2
```

Nome do arquivo: `Obra_Edifício_Alpha_2026-09.csv`. Com **Tudo**, o sufixo vira a data de hoje.

> **Duas exigências do Excel em pt-BR**, ambas já atendidas e fáceis de
> quebrar sem perceber:
> separador de coluna é `;` e não `,` (com vírgula, tudo cai numa coluna só);
> e o arquivo precisa começar com BOM UTF-8 (`﻿`), senão os acentos
> viram `Ã§Ã£o`.

### Agrupamento por mês

Em `src/utils/date.js`, funções puras e testáveis:

| Função | O que faz |
|---|---|
| `dataDoLancamento(t)` | `Date` do lançamento, com fallback para o campo legado `data` |
| `chaveMes(t)` | `"2026-09"` — ordena cronologicamente como string |
| `rotuloMes(chave)` | `"Setembro de 2026"` |
| `mesesDisponiveis(txs)` | `[{ chave, rotulo, total }]`, do mais recente ao mais antigo |
| `filtrarPorMes(txs, chave)` | Lançamentos daquele mês |

### PDF

`exportarObraPDF` usa `pdf-lib`, que é JavaScript puro. Não tem módulo nativo, então mudanças no PDF sobem por OTA. O PDF sai sempre completo, sem seletor de mês.

### Cópia de segurança

`src/utils/backup.js` exporta e restaura um JSON com obras e lançamentos, pelo menu de Opções. É a única forma de o cliente levar os dados para outro aparelho — os dados vivem só no AsyncStorage local.

---

## Reconhecimento de Voz

Arquivo: `src/components/VoiceNoteButton.js`
Biblioteca: `expo-speech-recognition`

- **Native:** `ExpoSpeechRecognitionModule` com idioma `pt-BR`
- **Web:** Web Speech API do próprio navegador (Chrome e Edge)
- Pede permissão de microfone antes de iniciar
- A transcrição é acrescentada ao campo "Anotação" do formulário
- **Não funciona no Expo Go** — é módulo nativo de terceiro, exige build EAS

---

## Build & Deploy

### Pré-requisitos
```bash
npx eas-cli login  # conta: leg110
```

### Gerar APK para o cliente
```bash
eas build --platform android --profile preview
```

### Enviar atualização OTA (sem novo APK)
```bash
npm run deploy -- --message "descrição do que mudou"
```
O app verifica atualizações ao abrir e aplica na próxima inicialização. O usuário também pode forçar em **Opções → Buscar atualização**.

> **Publique sempre na branch `preview`.** É o que o script acima faz.
>
> Todos os APKs já distribuídos foram gerados com `--profile preview`, e o
> canal fica gravado no APK no momento do build. Publicar em `--branch
> production` sobe o pacote para um canal que nenhum aparelho instalado
> escuta: o app responde "Tudo em dia" e nada chega. O nome do profile
> `production` no `eas.json` engana — ele nunca foi usado para gerar um build.
>
> Para trocar isso de verdade seria preciso um build novo no canal
> `production`, e o cliente teria que desinstalar o app atual (o que apaga os
> dados dele) antes de instalar o novo. Enquanto isso não acontecer,
> `preview` é o canal de produção deste projeto.

Conferir o que está no ar:
```bash
npm run deploy:status
```

Voltar para a versão anterior, se uma atualização quebrar algo:
```bash
eas update:republish --branch preview --group <group-id-anterior>
```
Pegue o `group-id` com `eas update:list --branch preview`.

### O que sobe por OTA e o que exige APK novo

| Sobe por OTA | Exige APK novo |
|---|---|
| Qualquer código JavaScript | Pacote com código nativo |
| Estilos, tema, layout, textos | Mudança em `app.json`: nome, ícone, splash, `plugins`, permissões |
| Imagens carregadas por `require()` | Ícone do app na tela inicial do celular |
| Biblioteca sem módulo nativo (`pdf-lib`) | Subir versão do `expo` ou do `react-native` |

> **Não mexa em `version` no `app.json` sozinho.** `runtimeVersion` usa a
> política `appVersion`. Trocar `1.0.0` por `1.0.1` faz os aparelhos com o
> build atual pararem de receber OTA, porque passam a esperar updates de
> `1.0.1`. Só altere junto com um build novo.

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
    "version": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/5d063a32-ecc3-4a89-acc8-c2277449d476"
    },
    "runtimeVersion": { "policy": "appVersion" },
    "android": { "package": "com.leg110.appfaim" },
    "plugins": ["expo-speech-recognition"],
    "extra": { "eas": { "projectId": "5d063a32-ecc3-4a89-acc8-c2277449d476" } }
  }
}
```

---

## Dependências Principais

| Pacote | Finalidade |
|---|---|
| `@react-native-async-storage/async-storage` | Persistência local |
| `@expo/vector-icons` | Ícones Feather (via `src/components/Icon.js`) |
| `expo-file-system` | Escrita dos arquivos exportados (usar `/legacy`) |
| `expo-sharing` | Compartilhamento nativo de arquivos |
| `expo-document-picker` | Escolha do arquivo ao restaurar backup |
| `expo-speech-recognition` | Reconhecimento de voz |
| `expo-updates` | Atualizações OTA |
| `pdf-lib` | Geração do PDF, em JavaScript puro |
| `react-native-safe-area-context` | SafeAreaView sem aviso de depreciação |

---

## Conta EAS

- **Usuário:** `leg110`
- **Projeto:** `@leg110/app-faim`
- **Project ID:** `5d063a32-ecc3-4a89-acc8-c2277449d476`
- **Dashboard:** https://expo.dev/accounts/leg110/projects/app-faim
- **Canal em uso:** `preview`

---

## Problemas Conhecidos e Soluções

| Problema | Causa | Solução |
|---|---|---|
| Atualização não chega, app diz "Tudo em dia" | Publicado no canal `production`, que nenhum APK escuta | `npm run deploy` (publica em `preview`) |
| Tela branca em `npm run web` | `pdf-lib` puxa `tslib@1`, cujo `exports` aponta a condição `import` para um arquivo que desestrutura um default inexistente. Explode antes do React montar | Já resolvido pelo `metro.config.js`. Não apague esse arquivo |
| `writeAsStringAsync is deprecated` | Import sem `/legacy` | `import * as FileSystem from 'expo-file-system/legacy'` |
| `SafeAreaView deprecated` | Import vindo do react-native | Usar `react-native-safe-area-context` + `SafeAreaProvider` no App.js |
| Voz não funciona no Expo Go | Módulo nativo de terceiro | Só em build EAS |
| Acentos viram `Ã§Ã£o` no Excel | CSV sem BOM UTF-8 | Manter o `﻿` no início do arquivo |
| Tudo numa coluna só no Excel | Separador `,` em vez de `;` | Manter `SEP = ';'` em `exportObra.js` |
| Segunda caixa deslizante não abre no Android | Dois `Modal` montados ao mesmo tempo | Fechar a primeira e abrir a segunda depois de ~300ms |

---

## Dívida Técnica

Código sem nenhum importador, mantido no repositório mas fora de uso. Apagar é seguro; foi deixado para decisão futura.

| Arquivo / símbolo | Situação |
|---|---|
| `src/utils/export.js` | Exportação global antiga, substituída pela exportação por obra |
| `src/utils/format.js` | `formatDuration`, sobra de uma gravação de áudio removida |
| `forceSyncAllData` em `storage.js` | Nunca chamado |
| `PERIODOS`, `periodoParaIntervalo`, `filtrarPorPeriodo` em `date.js` | Filtro de período antigo, substituído por `mesesDisponiveis` e `filtrarPorMes` |

Pendências de arquitetura:

- **Relacionamento por nome.** `transacao.categoria === obra.nome` funciona porque renomear e excluir atualizam os dois lados, mas um `obraId` eliminaria a classe inteira de bug.
- **Sem framework de teste.** As funções puras de `date.js` e o CSV foram verificadas com scripts avulsos em node. Vale instalar Jest quando a lógica crescer.
- **Canal `production` sem uso.** Ver a nota em Build & Deploy.

---

## Fluxo de Desenvolvimento

```
1. Editar código JS

2. Conferir o visual rápido no navegador
   npm run web
   Serve para cor, espaçamento, tipografia e tema.
   NÃO serve para exportação (sem expo-file-system) nem para os dados reais
   (na web o armazenamento é o localStorage do navegador).

3. Testar de verdade no aparelho, no development build
   npm start
   Expo Go NÃO funciona: expo-speech-recognition é módulo nativo.

4. Publicar
   npm run deploy -- --message "o que mudou"
   npm run deploy:status
```

Antes de publicar algo que mexa em exportação, gere um CSV e um PDF num aparelho real. O compartilhamento nativo não tem como ser verificado na web nem por script.
