# CompliFi Protocol

Decentralised Derivatives That Do Not Default. No counterparty risk, no margin
calls, no liquidations.

## Setup

Requirements:

- Node >= v12

```
$ git clone git@github.com:CompliFi/complifi-protocol.git
$ cd complifi-protocol
$ npm install        # Install dependencies
```

## Linting and Formatting

To check code for problems:

```
$ npm run typecheck      # Type-check TypeScript code
$ npm run lint           # Check JavaScript and TypeScript code
$ npm run lint --fix     # Fix problems where possible
$ npm run solhint        # Check Solidity code
$ npm run slither        # Run Slither
```

To auto-format code:

```
$ npm run fmt
```

## Testing

First, make sure Ganache is running.

```
$ ganache-cli
```

Run all tests:

```
$ npm run test
```

To run tests in a specific file, run:

```
$ npm run test [path/to/file]
```

To run tests and generate test coverage, run:

```
$ npm run coverage
```

## Deployment

Create a copy of the file `.env.template`, and name it `.env`. Enter the BIP39
mnemonic phrase, the INFURA API key to use for deployment, and the gas price in
gwei in `.env`. This file must not be checked into the repository.

Run `npm run migrate --network NETWORK`, where NETWORK is either `mainnet` or
`rinkeby`.
