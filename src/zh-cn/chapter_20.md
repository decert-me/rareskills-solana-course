# Solana 中的存储成本、最大存储大小和账户调整

![solana 账户租金](https://static.wixstatic.com/media/935a00_0d3663d61dff48bf81ac520eee9261b7~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_0d3663d61dff48bf81ac520eee9261b7~mv2.jpg)

在分配存储空间时，付款人必须按每分配的字节支付一定数量的 SOL。

Solana 将此称为“租金”。这个名称有点误导，因为它暗示需要每月充值，但情况并非总是如此。一旦支付了租金，即使两年过去了，也不需要再付款。支付了两年的租金后，该账户被视为“租金豁免”。

这个名称源自 Solana 最初按年度的字节数收费。如果你只支付了半年的租金，你的账户将在六个月后被删除。如果你提前支付了两年的租金，该账户将被视为“租金豁免”。该账户将永远不必再支付租金。如今，所有账户都必须是租金豁免的；你不能支付少于 2 年的租金。

尽管租金是按“每字节”计算的，但零数据的账户并不是免费的；Solana 仍然必须对其进行索引并存储有关其的元数据。

**当初始化账户时，需要在后台计算所需的租金数量；你无需明确计算租金。**

但是，你确实希望能够预估存储成本，以便能够正确设计你的应用程序。

如果你想要快速估算，可以在命令行中运行 `solana rent <字节数>` 来快速获得答案：

![solana 租金 32](https://static.wixstatic.com/media/935a00_f4d109b3ccca403aaa4474180b6044be~mv2.png/v1/fill/w_350,h_67,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_f4d109b3ccca403aaa4474180b6044be~mv2.png)

如前所述，分配零字节并不是免费的：

![solana 租金 0](https://static.wixstatic.com/media/935a00_38db1f0b0eb9473bae5c0d6148f63c1d~mv2.png/v1/fill/w_350,h_67,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_38db1f0b0eb9473bae5c0d6148f63c1d~mv2.png)

让我们看看如何计算这个费用。

[Anchor Rent Module](https://docs.rs/solana-program/latest/solana_program/rent/index.html) 提供了一些与租金相关的常量：

- `ACCOUNT_STORAGE_OVERHEAD`：此常量的值为 128（字节），正如其名称所示，空账户有 128 字节的开销。
- `DEFAULT_EXEMPTION_THRESHOLD`：此常量的值为 2.0（float 64），表示提前支付两年的租金使账户免除进一步支付租金。
- `DEFAULT_LAMPORTS_PER_BYTE_YEAR`：此常量的值为 3,480，意味着每个字节需要 3,480 lamports 每年。由于我们需要支付两年的租金，每个字节将花费我们 6,960 lamports。

以下的 rust 程序打印出一个空账户将花费我们多少。请注意，结果与上面的 `solana rent 0` 的截屏相匹配：

```
use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent as rent_module;

declare_id!("BfMny1VwizQh89rZtikEVSXbNCVYRmi6ah8kzvze5j1S");

#[program]
pub mod rent {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let cost_of_empty_acc = rent_module::ACCOUNT_STORAGE_OVERHEAD as f64 * 
                                rent_module::DEFAULT_LAMPORTS_PER_BYTE_YEAR as f64 *
                                rent_module::DEFAULT_EXEMPTION_THRESHOLD; 

        msg!("cost to create an empty account: {}", cost_of_empty_acc);
        // 890880

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

如果我们想要计算一个非空账户将花费多少，那么我们只需将字节数添加到空账户的成本中，如下所示：

```
use anchor_lang::prelude::*;
use anchor_lang::solana_program::rent as rent_module;

declare_id!("BfMny1VwizQh89rZtikEVSXbNCVYRmi6ah8kzvze5j1S");

#[program]
pub mod rent {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let cost_of_empty_acc = rent_module::ACCOUNT_STORAGE_OVERHEAD as f64 * 
                                rent_module::DEFAULT_LAMPORTS_PER_BYTE_YEAR as f64 *
                                rent_module::DEFAULT_EXEMPTION_THRESHOLD;

        msg!("cost to create an empty account: {}", cost_of_empty_acc);
        // 890,880 lamports
        
        let cost_for_32_bytes = cost_of_empty_acc + 
                                32 as f64 * 
                                rent_module::DEFAULT_LAMPORTS_PER_BYTE_YEAR as f64 *
                                rent_module::DEFAULT_EXEMPTION_THRESHOLD;

        msg!("cost to create a 32 byte account: {}", cost_for_32_bytes);
        // 1,113,600 lamports
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

同样，请注意，此程序的输出与命令行上的输出相匹配。

## 将存储成本与 ETH 进行比较

在撰写本文时，ETH 的价值约为$2,425。初始化一个新账户的成本为 22,100 gas，因此我们可以计算 32 字节的 gas 成本为$0.80，假设 gas 成本为 15 gwei。

目前，Solana 的价格为$90/SOL，因此支付 1,113,600 lamports 来初始化 32 字节存储将花费$0.10。

然而，ETH 的市值是 SOL 的 7.5 倍，因此如果 SOL 的市值与 ETH 相同，那么 SOL 的当前价格将为$675，而 32 字节存储将花费$0.75。

Solana 有一个永久的通货膨胀模型，最终会收敛到每年 1.5%，因此这应该反映出存储随着时间按照摩尔定律变得更便宜的事实，即相同成本的晶体管密度每 18 个月翻倍。

请记住，从字节到加密货币的转换是协议中设置的常数，一个硬分叉随时可以更改。

## 余额低于 2 年租金豁免阈值的账户将被减少，直到删除账户

一个用户的钱包账户余额逐渐“减少”的有趣 Reddit 帖子可以在这里阅读：[https://www.reddit.com/r/solana/comments/qwin1h/my_sol_balance_in_the_wallet_is_decreasing/](https://www.reddit.com/r/solana/comments/qwin1h/my_sol_balance_in_the_wallet_is_decreasing/)

原因是钱包低于租金豁免阈值，Solana 运行时正在逐渐减少账户余额以支付租金。

如果由于余额低于租金豁免阈值而导致钱包被删除，可以通过向其发送更多的 SOL 来“复活”它，但如果账户中存储了数据，那么这些数据将会丢失。

## 大小限制

当我们初始化一个账户时，我们不能初始化超过 10,240 字节的大小。

**练习：** 创建一个基本的存储初始化程序，并设置 `space=10241`。这比限制高 1 字节。你应该会看到以下错误：

![solana 账户由于超出大小限制而无法初始化](https://static.wixstatic.com/media/935a00_1292e88b8b014ff58682fbd586115fc7~mv2.png/v1/fill/w_740,h_158,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_1292e88b8b014ff58682fbd586115fc7~mv2.png)

## 更改账户的大小

如果需要增加账户的大小，我们可以使用 `realloc` 宏。如果账户存储了一个向量并且需要更多空间，这可能会很方便。下面的代码示例中的 `increase_account_size` 函数和 `IncreaseAccountSize` 上下文结构体会将大小增加 1,000 字节（请查看下面代码中的全部大写注释）：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("GLKUcCtHx6nkuDLTz5TNFrR4tt4wDNuk24Aid2GrDLC6");

#[program]
pub mod basic_storage {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn increase_account_size(ctx: Context<IncreaseAccountSize>) -> Result<()> {
        Ok(())
    }
}


#[derive(Accounts)]
pub struct IncreaseAccountSize<'info> {

    #[account(mut,
							// ***** 1,000 BYTE INCREMENT IS OVER HERE *****
              realloc = size_of::<MyStorage>() + 8 + 1000,
              realloc::payer = signer,
              realloc::zero = false,
              seeds = [],
              bump)]
    pub my_storage: Account<'info, MyStorage>,
    
    #[account(mut)]
    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
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

增加账户大小时，请确保设置 `realloc::zero = false`（在上面的代码中）如果你不希望擦除账户数据。如果你希望将账户数据设置为全零，请使用 `realloc::zero = true`。你无需更改测试。该宏将在幕后为你处理这一点。

**练习：** 在测试中初始化一个账户，然后调用 `increase_account_size` 函数。在命令行中查看账户大小 `solana account <地址>`。你需要在本地验证器上执行此操作，以便账户持久存在。

## Solana 账户的最大大小

每次重新分配的最大账户大小增加量为 10240。在 Solana 中，账户的最大大小为 10 MB。

## 预估部署程序的成本

部署 Solana 程序的大部分成本来自为存储字节码支付租金。字节码存储在从 `anchor deploy` 返回的地址不同的账户中。

下面的截图显示了如何获取这些信息：

![img](https://static.wixstatic.com/media/935a00_b2995dfebb704e33a45a91b0e2d980de~mv2.png/v1/fill/w_740,h_284,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_b2995dfebb704e33a45a91b0e2d980de~mv2.png)

一个简单的 hello world 程序当前部署的成本略高于 2.47 SOL。通过编写原始的 Rust 代码而不是使用 Anchor 框架，可以显著降低成本，但在你完全了解 Anchor 默认消除的所有安全风险之前，我们不建议这样做。

## 通过 RareSkills 了解更多

查看我们的 [Solana 开发者课程](https://www.rareskills.io/solana-tutorial)以获取更多信息。