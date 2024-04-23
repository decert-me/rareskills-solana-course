# 使用不同签名者修改账户

更新日期：3 月 11 日

![锚点签名者](https://static.wixstatic.com/media/935a00_8a5622df6d344ca3bd3d548454a703fe~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_8a5622df6d344ca3bd3d548454a703fe~mv2.jpg)

到目前为止，在我们的 [Solana 教程](https://www.rareskills.io/solana-tutorial)中，我们只初始化并向账户写入了一个账户。

实际上，这是非常受限制的。例如，如果用户 Alice 正在向 Bob 转移积分，Alice 必须能够向由用户 Bob 初始化的账户写入。

在本教程中，我们将演示使用一个钱包初始化一个账户，然后使用另一个钱包更新它。

## 初始化步骤

我们一直在使用的用于初始化账户的 Rust 代码没有变化：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("61As9Y8pREgvFZzps6rpFai8UkageeHT6kW1dnGRiefb");

#[program]
pub mod other_write {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
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

#[account]
pub struct MyStorage {
    x: u64,
}
```

### 使用另一个钱包进行初始化交易

然而，在客户端代码中有一个重要的变化：

- 为了测试目的，我们创建了一个名为`newKeypair`的新钱包。这与 Anchor 默认提供的钱包不同。
- 我们向该新钱包空投 1 SOL，以便它可以支付交易费用。
- 注意注释`// THIS MUST BE EXPLICITLY SPECIFIED`。我们将该钱包的公钥传递给`Signer`字段。当我们使用 Anchor 内置的默认签名者时，Anchor 会在后台为我们传递这个。但是，当我们使用不同的钱包时，我们需要明确提供这个。
- 我们将签名者设置为`newKeypair`，使用`.signers([newKeypair])`配置。

我们将在这段代码片段之后解释为什么我们（表面上）要指定签名者两次：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OtherWrite } from "../target/types/other_write";

// this airdrops sol to an address
async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount);
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

describe("other_write", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.OtherWrite as Program<OtherWrite>;

  it("Is initialized!", async () => {
    const newKeypair = anchor.web3.Keypair.generate();
    await airdropSol(newKeypair.publicKey, 1e9); // 1 SOL

    let seeds = [];
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
    
    await program.methods.initialize().accounts({
      myStorage: myStorage,
      signer: newKeypair.publicKey // ** THIS MUST BE EXPLICITLY SPECIFIED **
    }).signers([newKeypair]).rpc();
  });
});
```

Anchor 不要求将键`signer`称为`signer`。

**练习：** 在 Rust 代码中，将`payer = signer`更改为`payer = fren`，将`pub signer: Signer<'info>`更改为`pub fren: Signer<'info>`，并在测试中将`signer: newKeypair.publicKey`更改为`fren: newKeypair.publicKey`。初始化应该成功，测试应该通过。

## 为什么 Anchor 需要指定签名者和公钥？

起初，我们似乎是在重复指定签名者两次，但让我们仔细看一下：

![Anchor 中的签名者类型](https://static.wixstatic.com/media/935a00_e6738de42e754598bdc0b91d6b161675~mv2.png/v1/fill/w_740,h_686,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_e6738de42e754598bdc0b91d6b161675~mv2.png)

在红框中，我们看到`fren`字段被指定为一个签名者账户。**`Signer`类型意味着 Anchor 将查看交易的签名，并确保签名与此处传递的地址匹配。**

稍后我们将看到如何使用这一点来验证签名者是否被授权执行某个交易。

Anchor 一直在幕后做这件事，但由于我们传入了一个除了 Anchor 默认使用的签名者之外的`Signer`，我们必须明确指定`Signer`是哪个账户。

## 错误：Solana Anchor 中的未知签名者

当交易的签名者与传递给`Signer`的公钥不匹配时，会出现`unknown signer`错误。

假设我们修改测试以删除`.signers([newKeypair])`规范。Anchor 将使用默认签名者，而默认签名者将不匹配我们的`newKeypair`钱包的`publicKey`：

![使用默认签名者，将另一个密钥对作为签名者](https://static.wixstatic.com/media/935a00_2b7cffddcb2a490aaea4396ee71a47a1~mv2.png/v1/fill/w_740,h_167,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_2b7cffddcb2a490aaea4396ee71a47a1~mv2.png)

我们将收到以下错误：

![签名验证失败](https://static.wixstatic.com/media/935a00_e65c13cd81be466dbb8abed42a18c3f4~mv2.png/v1/fill/w_740,h_147,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_e65c13cd81be466dbb8abed42a18c3f4~mv2.png)

同样，如果我们不显式传递公钥，Anchor 将悄悄使用默认签名者：

![使用不同的密钥对作为签名者，但使用默认签名者地址作为公钥](https://static.wixstatic.com/media/935a00_3d3ff1498fb74e98a9d153733f621ade~mv2.png/v1/fill/w_740,h_178,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_3d3ff1498fb74e98a9d153733f621ade~mv2.png)

然后我们将收到以下错误：未知签名者：

![错误：未知签名者](https://static.wixstatic.com/media/935a00_6cffaab9b57f4f40ad296c048769d223~mv2.png/v1/fill/w_740,h_142,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_6cffaab9b57f4f40ad296c048769d223~mv2.png)

有点误导，Anchor 并不是说签名者未知，因为它没有被明确指定。Anchor 能够确定如果没有指定签名者，那么它将使用默认签名者。如果我们同时删除`.signers([newKeypair])`代码和`fren: newKeypair.publicKey`代码，则 Anchor 将对公钥进行检查使用默认签名者，并验证签名者的签名是否与公钥匹配。

以下代码将导致初始化成功，因为`Signer`公钥和签署交易的账户都是 Anchor 默认签名者。

![使用默认签名者进行初始化](https://static.wixstatic.com/media/935a00_f4422a244375428b8b18b9990d7aa1d3~mv2.png/v1/fill/w_433,h_72,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_f4422a244375428b8b18b9990d7aa1d3~mv2.png)

![使用默认签名者进行初始化测试通过](https://static.wixstatic.com/media/935a00_8c4141658d744bfe980e6063b598eb6d~mv2.png/v1/fill/w_432,h_101,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_8c4141658d744bfe980e6063b598eb6d~mv2.png)

## Bob 可以向 Alice 初始化的账户写入

下面展示了一个包含初始化账户和向其写入的功能的 Anchor 程序。

这将与我们的 [Solana 计数器程序教程](https://www.rareskills.io/post/solana-counter-program)中熟悉，但请注意在底部附近的`// THIS FIELD MUST BE INCLUDED`注释标记的小添加：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("61As9Y8pREgvFZzps6rpFai8UkageeHT6kW1dnGRiefb");

