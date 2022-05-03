[![Codecov Coverage](https://img.shields.io/codecov/c/github/caki0915/my-awesome-greeter/coverage.svg?style=flat-square)](https://codecov.io/gh/caki0915/my-awesome-greeter/)

# Cal.com Public API SDK
This is an SDK for our API at https://api.cal.com

It uses `readmeio/api` package to auto-generate a javascript client with all the same available functions matching our API endpoints.

## How to use

`import calComSdk from 'calcom/sdk';`

describe('Cal.com SDK', () => {
  calComSdk.auth('cal_{YOUR_API_KEY_HERE}');