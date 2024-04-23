# Solana 中的 Multicall：批处理交易和交易大小限制

![solana transaction batch and transaction size limits](https://static.wixstatic.com/media/935a00_5dd3345354a8421d9e478d408eb4bee8~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_5dd3345354a8421d9e478d408eb4bee8~mv2.jpg)

## Solana 内置 Multicall

在以太坊中，如果我们想要原子地批处理多个交易，我们会使用 Multicall 模式。如果一个失败，其余的也会失败。

Solana 已经将此功能内置到运行时中，因此我们不需要实现 Multicall。在下面的示例中，我们在一个交易中初始化一个账户并向其写入 —— 而不使用`init_if_needed`。

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Batch } from "../target/types/batch";

describe("batch", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Batch as Program<Batch>;

  it("Is initialized!", async () => {
    const wallet = anchor.workspace.Batch.provider.wallet.payer;
    const [pda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);

    const initTx = await program.methods.initialize()
			              .accounts({pda: pda})
										.transaction();

    // for u32, we don't need to use big numbers
    const setTx = await program.methods.set(5)
										.accounts({pda: pda})
										.transaction();

    let transaction = new anchor.web3.Transaction();
    transaction.add(initTx);
    transaction.add(setTx);

    await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [wallet]);

    const pdaAcc = await program.account.pda.fetch(pda);
    console.log(pdaAcc.value); // prints 5
  });
});
```

以下是相应的 Rust 代码：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("Ao9LdZtHdMAzrFUEfRNbKEb5H4nXvpRZC69kxeAGbTPE");

#[program]
pub mod batch {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Set>, new_val: u32) -> Result<()> {
        ctx.accounts.pda.value = new_val;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<PDA>() + 8, seeds = [], bump)]
    pub pda: Account<'info, PDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut)]
    pub pda: Account<'info, PDA>,
}

#[account]
pub struct PDA {
    pub value: u32,
}
```

关于上面代码的一些注释：

- 当向 Rust 传递`u32`值或更小值时，我们不需要使用 JavaScript 大数。
- 我们不再需要使用`await program.methods.initialize().accounts({pda: pda}).rpc()`，而是使用`await program.methods.initialize().accounts({pda: pda}).transaction()`来创建一个交易。

## Solana 交易大小限制

Solana 交易的总大小不能超过**1232 字节**。

这意味着你将无法像在以太坊中那样批处理“无限”数量的交易并支付更多的 gas。

## 演示批处理交易的原子性

让我们修改我们 Rust 中的`set`函数，使其始终失败。这将帮助我们看到如果其中一个批处理的交易失败，`initialize`交易会被回滚。

以下 Rust 程序在调用`set`时始终返回错误：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("Ao9LdZtHdMAzrFUEfRNbKEb5H4nXvpRZC69kxeAGbTPE");

#[program]
pub mod batch {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Set>, new_val: u32) -> Result<()> {
        ctx.accounts.pda.value = new_val;
        return err!(Error::AlwaysFails);
    }
}

#[error_code]
pub enum Error {
    #[msg(always fails)]
    AlwaysFails,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<PDA>() + 8, seeds = [], bump)]
    pub pda: Account<'info, PDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut)]
    pub pda: Account<'info, PDA>,
}

#[account]
pub struct PDA {
    pub value: u32,
}
```

以下 Typescript 代码发送了一个初始化和设置的批处理交易：

```
import * as anchor from "@coral-xyz/anchor";
import { Program, SystemProgram } from "@coral-xyz/anchor";
import { Batch } from "../target/types/batch";

describe("batch", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Batch as Program<Batch>;

  it("Set the number to 5, initializing if necessary", async () => {
    const wallet = anchor.workspace.Batch.provider.wallet.payer;
    const [pda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);

    // console.log the address of the pda
    console.log(pda.toBase58());

    let transaction = new anchor.web3.Transaction();
    transaction.add(await program.methods.initialize().accounts({pda: pda}).transaction());
    transaction.add(await program.methods.set(5).accounts({pda: pda}).transaction());

await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [wallet]);
  });
});
```

当我们运行测试，然后查询本地验证器以获取 pda 账户时，我们会发现它不存在。尽管初始化交易首先执行，但随后执行的设置交易失败，导致整个交易被取消，因此没有账户被初始化。

![atomic multiple transaction fails](https://static.wixstatic.com/media/935a00_4420f56b3323493084beafb6c35ea6ac~mv2.png/v1/fill/w_740,h_261,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_4420f56b3323493084beafb6c35ea6ac~mv2.png)

## 前端中的“如果需要则初始化”

你可以使用前端代码模拟`init_if_needed`的行为，同时拥有一个单独的`initialize`函数。然而，从用户的角度来看，当他们第一次使用账户时，所有这些都会被平滑处理，因为他们不必在第一次使用账户时发出多个交易。

要确定是否需要初始化一个账户，我们检查它是否具有零 lamports 或是否由系统程序拥有。以下是我们在 Typescript 中如何做到这一点：

```
import * as anchor from "@coral-xyz/anchor";
import { Program, SystemProgram } from "@coral-xyz/anchor";
import { Batch } from "../target/types/batch";

