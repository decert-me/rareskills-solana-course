# 转移 SOL 并构建支付分割器：Solana 中的 "msg.value"

![img](https://static.wixstatic.com/media/935a00_b3715afc88894b44aaf8cb8cfc8c4587~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_b3715afc88894b44aaf8cb8cfc8c4587~mv2.jpg)

本教程将介绍 Solana Anchor 程序如何在交易中转移 SOL 的机制。

**与以太坊不同，以太坊钱包在交易中指定 msg.value 并将 ETH“推送”到合约，而 Solana 程序则是从钱包“拉取” Solana。**

因此，Solana 中没有“可支付”函数或“msg.value”。

下面我们创建了一个名为 `sol_splitter` 的新 Anchor 项目，并放置了 Rust 代码以将 SOL 从发送方转移到接收方。

当然，如果发送方直接发送 SOL 而不通过程序进行操作会更有效，但我们想说明如何操作：

```
use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("9qnGx9FgLensJQy1hSB4b8TaRae6oWuNDveUrxoYatr7");

#[program]
pub mod sol_splitter {
    use super::*;

    pub fn send_sol(ctx: Context<SendSol>, amount: u64) -> Result<()> {

        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(), 

            system_program::Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: ctx.accounts.recipient.to_account_info(),
            }
        );

        let res = system_program::transfer(cpi_context, amount);

        if res.is_ok() {
            return Ok(());
        } else {
            return err!(Errors::TransferFailed);
        }
    }
}

#[error_code]
pub enum Errors {
    #[msg("transfer failed")]
    TransferFailed,
}

#[derive(Accounts)]
pub struct SendSol<'info> {
    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    recipient: UncheckedAccount<'info>,
    
    system_program: Program<'info, System>,

    #[account(mut)]
    signer: Signer<'info>,
}
```

这里有很多需要解释的地方。

## 介绍 CPI：跨程序调用

在以太坊中，通过在 `msg.value` 字段中指定一个值来转移 ETH。在 Solana 中，一个名为 `system program` 的内置程序将 SOL 从一个账户转移到另一个账户。这就是为什么在我们初始化账户时一直出现它，并且必须支付费用来初始化这些账户。

你可以粗略地将系统程序视为以太坊中的预编译。想象一下，它的行为有点像内置在协议中的 ERC-20 代币，用作本地货币。它有一个名为 `transfer` 的公共函数。

## CPI 交易的上下文

每当调用 Solana 程序函数时，都必须提供一个 `Context`。该 `Context` 包含程序将交互的所有账户。

调用系统程序也不例外。系统程序需要一个包含 `from` 和 `to` 账户的 `Context`。要转移的 `amount` 作为“常规”参数传递 —— 它不是 `Context` 的一部分（因为“amount”不是一个账户，它只是一个值）。

现在我们可以解释下面的代码片段：

![CpiContext](https://static.wixstatic.com/media/935a00_7ff8faa78c804a1ba629d33ad93420a9~mv2.png/v1/fill/w_740,h_218,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_7ff8faa78c804a1ba629d33ad93420a9~mv2.png)

我们正在构建一个新的 `CpiContext`，它将第一个参数作为我们将要调用的程序（绿色框），以及作为该交易一部分的账户（黄色框）。这里没有提供参数 `amount`，因为 `amount` 不是一个账户。

现在我们已经构建了我们的 `cpi_context`，我们可以执行一个跨程序调用到系统程序（橙色框）同时指定金额。

这将返回一个 `Result<()>` 类型，就像我们的 Anchor 程序上的公共函数一样。

## 不要忽略跨程序调用的返回值。

要检查跨程序调用是否成功，我们只需要检查返回的值是否为 `Ok`。Rust 使用 `is_ok()` 方法使这一过程变得简单：

![error return of Solana CPI](https://static.wixstatic.com/media/935a00_31a6794a7b484ababb68895357fe3b27~mv2.png/v1/fill/w_740,h_312,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_31a6794a7b484ababb68895357fe3b27~mv2.png)

## 只有签名者可以作为“from”

如果你使用不是 `Signer` 的账户作为 `from` 调用系统程序，则系统程序将拒绝该调用。没有签名，系统程序无法知道你是否授权了该调用。

Typescript 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolSplitter } from "../target/types/sol_splitter";

describe("sol_splitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolSplitter as Program<SolSplitter>;

  async function printAccountBalance(account) {
    const balance = await anchor.getProvider().connection.getBalance(account);
    console.log(`${account} has ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  }

  it("Transmit SOL", async () => {
    // generate a new wallet
    const recipient = anchor.web3.Keypair.generate();

    await printAccountBalance(recipient.publicKey);

    // send the account 1 SOL via the program
    let amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    await program.methods.sendSol(amount)
      .accounts({recipient: recipient.publicKey})
      .rpc();

    await printAccountBalance(recipient.publicKey);
  });
});
```

需要注意的一些事项：

- 我们创建了一个辅助函数 `printAccountBalance` 来显示接收者地址的余额
- 我们使用 `anchor.web3.Keypair.generate()` 生成了接收者钱包
- 我们将一个 SOL 转移到了新账户

当我们运行代码时，预期结果如下。打印语句是接收者地址的余额变化前后：

![SOL transfer test](https://static.wixstatic.com/media/935a00_65cb4a30f02d467ba68d5dcb4f78bdde~mv2.png/v1/fill/w_740,h_177,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_65cb4a30f02d467ba68d5dcb4f78bdde~mv2.png)

**练习：** 构建一个 Solana 程序，将接收到的 SOL 平均分配给两个接收者。你无法通过函数参数完成此操作，账户需要在 Context 结构中。

## 构建支付分割器：使用 `remaining_accounts` 处理任意数量的账户

我们可以看到，如果我们想要在多个账户之间分配 SOL，需要指定一个像下面这样的 Context 结构会相当笨拙：

```
#[derive(Accounts)]
pub struct SendSol<'info> {
    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    recipient1: UncheckedAccount<'info>,

    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    recipient2: UncheckedAccount<'info>,

    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    recipient3: UncheckedAccount<'info>,

		// ...

    /// CHECK: we do not read or write the data of this account
    #[account(mut)]
    recipientn: UncheckedAccount<'info>,
    
    system_program: Program<'info, System>,

    #[account(mut)]
    signer: Signer<'info>,
}
```

为了解决这个问题，Anchor 在 `Context` 结构中添加了一个 `remaining_accounts` 字段。

下面的代码演示了如何使用该功能：

```
use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("9qnGx9FgLensJQy1hSB4b8TaRae6oWuNDveUrxoYatr7");

#[program]
pub mod sol_splitter {
    use super::*;

		// 'a, 'b, 'c are Rust lifetimes, ignore them for now
    pub fn split_sol<'a, 'b, 'c, 'info>(
        ctx: Context<'a, 'b, 'c, 'info, SplitSol<'info>>,
        amount: u64,
    ) -> Result<()> {

        let amount_each_gets = amount / ctx.remaining_accounts.len() as u64;
        let system_program = &ctx.accounts.system_program;

				// note the keyword `remaining_accounts`
        for recipient in ctx.remaining_accounts {
            let cpi_accounts = system_program::Transfer {
                from: ctx.accounts.signer.to_account_info(),
                to: recipient.to_account_info(),
            };
            let cpi_program = system_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

            let res = system_program::transfer(cpi_context, amount_each_gets);
            if !res.is_ok() {
                return err!(Errors::TransferFailed);
            }
        }

        Ok(())
    }
}

#[error_code]
pub enum Errors {
    #[msg("transfer failed")]
    TransferFailed,
}

#[derive(Accounts)]
pub struct SplitSol<'info> {
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}
```

以下是 Typescript 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolSplitter } from "../target/types/sol_splitter";

describe("sol_splitter", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SolSplitter as Program<SolSplitter>;

  async function printAccountBalance(account) {
    const balance = await anchor.getProvider().connection.getBalance(account);
    console.log(`${account} has ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL`);
  }

  it("Split SOL", async () => {
    const recipient1 = anchor.web3.Keypair.generate();
    const recipient2 = anchor.web3.Keypair.generate();
    const recipient3 = anchor.web3.Keypair.generate();

    await printAccountBalance(recipient1.publicKey);
    await printAccountBalance(recipient2.publicKey);
    await printAccountBalance(recipient3.publicKey);

    const accountMeta1 = {pubkey: recipient1.publicKey, isWritable: true, isSigner: false};
    const accountMeta2 = {pubkey: recipient2.publicKey, isWritable: true, isSigner: false};
    const accountMeta3 = {pubkey: recipient3.publicKey, isWritable: true, isSigner: false};

    let amount = new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL);
    await program.methods.splitSol(amount)
      .remainingAccounts([accountMeta1, accountMeta2, accountMeta3])
      .rpc();

    await printAccountBalance(recipient1.publicKey);
    await printAccountBalance(recipient2.publicKey);
    await printAccountBalance(recipient3.publicKey);
  });
});
```

运行测试显示了转移前后的余额：

![Solana test before and after transfer](https://static.wixstatic.com/media/935a00_d59f3d33908a4c2fa3a2ccd2feabdf9f~mv2.png/v1/fill/w_740,h_170,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_d59f3d33908a4c2fa3a2ccd2feabdf9f~mv2.png)

以下是有关 Rust 代码的一些评论：

### Rust 生命周期

`split_sol` 函数声明引入了一些奇怪的语法：

```
pub fn split_sol<'a, 'b, 'c, 'info>(
    ctx: Context<'a, 'b, 'c, 'info, SplitSol<'info>>,
    amount: u64,
) -> Result<()>
```

`'a`、`'b` 和 `'c` 是 Rust 生命周期。Rust 生命周期是一个复杂的主题，我们现在最好避免讨论。但是，高层次的解释是，Rust 代码需要确保传递到循环 `for recipient in ctx.remaining_accounts` 中的资源将在整个循环中存在。

### ctx.remaining_accounts

循环遍历 `for recipient in ctx.remaining_accounts`。关键字 `remaining_accounts` 是 Anchor 传递任意数量账户的机制，而无需在 Context 结构中创建一堆密钥。

在 Typescript 测试中，我们可以像这样将 `remaining_accounts` 添加到交易中：

```
await program.methods.splitSol(amount)
  .remainingAccounts([accountMeta1, accountMeta2, accountMeta3])
  .rpc();
```

## 通过 RareSkills 了解更多

查看我们的 [Solana 课程](https://www.rareskills.io/solana-tutorial) 以获取 Solana 教程的其余部分。