# Solana 日志，“事件”和交易历史

更新日期：Apr 5

![img](https://static.wixstatic.com/media/935a00_5dfc6f5062894ef7be199e2084106222~mv2.jpg)

Solana 程序可以发出类似于 [Ethereum 触发事件](https://www.rareskills.io/post/ethereum-events)的事件，尽管我们将讨论一些不同之处。

具体来说，Solana 中的事件旨在将信息传递给前端，而不是记录过去的交易。要获取过去的历史记录，可以通过地址查询 Solana 交易。

## Solana 日志和事件

以下程序有两个事件：`MyEvent`和`MySecondEvent`。与 Ethereum 事件具有“参数”类似，Solana 事件在结构体中具有字段：

```
use anchor_lang::prelude::*;

declare_id!("FmyZrMmPvRzmJCG3p5R1AnbkPqSmzdJrcYzgnQiGKuBq");

#[program]
pub mod emit {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        emit!(MyEvent { value: 42 });
        emit!(MySecondEvent { value: 3, message: "hello world".to_string() });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

#[event]
pub struct MyEvent {
    pub value: u64,
}

#[event]
pub struct MySecondEvent {
    pub value: u64,
    pub message: String,
}
```

事件成为 [Solana 程序的 IDL](https://www.rareskills.io/post/anchor-idl) 的一部分，类似于事件是 Solidity 智能合约 ABI 的一部分。以下是上述程序的 IDL 截图，突出显示相关部分：

![Solana IDL 上的事件定义](https://static.wixstatic.com/media/935a00_3b8137e010d540178284188e9925d7ad~mv2.png/v1/fill/w_350,h_484,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_3b8137e010d540178284188e9925d7ad~mv2.png)

在 Solana 中，没有“索引”或“非索引”信息的概念，就像在 Ethereum 中一样（尽管上面的截图中有一个“index”字段，但它没有用）。

与 Ethereum 不同，我们不能直接查询一系列区块号的过去事件。我们只能在事件发生时监听事件。（稍后我们将看到 Solana 审计过去交易的方法）。以下代码显示了如何在 Solana 中监听事件：

```
import * as anchor from "@coral-xyz/anchor";
import { BorshCoder, EventParser, Program } from "@coral-xyz/anchor";
import { Emit } from "../target/types/emit";

describe("emit", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Emit as Program<Emit>;

  it("Is initialized!", async () => {
    const listenerMyEvent = program.addEventListener('MyEvent', (event, slot) => {
      console.log(`slot ${slot} event value ${event.value}`);
    });

    const listenerMySecondEvent = program.addEventListener('MySecondEvent', (event, slot) => {
      console.log(`slot ${slot} event value ${event.value} event message ${event.message}`);
    });

    await program.methods.initialize().rpc();

		// This line is only for test purposes to ensure the event
		// listener has time to listen to event.
    await new Promise((resolve) => setTimeout(resolve, 5000));

    program.removeEventListener(listenerMyEvent);
    program.removeEventListener(listenerMySecondEvent);
  });
});
```

在 Solana 中不可能像在 Ethereum 中那样扫描过去的日志，它们必须在交易发生时进行监视。

![来自测试的 Solana 事件日志](https://static.wixstatic.com/media/935a00_4093b5180b5a4e179c46151e54df8819~mv2.png/v1/fill/w_350,h_133,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_4093b5180b5a4e179c46151e54df8819~mv2.png)

## 日志在幕后的工作原理

在 EVM 中，通过运行`log0`，`log1`，`log2`等操作码来发出日志。在 Solana 中，通过调用系统调用`sol_log_data`来运行日志。作为参数，它只是一个字节序列：

[https://docs.rs/solana-program/latest/src/solana_program/log.rs.html#116-124](https://docs.rs/solana-program/latest/src/solana_program/log.rs.html#116-124)

以下是 Solana 客户端中系统调用的功能：

![sol_log_data](https://static.wixstatic.com/media/935a00_1708759ffbba49618878a420e50554b5~mv2.png/v1/fill/w_740,h_200,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_1708759ffbba49618878a420e50554b5~mv2.png)

我们用来创建事件的“struct”结构是字节序列的抽象。在幕后，Anchor 将结构体转换为字节序列传递给此函数。Solana 系统调用只接受字节序列，而不是结构体。

## Solana 日志不适用于历史查询

在 Ethereum 中，日志用于审计目的，但在 Solana 中，日志不能以这种方式使用，因为它们只能在发生时查询。因此，它们更适合于将信息传递给前端应用程序。Solana 函数无法像 Solidity 视图函数那样将数据返回给前端，因此 Solana 日志是一种轻量级的实现方式。

但是，事件在区块浏览器中是保留的。请参见此交易底部的示例：

[https://explorer.solana.com/tx/JgyHQPxL3cPLFtV4cx5i842ZgBx57R2fkNn2TZn1wsQZqVXKfijd43CEHo88C3ridK27Kw8KkMzfvDdqaS398SX](https://explorer.solana.com/tx/JgyHQPxL3cPLFtV4cx5i842ZgBx57R2fkNn2TZn1wsQZqVXKfijd43CEHo88C3ridK27Kw8KkMzfvDdqaS398SX)

## 与 Ethereum 不同，Solana 交易可以通过地址查询

在 Ethereum 中，没有直接的方法来查询发送到智能合约的交易或来自特定钱包的交易。

我们可以使用 [eth_getTransactionCount](https://ethereum.org/developers/docs/apis/json-rpc#eth_gettransactioncount) 来*计算*从地址发送的交易数量。我们可以使用交易哈希和 [eth_getTransactionByHash](https://ethereum.org/developers/docs/apis/json-rpc#eth_gettransactionbyhash) 来获取特定交易。我们可以使用 [eth_getBlockByNumber](https://ethereum.org/developers/docs/apis/json-rpc#eth_getblockbynumber) 或 [eth_getBlockByHash](https://ethereum.org/developers/docs/apis/json-rpc#eth_getblockbyhash) 来获取特定区块中的交易。

但是，无法按地址获取所有交易。这必须通过间接方式，解析自钱包活跃或智能合约部署以来的每个区块来完成。

为了审计智能合约中的交易，开发人员添加[智能合约事件](https://www.rareskills.io/post/ethereum-events)来查询感兴趣的交易。

## 获取 Solana 中的交易历史

另一方面，Solana 有一个 RPC 函数 [getSignaturesForAddress](https://solana.com/docs/rpc/http/getsignaturesforaddress)，列出地址完成的所有交易。地址可以是程序或钱包。

以下是列出地址的交易的脚本：

```
let web3 = require('@solana/web3.js');

const solanaConnection = new web3.Connection(web3.clusterApiUrl("mainnet-beta"));

const getTransactions = async(address,limit) => {
  const pubKey = new web3.PublicKey(address);
  let transactionList = await solanaConnection.getSignaturesForAddress(pubKey, {limit: limit});
  let signatureList = transactionList.map(transaction => transaction.signature);

  console.log(signatureList);

  for await (const sig of signatureList) {
    console.log(await solanaConnection.getParsedTransaction(sig, {maxSupportedTransactionVersion: 0}));
  }
}

let myAddress = "enter and address here";

getTransactions(myAddress, 3);
```

请注意，实际交易内容是使用`getParsedTransaction` RPC 方法检索的。