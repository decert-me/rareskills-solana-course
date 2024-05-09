# 理解 Solana 中的账户所有权：将 SOL 转出 PDA

![solana account owner](https://static.wixstatic.com/media/935a00_46458c8f748f4697835ec9db35ab9657~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_46458c8f748f4697835ec9db35ab9657~mv2.jpg)

在 Solana 中，账户的所有者能够减少 SOL 余额、向账户写入数据以及更改所有者。

以下是 Solana 中账户所有权的摘要：

1) `系统程序` 拥有尚未分配所有权给程序（已初始化）的钱包和密钥对账户。
2) BPFLoader 拥有程序。
3) 程序拥有 [Solana PDA](https://www.rareskills.io/post/solana-pda)。如果所有权已转移给程序，则它也可以拥有密钥对账户（这是在初始化期间发生的事情）。

现在我们来研究这些事实的影响。

## 系统程序拥有密钥对账户

为了说明这一点，让我们使用 Solana CLI 查看我们的 Solana 钱包地址并检查其元数据：

![system program](https://static.wixstatic.com/media/935a00_18047d3cc76b443f8ed1db16968ed951~mv2.png/v1/fill/w_740,h_204,al_c,lg_1,q_85,enc_auto/935a00_18047d3cc76b443f8ed1db16968ed951~mv2.png)

请注意，所有者不是我们的地址，而是一个地址为 111…111 的账户。这是系统程序，与我们在早期教程中看到的那个移动 SOL 的系统程序相同。

**只有账户的所有者才能修改其中的数据**

这包括减少 lamport 数据（你无需是所有者即可增加另一个账户的 lamport 数据，我们稍后会看到）。

尽管你在某种形而上学意义上“拥有”你的钱包，但从 Solana 运行时的角度来看，你无法直接向其中写入数据或减少 lamport 余额，因为你不是所有者。

你之所以能够在你的钱包中花费 SOL，是因为你拥有生成该地址或公钥的私钥。当`系统程序`认识到你为公钥生成了有效签名时，它将认可你请求花费账户中的 lamports 是合法的，然后根据你的指示花费它们。

然而，系统程序并没有提供一个机制，让签名者直接向账户写入数据。

上面示例中显示的账户是一个密钥对账户，或者我们可能认为是一个“常规 Solana 钱包”。系统程序是密钥对账户的所有者。

## 程序初始化的 PDAs 和密钥对账户由程序拥有

程序可以写入由程序初始化但在程序外创建的 PDA 或密钥对账户的原因是因为程序拥有它们。

当我们讨论重新初始化攻击时，我们将更仔细地探讨初始化，但现在，重要的一点是**初始化账户会将账户的所有者从系统程序更改为程序。**

为了说明这一点，考虑以下初始化 PDA 和密钥对账户的程序。Typescript 测试将在初始化事务之前和之后记录所有者。

如果我们尝试确定一个不存在的地址的所有者，我们会得到一个 `null`。

以下是 Rust 代码：

```
use anchor_lang::prelude::*;

declare_id!("C2ZKJPhNiCM6CqTneGUXJoE4o6YhMzNUes3q5WNcH3un");

#[program]
pub mod owner {
    use super::*;

    pub fn initialize_keypair(ctx: Context<InitializeKeypair>) -> Result<()> {
        Ok(())
    }

    pub fn initialize_pda(ctx: Context<InitializePda>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeKeypair<'info> {
    #[account(init, payer = signer, space = 8)]
    keypair: Account<'info, Keypair>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePda<'info> {
    #[account(init, payer = signer, space = 8, seeds = [], bump)]
    pda: Account<'info, Pda>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[account]
pub struct Keypair();

#[account]
pub struct Pda();
```

以下是 Typescript 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Owner } from "../target/types/owner";

async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount * anchor.web3.LAMPORTS_PER_SOL);
  await confirmTransaction(airdropTx);
}

async function confirmTransaction(tx) {
  const latestBlockHash = await anchor.getProvider().connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: tx,
  });
}