#[program]
pub mod other_write {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn update_value(ctx: Context<UpdateValue>, new_value: u64) -> Result<()> {
        ctx.accounts.my_storage.x = new_value;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
              payer = fren,
              space=size_of::<MyStorage>() + 8,
              seeds = [],
              bump)]
    pub my_storage: Account<'info, MyStorage>,

    #[account(mut)]
    pub fren: Signer<'info>, // A public key is passed here

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateValue<'info> {
    #[account(mut, seeds = [], bump)]
    pub my_storage: Account<'info, MyStorage>,

	// THIS FIELD MUST BE INCLUDED
    #[account(mut)]
    pub fren: Signer<'info>,
}

#[account]
pub struct MyStorage {
    x: u64,
}
```

以下客户端代码将为 Alice 和 Bob 创建一个钱包，并向他们每人空投 1 SOL。Alice 将初始化账户`MyStorage`，而 Bob 将向其写入：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OtherWrite } from "../target/types/other_write";

// this airdrops sol to an address
async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount);
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

describe("other_write", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.OtherWrite as Program<OtherWrite>;

  it("Is initialized!", async () => {
    const alice = anchor.web3.Keypair.generate();
    const bob = anchor.web3.Keypair.generate();

    const airdrop_alice_tx = await anchor.getProvider().connection.requestAirdrop(alice.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_tx);

    const airdrop_alice_bob = await anchor.getProvider().connection.requestAirdrop(bob.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_bob);

    let seeds = [];
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
    
    // ALICE INITIALIZE ACCOUNT
    await program.methods.initialize().accounts({
      myStorage: myStorage,
      fren: alice.publicKey
    }).signers([alice]).rpc();

    // BOB WRITE TO ACCOUNT
    await program.methods.updateValue(new anchor.BN(3)).accounts({
      myStorage: myStorage,
      fren: bob.publicKey
    }).signers([bob]).rpc();

    let value = await program.account.myStorage.fetch(myStorage);
    console.log(`value stored is ${value.x}`);
  });
});
```

## 限制对 Solana 账户的写入

