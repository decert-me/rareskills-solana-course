# Solana Sysvars Explained

更新日期：2 月 29 日

![Solana 系统变量](https://static.wixstatic.com/media/935a00_b49fad623fe34f7598cfaf32c96e45f1~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_b49fad623fe34f7598cfaf32c96e45f1~mv2.jpg)

在 Solana 中，sysvars 是只读系统账户，为 Solana 程序提供访问区块链状态和网络信息的权限。它们类似于以太坊的全局变量，也使智能合约能够访问网络或区块链状态信息，但它们具有类似以太坊预编译合约的唯一公钥地址。

在 Anchor 程序中，你可以通过两种方式访问 sysvars：一种是使用 anchor 的 get 方法包装器，另一种是将其视为帐户在你的`#[Derive(Accounts)]`中，使用其公钥地址。

并非所有 sysvars 都支持`get`方法，有些已被弃用（有关弃用信息将在本指南中指定）。对于那些没有`get`方法的 sysvars，我们将使用它们的公钥地址进行访问。

- **Clock**：用于执行与时间相关的操作，如获取当前时间或插槽（slot）号。
- **EpochSchedule**：包含有关纪元（epoch）调度的信息，包括特定插槽的纪元。
- **Rent**：包含租金率和信息，如保持帐户免于租金的最低余额要求。
- **Fees**：包含当前插槽的费用计算器。费用计算器提供有关 Solana 交易中每个签名支付多少 lamports 的信息。
- **EpochRewards**：EpochRewards sysvar 保存了 Solana 中的纪元奖励分配记录，包括区块奖励和质押奖励。
- **RecentBlockhashes**：包含活动的最近区块哈希。
- **SlotHashes**：包含最近插槽哈希的历史记录。
- **SlotHistory**：保存在 Solana 中最近纪元可用的插槽数组，并在处理新插槽时更新。
- **StakeHistory**：按每个纪元基础维护整个网络的质押激活和停用记录，每个纪元开始时更新。
- **Instructions**：用于访问当前交易中作为一部分的序列化指令。
- **LastRestartSlot**：包含上次重启（Solana 上次重启的时间）的插槽号，如果从未发生过则为零。如果 Solana 区块链崩溃并重新启动，应用程序可以使用此信息确定是否应等待事情稳定下来。

## 区分 Solana 插槽和区块

插槽（slot）是一个时间窗口（约 400 毫秒），指定的领导者可以在其中生成一个区块。一个插槽包含一个区块（与以太坊上的相同类型的区块，即交易列表）。但是，如果区块领导者在该插槽中未能生成区块，则该插槽可能不包含区块。它们的关系如下图所示：

![solana 插槽和区块](https://static.wixstatic.com/media/935a00_fe2b8cf87b1849959603a835b8bcecc1~mv2.jpg/v1/fill/w_740,h_320,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_fe2b8cf87b1849959603a835b8bcecc1~mv2.jpg)

尽管每个区块对应一个插槽，但区块哈希与插槽哈希不同。当在资源管理器中单击插槽号时，会打开具有不同哈希的区块详细信息。

让我们以下图中来自 Solana 区块资源管理器的示例为例：

![solana 插槽哈希](https://static.wixstatic.com/media/935a00_52a0a8a9b7f044d4a191ffa571c7fc49~mv2.png/v1/fill/w_740,h_461,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_52a0a8a9b7f044d4a191ffa571c7fc49~mv2.png)

图像中突出显示的绿色数字是插槽号**237240962**，突出显示的黄色文本是插槽哈希**DYFtWxEdLbos9E6SjZQCMq8z242Yv2bVoj6dzwskd5vZ**。下面突出显示的红色区块哈希是**FzHwFHDAXJBc55rpjShznGCBnC7DsTCjxf3KKAk6hk9T**。

（其他区块详细信息已被裁剪）：

![Solana 区块哈希](https://static.wixstatic.com/media/935a00_e29af689fdf141098fa7603bce44d797~mv2.png/v1/fill/w_740,h_177,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_e29af689fdf141098fa7603bce44d797~mv2.png)

我们可以通过它们独特的哈希来区分区块和插槽，即使它们具有相同的数字。

作为测试，点击资源管理器中的任何插槽号[这里](https://explorer.solana.com/address/SysvarS1otHashes111111111111111111111111111/slot-hashes?cluster=testnet) ，你会注意到会打开一个区块页面。该区块将具有与插槽哈希不同的哈希。

## 在 Anchor 中使用 get 方法访问 Solana Sysvars

如前所述，并非所有 sysvars 都可以使用 Anchor 的 get 方法访问。诸如 Clock、EpochSchedule 和 Rent 之类的 sysvars 可以使用此方法访问。

虽然 Solana 文档将 Fees 和 EpochRewards 列为可以使用 get 方法访问的 sysvars，但在最新版本的 Anchor 中已被弃用。因此，它们无法在 Anchor 中使用 get 方法调用。

我们将使用 get 方法访问并记录所有当前支持的 sysvars 的内容。首先，我们创建一个新的 Anchor 项目：

```
anchor init sysvars
cd sysvars
anchor build
```

### Clock sysvar

要使用 Clock sysvar，我们可以调用 Clock::get()（我们在以前的教程中做过类似的操作）方法，如下所示。

将以下代码添加到我们项目的 initialize 函数中：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Get the Clock sysvar
    let clock = Clock::get()?;

    msg!(
        "clock: {:?}",
        // Retrieve all the details of the Clock sysvar
        clock
    );

    Ok(())
}
```

现在，在本地 Solana 节点上运行测试并检查日志：

![Solana 纪元](https://static.wixstatic.com/media/935a00_1383139e135d4e39b3092482a762dfc4~mv2.png/v1/fill/w_740,h_46,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_1383139e135d4e39b3092482a762dfc4~mv2.png)

### EpochSchedule sysvar

在 Solana 中，一个纪元是大约两天的时间段。SOL 只能在纪元开始时抵押或赎回。如果在纪元结束之前抵押（或赎回）SOL，则等待纪元结束时，SOL 将被标记为“激活”或“停用”。

Solana 在其[委托 SOL](https://solana.com/id/staking#overview/delegation-timing-considerations) 的描述中更详细地描述了这一点。

我们可以使用 get 方法访问 EpochSchedule sysvar，类似于 Clock sysvar。

使用以下代码更新 initialize 函数：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Get the Clock sysvar
    let clock = Clock::get()?;

    msg!(
        "clock: {:?}",
        // Retrieve all the details of the Clock sysvar
        clock
    );

    Ok(())
}
```

再次运行测试，将生成以下日志：

![img](https://static.wixstatic.com/media/935a00_f4868db60a144483b36c24b700f934cb~mv2.png/v1/fill/w_740,h_33,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_f4868db60a144483b36c24b700f934cb~mv2.png)

从日志中，我们可以观察到 EpochSchedule sysvar 包含以下字段：

- **slots_per_epoch**（黄色突出显示）保存每个纪元中的插槽数，这里是 432,000 个插槽。
- **leader_schedule_slot_offset**（红色突出显示）确定下一个纪元的领导者计划的时间（我们之前在第 11 天谈到过）。它也设置为 432,000。
- **warmup**（紫色突出显示）是一个布尔值，指示 Solana 是否处于热身阶段。在此阶段，纪元开始较小，然后逐渐增加大小。这有助于网络在重置后或在早期运行期间平稳启动。
- **first_normal_epoch**（橙色突出显示）标识可以具有其插槽计数的第一个纪元，而 first_normal_slot（蓝色突出显示）是开始此纪元的插槽。在这种情况下，两者都是 0。

我们看到`first_normal_epoch`和`first_normal_slot`为 0 是因为测试验证器尚未运行两天。如果我们在主网上运行此命令（在撰写本文时），我们预计`first_normal_epoch`为 576，`first_normal_slot`为 248,832,000。

![Solana 最近纪元](https://static.wixstatic.com/media/935a00_97b5517e14cb4e7ea783b18a25ed7e4d~mv2.png/v1/fill/w_740,h_401,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_97b5517e14cb4e7ea783b18a25ed7e4d~mv2.png)

### Rent sysvar

再次，我们使用 get 方法访问 Rent sysvar。

使用以下代码更新 initialize 函数：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Previous code...

    // Get the Rent sysvar
    let rent_var = Rent::get()?;
    msg!(
        "Rent {:?}",
        // Retrieve all the details of the Rent sysvar
        rent_var
    );

    Ok(())
}
```

运行测试，我们得到以下日志：

![solana 租金 sysvar](https://static.wixstatic.com/media/935a00_64286e1a2b93484a92a7cbc3839e545b~mv2.png/v1/fill/w_740,h_32,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_64286e1a2b93484a92a7cbc3839e545b~mv2.png)

Solana 中的 Rent sysvar 具有三个关键字段：

- **lamports_per_byte_year**
- **exemption_threshold**
- **burn_percent** 

黄色突出显示的 lamports_per_byte_year 指示每年每字节所需的 lamports 数量，以获得租金豁免。

红色突出显示的 exemption_threshold 是用于计算租金豁免所需的最低余额的乘数。在此示例中，我们看到我们需要支付 3480 x 2 = 6960 lamports 每字节来创建一个新帐户。

其中 50%被燃烧（紫色突出显示的 burn_percent）以管理 Solana 通胀。

“租金”概念将在后续教程中进行全面解释。

## 在 Anchor 中使用 Sysvar 公钥地址访问 Solana Sysvars

对于不支持 get 方法的 sysvars，我们可以使用它们的公钥地址访问它们。任何此类例外情况将被指定。

### StakeHistory sysvar

回想一下，我们先前提到该 sysvar 按每个纪元基础记录整个网络的质押激活和停用。但是，由于我们运行的是本地验证器节点，因此此 sysvar 将返回空数据。

我们将使用其公钥地址访问此 sysvar
**SysvarStakeHistory1111111111111111111111111**。

首先，我们将在项目中的`Initialize`帐户结构中进行修改，如下所示：

```
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK:
    pub stake_history: AccountInfo<'info>, // We create an account for the StakeHistory sysvar
}
```

请暂时将新语法视为样板。`/// CHECK:`和`AccountInfo`将在后续教程中解释。对于好奇的人，`<'info'>`标记是 [Rust 生命周期](https://web.mit.edu/rust-lang_v1.25/arch/amd64_ubuntu1404/share/doc/rust/html/book/first-edition/lifetimes.html) 。

接下来，我们将以下代码添加到`initialize`函数中。

（sysvar 帐户的引用将作为事务的一部分传递给我们的测试。之前的示例已内置到 Anchor 框架中）。

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Previous code...

    // Accessing the StakeHistory sysvar
    // Create an array to store the StakeHistory account
    let arr = [ctx.accounts.stake_history.clone()];

    // Create an iterator for the array
    let accounts_iter = &mut arr.iter();

    // Get the next account info from the iterator (still StakeHistory)
    let sh_sysvar_info = next_account_info(accounts_iter)?;

    // Create a StakeHistory instance from the account info
    let stake_history = StakeHistory::from_account_info(sh_sysvar_info)?;

    msg!("stake_history: {:?}", stake_history);

    Ok(())
}
```

我们不导入 StakeHistory sysvar，因为我们可以通过使用`super::*; import`来访问它。如果不是这种情况，我们将导入特定的 sysvar。

并更新测试：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Previous code...

    // Accessing the StakeHistory sysvar
    // Create an array to store the StakeHistory account
    let arr = [ctx.accounts.stake_history.clone()];

    // Create an iterator for the array
    let accounts_iter = &mut arr.iter();

    // Get the next account info from the iterator (still StakeHistory)
    let sh_sysvar_info = next_account_info(accounts_iter)?;

    // Create a StakeHistory instance from the account info
    let stake_history = StakeHistory::from_account_info(sh_sysvar_info)?;

    msg!("stake_history: {:?}", stake_history);

    Ok(())
}
```

现在，重新运行我们的测试：

![solana 质押历史](https://static.wixstatic.com/media/935a00_0729ba11d79245c6b2961b66dcab9279~mv2.png/v1/fill/w_740,h_32,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_0729ba11d79245c6b2961b66dcab9279~mv2.png)

正如之前提到的，对于我们的本地验证器，它返回空数据。

我们还可以通过在 Anchor Typescript 客户端中将`StakeHistory_PublicKey`变量替换为 anchor.web3.`SYSVAR_STAKE_HISTORY_PUBKEY`来获取 StakeHistory sysvar 的公钥。

### RecentBlockhashes sysvar

如何访问此 sysvar 在我们的[先前教程](https://www.rareskills.io/post/solana-clock)中已经讨论过。作为提醒，它已被弃用，并且将不再受支持。

### Fees sysvar

Fees sysvar 也已被弃用。

### Instruction sysvar

此 sysvar 可用于访问当前交易的序列化指令，以及该交易的一些元数据。我们将在下面进行演示。

首先，更新我们的导入：

```
#[program]
pub mod sysvars {
		use super::*;
    use anchor_lang::solana_program::sysvar::{instructions, fees::Fees, recent_blockhashes::RecentBlockhashes};
    // rest of the code
}
```

接下来，将 Instruction sysvar 帐户添加到`Initialize`帐户结构中：

```
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK:
    pub stake_history: AccountInfo<'info>, // We create an account for the StakeHistory sysvar
    /// CHECK:
    pub recent_blockhashes: AccountInfo<'info>,
    /// CHECK:
    pub instruction_sysvar: AccountInfo<'info>,
}
```

现在，修改 initialize 函数以接受一个`number: u32`参数，并将以下代码添加到 initialize 函数中。

```
pub fn initialize(ctx: Context<Initialize>, number: u32) -> Result<()> {
    // Previous code...

    // Get Instruction sysvar
    let arr = [ctx.accounts.instruction_sysvar.clone()];

    let account_info_iter = &mut arr.iter();

    let instructions_sysvar_account = next_account_info(account_info_iter)?;

    // Load the instruction details from the instruction sysvar account
    let instruction_details =
        instructions::load_instruction_at_checked(0, instructions_sysvar_account)?;

    msg!(
        "Instruction details of this transaction: {:?}",
        instruction_details
    );
    msg!("Number is: {}", number);

    Ok(())
}
```

与之前的 sysvar 不同，我们在这种情况下使用`load_instruction_at_checked()`方法从 Instruction sysvar 中检索 sysvar，而不是使用`<sysvar_name>::from_account_info()`。此方法需要指令数据索引（在本例中为 0）和 Instruction sysvar 帐户作为参数。

更新测试：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Sysvars } from "../target/types/sysvars";

describe("sysvars", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Sysvars as Program<Sysvars>;

  // Create a StakeHistory PublicKey object
  const StakeHistory_PublicKey = new anchor.web3.PublicKey(
    "SysvarStakeHistory1111111111111111111111111"
  );

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize(3) // Call the initialze function with the number `3`
      .accounts({
        stakeHistory: StakeHistory_PublicKey, // pass the public key of StakeHistory sysvar to the list of accounts needed for the instruction
        recentBlockhashes: anchor.web3.SYSVAR_RECENT_BLOCKHASHES_PUBKEY, // pass the public key of RecentBlockhashes sysvar to the list of accounts needed for the instruction
				instructionSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY, // Pass the public key of the Instruction sysvar to the list of accounts needed for the instruction
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
```

并运行测试：

![solana sysvar 指令](https://static.wixstatic.com/media/935a00_7a761449386048b5926581b4bd55f2a8~mv2.png/v1/fill/w_740,h_55,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_7a761449386048b5926581b4bd55f2a8~mv2.png)

如果仔细检查日志，我们可以看到程序 Id、sysvar 指令的公钥、序列化数据和其他元数据。

我们还可以在序列化指令数据和我们自己的程序日志中看到用黄色箭头突出显示的数字 3。红色突出显示的序列化数据是 Anchor 注入的一个鉴别器（我们可以忽略它）。

**练习：** 访问`LastRestartSlot` 系统变量 

**SysvarLastRestartS1ot1111111111111111111111** 使用上述方法。请注意，Anchor 没有这个系统变量的地址，因此你需要创建一个`PublicKey`对象。

## 在当前版本的 Anchor 中无法访问的 Solana 系统变量。

在当前版本的 Anchor 中，无法访问某些系统变量。这些系统变量包括`EpochRewards`、`SlotHistory`和`SlotHashes`。尝试访问这些系统变量时会导致错误。

## 了解更多

本教程是我们免费的 [Solana 课程](https://hackmd.io/4eVoPWjpRLCqf03vK7CyVg?view)的一部分。