describe("owner", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Owner as Program<Owner>;

  it("Is initialized!", async () => {
    console.log("program address", program.programId.toBase58());    
    const seeds = []
    const [pda, bump_] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);

    console.log("owner of pda before initialize:",
                await anchor.getProvider().connection.getAccountInfo(pda));

    await program.methods.initializePda()
    .accounts({pda: pda}).rpc();

    console.log("owner of pda after initialize:",
                (await anchor.getProvider().connection.getAccountInfo(pda)).owner.toBase58());

    let keypair = anchor.web3.Keypair.generate();

    console.log("owner of keypair before airdrop:",
                await anchor.getProvider().connection.getAccountInfo(keypair.publicKey));

    await airdropSol(keypair.publicKey, 1); // 1 SOL
   
    console.log("owner of keypair after airdrop:",
                (await anchor.getProvider().connection.getAccountInfo(keypair.publicKey)).owner.toBase58());
    
    await program.methods.initializeKeypair()
      .accounts({keypair: keypair.publicKey})
      .signers([keypair]) // the signer must be the keypair
      .rpc();

    console.log("owner of keypair after initialize:",
                (await anchor.getProvider().connection.getAccountInfo(keypair.publicKey)).owner.toBase58());
 
  });
});
```

测试的工作方式如下：

1) 预测 PDA 的地址并查询所有者。得到 `null`。
2) 调用 `initializePDA` 然后查询所有者。得到程序的地址。
3) 生成一个密钥对账户并查询所有者。得到 `null`。
4) 向密钥对账户空投 SOL。现在所有者是系统程序，就像一个普通的钱包一样。
5) 调用 `initializeKeypair` 然后查询所有者。得到程序的地址。

测试结果截图如下：

![print solana account owner](https://static.wixstatic.com/media/935a00_55cd8f204aa64cf2a105fc745f5a18fa~mv2.png/v1/fill/w_740,h_157,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_55cd8f204aa64cf2a105fc745f5a18fa~mv2.png)

这就是程序能够向账户写入数据的方式：它们拥有这些账户。在初始化期间，程序接管了账户的所有权。

**练习：** 修改测试以打印密钥对和 PDA 的地址。然后使用 Solana CLI 检查这些账户的所有者是谁。它应该与测试打印的内容相匹配。确保 `solana-test-validator` 在后台运行，以便你可以使用 CLI。

## BPFLoaderUpgradeable 拥有程序

让我们使用 Solana CLI 确定我们的程序的所有者：

![BPFLoaderUpgradeable](https://static.wixstatic.com/media/935a00_396ec64ed6bf429fb84fd1252b62cdb6~mv2.png/v1/fill/w_740,h_185,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_396ec64ed6bf429fb84fd1252b62cdb6~mv2.png)

部署程序的钱包并不是其所有者。Solana 程序之所以能够被部署的钱包升级，是因为 BpfLoaderUpgradeable 能够向程序写入新的字节码，并且它只会接受来自预先指定地址的新字节码：最初部署程序的地址。

当我们部署（或升级）一个程序时，实际上是在调用 BPFLoaderUpgradeable 程序，如日志所示：

![BPFLoader call](https://static.wixstatic.com/media/935a00_b29171cb29a34ae49c47c92571e49af9~mv2.png/v1/fill/w_740,h_149,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_b29171cb29a34ae49c47c92571e49af9~mv2.png)

## 程序可以转移拥有账户的所有权

这可能是你不太经常使用的功能，但以下是执行此操作的代码。

Rust：

```
use anchor_lang::prelude::*;
use std::mem::size_of;
use anchor_lang::system_program;

declare_id!("Hxj38tktrD7YcSvKRxVrYQfxptkZd7NVbmrRKvLxznyA");


#[program]
pub mod change_owner {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn change_owner(ctx: Context<ChangeOwner>) -> Result<()> {
        let account_info = &mut ctx.accounts.my_storage.to_account_info();
        
				// assign is the function to transfer ownership
				account_info.assign(&system_program::ID);

				// we must erase all the data in the account or the transfer will fail
        let res = account_info.realloc(0, false);

        if !res.is_ok() {
            return err!(Err::ReallocFailed);
        }

        Ok(())
    }
}

#[error_code]
pub enum Err {
    #[msg("realloc failed")]
    ReallocFailed,
}

#[derive(Accounts)]
pub struct Initialize<'info> {

    #[account(init,
              payer = signer,
              space=size_of::<MyStorage>() + 8,
              seeds = [],
              bump)]
    pub my_storage: Account<'info, MyStorage>,
    
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ChangeOwner<'info> {
    #[account(mut)]
    pub my_storage: Account<'info, MyStorage>,
}

#[account]
pub struct MyStorage {
    x: u64,
}
```

Typescript：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ChangeOwner } from "../target/types/change_owner";

import privateKey from '/Users/jeffreyscholz/.config/solana/id.json';

describe("change_owner", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ChangeOwner as Program<ChangeOwner>;

  it("Is initialized!", async () => {
    const deployer = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(privateKey));

    const seeds = []
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);

    console.log("the storage account address is", myStorage.toBase58());

    await program.methods.initialize().accounts({myStorage: myStorage}).rpc();
    await program.methods.changeOwner().accounts({myStorage: myStorage}).rpc();
    
		// after the ownership has been transferred
		// the account can still be initialized again
		await program.methods.initialize().accounts({myStorage: myStorage}).rpc();
  });
});
```

以下是我们要注意的一些事项：

- 在转移账户后，必须在同一事务中擦除数据。否则，我们可能会向其他程序拥有的账户插入数据。这是 `account_info.realloc(0, false);` 代码。`false` 表示不要清零数据，但这没有关系，因为数据已经不存在了。
- 转移账户所有权并不会永久删除账户，它可以再次初始化，正如测试所示。

