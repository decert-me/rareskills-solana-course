# 在 Anchor 中的 `init_if_needed` 和重新初始化攻击

![anchor init if needed](https://static.wixstatic.com/media/935a00_da6446a3727044b589537f2fedac8c55~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_da6446a3727044b589537f2fedac8c55~mv2.jpg)

在之前的教程中，我们必须在可以向其写入数据之前在单独的事务中初始化帐户。我们可能希望能够在一个事务中初始化帐户并向其写入数据，以简化用户操作。

Anchor 提供了一个方便的宏称为 `init_if_needed`，正如其名称所示，如果帐户不存在，它将初始化该帐户。

下面的示例计数器不需要单独的初始化事务，它将立即开始向 `counter` 存储添加“1”。

Rust:

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("9DbiqCqtqgP3NYufxBakbeRd7JyNpNYbsm6Jqrn8Z2Hn");

#[program]
pub mod init_if_needed {
    use super::*;

    pub fn increment(ctx: Context<Initialize>) -> Result<()> {
        let current_counter = ctx.accounts.my_pda.counter;
        ctx.accounts.my_pda.counter = current_counter + 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init_if_needed,
        payer = signer,
        space = size_of::<MyPDA>() + 8,
        seeds = [],
        bump
    )]
    pub my_pda: Account<'info, MyPDA>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyPDA {
    pub counter: u64,
}
```

Typescript:

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { InitIfNeeded } from "../target/types/init_if_needed";

describe("init_if_needed", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.InitIfNeeded as Program<InitIfNeeded>;

  it("Is initialized!", async () => {
    const [myPda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);
    await program.methods.increment().accounts({myPda: myPda}).rpc();
    await program.methods.increment().accounts({myPda: myPda}).rpc();
    await program.methods.increment().accounts({myPda: myPda}).rpc();

    let result = await program.account.myPda.fetch(myPda);
    console.log(`counter is ${result.counter}`);
  });
});
```

当我们尝试使用 `anchor build` 构建此程序时，将会出现以下错误：

![anchor `init_if_needed` warning](https://static.wixstatic.com/media/935a00_c444fda7ad5a4771ac4444d8993eb1f7~mv2.png/v1/fill/w_740,h_108,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c444fda7ad5a4771ac4444d8993eb1f7~mv2.png)

为了消除错误 `init_if_needed requires that anchor-lang be imported with the init-if-needed cargo feature enabled`，我们可以打开 `programs/<anchor_project_name>` 中的 `Cargo.toml` 文件，并添加以下行：

```
[dependencies]
anchor-lang = { version = "0.29.0", features = ["init-if-needed"] }
```

但在消除错误之前，我们应该了解重新初始化攻击是什么以及它是如何发生的。

## 在 Anchor 程序中，帐户不能被初始化两次（默认情况下）

如果我们尝试初始化已经被初始化的帐户，事务将失败。

## Anchor 如何知道帐户是否已经初始化？

从 Anchor 的角度来看，如果帐户具有非零的 lamport 余额或者帐户由系统程序拥有，则它未被初始化。

由系统程序拥有或者具有零 lamport 余额的帐户可以被重新初始化。

为了说明这一点，我们有一个具有典型 `initialize` 函数（使用 `init` 而不是 `init_if_needed`）的 Solana 程序。它还有一个 `drain_lamports` 函数和一个 `give_to_system_program` 函数，它们的功能与它们的名称一样：

```
use anchor_lang::prelude::*;
use std::mem::size_of;
use anchor_lang::system_program;

declare_id!("FC467mPCCKXG97ut1WdLLi55vuAcyCW8AD1vid27bZfn");

#[program]
pub mod reinit_attack {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn drain_lamports(ctx: Context<DrainLamports>) -> Result<()> {
        let lamports = ctx.accounts.my_pda.to_account_info().lamports();
        ctx.accounts.my_pda.sub_lamports(lamports)?;
				ctx.accounts.signer.add_lamports(lamports)?;
        Ok(())
    }

    pub fn give_to_system_program(ctx: Context<GiveToSystemProgram>) -> Result<()> {
        let account_info = &mut ctx.accounts.my_pda.to_account_info();
        // the assign method changes the owner
				account_info.assign(&system_program::ID);
        account_info.realloc(0, false)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct DrainLamports<'info> {
    #[account(mut)]
    pub my_pda: Account<'info, MyPDA>,
    #[account(mut)]
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8, seeds = [], bump)]
    pub my_pda: Account<'info, MyPDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GiveToSystemProgram<'info> {
    #[account(mut)]
    pub my_pda: Account<'info, MyPDA>,
}

#[account]
pub struct MyPDA {}
```

现在考虑以下单元测试：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ReinitAttack } from "../target/types/reinit_attack";

