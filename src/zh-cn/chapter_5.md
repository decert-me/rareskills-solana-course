# Solana 程序可升级且没有构造函数

![solana anchor deploy](https://static.wixstatic.com/media/935a00_6f744496166444cbbd0621def8ead449~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_6f744496166444cbbd0621def8ead449~mv2.jpg)

在本教程中，我们将深入了解 anchor 背后的秘密，看看 Solana 程序是如何部署的。

当运行 `anchor init deploy_tutorial` 时，anchor 创建的测试文件：

```js
describe("deploy_tutorial", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.DeployTutorial as Program<DeployTutorial>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
```

它生成的启动程序应该很熟悉：

```rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod deploy_tutorial {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

上面的程序在何时何地部署？

合同可能被部署的唯一可能地方是测试文件中的这一行：

```js
const program = anchor.workspace.DeployTutorial as Program<DeployTutorial>;
```

但这没有意义，因为我们期望的那是一个异步函数。

Anchor 在后台默默地部署程序。

## **Solana 程序没有构造函数**

对于那些来自其他面向对象语言的人来说，这可能看起来很不寻常。Rust 没有对象或类。

在以太坊智能合约中，构造函数可以配置存储、设置字节码和不可变变量。

那么“部署步骤”究竟在哪里？

(*如果你仍在运行 Solana 验证器和 Solana 日志，建议你重新启动并清除两个终端*)

让我们进行通常的设置。创建一个名为 program-deploy 的新 Anchor 项目，并确保验证器和日志在其他 shell 中运行。

不要运行 `anchor test`，而是在终端中运行以下命令：

```shell
anchor deploy
```

![solana program deploy visible in the logs](https://static.wixstatic.com/media/935a00_fb4d75f1016144a3bc2e2706c27736f0~mv2.png/v1/fill/w_740,h_212,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_fb4d75f1016144a3bc2e2706c27736f0~mv2.png)

在上面日志的截图中，我们可以看到程序被部署的时刻。

现在到了有趣的部分。再次运行 `anchor deploy`：

![solana upgrade instead of deploy](https://static.wixstatic.com/media/935a00_95bc7ab0a8de400aac1f11e47471b748~mv2.png/v1/fill/w_740,h_148,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_95bc7ab0a8de400aac1f11e47471b748~mv2.png)

该程序被部署到相同的地址，但这次是*升级*，而不是部署。

程序 ID 没有改变，**程序被覆盖。**

## **Solana 程序默认可变**

对以太坊开发人员来说，这可能会让人震惊，因为以太坊合约默认是不可变的。

如果作者可以随意更改程序，那程序还有什么意义呢？Solana 程序也可以是不可更改的。假设作者首先部署可变版本，随着时间的推移且没有发现错误，然后将其重新部署为不可更改的版本。

从功能上讲，这与管理员控制的代理没有什么不同，代理的所有者后来放弃了对零地址的所有权。但可以说，Solana 模式要干净得多，因为以太坊代理可能会出现很多问题。

另一个含义：**Solana 没有 delegatecall，因为它不需要。**

Solidity 合约中使用 delegatecall 的主要目的是通过向新实现合约发出 delegatecall 来升级代理合约的功能。然而，由于 Solana 中的程序字节码可以升级，所以不需要对实现合约进行 delegatecall。

另一个推论：**Solana 没有像 Solidity 那样的不可变变量（只能在构造函数中设置的变量）。**

## 运行测试而不重新部署程序

由于 anchor 默认会重新部署程序，让我们演示如何在不重新部署的情况下运行测试。

将测试更改为以下内容：

```js
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import fs from 'fs'
let idl = JSON.parse(fs.readFileSync('target/idl/deployed.json', 'utf-8'))

describe("deployed", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  // Change this to be your programID
  const programID = "6p29sM4hEK8ZFT5AvsGJQG5nKUtHBKs13iVL6juo5Uqj";
  const program = new Program(idl, programID, anchor.getProvider());

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
```

在运行测试之前，我们建议清除 Solana 日志终端并重新启动 `solana-test-validator`。

现在，使用以下命令运行测试：

```shell
anchor test --skip-local-validator --skip-deploy
```

现在查看日志：

![anchor skip deploy](https://static.wixstatic.com/media/935a00_177b1f145f08486d94416f73f502c14e~mv2.png/v1/fill/w_740,h_194,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_177b1f145f08486d94416f73f502c14e~mv2.png)

我们看到初始化指令已执行，但程序既没有部署也没有升级，因为我们在 anchor test 中使用了 `--skip-deploy` 参数。

**练习：** 为了查看程序字节码实际上已更改，请部署两个打印不同 msg! 值的合约。

1. 更新 [lib.rs](http://lib.rs/) 中的 initialize 函数，包括写入日志的 `msg!` 语句。
2. anchor deploy
3. anchor test --skip-local-validator --skip-deploy
4. 检查日志以查看消息记录
5. 重复 1 - 4，但要更改 msg! 中的字符串
6. 验证程序 ID 未更改

你应该观察到消息字符串有改动，但程序 ID 保持不变。

## 总结

- Solana 没有构造函数，程序“只是被部署”
- Solana 没有不可变变量
- Solana 没有 delegatecall，程序可以“只是被更新”

## 通过 RareSkills 深入了解

本教程是我们免费的 [Solana 课程](https://www.rareskills.io/solana-tutorial)的一部分。