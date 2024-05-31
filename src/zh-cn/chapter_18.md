# 使用 Solana web3 js 和 Anchor 读取账户数据

![img](https://static.wixstatic.com/media/935a00_90cc4c7788d745c5b1b4a78fffcea8cf~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_90cc4c7788d745c5b1b4a78fffcea8cf~mv2.jpg)

本教程展示了如何直接从 Solana web3 Javascript 客户端读取账户数据，以便 Web 应用程序可以在前端读取它。

在之前的教程中，我们使用 `solana account <账户地址>` 来读取我们写入的数据，但如果我们正在构建一个网站上的 dApp，则这种方法不起作用。

相反，我们必须计算存储账户的地址，读取数据，并从 Solana web3 客户端反序列化数据。

想象一下，在以太坊中，我们想要避免使用公共变量或视图函数，但仍然想要在前端显示它们的值。要查看存储变量中的值，而不使它们公开或添加视图函数，我们将使用 `getStorageAt(contract_address, slot)` API。我们将在 Solana 中做类似的事情，只是不是传入 `(contract_address, slot)` 对，而是只传入程序的地址，并推导其存储账户的地址。

以下是来自上一篇教程的 Rust 代码。它初始化了 `MyStorage` 并使用 `set` 函数写入 `x`。我们将在本教程中不对其进行修改：

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

    pub fn set(ctx: Context<Set>, new_x: u64) -> Result<()> {
        ctx.accounts.my_storage.x = new_x;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Set<'info> {
    #[account(mut, seeds = [], bump)]
    pub my_storage: Account<'info, MyStorage>,
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

以下是 Typescript 单元测试，用于：

1) 初始化账户
2) 将 `170` 写入存储
3) 使用 `fetch` 函数读取值：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BasicStorage} from "../target/types/basic_storage";

describe("basic_storage", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BasicStorage as Program<BasicStorage>;

  it("Is initialized!", async () => {
    const seeds = []
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);

    console.log("the storage account address is", myStorage.toBase58());
 
    await program.methods.initialize().accounts({myStorage: myStorage}).rpc();
    await program.methods.set(new anchor.BN(170)).accounts({myStorage: myStorage}).rpc();
  
		// ***********************************
		// *** NEW CODE TO READ THE STRUCT ***
		// ***********************************
		let myStorageStruct = await program.account.myStorage.fetch(myStorage);
    console.log("The value of x is:",myStorageStruct.x.toString());
	});
});
```

在 Anchor 中查看账户可以通过以下方式完成：

```
let myStorageStruct = await program.account.myStorage.fetch(myStorage);
console.log("x 的值为:", myStorageStruct.x.toString());
```

Anchor 自动计算 `MyStorage` 账户的地址，读取它，并将其格式化为 Typescript 对象。

要了解 Anchor 是如何将 Rust 结构神奇地转换为 Typescript 结构的，请看 `target/idl/basic_storage.json` 中的 IDL。在 JSON 的底部，我们可以看到我们的程序正在创建的结构的定义：

![img](https://static.wixstatic.com/media/935a00_3b121a3b1adb4f899a82e125607c64c5~mv2.png/v1/fill/w_350,h_289,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_3b121a3b1adb4f899a82e125607c64c5~mv2.png)

**此方法仅适用于你的程序或客户端初始化或创建并具有 IDL 的账户，对于任意账户，此方法将无法正常工作。**

也就是说，如果你选择 Solana 上的一个随机账户并使用上述代码，反序列化几乎肯定会失败。在本文的后面，我们将以更“原始”的方式读取账户。

`fetch` 函数并不神奇。那么，我们如何为我们没有创建的账户执行此操作呢？

## 从 Anchor Solana 程序创建的账户中获取数据

如果我们知道另一个使用 Anchor 创建的程序的 IDL，我们可以方便地读取其账户数据。

让我们在另一个 shell 中 `anchor init` 另一个程序，然后让其初始化一个账户，并将该结构中的单个布尔变量设置为 `true`。我们将称其为 `other account`，`other_program`，存储其布尔值的结构为 `TrueOrFalse`：

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("4z4dduMSFKFJDnUAKaHnbhHySK8x1PwgArUBXzksjwa8");

#[program]
pub mod other_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn setbool(ctx: Context<SetFlag>, flag: bool) -> Result<()> {
        ctx.accounts.true_or_false.flag = flag;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    signer: Signer<'info>,

    system_program: Program<'info, System>,

    #[account(init, payer = signer, space = size_of::<TrueOrFalse>() + 8, seeds=[], bump)]
    true_or_false: Account<'info, TrueOrFalse>,
}

#[derive(Accounts)]
pub struct SetFlag<'info> {
    #[account(mut)]
    true_or_false: Account<'info, TrueOrFalse>, 
}

#[account]
pub struct TrueOrFalse {
    flag: bool,
}
```