既然我们清楚地了解了程序拥有由它们初始化的 PDAs 和密钥对账户，我们可以做的有趣且有用的事情是将 SOL 从中转出。

## 从 PDA 转出 SOL：众筹示例

以下是一个简单的众筹应用程序的代码。感兴趣的函数是 `withdraw` 函数，其中程序将 lamports 从 PDA 转出并转给提款人。

```
use anchor_lang::prelude::*;
use anchor_lang::system_program;
use std::mem::size_of;
use std::str::FromStr;

declare_id!("BkthFL8LV2V2MxVgQtA9tT5goeeJhUdxRPahzavqHPFZ");

#[program]
pub mod crowdfund {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let initialized_pda = &mut ctx.accounts.pda;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.signer.to_account_info().clone(),
                to: ctx.accounts.pda.to_account_info().clone(),
            },
        );

        system_program::transfer(cpi_context, amount)?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        ctx.accounts.pda.sub_lamports(amount)?;
        ctx.accounts.signer.add_lamports(amount)?;

        // in anchor 0.28 or lower, use the following syntax:
        // **ctx.accounts.pda.to_account_info().try_borrow_mut_lamports()? -= amount;
        // **ctx.accounts.signer.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(init, payer = signer, space=size_of::<Pda>() + 8, seeds=[], bump)]
    pub pda: Account<'info, Pda>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub pda: Account<'info, Pda>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, address = Pubkey::from_str("5jmigjgt77kAfKsHri3MHpMMFPo6UuiAMF19VdDfrrTj").unwrap())]
    pub signer: Signer<'info>,

    #[account(mut)]
    pub pda: Account<'info, Pda>,
}

#[account]
pub struct Pda {}
```

因为程序拥有 PDA，所以它可以直接从账户中扣除 lamport 余额。

当我们作为正常钱包交易的一部分转移 SOL 时，我们不会直接扣除 lamport 余额，因为我们不是账户的所有者。系统程序拥有钱包，并且只有在看到请求其这样做的交易上有有效签名时，它才会扣除 lamport 余额。

在这种情况下，程序拥有 PDA，因此可以直接从中扣除 lamports。

代码中还值得注意的一些内容：

- 我们硬编码了谁可以从 PDA 提取的约束，使用约束 `#[account(mut, address = Pubkey::from_str("5jmigjgt77kAfKsHri3MHpMMFPo6UuiAMF19VdDfrrTj").unwrap())]`。这检查该账户的地址是否与字符串中的地址匹配。为了使此代码工作，我们还需要导入 `use std::str::FromStr;`。要测试此代码，请将字符串中的地址更改为你的 `solana address`。
- 使用 Anchor 0.29，我们可以使用语法 `ctx.accounts.pda.sub_lamports(amount)?;` 和 `ctx.accounts.signer.add_lamports(amount)?;`。对于 Anchor 的早期版本，请使用 `ctx.accounts.pda.to_account_info().try_borrow_mut_lamports()? -= amount;` **和** `ctx.accounts.signer.to_account_info().try_borrow_mut_lamports()? += amount;`。
- 你不需要拥有你要转移 lamports 的账户。

以下是相应的 Typescript 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Crowdfund } from "../target/types/crowdfund";

describe("crowdfund", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Crowdfund as Program<Crowdfund>;

  it("Is initialized!", async () => {
    const programId = await program.account.pda.programId;

    let seeds = [];
    let pdaAccount = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId)[0];

    const tx = await program.methods.initialize().accounts({
      pda: pdaAccount
    }).rpc();

    // transfer 2 SOL
    const tx2 = await program.methods.donate(new anchor.BN(2_000_000_000)).accounts({
      pda: pdaAccount
    }).rpc();

    console.log("lamport balance of pdaAccount",
								await anchor.getProvider().connection.getBalance(pdaAccount));

    // transfer back 1 SOL
		// the signer is the permitted address
    await program.methods.withdraw(new anchor.BN(1_000_000_000)).accounts({
      pda: pdaAccount
    }).rpc();

    console.log("lamport balance of pdaAccount",
							  await anchor.getProvider().connection.getBalance(pdaAccount));

  });
});
```

**练习：** 尝试向接收地址添加比你从 PDA 提取的 lamports 更多的 lamports。即将代码更改为以下内容：

```
ctx.accounts.pda.sub_lamports(amount)?;
// sneak in an extra lamport
ctx.accounts.signer.add_lamports(amount + 1)?;
```

运行时应该会阻止你。

请注意，将 lamport 余额提取到低于租金免除阈值的账户将导致该账户被关闭。如果账户中有数据，那将被擦除。因此，程序应该在提取 SOL 之前跟踪需要多少 SOL 才能获得租金豁免，除非他们不在乎账户被擦除。

## 通过 RareSkills 了解更多

请查看我们的 [Solana 教程](https://www.rareskills.io/solana-tutorial) 以获取完整的主题列表。