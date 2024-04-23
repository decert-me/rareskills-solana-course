# Solana 中的 Tx.origin、msg.sender 和 onlyOwner：识别调用者

![Solana 中的 tx.origin、msg.sender 和 onlyOwner](https://static.wixstatic.com/media/935a00_5b75852d244b42ffa7e441959fac0b18~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_5b75852d244b42ffa7e441959fac0b18~mv2.jpg)

在 Solidity 中，`msg.sender`是一个全局变量，代表调用或启动智能合约上的函数调用的地址。全局变量`tx.origin`是签署交易的钱包。

在 Solana 中，没有等价于`msg.sender`。

在 Solana 中有一个等价于`tx.origin`，但你应该知道 Solana 交易可以有多个签署者，因此我们可以将其视为具有“多个 tx.origin”。

要在 Solana 中获取“`tx.origin`”地址，你需要通过向函数上下文添加 Signer 账户并在调用函数时将调用者的账户传递给它来设置它。

让我们看一个示例，演示如何在 Solana 中访问交易签署者的地址：

```
use anchor_lang::prelude::*;

declare_id!("Hf96fZsgq9R6Y1AHfyGbhi9EAmaQw2oks8NqakS6XVt1");

#[program]
pub mod day14 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let the_signer1: &mut Signer = &mut ctx.accounts.signer1;

				// Function logic....

        msg!("The signer1: {:?}", *the_signer1.key);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer1: Signer<'info>,
}
```

从上面的代码片段中，`Signer<'info>`用于验证`Initialize<'info>`账户结构中的`signer1`账户是否已签署交易。

在`initialize`函数中，从上下文中对 signer1 账户进行可变引用，并将其分配给`the_signer1`变量。

最后，我们使用`msg!`宏记录了 signer1 的公钥（地址），并传入`*the_signer1.key`，该操作对`the_signer1`指向的实际值进行了解引用并访问了`key`字段或方法。

接下来是为上述程序编写一个测试：

```
describe("Day14", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Day14 as Program<Day14>;

  it("Is signed by a single signer", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().accounts({
      signer1: program.provider.publicKey
    }).rpc();

    console.log("The signer1: ", program.provider.publicKey.toBase58());
  });
});
```

在测试中，我们将我们的钱包账户作为签署者传递给`signer1`账户，然后调用 initialize 函数。随后，我们在控制台上记录了钱包账户，以验证其与我们程序中的账户一致性。

**练习：** 运行测试后，你在**shell_1**（命令终端）和**shell_3**（日志终端）的输出中注意到了什么？

## 多个签署者

在 Solana 中，我们还可以让多个签署者签署一个交易，你可以将其视为将一堆签名打包并在一个交易中发送。一个用例是在一个交易中执行多签交易。

为此，我们只需在程序中的账户结构中添加更多的 Signer 结构，然后确保在调用函数时传递必要的账户：

```
use anchor_lang::prelude::*;

declare_id!("Hf96fZsgq9R6Y1AHfyGbhi9EAmaQw2oks8NqakS6XVt1");

#[program]
pub mod day14 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let the_signer1: &mut Signer = &mut ctx.accounts.signer1;
        let the_signer2: &mut Signer = &mut ctx.accounts.signer2;

        msg!("The signer1: {:?}", *the_signer1.key);
        msg!("The signer2: {:?}", *the_signer2.key);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub signer1: Signer<'info>,
    pub signer2: Signer<'info>,
}
```

上面的示例与单个签署者示例有些相似，但有一个显著的区别。在这种情况下，我们向`Initialize`结构添加了另一个 Signer 账户（`signer2`），并在**initialize**函数中记录了两个签署者的公钥。

使用多个签署者调用**initialize**函数与单个签署者不同。下面的测试显示了如何使用多个签署者调用函数：

```
describe("Day14", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Day14 as Program<Day14>;

  // generate a signer to call our function
  let myKeypair = anchor.web3.Keypair.generate();

  it("Is signed by multiple signers", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accounts({
        signer1: program.provider.publicKey,
        signer2: myKeypair.publicKey,
      })
      .signers([myKeypair])
      .rpc();

    console.log("The signer1: ", program.provider.publicKey.toBase58());
    console.log("The signer2: ", myKeypair.publicKey.toBase58());
  });
});
```

上面的测试有什么不同？首先是`signers()`方法，该方法接受一个签署者数组作为参数。但我们的数组中只有一个签署者，而不是两个。Anchor 会自动将提供程序中的钱包账户作为签署者传递，因此我们不需要再将其添加到签署者数组中。

### 生成随机地址以进行测试

第二个变化是`myKeypair`变量，它存储了由`anchor.web3`模块随机生成的 Keypair（*用于访问账户的公钥和相应的私钥*）。在测试中，我们将 Keypair（存储在`myKeypair`变量中的）的公钥分配给`signer2`账户，这就是为什么它作为参数传递给`.signers([myKeypair])`方法。

多次运行测试，你会注意到`signer1`的公钥不会改变，但`signer2`的公钥会改变。这是因为分配给`signer1`账户（在测试中）的钱包账户来自提供程序，这也是你本地机器上的 Solana 钱包账户，而分配给`signer2`的账户每次运行`anchor test --skip-local-validator`时都会随机生成。

**练习：** 创建另一个需要三个签署者（提供程序钱包账户和两个随机生成账户）的函数，并为其编写一个测试。

## onlyOwner

这是 Solidity 中常用的一种模式，用于限制函数的访问权限仅限于合约的所有者。使用 Anchor 的`#[access_control]`属性，我们也可以实现 only owner 模式，即将我们 Solana 程序中函数的访问权限限制为 PubKey（所有者的地址）。

以下是如何在 Solana 中实现“onlyOwner”功能的示例：

```
use anchor_lang::prelude::*;

declare_id!("Hf96fZsgq9R6Y1AHfyGbhi9EAmaQw2oks8NqakS6XVt1");

// NOTE: Replace with your wallet's public key
const OWNER: &str = "8os8PKYmeVjU1mmwHZZNTEv5hpBXi5VvEKGzykduZAik";

#[program]
pub mod day14 {
    use super::*;

    #[access_control(check(&ctx))]
    pub fn initialize(ctx: Context<OnlyOwner>) -> Result<()> {
        // Function logic...

        msg!("Holla, I'm the owner.");
        Ok(())
    }
}

fn check(ctx: &Context<OnlyOwner>) -> Result<()> {
    // Check if signer === owner
    require_keys_eq!(
        ctx.accounts.signer_account.key(),
        OWNER.parse::<Pubkey>().unwrap(),
        OnlyOwnerError::NotOwner
    );

    Ok(())
}

#[derive(Accounts)]
pub struct OnlyOwner<'info> {
    signer_account: Signer<'info>,
}

// An enum for custom error codes
#[error_code]
pub enum OnlyOwnerError {
    #[msg("Only owner can call this function!")]
    NotOwner,
}
```

在上述代码中，`OWNER`变量存储与我的本地 Solana 钱包关联的公钥（地址）。在测试之前，请确保将`OWNER`变量替换为你钱包的公钥。你可以通过运行`solana address`命令轻松检索你的公钥。

`#[access_control]`属性在运行主要指令之前执行给定的访问控制方法。当调用 initialize 函数时，将在运行 initialize 函数之前执行访问控制方法（`check`）。`check`方法接受引用上下文作为参数，然后检查交易的签署者是否等于`OWNER`变量的值。`require_keys_eq!`宏确保两个公钥值相等，如果为真，则执行 initialize 函数，否则，使用`NotOwner`自定义错误回滚。

### 测试 onlyOwner 功能 - 正常情况

在下面的测试中，我们调用 initialize 函数，并使用所有者的密钥对签署交易：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Day14 } from "../target/types/day14";