Typescript 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OtherProgram } from "../target/types/other_program";

describe("other_program", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.OtherProgram as Program<OtherProgram>;

  it("Is initialized!", async () => {
    const seeds = []
    const [TrueOrFalse, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);

    console.log("address: ", program.programId.toBase58());

    await program.methods.initialize().accounts({trueOrFalse: TrueOrFalse}).rpc();
    await program.methods.setbool(true).accounts({trueOrFalse: TrueOrFalse}).rpc();
  });
});
```

针对本地验证器在另一个 shell 中运行测试。请注意打印出的 `programId`。我们将需要它来推导 `other_program` 的账户地址。

### 读取程序

在另一个 shell 中，使用 `anchor init` 初始化另一个程序。我们将其称为 `read`。我们将仅使用 Typescript 代码来读取 `other_program` 的 `TrueOrFalse` 结构，不使用 Rust。这模拟了从另一个程序的存储账户中读取数据。

我们的目录布局如下：

```
parent_dir/
∟ other_program/
∟ read/
```

以下代码将从 `other_program` 读取 `TrueOrFalse` 结构。确保：

- `otherProgramAddress` 与上面打印的地址匹配
- 确保你从正确的文件位置读取 `other_program`.json IDL
- 确保使用 `--skip-local-validator` 运行测试，以确保此代码读取另一个程序创建的账户

```
import * as anchor from "@coral-xyz/anchor";

describe("read", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  it("Read other account", async () => {
    // the other program's programdId -- make sure the address is correct
    const otherProgramAddress = "4z4dduMSFKFJDnUAKaHnbhHySK8x1PwgArUBXzksjwa8";
    const otherProgramId = new anchor.web3.PublicKey(otherProgramAddress);

    // load the other program's idl -- make sure the path is correct
    const otherIdl = JSON.parse(
        require("fs").readFileSync("../other_program/target/idl/other_program.json", "utf8")
    );
    
    const otherProgram = new anchor.Program(otherIdl, otherProgramId);

    const seeds = []
    const [trueOrFalseAcc, _bump] = 
	    anchor.web3.PublicKey.findProgramAddressSync(seeds, otherProgramId);
    let otherStorageStruct = await otherProgram.account.trueOrFalse.fetch(trueOrFalseAcc);

    console.log("The value of flag is:", otherStorageStruct.flag.toString());
  });
});
```

预期输出如下：

![img](https://static.wixstatic.com/media/935a00_3fdf24ed318d4767b952aa9ae5bbc925~mv2.png/v1/fill/w_350,h_147,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_3fdf24ed318d4767b952aa9ae5bbc925~mv2.png)

再次强调，**此方法仅适用于使用 Anchor 构建的其他 Solana 程序。这依赖于 Anchor 如何序列化结构。**

## 获取任意账户的数据

在以下部分，我们将展示如何在没有 Anchor 魔力的情况下读取数据。

不幸的是，Solana 的 Typescript 客户端文档非常有限，该库已经更新了多次，使得关于该主题的教程已经过时。

尝试查找你需要的 Solana web3 Typescript 函数的最佳方法是查看 [HTTP JSON RPC 方法](https://docs.solana.com/api/http) ，并查找看起来有希望的方法。在我们的情况下，`getAccountInfo` 看起来很有希望（蓝色箭头）。

![img](https://static.wixstatic.com/media/935a00_d93044e34e724b31b7998bc55176a053~mv2.png/v1/fill/w_740,h_419,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_d93044e34e724b31b7998bc55176a053~mv2.png)

接下来，我们想尝试在 Solana web3 js 中找到该方法。最好使用具有自动完成功能的 IDE，这样你可以尝试找到该函数，就像以下视频演示的那样：

<video src="https://video.wixstatic.com/video/935a00_06ca67880d9f4b1b8415cd580faf0ea6/480p/mp4/file.mp4" preload="auto" controls=""></video>

下面是再次运行测试的预期输出：

![img](https://static.wixstatic.com/media/935a00_7c3968c4f5cd4968849e1d30b5d24263~mv2.png/v1/fill/w_740,h_293,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_7c3968c4f5cd4968849e1d30b5d24263~mv2.png)

围绕十六进制 `aa` 字节的绿色框显示，我们已成功检索到我们在 `set()` 函数中存储的十进制 170 值。

下一步是解析数据缓冲区，这不是我们在这里要涵盖的内容。

读者应该注意，反序列化这些数据可能是一个令人沮丧的过程。

**在 Solana 账户中，没有“强制”数据序列化的方式**。Anchor 以自己的方式序列化结构，但如果有人使用原始 Rust（没有使用 Anchor）编写了 Solana 程序，或者使用了他们自己的序列化算法，那么你将不得不根据他们序列化数据的方式自定义你的反序列化算法。

## 继续学习 Solana

你可以在这里查看我们的 [Solana 课程](http://rareskills.io/solana-tutorial)的其余部分。