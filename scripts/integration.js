const shell = require('shelljs');
const colors = require('./common/colors');


process.env.NODE_ENV = process.env.BABEL_ENV = 'integration';

const util = require('util');
const exec = util.promisify(require('child_process').exec);


shell.echo(`
  ${colors.title(`== Running All Integration Tests ==`)}
`);


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

// Find test files.
const files = shell.find('integration').filter(function(file) { return file.match(/\.test\.ts$/); });

// Run each file within a separate docker-compose environment.
const cb = async (filepath) => {
  process.stdout.write(
    colors.notice(`${filepath}:\t\t\tRunning...`)
  );

  try {
    const { stdout, stderr } = await exec(`npm run docker:integration ${filepath}`)
  } catch (e) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      colors.error(`${filepath}:\t\t\tFailed!\n\n`)
    );

    process.stderr.write(e);
  }

  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    colors.dim(`${filepath}:\t\t\tPassed!\n`)
  );
}

asyncForEach(files, cb)