describe("day14", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Day14 as Program<Day14>;

  it("Is called by the owner", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accounts({
        signerAccount: program.provider.publicKey,
      })
      .rpc();

    console.log("Transaction hash:", tx);
  });
});
```

我们调用 initialize 函数，并将提供程序中的钱包账户（本地 Solana 钱包账户）传递给具有`Signer<'info>`结构的`signerAccount`，以验证钱包账户实际上签署了交易。还记得 Anchor 会使用提供程序中的钱包账户秘密签署任何交易。

如果一切都正确，运行测试`anchor test --skip-local-validator`，测试应该通过：

![Anchor 测试通过](https://static.wixstatic.com/media/935a00_a6f122cf3fdf49ac98dbb04d90495aa4~mv2.png/v1/fill/w_740,h_187,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_a6f122cf3fdf49ac98dbb04d90495aa4~mv2.png)

### 测试签署者不是所有者的情况 - 攻击案例

使用不是所有者的不同密钥对调用 initialize 函数并签署交易将引发错误，因为函数调用仅限于所有者：

```
describe("day14", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Day14 as Program<Day14>;

  let Keypair = anchor.web3.Keypair.generate();

  it("Is NOT called by the owner", async () => {
    // Add your test here.
    const tx = await program.methods
      .initialize()
      .accounts({
        signerAccount: Keypair.publicKey,
      })
      .signers([Keypair])
      .rpc();

    console.log("Transaction hash:", tx);
  });
});
```

在这里，我们生成了一个随机密钥对，并用它来签署交易。让我们再次运行测试：

![由于签署者错误而失败的 anchor 测试](https://static.wixstatic.com/media/935a00_b2f1fa2f9e5049998817b69db9025b42~mv2.png/v1/fill/w_740,h_209,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_b2f1fa2f9e5049998817b69db9025b42~mv2.png)

正如预期的那样，由于签署者的公钥与所有者的公钥不相等，我们收到了错误。

### 修改所有者

要更改程序中的所有者，需要将分配给所有者的公钥存储在链上。但是，关于 Solana 中的“存储”讨论将在未来的教程中介绍。

所有者只需重新部署字节码。

**练习：** 将类似上述程序的程序升级为具有新所有者。

## 通过 RareSkills 了解更多

本教程是我们 [Solana 课程](https://www.rareskills.io/solana-tutorial)中的第 14 章。