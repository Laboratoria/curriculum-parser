const help = ({ pkg, commands }) => `
Usage: ${pkg.name} [command] [options]

Commands:

${Object.keys(commands)
    .map(
      cmdName => (
        `  ${cmdName} ${
          (commands[cmdName].args || [])
            .map(arg => (
              (arg.required)
                ? `<${arg.name}>`
                : `[${arg.name}]`
            ))
            .join(' ')
        } ${
          (commands[cmdName].options || [])
            .map(opt => (
              (opt.required)
                ? `--${opt.name}`
                : `[--${opt.name}]`
            ))
            .join(' ')
        }`
      ),
    )
    .join('\n')}

Global options:

  -h, --help        Show help
  -V                Show version
`;


module.exports = app => Promise.resolve(help(app));
