const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// `pdf-lib` depende de tslib@1, cujo campo `exports` aponta a condição `import`
// para `tslib/modules/index.js`. Esse arquivo faz `import tslib from '../tslib.js'`
// e desestrutura o default — mas `tslib.js` é UMD e não expõe um default, então
// o resultado é `undefined` e a desestruturação lança:
//
//   Uncaught TypeError: Cannot destructure property '__extends' of 'n.default'
//
// O erro acontece na inicialização do módulo, antes do React montar, e o
// resultado é tela branca. Só afeta a web: no bundle nativo o Metro resolve
// pela condição `react-native`/`main`, que já cai no CJS correto.
//
// Aqui forçamos a web a usar o mesmo arquivo CJS que o nativo usa.
const resolveOriginal = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'tslib') {
    return context.resolveRequest(context, 'tslib/tslib.js', platform);
  }
  return resolveOriginal
    ? resolveOriginal(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
