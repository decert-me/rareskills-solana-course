# Solana Anchor 程序 IDL

![img](https://static.wixstatic.com/media/935a00_383c33e21e624c6dbface694c92bd6a5~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_383c33e21e624c6dbface694c92bd6a5~mv2.jpg)

IDL（接口定义语言）是一个 JSON 文件，描述了如何与 Solana 程序进行交互。它是由 Anchor 框架自动生成的。

名为“initialize”的函数没有什么特别之处——这是 Anchor 选择的名称。在本教程中，我们将学习 TypeScript 单元测试如何“找到”适当的函数。

让我们创建一个名为`anchor-function-tutorial`的新项目，并将`initialize`函数中的名称更改为 `boaty_mc_boatface`，保持其他内容不变。

```rust
pub fn boaty_mc_boatface(ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}
```

现在将测试更改为以下内容：

```js
it("Call boaty mcboatface", async () => {
  // Add your test here.
  const tx = await program.methods.boatyMcBoatface().rpc();
  console.log("Your transaction signature", tx);
});
```

现在使用`anchor test --skip-local-validator`运行测试。

测试按预期运行。那么它是如何奇迹般工作的呢？

### 测试是如何知道 initialize 函数的？

当 Anchor 构建 Solana 程序时，它会创建一个 IDL（接口定义语言）。

这个 IDL 存储在`target/idl/anchor_function_tutorial.json`中。这个文件只所以被称为`anchor_function_tutorial`，因为`anchor_function_tutorial`是程序的名称。请注意，Anchor 将破折号转换为下划线！

查看这个文件：

```json
{
  "version": "0.1.0",
  "name": "anchor_function_tutorial",
  "instructions": [
    {
      "name": "boatyMcBoatface",
      "accounts": [],
      "args": []
    }
  ]
}
```

“instructions”列表是程序的公共函数，大致相当于以太坊合约上的外部函数和公共函数。**在 Solana 中，IDL 文件的作用类似于 Solidity 中的 ABI 文件，指定如何与程序/合约进行交互。**

我们之前看到函数没有接受任何参数，这就是为什么`args`列表为空的原因。我们稍后会解释“accounts”是什么。

有一件事很明显：Rust 中的函数是蛇形命名，但 Anchor 在 JavaScript 中将它们格式化为驼峰式。这是为了遵循不同语言的约定：Rust 倾向于使用蛇形命名，而 JavaScript 通常使用驼峰命名。

通过该 JSON 文件，“methods”对象可以知道了解需要支持哪些功能

当运行测试时，我们期望它通过测试，这意味着测试正确地调用了 Solana 程序：

![solana 测试通过](https://static.wixstatic.com/media/935a00_dedb6e369b14419880e19969e2bdd4d6~mv2.png/v1/fill/w_740,h_211,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_dedb6e369b14419880e19969e2bdd4d6~mv2.png)

**练习：** 为 boaty_mc_boatface 函数添加一个接收 u64 类型的参数。再次运行`anchor build`，然后再次打开`target/idl/anchor_function_tutorial.json`文件。它有什么变化？

现在创建一个 Solana 程序，其中包含用于基本加法和减法的函数，这些函数会打印结果。Solana 函数无法像 Solidity 那样返回数值，所以必须打印它们。（Solana 有其他传递值的方式，我们稍后讨论）。让我们创建两个类似的函数：

```rust
pub fn add(ctx: Context<Initialize>, a: u64, b: u64) -> Result<()> {
  let sum = a + b;
  msg!("Sum is {}", sum);
	Ok(())
}

pub fn sub(ctx: Context<Initialize>, a: u64, b: u64) -> Result<()> {
  let difference = a - b;
  msg!("Difference is {}", difference);
	Ok(())
}
```

并将单元测试更改为以下内容：

```js
it("Should add", async () => {
  const tx = await program.methods.add(new anchor.BN(1), new anchor.BN(2)).rpc();
  console.log("Your transaction signature", tx);
});

it("Should sub", async () => {
  const tx = await program.methods.sub(
	new anchor.BN(10),
	new anchor.BN(3)).rpc();
  console.log("Your transaction signature", tx);
});
```

**练习：** 为`mul`、`div` 和 `mod`实现类似的函数，并编写单元测试来触发每个函数。

### `Initialize` 结构体是什么？

现在还有一个疑问。我们保持`Initialize`结构体不变，并在函数之间重复使用它。同样，名称并不重要。让我们将结构体名称更改为`Empty`，然后重新运行测试。

```rust
  // ...
  // Change struct name here
	pub fn add(ctx: Context<Empty>, a: u64, b: u64) -> Result<()> {
	    let sum = a + b;
	    msg!("Sum is {}", sum);
	    Ok(())
	}
//...

// Change struct name here too
#[derive(Accounts)]
pub struct Empty {}
```

同样，这里的名称--`Empty`是完全任意的。

**练习：** 将结构体`Empty`更改为`BoatyMcBoatface`，然后重新运行测试。

### `#[derive(Accounts)]` 结构体是什么？

这个`#`语法是 Anchor 框架定义的 [Rust 属性](https://doc.rust-lang.org/reference/attributes.html) 。我们将在后续教程中进一步解释这个内容。现在，我们要关注 IDL 中的`accounts`以及它如何与程序中定义的结构体相关联。

### Accounts IDL

下面是程序的 IDL 的截图。我们就可以看到 Rust 属性`#[derive(Accounts)]`中的“Accounts”与 IDL 中的“accounts”键之间的关系：

![solana anchor idl](https://static.wixstatic.com/media/935a00_1a2d5c48f8ff46f1836f3a9704e8e1df~mv2.png/v1/fill/w_740,h_517,al_c,q_90,usm_0.66_1.00_0.01,enc_auto/935a00_1a2d5c48f8ff46f1836f3a9704e8e1df~mv2.png)

在我们的示例中，上面紫色箭头标记的 JSON IDL 中的`accounts`键是空的。但对于大多数有用的 Solana 交易来说，情况并非如此，我们稍后会学习。

因为`BoatyMcBoatface`账户结构体是空的，所以 IDL 中的账户列表也是空的。

现在让我们看看当结构体不为空时会发生什么。复制下面的代码，并替换 [`lib.rs`](http://lib.rs/) 的内容。

```rust
use anchor_lang::prelude::*;

declare_id!("8PSAL9t1RMb7BcewhsSFrRQDq61Y7YXC5kHUxMk5b39Z");

#[program]
pub mod anchor_function_tutorial {
    use super::*;

    pub fn non_empty_account_example(ctx: Context<NonEmptyAccountExample>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct NonEmptyAccountExample<'info> {
    signer: Signer<'info>,
    another_signer: Signer<'info>,
}
```

现在运行`anchor build` - 让我们看看新的 IDL 返回了什么。

```js
{
  "version": "0.1.0",
  "name": "anchor_function_tutorial",
  "instructions": [
    {
      "name": "nonEmptyAccountExample",
      "accounts": [
        {
          "name": "signer",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "anotherSigner",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "metadata": {
    "address": "8PSAL9t1RMb7BcewhsSFrRQDq61Y7YXC5kHUxMk5b39Z"
  }
}
```

请注意，“accounts”不再为空，并且填充了来自结构体的字段：“signer”和“anotherSigner”（请注意，another_signer 从蛇形命名转换为驼峰命名）。IDL 已经更新以匹配刚刚更改的结构体，特别是我们添加的账户数量。

我们将在即将推出的教程中更深入地探讨“Signer”，但目前你可以将其视为类似于以太坊中的`tx.origin`。

### 另一个程序和 IDL 的第二个示例

为了总结我们现在学到的一切，再构建一个具有不同函数和账户结构的程序。

```rust
use anchor_lang::prelude::*;

declare_id!("8PSAL9t1RMb7BcewhsSFrRQDq61Y7YXC5kHUxMk5b39Z");

#[program]
pub mod anchor_function_tutorial {
    use super::*;

    pub fn function_a(ctx: Context<NonEmptyAccountExample>) -> Result<()> {
        Ok(())
    }

    pub fn function_b(ctx: Context<Empty>, firstArg: u64) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct NonEmptyAccountExample<'info> {
    signer: Signer<'info>,
    another_signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct Empty {}
```

现在使用`anchor build`构建程序

让我们再次查看 IDL 文件`target/idl/anchor_function_tutorial.json`，并将这些文件并排放置：

![idl 与 solana 程序并排](https://static.wixstatic.com/media/935a00_4e4349630f9f4731b99b550b35ba1fde~mv2.png/v1/fill/w_740,h_413,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_4e4349630f9f4731b99b550b35ba1fde~mv2.png)

你能看到 IDL 文件与上面程序之间的关系吗？

函数`function_a`没有参数，这在 IDL 中显示为`args`键下的空数组。

`Context`接受`NonEmptyAccountExample`结构体。这个结构体`NonEmptyAccountExample`有两个 Signer 类型的属性：`signer`和`another_signer`。请注意，这些在 IDL 中作为`function_a`的`accounts`键中的元素重复显示。你可以看到 Anchor 将 Rust 的蛇形命名转换为 IDL 中的驼峰命名。

函数`function_b`接受一个 u64 类型的参数。它的结构体为空，因此 IDL 中`function_b`的`accounts`键是一个空数组。

一般来说，我们希望 IDL 中`accounts`中包含的属性与函数在其`ctx`参数中接受的账户结构体的属性相匹配。

### 总结

在本章中：

- 我们了解到 Solana 使用 IDL（接口定义语言）显示如何与 Solana 程序进行交互以及 IDL 中显示的字段。
- 我们介绍了由`#[derive(Accounts)]`修改的结构体及其与函数参数的关系。
- Anchor 将 Rust 中的蛇形命名函数转化为 TypeScript 测试中的驼峰命名函数。