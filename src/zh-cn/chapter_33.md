# Anchor 中的跨程序调用

跨程序调用（CPI）是 Solana 中一个程序调用另一个程序的公共函数的术语。

我们之前已经做过 CPI，当我们发送一个[转账 SOL 交易到系统程序](./chapter_23.md)时。以下是相关代码片段以作提醒：

```
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
```

`CpiContext` 中的 `Cpi` 字面意思是“跨程序调用”。

调用除系统程序外的其他程序的公共函数的工作流程并没有太大不同——我们将在本教程中教授这一点。

本教程仅关注如何调用使用 Anchor 构建的另一个 Solana 程序。如果另一个程序是用纯 Rust 开发的，那么以下指南将不起作用。

在我们的运行示例中，`Alice` 程序将调用 `Bob` 程序中的一个函数。

## Bob 程序

我们首先使用 Anchor 的 CLI 创建一个新项目：

```
anchor init bob
```

然后将以下代码复制粘贴到 `bob/lib.rs` 中。该账户有两个函数，一个用于初始化存储 `u64` 的存储账户，另一个函数 `add_and_store` 接受两个 `u64` 变量，将它们相加并存储在由结构体 `BobData` 定义的账户中。

```
use anchor_lang::prelude::*;
use std::mem::size_of;

// REPLACE WITTH YOUR <PROGRAM_ID>declare_id!
("8GYu5JYsvAYoinbFTvW4AACYB5GxGstz21FmZe3MNFn4");

#[program]
pub mod bob {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Data Account Initialized: {}", ctx.accounts.bob_data_account.key());

        Ok(())
    }

    pub fn add_and_store(ctx: Context<BobAddOp>, a: u64, b: u64) -> Result<()> {
        let result = a + b;
                        
        // MODIFY/UPDATE THE DATA ACCOUNT
        ctx.accounts.bob_data_account.result = result;
        Ok(())
    }
}

#[account]
pub struct BobData {
    pub result: u64,
}

#[derive(Accounts)]
pub struct BobAddOp<'info> {   
    #[account(mut)]
    pub bob_data_account: Account<'info, BobData>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<BobData>() + 8)]
    pub bob_data_account: Account<'info, BobData>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}
```

本教程的目标是创建另一个程序 `alice` 来调用 `bob.add_and_store`。

仍然在项目（bob）中，使用 `anchor new` 命令创建一个新程序：

```
anchor new alice
```

命令行应打印出 `Created new program`。

在开始编写 Alice 程序之前，以下代码片段必须添加到 Alice 的 **\[dependencies\]** 部分的 **Cargo.toml** 文件中，路径为 `programs/alice/Cargo.toml`。

```
[dependencies]
bob = {path = "../bob", features = ["cpi"]}
```

Anchor 在后台做了大量工作。Alice 现在可以访问 Bob 的公共函数和 Bob 的结构体定义。**你可以将其类比为在 Solidity 中导入一个接口，以便我们知道如何与另一个合约交互。**

下面我们展示 `Alice` 程序。在顶部，Alice 程序导入了携带 `BobAddOp` 账户的结构体（用于 `add_and_store`）。请注意代码中的注释：

```
use anchor_lang::prelude::*;
// account struct for 
add_and_storeuse bob::cpi::accounts::BobAddOp;

// The program definition for Bob
use bob::program::Bob;

// the account where Bob is storing the sum
use bob::BobData;

declare_id!("6wZDNWprmb9TAZYMAPpT23kHDPABvBLT8jbWQKLHEmBy");

#[program]
pub mod alice {
    use super::*;

    pub fn ask_bob_to_add(ctx: Context<AliceOp>, a: u64, b: u64) -> Result<()> {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.bob_program.to_account_info(),
            BobAddOp {
                bob_data_account: ctx.accounts.bob_data_account.to_account_info(),
            }
        );

        let res = bob::cpi::add_and_store(cpi_ctx, a, b);

        // return an error if the CPI failed
        if res.is_ok() {
            return Ok(());
        } else {
            return err!(Errors::CPIToBobFailed);
        }
    }
}

#[error_code]
pub enum Errors {
    #[msg("cpi to bob failed")]
    CPIToBobFailed,
}

#[derive(Accounts)]
pub struct AliceOp<'info> {
    #[account(mut)]
    pub bob_data_account: Account<'info, BobData>,

    pub bob_program: Program<'info, Bob>,
}
```

如果我们将 `ask_bob_to_add` 与本文顶部显示的转账 SOL 的代码片段进行比较，我们会发现很多相似之处。

