const { ConsoleConnector } = require('@nlpjs/console-connector');
const { dockStart } = require('@nlpjs/basic');
const { exec } = require('child_process');

// Promise will be completed only AFTER app/command is done
const runCommand = async command => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (stderr) {
        return reject(new Error(`stderr: ${stderr}`));
      }
      return resolve(stdout);
    });
  });
};

// Run command and WAIT until it is finished.
// While waiting, this script cannot process new input and run others commands
async function runCommandHandler(command) {
  try {
    console.log(await runCommand(command));
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}

// entry point
const main = async () => {
  // create NLP
  const dock = await dockStart();
  // select nlp from the settings (conf.json)
  const nlp = dock.get('nlp');
  // train the nlp use corpus_en.json
  await nlp.train();
  // Helper for running script as user console app. Allow to get user input from the terminal
  const connector = new ConsoleConnector();
  // Event-function will be invoked each time user type the text and press Enter
  connector.onHear = async (self, text) => {
    self.say(`You said "${text}"`);
    const response = await nlp.process('en', text);
    console.log(`NLP answer: ${response.answer}`);
    // Check the match object and run/execute related app/command/stuff
    // intent(s) are described in the corpus-en.json
    switch (response.intent) {
      case 'run.browser':
        await runCommandHandler(
          'open -a "Google Chrome" www.google.com'
        );
        break;
      case 'run.test':
        await runCommandHandler('npm test');
        break;
      case 'run.ls':
        await runCommandHandler('ls -al');
        break;
      case 'exit':
        connector.close();
        break;
      default:
        console.log(`Skipping case: ${response.intent}`);
        break;
    }
  };
  connector.say('Say something!');
};

main().catch(e => {
  throw e;
});
