# Solana 时钟和其他“块”变量

更新日期：2 月 20 日

![solana 时钟](https://static.wixstatic.com/media/935a00_55b04d2394f04f7781fdee936109b747~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_55b04d2394f04f7781fdee936109b747~mv2.jpg)

今天我们将介绍所有与 Solidity 中块变量对应的变量。并非所有变量都有 1 对 1 的对应关系。在 Solidity 中，我们有以下常用的块变量：

- block.timestamp
- block.number
- blockhash() 

以及较少人知道的：

- block.coinbase
- block.basefee
- block.chainid
- block.difficulty / block.prevrandao 

我们假设你已经知道它们的作用，但如果需要复习，可以在 [Solidity 全局变量文档](https://docs.soliditylang.org/en/latest/units-and-global-variables.html)中找到解释。

## Solana 中的 block.timestamp

通过使用 [Clock sysvar](https://docs.solana.com/developing/runtime-facilities/sysvars) 中的`unix_timestamp`字段，我们可以访问 Solana 的块时间戳。

首先，我们初始化一个新的 Anchor 项目：

```
anchor init sysvar
```

将初始化函数替换为：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let clock: Clock = Clock::get()?;
    msg!(
        "Block timestamp: {}",
        // Get block.timestamp
        clock.unix_timestamp,
    );
    Ok(())
}
```

Anchor 的 prelude 模块包含 Clock 结构，默认情况下会自动导入：

```
use anchor_lang::prelude::*;
```

有点令人困惑的是，`unix_timestamp`返回的类型是`i64`，而不是`u64`，这意味着它支持负数，尽管时间本身不可能是负数。但时间差可以是负数。

### 获取星期几

现在让我们创建一个程序，使用 Clock sysvar 中的`unix_timestamp`告诉我们当前是星期几。

[Rust 中的 chrono](https://docs.rs/chrono/latest/chrono/)库提供了对日期和时间进行操作的功能。

在程序目录./sysvar/Cargo.toml 中将 chrono 库添加为依赖项：

```
[dependencies]
chrono = "0.4.31"
```

在 sysvar 模块中导入 chrono 库：

```
// ...other code

#[program]
pub mod sysvar {
    use super::*;
    use chrono::*;  // new line here

    // ...
}
```

现在，我们在程序中添加以下函数：

```
pub fn get_day_of_the_week(
    _ctx: Context<Initialize>) -> Result<()> {

    let clock = Clock::get()?;
    let time_stamp = clock.unix_timestamp; // current timestamp

    let date_time = chrono::NaiveDateTime::from_timestamp_opt(time_stamp, 0).unwrap();
    let day_of_the_week = date_time.weekday();

    msg!("Week day is: {}", day_of_the_week);

    Ok(())
}
```

我们将从 Clock sysvar 获取的当前 unix 时间戳作为参数传递给`from_timestamp_opt`函数，该函数返回一个包含日期和时间的`NaiveDateTime`结构。然后我们调用 weekday 方法，根据我们传递的时间戳获取当前星期几。

并更新我们的测试：

```
it("Get day of the week", async () => {
    const tx = await program.methods.getDayOfTheWeek().rpc();
    console.log("Your transaction signature", tx);
});
```

再次运行测试，得到以下日志：

![img](https://static.wixstatic.com/media/935a00_85c168cb57ae40b592c769bbebf27b2c~mv2.png/v1/fill/w_740,h_116,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_85c168cb57ae40b592c769bbebf27b2c~mv2.png)

注意“星期几是：Wed”日志。

## Solana 中的 block.number

Solana 有一个“槽号”概念，与“块号”密切相关但并非相同。关于它们之间的区别将在接下来的教程中介绍，因此我们推迟对如何获取“块号”的完整讨论。

## block.coinbase

在以太坊中，“块 Coinbase”代表成功挖掘工作量证明（PoW）区块的矿工地址。另一方面，Solana 使用基于领导者的共识机制，结合了 Proof of History（PoH）和 Proof of Stake（PoS），消除了挖矿的概念。相反，通过一种称为[领导者计划](https://docs.solana.com/cluster/leader-rotation)的系统，任命一个区块或槽领导者在特定时间间隔内验证交易并提出区块。这个计划确定了谁将在特定时间成为区块生产者。

然而，目前在 Solana 程序中没有特定的方法来访问区块领导者的地址。

## blockhash

我们包含这一部分是为了完整性，但这很快将被弃用。

对于不感兴趣的读者，可以跳过这一部分。

Solana 有一个 [RecentBlockhashes sysvar](https://docs.rs/solana-program/1.17.2/solana_program/sysvar/recent_blockhashes/struct.RecentBlockhashes.html)，其中包含活动的最近区块哈希及其相关的费用计算器。然而，这个 sysvar 已经[被弃用](https://docs.rs/solana-program/1.17.3/src/solana_program/sysvar/recent_blockhashes.rs.html) ，并且将不会在未来的 Solana 版本中得到支持。RecentBlockhashes sysvar 不像 Clock sysvar 那样提供 get 方法。然而，缺乏此方法的 sysvar 可以使用`sysvar_name::from_account_info`来访问。

我们还将介绍一些新的语法，稍后会进行解释。目前，请将其视为样板代码：

```
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: readonly
    pub recent_blockhashes: AccountInfo<'info>,
}
```

以下是如何在 Solana 中获取最新的区块哈希：

```
use anchor_lang::{prelude::*, solana_program::sysvar::recent_blockhashes::RecentBlockhashes};

// replace program id
declare_id!("H52ppiSyiZyYVn1Yr9DgeUKeChktUiPwDfuuo932Uqxy");

#[program]
pub mod sysvar {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // RECENT BLOCK HASHES
        let arr = [ctx.accounts.recent_blockhashes.clone()];
        let accounts_iter = &mut arr.iter();
        let sh_sysvar_info = next_account_info(accounts_iter)?;
        let recent_blockhashes = RecentBlockhashes::from_account_info(sh_sysvar_info)?;
        let data = recent_blockhashes.last().unwrap();

        msg!("The recent block hash is: {:?}", data.blockhash);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: readonly
    pub recent_blockhashes: AccountInfo<'info>,
}
```

测试文件：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sysvar } from "../target/types/sysvar";

describe("sysvar", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Sysvar as Program<Sysvar>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accounts({
        recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
      })
      .rpc();

    console.log("Transaction hash:", tx);
  });
});
```

运行测试，得到以下日志：

![img](https://static.wixstatic.com/media/935a00_f883ec55d8ea49e399403e176d6265d7~mv2.png/v1/fill/w_740,h_100,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_f883ec55d8ea49e399403e176d6265d7~mv2.png)

我们可以看到最新的区块哈希。请注意，因为我们部署到本地节点，所以我们得到的区块哈希是我们本地节点的，而不是 Solana 主网的。

在时间结构方面，Solana 在一个固定的时间线上运行，将时间划分为槽，每个槽是分配给领导者提出区块的时间段。这些槽进一步组织成预定义的时期，领导者计划在这些时期内保持不变。

## block.gaslimit

Solana 每个块的计算单位限制为 [4800 万](https://github.com/solana-labs/solana/issues/29492) 。每个交易默认限制为 20 万计算单位，尽管可以将其提高到 140 万计算单位（我们将在以后的教程中讨论，但你可以[在这里看到一个示例](https://solanacookbook.com/references/basic-transactions.html#how-to-change-compute-budget-fee-priority-for-a-transaction) ）。

无法从 Rust 程序中访问此限制。

## block.basefee

在以太坊中，basefee 根据 EIP-1559 是动态的；它是先前区块利用率的函数。在 Solana 中，交易的基本价格是静态的，因此不需要像这样的变量。

## block.difficulty

块难度是与工作量证明（PoW）区块链相关的概念。另一方面，Solana 采用 Proof of History（PoH）结合 Proof of Stake（PoS）共识机制，不涉及块难度的概念。

## block.chainid

Solana 没有链 ID，因为它不是与以太坊虚拟机兼容的区块链。block.chainid 是 Solidity 智能合约知道它们在测试网、L2、主网或其他以太坊虚拟机兼容链上的方法。

Solana 为 [Devnet、Testnet 和 Mainnet](https://docs.solana.com/clusters) 运行单独的集群，但程序没有机制可以知道它们位于哪个集群。但是，你可以在部署时使用 Rust cfg 功能在代码中进行程序化调整，以根据部署到的集群不同而具有不同的功能。这里有一个[根据集群更改程序 ID 的示例](https://solana.stackexchange.com/questions/848/how-to-have-a-different-program-id-depending-on-the-cluster) 。

## 了解更多

本教程是我们免费的 [Solana 课程](https://hackmd.io/4eVoPWjpRLCqf03vK7CyVg?view)的一部分。