![Image 1: Code snippet comparison of ask_bob_to_add to the code snippet at the top of this article](https://static.wixstatic.com/media/706568_107fea85400047e19d4653970968b609~mv2.jpeg)

要进行 CPI，需要以下内容：

*   目标程序的引用（作为 `AccountInfo`）（红框）
    
*   目标程序运行所需的账户列表（包含所有账户的 `ctx` 结构体）（绿框）
    
*   传递给函数的参数（橙框）
    

## 测试 CPI

以下 Typescript 代码可用于测试 CPI：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Bob } from "../target/types/bob";
import { Alice } from "../target/types/alice";
import { expect } from "chai";

describe("CPI from Alice to Bob", () => {
  const provider = anchor.AnchorProvider.env();

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const bobProgram = anchor.workspace.Bob as Program<Bob>;
  const aliceProgram = anchor.workspace.Alice as Program<Alice>;
  const dataAccountKeypair = anchor.web3.Keypair.generate();

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await bobProgram.methods
      .initialize()
      .accounts({
        bobDataAccount: dataAccountKeypair.publicKey,
        signer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([dataAccountKeypair])
      .rpc();
  });

  it("Can add numbers then double!", async () => {
    // Add your test here.
    const tx = await aliceProgram.methods
      .askBobToAddThenDouble(new anchor.BN(4), new anchor.BN(2))
      .accounts({
        bobDataAccount: dataAccountKeypair.publicKey,
        bobProgram: bobProgram.programId,
      })
      .rpc();
  });

   it("Can assert value in Bob's data account equals 4 + 2", async () => {

    const BobAccountValue = (
      await bobProgram.account.bobData.fetch(dataAccountKeypair.publicKey)    ).result.toNumber();
    expect(BobAccountValue).to.equal(6);
  });
});
```

## 一行代码进行 CPI

由于传递给 Alice 的 ctx 账户包含进行交易所需的所有账户的引用，我们可以在该结构体的 `impl` 中创建一个函数来完成 CPI。记住，所有 `impl` 都是将函数“附加”到一个结构体上，可以使用结构体中的数据。由于 `ctx` 结构体 `AliceOp` 已经包含了 `Bob` 进行交易所需的所有账户，我们可以将所有 CPI 代码移到：

```
let cpi_ctx = CpiContext::new(
    ctx.accounts.bob_program.to_account_info(),

    BobAddOp {
        bob_data_account: ctx.accounts.bob_data_account.to_account_info(),
    }
);
```

像这样的 `impl`:

```
let cpi_ctx = CpiContext::new(
    ctx.accounts.bob_program.to_account_info(),
    BobAddOp {
        bob_data_account:
 ctx.accounts.bob_data_account.to_account_info(),
    }
);

use anchor_lang::prelude::*;
use bob::cpi::accounts::BobAddOp;
use bob::program::Bob;
use bob::BobData;

// REPLACE WITTH YOUR <PROGRAM_ID>declare_id!
("B2BNs2GecG8Ux5EchDDFZakRWX2NDfy1RDhPCTJuJtr5");

#[program]
pub mod alice {
    use super::*;

    pub fn ask_bob_to_add(ctx: Context<AliceOp>, a: u64, b: u64) -> Result<()> {
        // Calls the `bob_add_operation` function in bob program
        let res = bob::cpi::bob_add_operation(ctx.accounts.add_function_ctx(), a, b);
        
        if res.is_ok() {
            return Ok(());
        } else {
            return err!(Errors::CPIToBobFailed);
        }
    }
}

impl<'info> AliceOp<'info> {
    pub fn add_function_ctx(&self) -> CpiContext<'_, '_, '_, 'info, BobAddOp<'info>> {
        // The bob program we are interacting with
        let cpi_program = self.bob_program.to_account_info();

        // Passing the necessary account(s) to the `BobAddOp` account struct in Bob program
        let cpi_account = BobAddOp {
            bob_data_account: self.bob_data_account.to_account_info(),
        };

        // Creates a `CpiContext` object using the new method
        CpiContext::new(cpi_program, cpi_account)
    }
}

#[error_code]
pub enum Errors {
    #[msg("cpi to bob failed")]
    CPIToBobFailed,
}

#[derive(Accounts)]
pub struct AliceOp<'info> {
    #[account(mut)]

    pub bob_data_account: Account<'info, BobData>,
    pub bob_program: Program<'info, Bob>,
}
```

我们能够用“一行”代码对 `Bob` 进行 CPI 调用。如果 Alice 程序的其他部分也需要对 Bob 进行 CPI 调用，将代码移动到 `impl` 中可以防止我们复制粘贴创建 `CpiContext` 的代码。

## 了解更多 RareSkills

本教程是[学习 Solana 开发](https://www.rareskills.io/solana-tutorial)系列的一部分。