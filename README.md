# promise-rejections

`src/index.ts` spawns a new process to run `script/promise-rejections-cmd`, once
without an argument to trigger the failure, and once with an argument to trigger
one.

When `main()` is called, we print the Promise resolution when no errors are detected,
and the Promise rejection when errors are detected.

```shell
❯ tsc -p .

❯ node lib/index.js 
# First two lines come from the script completing normally
STDOUT: Promise rejections cmd (stdout)
RESOLVED I got a close event and command was successful
# Next lines are what happens when we trigger an error and write some stuff to stderr
STDOUT: Promise rejections cmd (stdout)
Detected error running command:
Here's my error:
  Error: STDERR Error thrown from promise-rejections-cmd (stderr)
  STDERR Another from promise-rejections-cmd (stderr)
```
