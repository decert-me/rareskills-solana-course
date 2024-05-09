# PDA（程序派生地址）与 Solana 中的密钥对账户

更新日期：3 月 11 日

![Solana PDA](https://static.wixstatic.com/media/935a00_1e7a9139d15a4acdb28cc700986b5661~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_1e7a9139d15a4acdb28cc700986b5661~mv2.jpg)

程序派生地址（PDA）是一个账户，其地址是从创建它的程序的地址和传递给 `init` 事务的 `seeds` 派生而来的。直到目前为止，我们只使用了 PDAs。

也可以在程序外部创建一个账户，然后在程序内部进行 `init`。

有趣的是，我们在程序外部创建的账户将拥有一个私钥，但我们将看到这并不会产生看似会有的安全影响。我们将称之为“密钥对账户”。

## 账户创建再探讨

在深入研究密钥对账户之前，让我们回顾一下迄今为止在我们的 [Solana 教程](https://www.rareskills.io/solana-tutorial) 中如何创建账户。这是我们一直在使用的相同样板文件，它创建了程序派生地址（PDA）：

```
use anchor_lang::prelude::*;
use std::mem::size_of; 

declare_id!("4wLnxvLwgXGT4eNg3D456K6Fxa1RieaUdERSPQ3WEpuV");

#[program]
pub mod keypair_vs_pda {
    use super::*;

    pub fn initialize_pda(ctx: Context<InitializePDA>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePDA<'info> {

    // This is the program derived address
    #[account(init,
              payer = signer,
              space=size_of::<MyPDA>() + 8,
              seeds = [],
              bump)]
    pub my_pda: Account<'info, MyPDA>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyPDA {
    x: u64,
}
```

以下是调用 `initialize` 的相关 Typescript 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KeypairVsPda } from "../target/types/keypair_vs_pda";

describe("keypair_vs_pda", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.KeypairVsPda as Program<KeypairVsPda>;

  it("Is initialized -- PDA version", async () => {
    const seeds = []
    const [myPda, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);

    console.log("the storage account address is", myPda.toBase58());

    const tx = await program.methods.initializePda().accounts({myPda: myPda}).rpc();
  });
});
```

到目前为止，所有这些都应该很熟悉，只是我们明确地将我们的账户称为“PDA”。

## 程序派生地址

如果账户的地址是从程序的地址派生而来的，即在 `findProgramAddressSync(seeds, program.programId)` 中的 `programId`，那么该账户就是程序派生地址（PDA）。它也是 `seeds` 的一个函数。

具体来说，我们知道它是一个 PDA，因为 `seeds` 和 `bump` 在 `init` 宏中存在。

  

## 密钥对账户

以下代码看起来与上面的代码非常相似，但请注意 `init` 宏缺少 `seeds` 和 `bump`：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("4wLnxvLwgXGT4eNg3D456K6Fxa1RieaUdERSPQ3WEpuV");

#[program]
pub mod keypair_vs_pda {
    use super::*;

    pub fn initialize_keypair_account(ctx: Context<InitializeKeypairAccount>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeKeypairAccount<'info> {
		// This is the program derived address
    #[account(init,
              payer = signer,
              space = size_of::<MyKeypairAccount>() + 8,)]
    pub my_keypair_account: Account<'info, MyKeypairAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct MyKeypairAccount {
    x: u64,
}
```

当缺少 `seed` 和 `bump` 时，**Anchor 程序现在期望我们首先创建一个账户，然后将该账户传递给程序。由于我们自己创建了账户，其地址将不会“派生自”程序的地址。换句话说，它将不是程序派生账户（PDA）。**