describe("batch", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Batch as Program<Batch>;

  it("Set the number to 5, initializing if necessary", async () => {
    const wallet = anchor.workspace.Batch.provider.wallet.payer;
    const [pda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);

    let accountInfo = await anchor.getProvider().connection.getAccountInfo(pda);

    let transaction = new anchor.web3.Transaction();
    if (accountInfo == null || accountInfo.lamports == 0 || accountInfo.owner == anchor.web3.SystemProgram.programId) {
      console.log("need to initialize");
      const initTx = await program.methods.initialize().accounts({pda: pda}).transaction();
      transaction.add(initTx);
    }
    else {
      console.log("no need to initialize");
    }

    // we're going to set the number anyway
    const setTx = await program.methods.set(5).accounts({pda: pda}).transaction();
    transaction.add(setTx);

    await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [wallet]);

    const pdaAcc = await program.account.pda.fetch(pda);
    console.log(pdaAcc.value);
  });
});
```

我们还需要修改我们的 Rust 代码，***不***在`set`操作上强制失败。

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("Ao9LdZtHdMAzrFUEfRNbKEb5H4nXvpRZC69kxeAGbTPE");

#[program]
pub mod batch {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Set>, new_val: u32) -> Result<()> {
        ctx.accounts.pda.value = new_val;
				Ok(()) // ERROR HAS BEEN REMOVED
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<PDA>() + 8, seeds = [], bump)]
    pub pda: Account<'info, PDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut)]
    pub pda: Account<'info, PDA>,
}

#[account]
pub struct PDA {
    pub value: u32,
}
```

如果我们针对同一个本地验证器实例运行测试两次，我们将得到以下输出：

第一次测试运行：

![batched transaction succeeds on first initialized](https://static.wixstatic.com/media/935a00_852692a28a964e328a655b04c8ebf6cf~mv2.png/v1/fill/w_740,h_179,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_852692a28a964e328a655b04c8ebf6cf~mv2.png)

第二次测试运行：

![batched transaction suceeds on second call with account already initialized](https://static.wixstatic.com/media/935a00_24cda760976a4c1b8880b3914318c83e~mv2.png/v1/fill/w_740,h_179,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_24cda760976a4c1b8880b3914318c83e~mv2.png)

## Solana 如何部署超过 1232 字节的程序？

如果你创建一个新的 Solana 程序并运行`anchor deploy`（或`anchor test`），你将在日志中看到有大量交易到`BFPLoaderUpgradeable`：

![anchor deploy logs with many transactions](https://static.wixstatic.com/media/935a00_141abab0799c428fa6f76dbd4c3e2e23~mv2.png/v1/fill/w_740,h_1100,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_141abab0799c428fa6f76dbd4c3e2e23~mv2.png)

在这里，Anchor 正在将部署的字节码拆分成多个交易，因为一次性部署整个字节码无法适应单个交易。我们可以通过将日志导向文件并计算发生的交易数量来查看它花费了多少交易：

```
solana logs > logs.txt
# run `anchor deploy` in another shell
grep "Transaction executed" logs.txt | wc -l
```

这将大致匹配在执行`anchor test`或`anchor deploy`命令后暂时出现的内容：

![transaction count to deploy program](https://static.wixstatic.com/media/935a00_a9a3a99d6c67406c88349188b82d8711~mv2.png/v1/fill/w_740,h_109,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_a9a3a99d6c67406c88349188b82d8711~mv2.png)

关于如何将交易批处理的确切过程在 [Solana 文档：Solana 程序部署工作原理](https://solana.com/docs/programs/deploying#how-solana-program-deploy-works)中有描述。

这些交易列表是单独的交易，而不是批处理的交易。如果是批处理的话，将会超过 1232 字节的限制。

## 通过 RareSkills 了解更多

查看我们的 [Solana 开发课程](https://www.rareskills.io/solana-tutorial)以获取更多 Solana 教程。