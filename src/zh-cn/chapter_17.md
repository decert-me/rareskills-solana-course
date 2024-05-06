# Solana 计数器教程：读取和写入账户数据

更新日期：2 月 25 日

![img](https://static.wixstatic.com/media/935a00_e7c40bb8964749c68bcb39e80aae9679~mv2.jpg)

在我们之前的教程中，我们讨论了如何初始化一个账户，以便我们可以将数据持久化存储。本教程展示了如何向我们已经初始化的账户写入数据。

以下是来自之前 Solana 账户初始化教程的代码。我们添加了一个`set()`函数，用于将一个数字存储在`MyStorage`和相关的`Set`结构中。

其余代码保持不变：

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

    // ****************************
    // *** THIS FUNCTION IS NEW ***
    // ****************************
    pub fn set(ctx: Context<Set>, new_x: u64) -> Result<()> {
        ctx.accounts.my_storage.x = new_x;
        Ok(())
    }
}

// **************************
// *** THIS STRUCT IS NEW ***
// **************************
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

**练习：** 修改测试，使用参数`170`调用`set()`。这是我们试图持久化的`MyStorage`中`x`的值。在`initialize()`之后调用`set()`。不要忘记将`170`转换为大数。

## `set()`函数解释

下面，我们稍微重新排列了代码，展示了`set()`函数、`Set`结构和`MyStorage`结构紧密相连：

![img](https://static.wixstatic.com/media/935a00_c11d3593c0004a659db5921808157f34~mv2.png/v1/fill/w_740,h_357,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c11d3593c0004a659db5921808157f34~mv2.png)

我们现在解释`ctx.accounts.my_storage.x = new_x`的工作原理：

- ctx 中的 accounts 字段（顶部蓝色框）为我们提供了访问 Set 结构中所有键的权限。这不是在 Rust 中列出结构键的方式。accounts 能够引用 Set 结构中的键，是由于 #[derive(Accounts)] 宏（底部蓝色框）的神奇插入。
- 账户 my_storage（橙色框）被设置为可变（绿色框），因为我们打算更改其中的值 x（红色框）。
- 键`my_storage`（橙色框）通过将`MyStorage`作为泛型参数传递给`Account`，为我们提供了对`MyStorage`账户（黄色框）的引用。我们使用键`my_storage`和存储结构`MyStorage`的事实仅是为了可读性，它们不需要彼此是驼峰式变体。将它们“联系在一起”的方式用黄色框和黄色箭头进行了说明。

实质上，当调用 set()时，调用者（Typescript 客户端）将 myStorage 账户传递给 set()。在这个账户内部是存储的地址。在幕后，set 将加载存储，写入 x 的新值，序列化结构，然后将其存储回去。

## `Context`结构 Set

`set()`的`Context`结构比`initialize`要简单得多，因为它只需要一个资源：对`MyStorage`账户的可变引用。

![img](https://static.wixstatic.com/media/935a00_38ac522d9abb4caea0b70248e7524656~mv2.png/v1/fill/w_740,h_146,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_38ac522d9abb4caea0b70248e7524656~mv2.png)

回想一下，Solana 交易必须预先指定将访问哪些账户。`set()`函数的结构指定将可变地（`mut`）访问`my_storage`账户。

`seeds = []`和`bump`用于推导我们将要修改的账户的地址。尽管用户为我们传入了账户，但 Anchor 会验证用户是否真的传入了这个程序真正拥有的账户，方法是重新推导地址并将其与用户提供的进行比较。

术语`bump`目前可以视为样板。但对于好奇的人来说，它用于确保该账户不是一个密码学上有效的公钥。这是运行时如何知道这将被用作程序的数据存储的方式。

尽管我们的 Solana 程序可以自行推导存储账户的地址，但用户仍然需要提供`myStorage`账户。这是 Solana 运行时要求的，我们将在接下来的教程中讨论原因。

## 写入`set`函数的另一种方法

如果我们要向账户写入多个变量，那么像这样一遍又一遍地写`ctx.accounts.my_storage`会显得相当笨拙：

```
ctx.accounts.my_storage.x = new_x;
ctx.accounts.my_storage.y = new_y;
ctx.accounts.my_storage.z = new_z;
```

相反，我们可以使用 Rust 中的“可变引用”（`&mut`），为我们提供一个对值的“句柄”，以便我们操作。考虑我们`set()`函数的以下重写：

```
pub fn set(ctx: Context<Set>, new_x: u64) -> Result<()> {
    let my_storage = &mut ctx.accounts.my_storage;
	my_storage.x = new_x;

    Ok(())
}
```

**练习：** 使用新的`set`函数重新运行测试。如果你正在使用本地测试网，请不要忘记重置验证器。

## 查看我们的存储账户

如果你正在运行用于测试的本地验证器，你可以使用以下 Solana 命令行指令查看账户数据：

```
# 用你测试中的地址替换这里的地址
solana account 9opwLZhoPdEh12DYpksnSmKQ4HTPSAmMVnRZKymMfGvn
```

将地址替换为从单元测试中记录在控制台的地址。

输出如下：

![img](https://static.wixstatic.com/media/935a00_98f723c0f9a644cbb551cea8775b924b~mv2.png/v1/fill/w_740,h_144,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_98f723c0f9a644cbb551cea8775b924b~mv2.png)

前 8 个字节（绿色框）是鉴别器。我们的测试将数字`170`存储在结构中，这个数字的十六进制表示为`aa`，显示在红色框中。

当然，命令行不是我们想要用来在前端查看账户数据的机制，也不是我们想要让我们的程序查看另一个程序的账户的机制。这将在接下来的教程中讨论。

## 从 Rust 程序内部查看我们的存储账户

然而，在 Rust 程序内部读取我们自己的存储值是很简单的。

我们向`pub mod basic_storage`添加以下函数：

```
pub fn print_x(ctx: Context<PrintX>) -> Result<()> {
    let x = ctx.accounts.my_storage.x;
    msg!("The value of x is {}", x);
    Ok(())
}
```

然后我们为`PrintX`添加以下结构：

```
#[derive(Accounts)]
pub struct PrintX<'info> {
    pub my_storage: Account<'info, MyStorage>,
}
```

请注意，`my_storage`没有`#[account(mut)]`宏，因为我们不需要它是可变的，我们只是在读取它。

然后我们将以下行添加到我们的测试中：

```
await program.methods.printX().accounts({myStorage: myStorage}).rpc();
```

如果你正在后台运行`solana logs`，你应该看到数字被打印出来。

**练习：** 编写一个增量函数，读取`x`并将`x + 1`存储回`x`。