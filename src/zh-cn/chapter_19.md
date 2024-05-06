# 在 Solana 中创建“映射”和“嵌套映射”

更新日期：3 月 1 日

![在 Solana 中的映射和嵌套映射](https://static.wixstatic.com/media/935a00_fcc8fb7861f344a6b54b33647dc34ef2~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_fcc8fb7861f344a6b54b33647dc34ef2~mv2.jpg)

在之前的教程中，`seeds=[]` 参数总是空的。如果我们向其中放入数据，它会像 Solidity 映射中的键一样运作。

考虑以下示例：

```
contract ExampleMapping {

    struct SomeNum {
        uint64 num;
    }

    mapping(uint64 => SomeNum) public exampleMap;

    function setExampleMap(uint64 key, uint64 val) public {
        exampleMap[key] = SomeNum(val);
    }
}
```

我们现在创建一个 Solana Anchor 程序 `example_map`。

## 初始化映射：Rust

首先，我们只展示初始化步骤，因为它会引入一些新的语法，我们需要解释。

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("DntexDPByFxpVeBSjd6nLqQQSqZmSaDkP8TUbcJ9jAgt");

#[program]
pub mod example_map {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, key: u64) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(key: u64)]
pub struct Initialize<'info> {

    #[account(init,
              payer = signer,
              space = size_of::<Val>() + 8,
              seeds=[&key.to_le_bytes().as_ref()],
              bump)]
    val: Account<'info, Val>,
    
    #[account(mut)]
    signer: Signer<'info>,
    
    system_program: Program<'info, System>,
}

#[account]
pub struct Val {
    value: u64,
}
```

这是你可以考虑这个映射的方式：

`&key.to_le_bytes().as_ref()` 中的 `key` 参数可以被视为映射中的“键”，类似于 Solidity 构造：

```
mapping(uint256 => uint256) myMap;
myMap[key] = val
```

代码中不熟悉的部分是 `#[instruction(key: u64)]` 和 `seeds=[&key.to_le_bytes().as_ref()]`。

### seeds = [&key.to_le_bytes().as_ref()]

`seeds` 中的项应为字节。然而，我们传入的是一个 `u64`，而不是字节类型。为了将其转换为字节，我们使用 `to_le_bytes()`。这里的“le”表示“ [little endian（小端）](https://www.freecodecamp.org/news/what-is-endianness-big-endian-vs-little-endian/) ”。seeds 不一定要编码为小端字节，我们只是为了这个示例选择了这种方式。大端也可以，只要保持一致。要转换为大端，我们将使用 `to_be_bytes()`。

### #[instruction(key: u64)]

为了在 `initialize(ctx: Context<Initialize>, key: u64)` 中“传递”函数参数 `key`，我们需要使用 `instruction` 宏，否则我们的 `init` 宏无法“看到” `initialize` 中的 `key` 参数。

## 初始化映射：Typescript

下面的代码展示了如何初始化账户：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ExampleMap } from "../target/types/example_map";

describe("example_map", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ExampleMap as Program<ExampleMap>;

  it("Initialize mapping storage", async () => {
    const key = new anchor.BN(42);

    const [seeds, _bump] = [key.toArrayLike(Buffer, "le", 8)];
    let valueAccount = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId,
    );

    await program.methods.initialize(key).accounts({val: valueAccount}).rpc();
  });
});
```

代码 `key.toArrayLike(Buffer, "le", 8)` 指定我们正在尝试使用来自 `key` 的值创建一个大小为 8 字节的字节缓冲区。我们选择了 8 字节，因为我们的 `key` 是 64 位，64 位等于 `8` 字节。"le" 表示小端，以便与 Rust 代码匹配。

映射中的每个“值”都是一个单独的账户，必须分别初始化。

## 设置映射：Rust

我们需要额外的 Rust 代码来设置值。这里的所有语法都应该是熟悉的。

```
// inside the #[program] module
pub fn set(ctx: Context<Set>, key: u64, val: u64) -> Result<()> {
    ctx.accounts.val.value = val;
    Ok(())
}

//...

#[derive(Accounts)]
#[instruction(key: u64)]
pub struct Set<'info> {
    #[account(mut)]
    val: Account<'info, Val>,
}
```

## 设置和读取映射：Typescript

因为我们在客户端（Typescript）中派生出存储值的账户地址，我们可以像处理 `seeds` 数组为空的账户一样从中读取和写入。读取 Solana 账户数据的语法和写入的语法与之前的教程相同：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ExampleMap } from "../target/types/example_map";

describe("example_map", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ExampleMap as Program<ExampleMap>;

  it("Initialize and set value", async () => {
    const key = new anchor.BN(42);
    const value = new anchor.BN(1337);

    const seeds = [key.toArrayLike(Buffer, "le", 8)];
    let valueAccount = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId,
    )[0];

    			await program.methods.initialize(key).accounts({val: valueAccount}).rpc();

	// set the account
    await program.methods.set(key, value).accounts({val: valueAccount}).rpc();

    // read the account back
    let result = await program.account.val.fetch(valueAccount);

    console.log(`the value ${result.value} was stored in ${valueAccount.toBase58()}`);

  });
});
```

