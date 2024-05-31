# Rust 和 Solana 中的可见性和“继承”

更新日期：3 月 21 日

![rust 函数可见性](https://static.wixstatic.com/media/935a00_0cc717e55a18467587b68a28852aa476~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_0cc717e55a18467587b68a28852aa476~mv2.jpg)

今天我们将学习如何在 Solana 中概念化 Solidity 的函数可见性和合约继承。Solidity 中有四个级别的函数可见性，它们是：

- public - 从合约内部和外部都可以访问。
- external - 仅从合约外部可以访问。
- internal - 在合约内部和继承的合约中可以访问。
- private - 仅在合约内部可以访问。

让我们在**Solana**中实现相同的功能，好吗？

## **公共函数**

自第 1 天开始定义的所有函数都是公共函数：

```rust
pub fn my_public_function(ctx: Context<Initialize>) -> Result<()> {
    // Function logic...

    Ok(())
}
```

在函数声明之前添加 pub 关键字将函数设为公共。

你不能删除`#[program]`标记的模块内部的函数的`pub`关键字。这样做将无法编译。

## 不用过于担心 external 和 public 之间的区别

Solana 程序调用自己的公共函数通常是不方便的。如果 Solana 程序中有一个`pub`函数，实际上你可以将其视为在 Solidity 上下文中的外部函数。

如果要在同一 Solana 程序中调用公共函数，最好将公共函数包装在内部实现函数中并调用该函数。

## 私有和内部函数

虽然你不能在带有`#[program]`宏的模块内部声明没有`pub`的函数，但可以在文件内声明函数。考虑以下代码：

```rust
use anchor_lang::prelude::*;

declare_id!("F26bvRaY1ut3TD1NhrXMsKHpssxF2PAUQ7SjZtnrLkaM");

#[program]
pub mod func_test {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
				// -------- calling a "private" function --------
        let u = get_a_num();
        msg!("{}", u);
        Ok(())
    }
}

// ------- We declared a non pub function over here -------
fn get_a_num() -> u64 {
    2
}

#[derive(Accounts)]
pub struct Initialize {}
```

这将按预期运行和记录。

如果你想要构建简单的 Solana 程序，这就是你需要了解有关公共和内部函数的全部内容。但是，如果你想更好地组织代码，可以继续阅读。

**Rust 和 Solana 没有类似 Solidity 的“类”，因为 Rust 不是面向对象的。因此，“私有”和“内部”的区别在 Rust 中没有直接的类比。**

Rust 使用模块来组织代码。有关这些模块内部和外部函数的可见性在 [Rust 文档的可见性和隐私部分](https://doc.rust-lang.org/beta/reference/visibility-and-privacy.html)中有详细讨论，但我们将在下面添加我们自己的与 Solana 相关的内容。

### **内部函数**

可以通过在程序模块内定义函数并确保它在自己的模块以及导入或使用它的其他模块中可访问来实现这一点。让我们看看如何做到这一点：

```rust
use anchor_lang::prelude::*;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod func_visibility {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // Call the internal_function from within its parent module
        some_internal_function::internal_function();

        Ok(())
    }

    pub mod some_internal_function {
        pub fn internal_function() {
            // Internal function logic...
        }
    }
}

mod do_something {
    // Import func_visibility module
    use crate::func_visibility;

    pub fn some_func_here() {
        // Call the internal_function from outside its parent module
        func_visibility::some_internal_function::internal_function();

        // Do something else...
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

构建程序后，如果导航到`./target/idl/func_visibility.json`文件，你将注意到在`some_internal_function`模块内定义的函数未包含在构建的程序中。这表明函数`some_internal_function`是内部函数，只能在程序本身以及导入或使用它的任何程序中访问。

从上面的示例中，我们能够从其“父”模块（`func_visibility`）内访问`internal_function`函数，并且还能够从`func_visibility`模块外部的一个单独模块（`do_something`）中访问。

### **私有函数**

在特定模块内定义函数并确保它们不会在该范围之外暴露是实现私有可见性的一种方式：

```rust
use anchor_lang::prelude::*;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod func_visibility {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // Call the private_function from within its parent module
        some_function_function::private_function();

        Ok(())
    }

    pub mod some_function_function {
        pub(in crate::func_visibility) fn private_function() {
            // Private function logic...
        }
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

`pub(in crate::func_visibility)`关键字表示`private_function`函数仅在`func_visibility`模块内可见。

我们成功在 initialize 函数中调用了`private_function`，因为 initialize 函数在`func_visibility`模块内。让我们尝试从模块外部调用`private_function`：

```rust
use anchor_lang::prelude::*;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod func_visibility {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // Call the private_function from within its parent module
        some_private_function::private_function();

        Ok(())
    }

    pub mod some_private_function {
        pub(in crate::func_visibility) fn private_function() {
            // Private function logic...
        }
    }
}

mod do_something {
    // Import func_visibility module
    use crate::func_visibility;

    pub fn some_func_here() {
        // Call the private_function from outside its parent module
        func_visibility::some_private_function::private_function()

        // Do something...
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

构建程序。发生了什么？我们收到了一个错误：

❌ *error[E0624]: associated function `private_function` is private*

这表明`private_function`不是公开可访问的，不能从其可见的模块之外调用。查看 [Rust 文档中关于`pub`可见性关键字的内容](https://doc.rust-lang.org/beta/reference/visibility-and-privacy.html#pubin-path-pubcrate-pubsuper-and-pubself) 。

## **合约继承**

将 Solidity 合约继承直接翻译为 Solana 是不可能的，因为 Rust 没有类。

然而，在 Rust 中的一种解决方法涉及创建定义特定功能的单独模块，然后在我们的主程序中使用这些模块，从而实现类似于 Solidity 合约继承的功能。

### 从另一个文件获取模块

随着程序变得越来越大，我们通常不希望将所有内容放入一个文件中。以下是如何将逻辑组织到多个文件中。

让我们在**src**文件夹中创建另一个名为**calculate.rs**的文件，并将提供的代码复制到其中。

```rust
pub fn add(x: u64, y: u64) -> u64 {
	// Return the sum of x and y
    x + y
}
```

这个 add 函数返回 x 和 y 的和。

然后将其添加到 lib.rs 中。

```rust
use anchor_lang::prelude::*;

// Import `calculate` module or crate
pub mod calculate;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod func_visibility {
    use super::*;

    pub fn add_two_numbers(_ctx: Context<Initialize>, x: u64, y: u64) -> Result<()> {
        // Call `add` function in calculate.rs
        let result = calculate::add(x, y);

        msg!("{} + {} = {}", x, y, result);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

在上面的程序中，我们导入了之前创建的 calculate 模块，并声明了一个名为`add_two_numbers`的函数，该函数将两个数字相加并记录结果。`add_two_numbers`函数调用 calculate 模块中的 add 函数，将`x`和`y`作为参数传递，然后将返回值存储在 result 变量中。msg! 宏记录了相加的两个数字和结果。

### 模块不必是单独的文件

以下示例在 lib.rs 中声明了一个模块，而不是在 calculate.rs 中。

```rust
use anchor_lang::prelude::*;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod func_visibility {
    use super::*;

    pub fn add_two_numbers(_ctx: Context<Initialize>, x: u64, y: u64) -> Result<()> {
        // Call `add` function in calculate.rs
        let result = calculate::add(x, y);

        msg!("{} + {} = {}", x, y, result);

        Ok(())
    }
}

mod calculate {
    pub fn add(x: u64, y: u64) -> u64 {
		// Return the summation of x and y
        x + y
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

这个程序与前面的示例相同，唯一的区别是 add 函数存在于 lib.rs 文件中并在 calculate 模块内。此外，向函数添加 pub 关键字至关重要，因为它使函数可以公开访问。以下代码将无法编译：

```rust
use anchor_lang::prelude::*;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod func_visibility {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        // Call the private-like function
        let result2 = do_something::some_func_here();

        msg!("The result is {}", result2);

        Ok(())
    }
}

mod do_something {
    // private-like function. It exists in the code, but not everyone can call it
    fn some_func_here() -> u64 {
        // Do something...

        return 20;
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

## 总结

在 Solidity 中，我们非常关注函数的可见性，因为这非常重要。以下是在 Rust 中考虑如何使用它：

- **公共/外部函数**：这些函数在程序内部和外部都可以访问。在 Solana 中，所有声明的函数默认都是公共的。`#[program]`块中的所有内容都必须声明为`pub`。
- **内部函数**：这些函数在程序内部以及继承它的程序中可以访问。在嵌套的 pub mod 块内部的函数不包括在构建的程序中，但它们仍然可以在父模块内或外部访问。
- **私有函数**：这些函数不是公开可访问的，不能从其模块之外调用。在 Rust/Solana 中实现私有可见性涉及在特定模块内定义一个带有`pub`(in crate::) 关键字的函数，这使得该函数仅在定义的模块内可见。

Solidity 通过类实现合约继承，而 Rust，Solana 中使用的语言，没有这个特性。尽管如此，仍然可以使用 Rust mod 模块来组织代码。

## 通过 RareSkills 了解更多

本教程是我们 [Solana 课程](https://www.rareskills.io/solana-tutorial)的一部分。