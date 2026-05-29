const isTsOrJsFile = (filename) =>
  filename.endsWith('.ts') ||
  filename.endsWith('.tsx') ||
  filename.endsWith('.js') ||
  filename.endsWith('.jsx');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isConstArrowBinding = (context, name) => {
  const sourceCode = context.getSourceCode?.();
  const text = sourceCode?.text ?? '';
  const escapedName = escapeRegExp(name);

  const re = new RegExp(`export\\s+const\\s+${escapedName}\\s*(?::[^=]+)?=\\s*\\(`, 'm');
  const matchIndex = text.search(re);
  if (matchIndex === -1) return false;

  const window = text.slice(matchIndex, matchIndex + 500);
  return window.includes('=>');
};

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Forbid `export function` syntax. Require `export const name = () => {}` arrow functions instead.'
    },
    schema: [],
    messages: {
      noDefaultFunction:
        'Prefer `export const {{name}} = () => {}` and `export default {{name}};` instead of a default-exported function.',
      defaultMustBeConstArrow:
        'Default export must be an identifier that refers to a top-level `const {{name}} = () => {}` arrow function.',
      noExportedFunctionDecl:
        'Prefer `export const {{name}} = () => {}` instead of `export function {{name}}() {}`.'
    }
  },
  create: (context) => {
    const filename = context.getFilename?.() ?? '';
    if (!isTsOrJsFile(filename)) return {};

    return {
      Program: (program) => {
        const body = program.body ?? [];

        for (const node of body) {
          if (node.type === 'ExportDefaultDeclaration') {
            const decl = node.declaration;

            if (decl?.type === 'FunctionDeclaration') {
              const name = decl.id?.name ?? 'Component';
              context.report({
                node,
                messageId: 'noDefaultFunction',
                data: { name }
              });
              continue;
            }

            if (decl?.type === 'Identifier') {
              const name = decl.name;
              const ok = isConstArrowBinding(context, name);
              if (!ok) {
                context.report({
                  node,
                  messageId: 'defaultMustBeConstArrow',
                  data: { name }
                });
              }
            }
          }

          if (node.type === 'ExportNamedDeclaration' && node.declaration) {
            const decl = node.declaration;

            if (decl.type === 'FunctionDeclaration') {
              const name = decl.id?.name ?? 'fn';
              context.report({
                node: decl,
                messageId: 'noExportedFunctionDecl',
                data: { name }
              });
            }
          }
        }
      }
    };
  }
};
