# 在 Solana 和 Anchor 中初始化账户

更新日期：2 月 25 日

![img](https://static.wixstatic.com/media/935a00_9b3ad24040c140d1bc4cfb2738faf1ca~mv2.jpg)

直到目前为止，我们的教程中都没有使用“存储变量”或存储任何永久性内容。

在 Solidity 和以太坊中，一种更为奇特的设计模式用于存储数据，即 SSTORE2 或 SSTORE3，其中数据存储在另一个智能合约的字节码中。

在 Solana 中，这不是一种奇特的设计模式，而是一种常态！

请记住，我们可以随意更新 Solana 程序的字节码（如果我们是原始部署者），除非该程序被标记为不可变。

Solana 使用相同的机制进行数据存储。

以太坊中的存储槽实际上是一个庞大的键值存储：

```
{
    key: [smart_contract_address, storage slot]
    value: 32_byte_slot // (for example: 0x00)
}
```

Solana 的模型类似：它是一个庞大的键值存储，其中“键”是一个 base58 编码的地址，而“值”是一个数据块，最大可达 10MB（或者可选择不存储任何内容）。可以将其可视化如下：

```
{
		// key is a base58 encoded 32 byte sequence
    key: ETnqC8mvPRyUVXyXoph22EQ1GS5sTs1zndkn5eGMYWfs
    value: {
			data: 020000006ad1897139ac2bdb67a3c66a...
			// other fields are omitted
		}
}
```

在以太坊中，智能合约的字节码和存储变量是分开存储的，即它们被不同方式索引，并且必须使用不同的 API 进行加载。

下图显示了以太坊如何维护状态。每个账户都是 Merkle 树中的一个叶子。请注意，“存储变量”存储在智能合约的账户内部（账户 1）。

![以太坊存储](https://static.wixstatic.com/media/935a00_97cc771466624c4e832364f800f9ca55~mv2.jpg/v1/fill/w_740,h_555,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_97cc771466624c4e832364f800f9ca55~mv2.jpg)

在 Solana 中，**一切都是账户**，这些账户都有可能存储数据。有时我们将一个账户称为“程序账户”，将另一个账户称为“存储账户”，但唯一的区别是是否将可执行标志设置为 true 以及我们打算如何使用账户的数据字段。

下面，我们可以看到 Solana 存储是一个从 Solana 地址到账户的巨大键值存储：

![Solana 账户](https://static.wixstatic.com/media/935a00_6d6699f68686415db71640130e8e7344~mv2.jpg/v1/fill/w_740,h_555,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_6d6699f68686415db71640130e8e7344~mv2.jpg)

想象一下，如果以太坊没有存储变量，并且智能合约默认是可变的。要存储数据，你必须创建其他“智能合约”并将数据存储在它们的字节码中，然后在必要时进行修改。这是 Solana 的一种思维模型。

另一种思维模型是一切都是 Unix 中的文件，只是某些文件是可执行的。Solana 账户可以被视为文件。它们保存内容，但也具有指示谁拥有文件、是否可执行等元数据。

在以太坊中，存储变量直接与智能合约耦合。除非智能合约通过公共变量、delegatecall 或某些设置器方法授予写入或读取访问权限，默认情况下，存储变量只能由单个合约写入或读取（尽管任何人都可以离线读取存储变量）。在 Solana 中，所有“存储变量”都可以被任何程序读取，但只有其所有者程序可以写入。

存储与程序“绑定”的方式是通过所有者字段。

在下图中，我们看到账户 B 是由程序账户 A 拥有的。我们知道 A 是一个程序账户，因为“可执行”被设置为 `true`。这表明 B 的数据字段将存储 A 的数据：

![Solana 的程序存储](https://static.wixstatic.com/media/935a00_f849336947924da0a21ccb33e978d0ed~mv2.jpg/v1/fill/w_740,h_555,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_f849336947924da0a21ccb33e978d0ed~mv2.jpg)

## Solana 程序需要在使用之前进行初始化

在以太坊中，我们可以直接写入一个之前未使用过的存储变量。然而，在 Solana 中，程序需要一个显式的初始化事务。也就是说，我们必须在写入数据之前创建账户。

*可以在一个事务中初始化并写入 Solana 账户 —— 但这会引入安全问题，如果我们现在处理这些问题将会复杂化讨论。目前，只需说 Solana 账户必须在使用之前进行初始化即可。*

## 一个基本的存储示例

让我们将以下 Solidity 代码翻译成 Solana：

```
contract BasicStorage {
    Struct MyStorage {
        uint64 x;
    }

    MyStorage public myStorage;

    function set(uint64 _x) external {
        myStorage.x = _x;
    }
} 
```

可能会觉得奇怪，我们将一个单变量放入一个结构体中。

但在 Solana 程序中，特别是 Anchor，**所有存储，或者说账户数据，都被视为结构体**。原因在于账户数据的灵活性。由于账户是数据块，可能相当大（最多可达 10MB），我们需要一些“结构”来解释数据，否则它只是一系列没有意义的字节。

在幕后，当我们尝试读取或写入数据时，Anchor 会将账户数据反序列化和序列化为结构体。

如上所述，我们需要在使用 Solana 账户之前对其进行初始化，因此在实现 `set()` 函数之前，我们需要编写 `initialize()` 函数。

## 账户初始化样板代码

让我们创建一个名为 `basic_storage` 的新 Anchor 项目。

下面我们编写了初始化 `MyStorage` 结构体的最小代码，该结构体仅包含一个数字 `x`。（请查看代码底部的 `MyStorage` 结构体）：

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

### 1) 初始化函数

请注意，`initialize()` 函数中没有代码 —— 实际上它只返回 `Ok(())`：

![Solana 初始化账户](https://static.wixstatic.com/media/935a00_92a7cce9e0ac44ffa7a996035060b4eb~mv2.png/v1/fill/w_740,h_68,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_92a7cce9e0ac44ffa7a996035060b4eb~mv2.png)

初始化账户的函数不一定要为空，我们可以有自定义逻辑。但在我们的示例中，它是空的。初始化账户的函数也不一定要叫做 `initialize`，但这是一个有用的名称。

### 2) 初始化结构体

`Initialize` 结构体包含初始化账户所需资源的引用：

- `my_storage`：我们正在初始化的类型为 `MyStorage` 的结构体。
- `signer`：支付存储结构体“gas”费用的钱包（有关存储费用的讨论稍后进行）。
- `system_program`：我们将在本教程后面讨论它。

![带注释的初始化结构体](https://static.wixstatic.com/media/935a00_c5a51bc46f954b57b767299a8fb4817d~mv2.png/v1/fill/w_740,h_502,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_c5a51bc46f954b57b767299a8fb4817d~mv2.png)

`'info` 关键字是一个 [Rust 生命周期](https://doc.rust-lang.org/rust-by-example/scope/lifetime.html)。这是一个庞大的主题，现在最好将其视为样板。

我们将重点放在上面 `my_storage` 之上的宏，因为这是初始化操作发生的地方。

### 3) 初始化结构体中的 my_storage 字段

`my_storage` 字段上面的属性宏（紫色箭头）是 Anchor 知道此事务旨在初始化此账户的方式（请记住，类似属性的宏以 `#` 开头，并使用 `init` 修改结构体以提供额外功能）：

![结构体字段的注释](https://static.wixstatic.com/media/935a00_48be1af69ce54df281456844ff5fbec7~mv2.png/v1/fill/w_740,h_541,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_48be1af69ce54df281456844ff5fbec7~mv2.png)

这里重要的关键字是 `init`。

当我们初始化一个账户时，我们必须提供额外的信息：

- `payer`（蓝色框）：谁支付 SOL 以分配存储空间。签名者被指定为 `mut`，因为他们的账户余额将发生变化，即他们的账户将被扣除一些 SOL。因此，我们将其账户标记为“mutable”。
- `space`（橙色框）：这表示账户将占用多少空间。我们可以使用 `std::mem::size_of` 实用程序，并使用我们要存储的结构体 `MyStorage`（绿色框）作为参数，而不是自己计算。我们将在下一点中讨论 `+ 8`（粉色框）。
- `seeds` 和 `bump`（红色框）：一个程序可以拥有多个账户，它使用“seed”在计算“鉴别器”时进行“区分”。 “鉴别器”占用 8 个字节，这就是为什么我们需要额外分配 8 个字节的空间，除了我们的结构体占用的空间。暂时将 bump 视为样板。

这可能看起来很复杂，不用担心。**目前，可以将初始化账户视为样板。**

### 4) 系统程序是什么？

`系统程序` 是内置于 Solana 运行时的程序（有点类似于 [以太坊预编译](https://www.rareskills.io/post/solidity-precompiles)），它将 SOL 从一个账户转移到另一个账户。我们将在稍后关于转移 SOL 的教程中重新讨论这一点。目前，我们需要将 SOL 从支付 `MyStruct` 存储费用的签名者转移出去，因此 `系统程序` 总是初始化事务的一部分。

### 5) MyStorage 结构体

回想一下 Solana 账户内部的数据字段：

![突出显示的 Solana 账户中的数据](https://static.wixstatic.com/media/935a00_e8d248aad3044b65b99cd2459b6edef4~mv2.jpg/v1/fill/w_740,h_555,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_e8d248aad3044b65b99cd2459b6edef4~mv2.jpg)

在幕后，这是一个字节序列。上面示例中的结构体：

![mystorage 结构体](https://static.wixstatic.com/media/935a00_cf148c488d73448c8bcac500f6c72038~mv2.png/v1/fill/w_350,h_107,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_cf148c488d73448c8bcac500f6c72038~mv2.png)

在写入时，结构体将被序列化为字节序列并存储在 `data` 字段中。在写入时，`data` 字段将根据该结构体进行反序列化。

在我们的示例中，我们只使用了结构体中的一个变量，尽管如果需要，我们可以添加更多变量或其他类型的变量。

Solana 运行时不强制我们使用结构体来存储数据。从 Solana 的角度来看，账户只是一个数据块。但是，Rust 有许多方便的库可以将结构体转换为数据块，反之亦然，因此结构体是约定俗成的。Anchor 在幕后利用这些库。

你不必使用结构体来使用 Solana 账户。可以直接写入字节序列，但这不是一种方便的存储数据的方式。

`#[account]` 宏会透明地实现所有魔法。

### 6) 单元测试初始化

以下 Typescript 代码将运行上面的 Rust 代码。

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BasicStorage } from "../target/types/basic_storage";

describe("basic_storage", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.BasicStorage as Program<BasicStorage>;

  it("Is initialized!", async () => {
    const seeds = []
    const [myStorage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);

    console.log("the storage account address is", myStorage.toBase58());

    await program.methods.initialize().accounts({ myStorage: myStorage }).rpc();
  });
});
```

以下是单元测试的输出：

![Solana 账户初始化测试通过](https://static.wixstatic.com/media/935a00_b13897889ff345e1aef2f801f1d46cef~mv2.png/v1/fill/w_740,h_136,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_b13897889ff345e1aef2f801f1d46cef~mv2.png)

我们将在后续教程中了解更多，但 Solana 要求我们提前指定事务将与之交互的账户。由于我们正在与存储 `MyStruct` 的账户交互，因此我们需要提前计算其“地址”并将其传递给 `initialize()` 函数。以下是使用以下 Typescript 代码执行此操作：

```
seeds = []
const [myStorage, _bump] = 
    anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
```

请注意，`seeds` 是一个空数组，就像在 Anchor 程序中一样。

### 预测 Solana 中的账户地址就像在以太坊中使用 create2

在以太坊中，使用 create2 创建的合约的地址取决于：

- 部署合约的地址
- 一个 salt
- 以及创建的合约的字节码

在 Solana 中，预测初始化账户的地址非常类似，只是忽略了“字节码”。具体来说，它取决于：

- 拥有存储账户的程序，`basic_storage`（类似于部署合约的地址）
- 以及 `seeds`（类似于 create2 的“salt”）

在本教程中的所有示例中，`seeds` 都是一个空数组，但我们将在以后的教程中探讨非空数组。

### 不要忘记将 my_storage 转换为 myStorage

Anchor 悄悄地将 Rust 的蛇形命名法转换为 Typescript 的驼峰命名法。当我们在 Typescript 中向 initialize 函数提供 `.accounts({myStorage: myStorage})` 时，它会在 Rust 中的 `Initialize` 结构体中“填充” `my_storage` 键（下面绿色圈中）。`system_program` 和 `Signer` 会被 Anchor 静默填充：

![snake case to camel case conversion](https://static.wixstatic.com/media/935a00_cda7e1e9f41340e695496e45de9cbbad~mv2.png/v1/fill/w_740,h_506,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_cda7e1e9f41340e695496e45de9cbbad~mv2.png)

## 账户不能被初始化两次

如果我们可以重新初始化一个账户，那将是非常有问题的，因为用户可能会擦除系统中的数据！幸运的是，Anchor 在后台防范了这种情况。

如果你第二次运行测试（而不重置本地验证器），你将会收到下面截图中显示的错误。

或者，如果你不使用本地验证器，你可以运行以下测试：

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
 
		// ********************************************
		// **** NOTE THAT WE CALL INITIALIZE TWICE ****
    // ********************************************
    await program.methods.initialize().accounts({myStorage: myStorage}).rpc();
    await program.methods.initialize().accounts({myStorage: myStorage}).rpc();
  });
});
```

当我们运行测试时，测试会失败，因为第二次调用 `initialize` 会抛出错误。预期输出如下：

![Solana account cannot be initialized twice](https://static.wixstatic.com/media/935a00_a5c4242d593a446fb842c6028b436221~mv2.png/v1/fill/w_740,h_200,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_a5c4242d593a446fb842c6028b436221~mv2.png)

## 不要忘记在多次运行测试时重置验证器

因为 `solana-test-validator` 仍会记住第一个单元测试中的账户，所以你需要在测试之间使用 `solana-test-validator --reset` 来重置验证器。否则，你将会收到上面的错误。

## 初始化账户摘要

对于大多数以太坊开发者来说，初始化账户的需求可能会感到不自然。

不用担心，你会一遍又一遍地看到这段代码序列，过一段时间后，这将变得轻而易举。

在本教程中，我们只看了初始化存储，而在接下来的教程中，我们将学习读取、写入和删除存储。在今天看到的所有代码中，你将有很多机会直观地理解它们的作用。

**练习：** 修改 `MyStorage`，使其像笛卡尔坐标一样保存 `x` 和 `y`。这意味着向 `MyStorage` 结构体添加 `y` 并将它们从 `u64` 更改为 `i64`。你不需要修改代码的其他部分，因为 `size_of` 将为你重新计算大小。请确保重置验证器，以便原始存储账户被擦除，你不会被阻止再次初始化账户。

## 通过 RareSkills 了解更多

查看我们的 [Solana 课程](http://rareskills.io/solana-tutorial) 以获取更多信息。