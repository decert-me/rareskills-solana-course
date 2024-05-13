# 在链上读取另一个 Anchor 程序的账户数据

在 Solidity 中，读取另一个合约的存储需要调用一个`view`函数或者存储变量是公共的。在 Solana 中，一个链下客户端可以直接读取一个存储账户。本教程展示了一个在链上的 Solana 程序如何读取它不拥有的账户中的数据。

我们将设置两个程序：`data_holder`和`data_reader`.`data_holder`将初始化并拥有一个包含`data_reader`将要读取的数据的 PDA。

## 设置存储数据的`data_holder`程序：Shell 1

以下代码是一个初始化带有`u64`字段`x`的账户`Storage`并在初始化时将值 9 存储在其中的基本 Solana 程序：

Typescript 代码:
```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DataHolder } from "../target/types/data_holder";
describe("data-holder", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .DataHolder as Program<DataHolder>;

  it("Is initialized!", async () => {
    const seeds = [];
    const [storage, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
        seeds,
        program.programId
      );

    await program.methods
      .initialize()
      .accounts({ storage: storage })
      .rpc();

    let storageStruct = await program.account.storage.fetch(
      storage
    );

    console.log(
      "The value of x is: ",
      storageStruct.x.toString()
    );

    console.log("Storage account address: ", storage.toBase58());
  });
});
```
测试将打印出 PDA 的地址，我们将很快引用这个地址：

![图 1：PDA 地址的终端输出](https://static.wixstatic.com/media/706568_78de30cddc5c48cf851a6c6e3deb73f4~mv2.png)

## 读取器

为了让`data_reader`读取另一个账户，该账户的公钥需要作为交易的一部分通过`Context`结构传递。这与传递任何其他类型的账户没有区别。

账户中的数据以序列化字节的形式存储。为了反序列化账户，`data_reader`程序需要一个 Rust 定义的结构体，该结构体与`data_holder`中的`Storage`结构体相同：

```
#[account]
pub struct Storage {
    x: u64,
}
```

这个结构体与`data_reader`中的结构体完全相同 — 即使名称也必须相同（稍后我们将详细介绍原因）。读取账户的代码在以下两行中：

```
let mut data_slice: &[u8] = &data_account.data.borrow();

let data_struct: Storage =
    AccountDeserialize::try_deserialize(
        &mut data_slice,
    )?;

```

`data_slice`是账户中数据的原始字节。如果你运行`solana account <pda 地址>`（使用我们部署`data_holder`时生成的 PDA 地址），你可以在那里看到数据，包括我们存储在`red`框中的数字 9：

![图 2：包含数字 9 的`solana account <pda 地址>`的终端输出](https://static.wixstatic.com/media/706568_77a38c0aa64845f5bc3e4ae32f1a6ca3~mv2.png)

黄框中的前 8 个字节是账户鉴别器，稍后我们将描述它们。

反序列化发生在这一步：

```
let data_struct: Storage =
    AccountDeserialize::try_deserialize(
        &mut data_slice,
    )?;
```

在这里传递类型`Storage`（我们上面定义的相同结构体）告诉 Solana 如何（尝试）反序列化数据。

现在让我们在一个新文件夹中创建一个单独的 Anchor 项目 `anchor new data_reader`。

以下是完整的 Rust 代码：
```
use anchor_lang::prelude::*;

declare_id!("HjJ1Rqsth5uxA6HKNGy8VVRvwK4W7aFgmQsss7UxePBw");

#[program]pub mod data_reader {
    use super::*;

    pub fn read_other_data(
        ctx: Context<ReadOtherData>,
    ) -> Result<()> {

            let data_account = &ctx.accounts.other_data;

        if data_account.data_is_empty() {
            return err!(MyError::NoData);
        }

        let mut data_slice: &[u8] = &data_account.data.borrow();

        let data_struct: Storage =
            AccountDeserialize::try_deserialize(
                &mut data_slice,
            )?;

        msg!("The value of x is: {}", data_struct.x);

        Ok(())
    }
}
#[error_code]
pub enum MyError {
    #[msg("No data")]
    NoData,
}

#[derive(Accounts)]
pub struct ReadOtherData<'info> {
    /// CHECK: We do not own this account so
    // we must be very cautious with how we
    // use the data
    other_data: UncheckedAccount<'info>,
}

#[account]
pub struct Storage {
    x: u64,
}
```

这是运行它的测试代码。确保在下面的代码中更改 PDA 的地址：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DataReader } from "../target/types/data_reader";

describe("data-reader", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace
    .DataReader as Program<DataReader>;

  it("Is initialized!", async () => {
    // CHANGE THIS TO THE ADDRESS OF THE PDA OF
    // DATA ACCOUNT HOLDER
    const otherStorageAddress =
      "HRGqGCLXxLryZav2SeKJKqBWYs8Ne7ppJxf3MLM3Y71E";

    const pub_key_other_storage = new anchor.web3.PublicKey(
      otherStorageAddress
    );

    const tx = await program.methods
      .readOtherData()
      .accounts({ otherData: pub_key_other_storage })
      .rpc();
  });
});
```

要测试读取另一个账户的数据：

1. 运行`solana-test-validator`上的`data_holder`测试。
    
2. 复制并粘贴`Storage`账户的公钥
    
3. 将该公钥放入`data_reader`测试的`otherStorageAddress`中
    
4. 在另一个 Shell 中运行 Solana 日志
    
5. 运行`data_reader`的测试以读取数据。
    

在 Solana 日志中应该看到以下内容：

![图 3：`data_reader`测试的终端输出](https://static.wixstatic.com/media/706568_11a4451dda4a4e1198bd3d4fe2187f4a~mv2.png)

### 如果我们不给结构体相同的名称会发生什么？

如果你将`data_reader`中的`Storage`结构体更改为除`Storage`之外的名称，比如`Storage2`，并尝试读取该账户，将会出现以下错误：

![图 4：更改 solana 中 data_reader 名称时的错误输出](https://static.wixstatic.com/media/706568_ef3a6822311d4958bdbd08d6866a05db~mv2.png)

由 Anchor 计算的账户鉴别器是结构体名称 sha256 后的前八个字节的 。**账户鉴别器不依赖于结构体中的变量。**

当 Anchor 读取账户时，它会检查前八个字节（账户鉴别器），看看它们是否与本地用于反序列化数据的结构体定义的账户鉴别器匹配。如果它们不匹配，Anchor 将不会反序列化数据。

检查账户鉴别器是防止客户端意外传递错误账户或其数据格式不符合 Anchor 预期的一种保护措施。

## 反序列化不会因解析更大的结构体而回滚

Anchor _只_ 检查账户鉴别器是否匹配 — 它不验证正在读取的账户内部的字段。

### 情况 1：Anchor 不检查结构体字段名称是否匹配

让我们将`data_reader`中`Storage`结构体的`x`字段更改为`y`，保持`data_holder`中的`Storage`结构体不变：

```
// data_reader

