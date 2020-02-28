const rawParse = require('./src/parse');
const { SyntaxType } = require('./src/ts_type');

function parse(source = '', option) {
  try {
    const protoDocument = rawParse(source, option);
    protoDocument.syntaxType = SyntaxType.ProtoDocument;
    return protoDocument;
  } catch (error) {
    const { message } = error;
    let { line } = error;

    if (!line) {
      line = 0;
    }

    return {
      line, message, error, syntaxType: SyntaxType.ProtoError,
    };
  }
}

module.exports = {
  parse,
  SyntaxType,
};
