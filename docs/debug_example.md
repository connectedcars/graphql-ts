# .vscode/tasks.json
```
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current",
      "cwd": "${workspaceFolder}",
      "skipFiles": [
        "${workspaceFolder}/node_modules/**/*.js",
        "${workspaceFolder}/lib/**/*.js",
        "<node_internals>/**/*.js" ],
      // "preLaunchTask": "tsc: build - tsconfig.json",
      "args": [
        "${workspaceRoot}/node_modules/.bin/jest",
        // "--forceExit",
        // "--detectOpenHandles",
        "${relativeFile}",
        "--runInBand",
      ],
      "console": "integratedTerminal",
    }
  ]
}
```