#[account]
pub struct Storage {
    y: u64,
}
```

我们还需要将日志行更改如下：

```
msg!("The value of y is: {}", data_struct.y);
```

当我们重新运行测试时，它成功读取数据：

![图 5：ReadOtherData 的成功终端输出](https://static.wixstatic.com/media/706568_592017189d1344ffad907e2f27d38b2c~mv2.png)

### 情况 2：Anchor 不检查数据类型

现在让我们将`data_reader`中`Storage`中的`y`的数据类型更改为`u32`，即使原始结构体是`u64`。

```
// data_reader

#[account]
pub struct Storage {
    y: u32,
}
```

当我们运行测试时，Anchor 仍然成功解析账户数据。

![图 6：更改 data_reader 中数据类型的终端输出](https://static.wixstatic.com/media/706568_9dbe0c8099744461bfaa81d91a74c1d5~mv2.png)

这个“成功”的原因是数据的布局方式：

![图 7：显示 data_reader Storage 原始字节数据的终端](https://static.wixstatic.com/media/706568_714ca0dee0e142ad8a9a076f74145dd1~mv2.png)

7 中的`9`在第一个字节中可用 — 一个`u32`将在前 4 个字节中查找数据，因此它将能够“看到”`9`。

当然，如果我们存储一个`u32`无法容纳的值在`x`中，比如 2³²，那么我们的读取程序将打印错误的数字。

**练习：** 重置验证器并重新部署`data_holder`，值为 2³²。在 Rust 中求幂的方法是 `let result = u64::pow(base, exponent)`。例如，`let result = u64::pow(2, 32);` 看看`data_reader`记录了什么值。

### 情况 3：解析超出数据量

存储账户大小为 16 字节。它包含 8 字节的账户鉴别器和 8 字节的`u64`变量。如果我们尝试读取超出账户大小的数据，比如定义一个需要超过 16 字节的值的结构体，那么读取时的反序列化将失败：

```
#[account]
pub struct Storage {
    y: u64,
    z: u64,
}
```

上面的结构体需要 16 字节来存储 y 和 z，但还需要额外的 8 字节来存储账户鉴别器，使账户大小为 24 字节。

![图 8：由于提供的数据超出所需数据而导致 data_reader 初始化失败的错误](https://static.wixstatic.com/media/706568_2a92b44a77a1427682c2d896efb077df~mv2.png)

## 解析 Anchor 账户数据总结

当从外部账户读取数据时，Anchor 将检查账户鉴别器是否匹配，并且账户中有足够的数据可以反序列化为用作 try_deserialize 类型的结构体：

```
let data_struct: Storage =
    AccountDeserialize::try_deserialize(
        &mut data_slice,
    )?;
```

Anchor 不检查变量的名称或其长度。

在幕后，Anchor 不存储任何元数据来解释账户中的数据。它只是端到端存储的变量字节。

## 不是所有的数据账户都遵循 Anchor 的约定

Solana 不要求使用账户鉴别器。使用原始 Rust 编写的 Solana 程序（没有使用 Anchor 框架）可能会以一种与 Anchor 的序列化方法不直接兼容的方式存储它们的数据，而 `AccountDeserialize::try_deserialize` 实现了这种方法。要反序列化非 Anchor 数据，开发人员必须事先了解所使用的序列化方法 — Solana 生态系统中没有强制执行的通用约定。

## 从任意账户读取数据时要小心

Solana 程序默认可升级。它们在账户中存储数据的方式可能随时发生变化，这可能会破坏正在从中读取数据的程序。

从任意账户接受数据是危险的 — 通常应在读取数据之前检查账户是否由受信任的程序拥有。