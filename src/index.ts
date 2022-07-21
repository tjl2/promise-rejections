import {spawn} from 'child_process';
import readline from 'readline';
import Bugsnag from '@bugsnag/js';

const bugsnagAPIKey = process.env.BUGSNAG_API_KEY || '123456789';

class CustomError extends Error {
  constructor(action: 'plan' | 'apply', public stderr: string) {
    super(stderr);
    this.name = `Terraform ${action}`;
  }
}

async function commandRunner(throwErr: boolean = false): Promise<any> {
  const argArr = throwErr ? ['error'] : [];

  const promiseRejectionCmd = spawn(
    'script/promise-rejections-cmd',
    argArr,
    {
      // I believe we will have to stop using 'inherit' on stderr, so that we
      // can capture the error with readline.
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );
  // Stream the output.
  const rl = readline.createInterface({input: promiseRejectionCmd.stdout});
  rl.on('line', (line: string) => {
    console.log(`STDOUT: ${line}`);
  });

  // Stream any stderr and create Error object.
  const rle = readline.createInterface({input: promiseRejectionCmd.stderr});
  let errLines = [] as string[];
  let stderr = '';
  rle.on('line', (line: string) => {
    console.error(`ERROR STDERR ${line}`);
    errLines.push(`STDERR: ${line}`);
  })
  .on('close', () => {
    stderr = errLines.join('\n');
  });

  // Return a promise that will reject on error.
  return new Promise((resolve, reject) => {
    promiseRejectionCmd.on('close', 
      code => (code === 0 ?
        resolve('RESOLVED I got a close event and command was successful') :
        reject(new CustomError('plan', stderr)) // I think this could then be captured by bugsnag.
      )
    );
  });
}

function main() {
  Bugsnag.start(bugsnagAPIKey);

  // Running command with no error.
  commandRunner().then(
    (blah) => {console.log(blah);},
    error => {
      if (error) {
        console.log('Detected error running command - sending to bugsnag');
        Bugsnag.notify(error);
      }
    }
  )

  // Running command with error.
  commandRunner(true).then((blah) => {console.log(blah); process.exit(0);},
    error => {
      if (error) {
        // Here wwould be where we could bugsnag.notify(error);
        console.log('Detected error running command - sending to bugsnag');
        Bugsnag.notify(error);
      }
    }
  );
}

main();