为程序创建一个账户就像生成一个新的密钥对一样简单（就像我们在 [Anchor 中测试不同签名者](https://www.rareskills.io/post/anchor-signer) 时使用的方式）。是的，这可能听起来有点可怕，因为我们持有程序用于存储数据的账户的私钥 — 我们稍后会再讨论这一点。现在，以下是创建一个新账户并将其传递给上面程序的 Typescript 代码。接下来我们将注意到重要部分：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KeypairVsPda } from "../target/types/keypair_vs_pda";

// this airdrops sol to an address
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

describe("keypair_vs_pda", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.KeypairVsPda as Program<KeypairVsPda>;

  it("Is initialized -- keypair version", async () => {
		
    const newKeypair = anchor.web3.Keypair.generate();
    await airdropSol(newKeypair.publicKey, 1e9); // 1 SOL

    console.log("the keypair account address is", newKeypair.publicKey.toBase58());

    await program.methods.initializeKeypairAccount()
      .accounts({myKeypairAccount: newKeypair.publicKey})
      .signers([newKeypair]) // the signer must be the keypair
      .rpc();
  });
});
```

我们希望注意以下几点：

- 我们添加了一个实用函数 `airdropSol` 来向我们创建的新密钥对 `newKeypair` 进行 `airdrop` SOL。没有 SOL，它将无法支付交易费用。此外，因为这也是将用于存储数据的账户，它需要一个 SOL 余额以免受[租金豁免](https://www.rareskills.io/post/solana-account-rent)。当进行 SOL 空投时，需要额外的 `confirmTransaction` 程序，因为运行时似乎存在关于何时实际进行 SOL 空投和何时确认交易的竞争条件。
- 我们将 `signers` 从默认值更改为 `newKeypair`。创建密钥对账户时，你无法创建你没有私钥的账户。

## 没有私钥的密钥对账户无法进行 `initialize`

如果你可以使用任意地址创建一个账户，那将是一个重大的安全风险，因为你可以向任意账户插入恶意数据。

**练习：** 修改测试以生成第二个密钥对 `secondKeypair`。使用第二个密钥对的公钥，并将 `.accounts({myKeypairAccount: newKeypair.publicKey})` 替换为 `.accounts({myKeypairAccount: secondKeypair.publicKey})`。不要更改签名者。你应该看到测试失败。你无需向新密钥对进行 SOL 空投，因为它不是交易的签名者。

你应该看到如下错误：

![密钥对账户初始化](https://static.wixstatic.com/media/935a00_e47f12b093224e6781f3dc20596c6892~mv2.png/v1/fill/w_740,h_257,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_e47f12b093224e6781f3dc20596c6892~mv2.png)

## 如果我们尝试伪造 PDA 的地址会怎样？

**练习：** 在上面练习中，不要传入 `secondKeypair`，而是使用以下方式派生一个 PDA：

```
const seeds = []
const [pda, _bump] = anchor
                        .web3
                        .PublicKey
                        .findProgramAddressSync(
                            seeds,
                            program.programId);
```

然后将 `myKeypairAccount` 参数替换为 `.accounts({myKeypairAccount: pda})`

你应该再次看到一个 `unknown signer` 错误。

Solana 运行时不会允许你这样做。如果一个程序的 PDAs 突然出现而它们尚未被初始化，这将导致严重的安全问题。

## 拥有账户的私钥是否是一个问题？

似乎持有私钥的人将能够从账户中花费 SOL，并可能将其降至租金豁免阈值以下。但是，当账户由程序初始化时，Solana 运行时会阻止这种情况发生。

为了证实这一点，请考虑以下单元测试：

- 在 Typescript 中创建一个密钥对账户
- 向密钥对账户进行 SOL 空投
- 从密钥对账户向另一个地址转移 SOL（成功）
- 初始化密钥对账户
- 尝试使用密钥对作为签名者从密钥对账户转移 SOL（失败）

以下是代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KeypairVsPda } from "../target/types/keypair_vs_pda";

// Change this to your path
import privateKey from '/Users/RareSkills/.config/solana/id.json';

import { fs } from fs;

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


describe("keypair_vs_pda", () => {
  const deployer = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(privateKey));

  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.KeypairVsPda as Program<KeypairVsPda>;

  it("Writing to keypair account fails", async () => {
    const newKeypair = anchor.web3.Keypair.generate();
    var recieverWallet = anchor.web3.Keypair.generate();

    await airdropSol(newKeypair.publicKey, 10);

    var transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: newKeypair.publicKey,
        toPubkey: recieverWallet.publicKey,
        lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
      }),
    );
    await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [newKeypair]);
    console.log('sent 1 lamport') 

    await program.methods.initializeKeypairAccount()
      .accounts({myKeypairAccount: newKeypair.publicKey})
      .signers([newKeypair]) // the signer must be the keypair
      .rpc();

  console.log("initialized");

  // try to transfer again, this fails
    var transaction = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: newKeypair.publicKey,
        toPubkey: recieverWallet.publicKey,
        lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
      }),
    );
    await anchor.web3.sendAndConfirmTransaction(anchor.getProvider().connection, transaction, [newKeypair]);
  });
});
```