describe("Program", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ReinitAttack as Program<ReinitAttack>;

  it("initialize after giving to system program or draining lamports", async () => {
    const [myPda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);

    await program.methods.initialize().accounts({myPda: myPda}).rpc();

    await program.methods.giveToSystemProgram().accounts({myPda: myPda}).rpc();

    await program.methods.initialize().accounts({myPda: myPda}).rpc();
    console.log("account initialized after giving to system program!")

    await program.methods.drainLamports().accounts({myPda: myPda}).rpc();

    await program.methods.initialize().accounts({myPda: myPda}).rpc();
    console.log("account initialized after draining lamports!")
  });
});
```

序列如下：

1. 我们初始化 PDA
2. 我们将 PDA 的所有权转移给系统程序
3. 我们再次调用初始化，它成功了
4. 我们从 `my_pda` 帐户中取出 lamports
5. 具有零 lamport 余额的帐户将被计划删除，因为它不再免租。Solana 运行时将认为该帐户不存在。
6. 我们再次调用初始化，它成功了。**在按照此顺序操作后，我们成功重新初始化了该帐户。**

再次强调，Solana 没有“initialized（已初始化）”标志或其他内容。如果帐户的所有者是系统程序或 lamport 余额为零，则 Anchor 将允许初始化事务成功。

## 为什么在我们的示例中重新初始化可能会成为问题

将所有权转移给系统程序需要擦除帐户中的数据。清空所有 lamports “传达”了你不希望该帐户继续存在的意图。

通过执行这些操作，你是想重新开始计数器还是结束计数器的生命周期？如果你的应用程序永远不希望计数器被重置，这可能会导致错误。

Anchor 希望你仔细考虑你的意图，这就是为什么它让你在 Cargo.toml 中启用一个特性标志的额外步骤。

如果你可以接受计数器在某个时刻被重置并重新计数，那么重新初始化就不是一个问题。但是，如果计数器在任何情况下都不应重置为零，则最好是单独实现 `initialization` 函数，并添加一个保障，确保它在其生命周期内只能被调用一次（例如，在单独帐户中存储一个布尔标志）。

当然，你的程序可能并没有机制将帐户转移给系统程序或从帐户中提取 lamports。但 Anchor 无法知道这一点，因此它总是会发出关于 `init_if_needed` 的警告，因为它无法确定帐户是否可以回到可初始化状态。

## 拥有两个初始化路径可能会导致差一错误或其他令人惊讶的行为

在我们的带有 `init_if_needed` 的计数器示例中，计数器永远不会等于零，因为第一个初始化事务还会将值从零增加到一。

如果我们*还*有一个常规初始化函数，该函数不会增加计数器的值，那么计数器将被初始化并具有零值。如果某些业务逻辑从不希望看到值为零的计数器，则可能会发生意外行为。

**在以太坊中，从未“触及”过的变量的存储值默认为零。在 Solana 中，未初始化的帐户不持有零值变量 —— 它们不存在，也无法读取**。

## “初始化”在 Anchor 中并不总是指“init”

有些情况下，“初始化”一词被用来更一般地表示“首次向帐户写入数据”，而不仅仅是 Anchor 的 `init` 宏。

如果我们查看来自 [Soldev](https://www.soldev.app/course/reinitialization-attacks) 的示例程序，我们会发现没有使用 `init` 宏：

![soldev screenshopt reinitialization](https://static.wixstatic.com/media/935a00_ddf79fa835384feeab537745b953b160~mv2.png/v1/fill/w_740,h_529,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_ddf79fa835384feeab537745b953b160~mv2.png)

代码直接在第 11 行读取帐户，然后设置字段。**该程序无论是首次写入数据还是第二次（或第三次）写入数据，都会盲目地覆盖数据。**

在这里，“初始化”术语的含义是“首次向帐户写入数据”。

这里的“重新初始化攻击”是一种不同类型，与 Anchor 框架警告的内容不同。具体来说，“初始化”可以被调用多次。Anchor 的 `init` 宏会检查 lamport 余额是否为非零，并且程序是否已经拥有该帐户，这将防止多次调用 `initialize`。init 宏可以看到帐户已经具有 lamports 或者由程序拥有。然而，上面的代码没有这样的检查。

值得一提的是，通过他们的教程了解这种重新初始化攻击的变体是值得的。

请注意，这使用的是 Anchor 的旧版本。`AccountInfo` 是 `UncheckedAccount` 的另一个术语，因此你需要在其上方添加一个 `/// Check:` 注释。

## 擦除帐户鉴别器不会使帐户可重新初始化

帐户是否已初始化与其内部的数据（或缺乏数据）无关。

要擦除帐户中的数据而不转移它：

```
use anchor_lang::prelude::*;
use std::mem::size_of;
use anchor_lang::system_program;

declare_id!("FC467mPCCKXG97ut1WdLLi55vuAcyCW8AD1vid27bZfn");

#[program]
pub mod reinit_attack {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn erase(ctx: Context<Erase>) -> Result<()> {
        ctx.accounts.my_pda.realloc(0, false)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Erase<'info> {
		/// CHECK: We are going to erase the account
    #[account(mut)]
    pub my_pda: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = 8, seeds = [], bump)]
    pub my_pda: Account<'info, MyPDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyPDA {}
```

重要的是，我们使用 `UncheckedAccount` 来擦除数据，因为常规 `Account` 上没有 `.realloc(0, false)` 方法。

此操作将擦除帐户鉴别器，因此它将无法通过 `Account` 再次读取。

**练习：** 初始化帐户，调用 `erase` 然后尝试再次初始化帐户。它将失败，因为即使帐户没有数据，它仍然由程序拥有并且具有非零 lamport 余额。

## 总结

`init_if_needed` 宏可以方便地避免需要两个事务与新存储帐户交互。Anchor 框架默认阻止它，以迫使我们考虑以下可能不希望发生的情况：

- 如果有一种方法可以将 lamport 余额减少到零或将所有权转移给系统程序，则可以重新初始化帐户。这可能是一个问题，也可能不是，这取决于业务需求。
- 如果程序既有 `init` 宏又有 `init_if_needed` 宏，开发人员必须确保拥有两个代码路径不会导致意外状态。
- 即使帐户中的数据完全被擦除，帐户仍然已初始化。
- 如果程序有一个“盲目”写入帐户的函数，那么该帐户中的数据可能会被覆盖。这通常需要通过 `AccountInfo` 或其别名 `UncheckedAccount` 加载帐户。

## 通过 RareSkills 了解更多

查看我们的 [Solana 开发课程](https://www.rareskills.io/solana-tutorial) 以获取我们的其他 Solana 教程。感谢阅读！