在实际应用中，我们不希望 Bob 向任意账户写入任意数据。让我们创建一个基本示例，用户可以使用 10 个积分初始化一个账户，并将这些积分转移到另一个账户。（显然，黑客可以使用不同的钱包创建任意多的账户，但这超出了我们示例的范围）。

## 构建原型 ERC20 程序

Alice 应该能够修改她自己的账户和 Bob 的账户。也就是说，她应该能够扣除自己的积分并向 Bob 增加积分。她不应该能够扣除 Bob 的积分 — 只有 Bob 才能做到这一点。

按照惯例，在 Solana 中，我们将可以对账户进行特权更改的地址称为“授权者”。在账户结构中存储“授权者”字段是一种常见模式，表示只有该账户才能对该账户执行敏感操作（例如在我们的示例中扣除积分）。

这在某种程度上类似于 Solidity 中的 [onlyOwner 模式](https://www.rareskills.io/post/openzeppelin-ownable2step) ，不同之处在于它不适用于整个合约，而是仅适用于单个账户：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("HFmGQX4wPgPYVMFe4WrBi925NKvGySrEG2LGyRXsXJ4Z");

const STARTING_POINTS: u32 = 10;

#[program]
pub mod points {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.player.points = STARTING_POINTS;
        ctx.accounts.player.authority = ctx.accounts.signer.key();
        Ok(())
    }

    pub fn transfer_points(ctx: Context<TransferPoints>,
                           amount: u32) -> Result<()> {
        require!(ctx.accounts.from.authority == ctx.accounts.signer.key(),
								 Errors::SignerIsNotAuthority);
        require!(ctx.accounts.from.points >= amount,
                 Errors::InsufficientPoints);
        
        ctx.accounts.from.points -= amount;
        ctx.accounts.to.points += amount;
        Ok(())
    }
}

#[error_code]
pub enum Errors {
    #[msg("SignerIsNotAuthority")]
    SignerIsNotAuthority,
    #[msg("InsufficientPoints")]
    InsufficientPoints
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init,
              payer = signer,
              space = size_of::<Player>() + 8,
              seeds = [&(signer.as_ref().key().to_bytes())],
              bump)]
    player: Account<'info, Player>,
    #[account(mut)]
    signer: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferPoints<'info> {
    #[account(mut)]
    from: Account<'info, Player>,
    #[account(mut)]
    to: Account<'info, Player>,
    #[account(mut)]
    signer: Signer<'info>,
}

#[account]
pub struct Player {
    points: u32,
    authority: Pubkey
}
```

请注意，我们使用签名者的地址（&(signer.as_ref().key().to_bytes())）来派生存储其积分的账户地址。这类似于 Solana 中的 Solidity [映射](https://www.rareskills.io/post/solana-solidity-mapping)，其中 [Solana“msg.sender / tx.origin”](https://www.rareskills.io/post/msg-sender-solana) 是键。

在`initialize`函数中，程序将初始积分设置为`10`，并将授权者设置为`signer`。用户无法控制这些初始值。

`transfer_points`函数使用 [Solana Anchor require 宏和错误代码宏](https://www.rareskills.io/post/solana-require-macro)来确保：1）交易的签名者是正在扣除余额的账户的授权者；2）账户有足够的积分余额进行转移。

测试代码库应该很容易理解。Alice 和 Bob 初始化他们的账户，然后 Alice 将 5 个积分转移到 Bob：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Points } from "../target/types/points";

// this airdrops sol to an address
async function airdropSol(publicKey, amount) {
  let airdropTx = await anchor.getProvider().connection.requestAirdrop(publicKey, amount);
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

describe("points", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Points as Program<Points>;


  it("Alice transfers points to Bob", async () => {
    const alice = anchor.web3.Keypair.generate();
    const bob = anchor.web3.Keypair.generate();

    const airdrop_alice_tx = await anchor.getProvider().connection.requestAirdrop(alice.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_tx);

    const airdrop_alice_bob = await anchor.getProvider().connection.requestAirdrop(bob.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    await confirmTransaction(airdrop_alice_bob);

    let seeds_alice = [alice.publicKey.toBytes()];
    const [playerAlice, _bumpA] = anchor.web3.PublicKey.findProgramAddressSync(seeds_alice, program.programId);

    let seeds_bob = [bob.publicKey.toBytes()];
    const [playerBob, _bumpB] = anchor.web3.PublicKey.findProgramAddressSync(seeds_bob, program.programId);

    // Alice and Bob initialize their accounts
    await program.methods.initialize().accounts({
      player: playerAlice,
      signer: alice.publicKey,
    }).signers([alice]).rpc();

    await program.methods.initialize().accounts({
      player: playerBob,
      signer: bob.publicKey,
    }).signers([bob]).rpc();

    // Alice transfers 5 points to Bob. Note that this is a u32
    // so we don't need a BigNum
    await program.methods.transferPoints(5).accounts({
      from: playerAlice,
      to: playerBob,
      signer: alice.publicKey,
    }).signers([alice]).rpc();

    console.log(`Alice has ${(await program.account.player.fetch(playerAlice)).points} points`);
    console.log(`Bob has ${(await program.account.player.fetch(playerBob)).points} points`)
  });
});
```

