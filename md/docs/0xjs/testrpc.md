In order to run 0x.js methods that interact with the Ethereum blockchain (i.e filling an order, checking a balance or setting an allowance) you need to point your Web3 Provider to an Ethereum node. Because of the ~12 second block times, during development it is best to use [TestRPC](https://github.com/ethereumjs/testrpc) a fast Ethereum RPC client made for testing and development.

Install TestRPC locally:

```
npm install -g ethereumjs-testrpc
```

In order to run TestRPC with all the latest 0x protocol smart contracts available, you must first download [this TestRPC snapshot](https://s3.amazonaws.com/testrpc-shapshots/35053f9.zip) and save it. Next unzip it's contents with:

```bash
unzip 35053f9.zip -d 0x_testrpc_snapshot
```

You can now start TestRPC as follows:

```bash
testrpc --networkId 50 -p 8545 --db 0x_testrpc_snapshot -m "concert load couple harbor equip island argue ramp clarify fence smart topic"
```

Since we started TestRPC on port 8545, we can pass ZeroEx the following provider during instantiation:

```
const provider = new Web3.providers.HttpProvider('http://localhost:8545');
```

0x.js will now communicate with TestRPC over HTTP!