以下是预期的错误消息：

![无法向密钥对账户写入](https://static.wixstatic.com/media/935a00_48b1cac1d51e4bbb95f29d305b1e6344~mv2.png/v1/fill/w_740,h_164,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_48b1cac1d51e4bbb95f29d305b1e6344~mv2.png)

即使我们持有该账户的私钥，但我们现在无法从该账户“花费 SOL”，因为它现在归程序所有。

## 拥有权和初始化简介

Solana 运行时如何知道在初始化后阻止 SOL 的转移？

**练习：** 修改测试为以下代码。注意已添加的控制台日志语句。它们记录了账户中的“owner”元数据字段和程序的地址：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { KeypairVsPda } from "../target/types/keypair_vs_pda";

import privateKey from '/Users/jeffreyscholz/.config/solana/id.json';


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


describe("keypair_vs_pda", () => {
  const deployer = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(privateKey));

  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.KeypairVsPda as Program<KeypairVsPda>;
  it("Console log account owner", async () => {

    console.log(`The program address is ${program.programId}`) 
    const newKeypair = anchor.web3.Keypair.generate();
    var recieverWallet = anchor.web3.Keypair.generate();

		// get account owner before initialization
    await airdropSol(newKeypair.publicKey, 10);
		const accountInfoBefore = await anchor.getProvider().connection.getAccountInfo(newKeypair.publicKey);
		console.log(`initial keypair account owner is ${accountInfoBefore.owner}`);

    await program.methods.initializeKeypairAccount()
      .accounts({myKeypairAccount: newKeypair.publicKey})
      .signers([newKeypair]) // the signer must be the keypair
      .rpc();

		// get account owner after initialization
		const accountInfoAfter = await anchor.getProvider().connection.getAccountInfo(newKeypair.publicKey);
		console.log(`initial keypair account owner is ${accountInfoAfter.owner}`);
  });
});
```

以下截图显示了预期结果：

![账户拥有权](https://static.wixstatic.com/media/935a00_210bf2a0dc0d49e48fc9d07c4b04b4f2~mv2.png/v1/fill/w_740,h_190,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_210bf2a0dc0d49e48fc9d07c4b04b4f2~mv2.png)

初始化后，密钥对账户的所有者从 `111...111` 更改为部署的程序。我们尚未在我们的 [Solana 教程](https://www.rareskills.io/solana-tutorial) 中深入讨论账户所有权或系统程序（全为 1 的地址）。但是，这应该让你了解“初始化”正在做什么以及为什么私钥的所有者不再能够将 SOL 转移出账户。

## 我应该使用 PDAs 还是密钥对账户？

一旦账户被初始化，它们的行为方式相同，因此实际上没有太大区别。

唯一显著的区别（这不会影响大多数应用程序）是 PDAs 只能以 10,240 字节的大小进行初始化，但密钥对账户可以初始化到完整的 10 MB 大小。但是，PDA 可以调整大小以达到 10 MB 的限制。

大多数应用程序使用 PDAs，因为它们可以通过 `seeds` 参数以编程方式寻址，但要访问密钥对账户，你必须事先知道地址。我们囊括密钥对账户的讨论，因为在线教程中有几个示例使用它们，所以我们希望你有一些背景知识。然而，在实践中，PDAs 是存储数据的首选方式。

## 通过 RareSkills 了解更多

继续学习我们的 [Solana 课程](https://www.rareskills.io/solana-tutorial)！