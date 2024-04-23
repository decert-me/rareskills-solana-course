# 删除和关闭 Solana 中的账户和程序

![Solana close acocunt](https://static.wixstatic.com/media/935a00_74aadefdf66141ac8156b6fb8a78cbfd~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_74aadefdf66141ac8156b6fb8a78cbfd~mv2.jpg)

在 Solana 的 Anchor 框架中，`close` 是 `init`（在 Anchor 中初始化账户）的相反操作 — 它将 lamport 余额减少到零，将 lamports 发送到目标地址，并将账户的所有者更改为系统程序。

以下是在 Rust 中使用 `close` 指令的示例：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("8gaSDFr5cVy2BkLrWfSX9MCtPX9N4gmXDvTVm7RS6DYK");

#[program]
pub mod close_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn delete(ctx: Context<Delete>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = signer, space = size_of::<ThePda>() + 8, seeds = [], bump)]
    pub the_pda: Account<'info, ThePda>,

    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Delete<'info> {
    #[account(mut, close = signer, )]
    pub the_pda: Account<'info, ThePda>,

    #[account(mut)]
    pub signer: Signer<'info>,
}

#[account]
pub struct ThePda {
    pub x: u32,
}
```

### Solana 为关闭账户返回租金

`close = signer` 宏指定交易中的签名者将收到为存储支付的租金（当然也可以指定其他地址）。这类似于以太坊中的 selfdestruct（在 Decun 升级之前）为清理空间的用户退款。关闭账户可以获得的 SOL 数量与账户大小成比例。

以下是调用 `initialize` 后跟 `delete` 的 Typescript：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CloseProgram } from "../target/types/close_program";
import { assert } from "chai";

describe("close_program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.CloseProgram as Program<CloseProgram>;

  it("Is initialized!", async () => {
   let [thePda, _bump] = anchor.web3.PublicKey.findProgramAddressSync([], program.programId);
    await program.methods.initialize().accounts({thePda: thePda}).rpc();
    await program.methods.delete().accounts({thePda: thePda}).rpc();

    let account = await program.account.thePda.fetchNullable(thePda);
    console.log(account)
  });
});
```

`close = signer` 指令表示将租金 lamports 发送给签名者，但你可以指定任何你喜欢的地址。

**上述结构允许任何人关闭账户**，你可能希望在真实应用程序中添加某种访问控制！

## 关闭后可以初始化账户

如果在关闭账户后调用 initialize，则会再次初始化。当然，之前赎回的租金必须再次支付。

**练习：** 在单元测试中添加另一个调用以初始化，以查看其是否通过。请注意，在测试结束时，账户不再为空。

## close 在底层执行了什么操作？

如果我们查看 Anchor 中 close 命令的[源代码](https://github.com/coral-xyz/anchor/blob/v0.29.0/lang/src/common.rs) ，我们可以看到它执行了我们上面描述的操作：

![Anchor close source code](https://static.wixstatic.com/media/935a00_dfd66357bad44b758fce6240bebae673~mv2.png/v1/fill/w_740,h_354,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_dfd66357bad44b758fce6240bebae673~mv2.png)

## 许多 Anchorlang 示例已过时

在 Anchor 的 0.25 版本中，关闭序列不同。

与当前实现类似，它首先将所有 lamports 发送到目标地址。

但是，与擦除数据并将其转移到系统程序不同，`close` 会写入一个称为 `CLOSE_ACCOUNT_DISCRIMINATOR` 的特殊 8 字节序列。( [原始代码](https://github.com/coral-xyz/anchor/blob/v0.25.0/lang/src/lib.rs#L273) )：

![Anchor account discriminator](https://static.wixstatic.com/media/935a00_24b182dead824479901e064b4ae16dda~mv2.png/v1/fill/w_740,h_42,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_24b182dead824479901e064b4ae16dda~mv2.png)

最终，运行时会擦除账户，因为它的 lamports 为零。

### Anchor 中的账户鉴别器是什么？

当 Anchor 初始化账户时，它计算鉴别器并将其存储在账户的前 8 个字节中。账户鉴别器是结构的 Rust 标识符的 SHA256 的前 8 个字节。

当用户要求程序通过 `pub the_pda: Account<'info, ThePda>` 加载账户时，程序将计算 `ThePda` 标识符的 SHA256 的前 8 个字节。然后，它将加载 `ThePda` 数据并将存储在那里的鉴别器与计算的鉴别器进行比较。如果它们不匹配，则 Anchor 将不会反序列化账户。

这里的目的是防止攻击者制作一个恶意账户，当通过“错误的结构”解析时，会反序列化为意外结果。

### 为什么 Anchor 以 [255, …, 255] 设置账户鉴别器

通过将账户鉴别器设置为全为 1，然后 Anchor 将始终拒绝反序列化账户，因为它不会与任何账户鉴别器匹配。

将账户鉴别器写为全为 1 的原因是为了防止攻击者在运行时擦除之前直接向账户发送 SOL。在这种情况下，程序“认为”关闭了程序，但攻击者“复活”了它。如果旧的账户鉴别器仍然存在，那么被认为已删除的数据将被重新读取。

### 为什么不再需要将账户鉴别器设置为 [255, …, 255]

通过改变所有权为系统程序，复活账户不会导致程序突然“拥有”该账户，系统程序拥有复活的账户，攻击者浪费了 SOL。

要将所有权重新更改为程序，需要明确再次初始化，不能通过发送 SOL 来复活，以防止运行时擦除它。

## 通过 CLI 关闭程序

要关闭程序，而不是由其拥有的账户，我们可以使用命令行：

```
solana program close <address> --bypass warning
```

警告是一旦关闭程序，具有相同地址的程序将无法重新创建。以下是演示关闭账户的一系列 shell 命令：

![solana close program cli](https://static.wixstatic.com/media/935a00_6656a12dd8ab418eb568038dc955fbeb~mv2.png/v1/fill/w_740,h_235,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_6656a12dd8ab418eb568038dc955fbeb~mv2.png)

以下是上述截图中的命令序列：

1. 首先部署程序
2. 我们关闭程序时没有使用 --bypass warning 标志，工具会警告我们无法再次部署程序
3. 我们使用标志关闭程序，程序关闭，我们收到 2.918 SOL 作为关闭账户的退款
4. 我们尝试再次部署，但失败，因为关闭的程序无法重新部署

## 通过 RareSkills 了解更多

要继续学习 Solana 开发，请查看我们的 [Solana 课程](https://www.rareskills.io/solana-tutorial) 。有关其他区块链主题，请查看我们的[区块链训练营](https://www.rareskills.io/web3-blockchain-bootcamps) 。