## 澄清“嵌套映射”

在像 Python 或 Javascript 这样的语言中，真正的嵌套映射是指指向另一个哈希映射的哈希映射。

然而，在 Solidity 中，“嵌套映射”只是一个具有多个键的单个映射，行为就像它们是一个键一样。

在一个“真正”的嵌套映射中，你只需提供第一个键，就会返回另一个哈希映射。

Solidity 的“嵌套映射”不是“真正”的嵌套映射：你不能提供一个键并获得一个映射返回：你必须提供所有键并获得最终结果。

如果你使用 seeds 来模拟类似于 Solidity 的嵌套映射，你将面临相同的限制。你必须提供所有 seeds —— Solana 不会接受只有一个 seed。

## 初始化嵌套映射：Rust

`seeds` 数组可以容纳任意数量的项，类似于 Solidity 中的嵌套映射。当然，这取决于每个交易所施加的计算限制。下面显示了执行初始化和设置的代码。

我们不需要任何特殊的语法来做到这一点，只需多接受一些函数参数并将更多项放入 `seeds` 中，因此我们将展示完整的代码而不再解释。

### Rust 嵌套映射

```
use anchor_lang::prelude::*;
use std::mem::size_of;

declare_id!("DntexDPByFxpVeBSjd6nLqQQSqZmSaDkP8TUbcJ9jAgt");

#[program]
pub mod example_map {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, key1: u64, key2: u64) -> Result<()> {
        Ok(())
    }

    pub fn set(ctx: Context<Set>, key1: u64, key2: u64, val: u64) -> Result<()> {
        ctx.accounts.val.value = val;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(key1: u64, key2: u64)] // new key args added
pub struct Initialize<'info> {

    #[account(init,
              payer = signer,
              space = size_of::<Val>() + 8,
              seeds=[&key1.to_le_bytes().as_ref(), &key2.to_le_bytes().as_ref()], // 2 seeds
              bump)]
    val: Account<'info, Val>,
    
    #[account(mut)]
    signer: Signer<'info>,
    
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(key1: u64, key2: u64)] // new key args added
pub struct Set<'info> {
    #[account(mut)]
    val: Account<'info, Val>,
}

#[account]
pub struct Val {
    value: u64,
}
```

### Typescript 嵌套映射

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ExampleMap } from "../target/types/example_map";

describe("example_map", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ExampleMap as Program<ExampleMap>;

  it("Initialize and set value", async () => {
    // we now have two keys
    const key1 = new anchor.BN(42);
    const key2 = new anchor.BN(43);
    const value = new anchor.BN(1337);

    // seeds has two values
    const seeds = [key1.toArrayLike(Buffer, "le", 8), key2.toArrayLike(Buffer, "le", 8)];
    let valueAccount = anchor.web3.PublicKey.findProgramAddressSync(
      seeds,
      program.programId,
    )[0];

    // functions now take two keys
    await program.methods.initialize(key1, key2).accounts({val: valueAccount}).rpc();
    await program.methods.set(key1, key2, value).accounts({val: valueAccount}).rpc();

    // read the account back
    let result = await program.account.val.fetch(valueAccount);
    console.log(`the value ${result.value} was stored in ${valueAccount.toBase58()}`);

  });
});
```

**练习：** 修改上述代码以形成一个嵌套映射，其中有三个键。

## 初始化多个映射

实现拥有多个映射的简单方法是将另一个变量添加到 `seeds` 数组中，并将其视为“索引”第一个映射、第二个映射等等的方式。

以下代码展示了初始化 `which_map` 的示例，它只包含一个键。

```
#[derive(Accounts)]
#[instruction(which_map: u64, key: u64)]
pub struct InitializeMap<'info> {

    #[account(init,
              payer = signer,
              space = size_of::<Val1>() + 8,
              seeds=[&which_map.to_le_bytes().as_ref(), &key.to_le_bytes().as_ref()],
              bump)]
    val: Account<'info, Val1>,

    #[account(mut)]
    signer: Signer<'info>,

    system_program: Program<'info, System>,
}
```

**练习：** 完成 Rust 和 Typescript 代码，创建一个具有两个映射的程序：第一个映射具有单个键，第二个映射具有两个键。考虑如何在指定第一个映射时将两级映射转换为单级映射。

## 通过 RareSkills 学习 Solana

查看我们的 [Solana 课程](http://rareskills.io/solana-tutorial) 以查看我们的其他 Solana 教程。