**练习：** 创建一个密钥对`mallory`，并尝试使用`mallory`作为`.signers([mallory])`中的签名者来从 Alice 或 Bob 那里窃取积分。你的攻击应该失败，但你应该尝试。

## 使用 Anchor 约束替换 require!宏

一个替代方法是编写`require!(ctx.accounts.from.authority == ctx.accounts.signer.key(), Errors::SignerIsNotAuthority);`是使用 Anchor 约束。[Anchor 账户文档](https://docs.rs/anchor-lang/latest/anchor_lang/derive.Accounts.html)为我们提供了可用的约束列表。

## Anchor `has_one`约束

`has_one`约束假定#[derive(Accounts)]和`#[account]`之间存在“共享键”，并检查这两个键是否具有相同的值。最好的方法是通过图片来演示：

![Anchor has_one 约束](https://static.wixstatic.com/media/935a00_bfee9678192b41db9831e3adc6016eb2~mv2.png/v1/fill/w_605,h_558,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_bfee9678192b41db9831e3adc6016eb2~mv2.png)

在幕后，如果作为交易的一部分传递的`authority`账户（作为`Signer`）不等于存储在账户中的`authority`，Anchor 将阻止该交易。

在我们上面的实现中，我们在账户中使用了键`authority`，并在`#[derive(Accounts)]`中使用了`signer`。这种键名称不匹配将阻止此宏的工作，因此上面的代码将键`signer`更改为`authority`。`Authority`不是一个特殊关键字，仅仅是一个约定。你可以尝试将所有`authority`实例更改为`fren`，代码将仍然正常工作。

## Anchor `constraint`约束

我们还可以使用 Anchor 约束来替换宏`require!(ctx.accounts.from.points >= amount, Errors::InsufficientPoints);`。

约束宏允许我们对传递给交易的账户和账户中的数据施加任意约束。在我们的情况下，我们希望确保发送方有足够的积分：

```
#[derive(Accounts)]
#[instruction(amount: u32)] // amount must be passed as an instruction
pub struct TransferPoints<'info> {
    #[account(mut,
              has_one = authority,
              constraint = from.points >= amount)]
    from: Account<'info, Player>,
    #[account(mut)]
    to: Account<'info, Player>,
    authority: Signer<'info>,
}

#[account]
pub struct Player {
    points: u32,
    authority: Pubkey
}
```

该宏足够智能，可以识别`from`基于传递给`from`键的账户，并且该账户具有`points`字段。`transfer_points`函数参数中的`amount`必须通过`instruction`宏传递，以便`constraint`宏可以将`amount`与账户中的积分余额进行比较。

## 向 Anchor 约束添加自定义错误消息

通过使用`@`符号添加自定义错误，我们可以改善违反约束时的错误消息的可读性，就像我们在`require!`宏中使用的自定义错误一样：

```
#[derive(Accounts)]
#[instruction(amount: u32)]
pub struct TransferPoints<'info> {
    #[account(mut,
              has_one = authority @ Errors::SignerIsNotAuthority,
              constraint = from.points >= amount @ Errors::InsufficientPoints)]
    from: Account<'info, Player>,
    #[account(mut)]
    to: Account<'info, Player>,
    authority: Signer<'info>,
}

#[account]
pub struct Player {
    points: u32,
    authority: Pubkey
}
```

`Errors`枚举在之前的 Rust 代码中定义了它们，并在`require!`宏中使用了它们。

**练习：** 修改测试以违反`has_one`和`constraint`宏，并观察错误消息。

## 通过 RareSkills 了解更多 Solana 知识

我们的 [Solana 教程](https://www.rareskills.io/solana-tutorial)介绍了如何作为以太坊或 EVM 开发人员学习 Solana。