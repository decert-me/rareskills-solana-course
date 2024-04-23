# 面向 Solidity 开发人员的基本 Rust

更新日期：Feb 29

![Rust 基本语法](https://static.wixstatic.com/media/935a00_f5ff83c14f7a4ff6a5e22d2ff73bc4e7~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_f5ff83c14f7a4ff6a5e22d2ff73bc4e7~mv2.jpg)

本教程介绍了 Solidity 中最常用的语法，并演示了 Rust 中的等效语法。

如果你想要了解 [Rust vs Solidity](https://www.rareskills.io/post/solidity-vs-rust) 的差异，请参阅链接的教程。本教程假定你已经了解 Solidity，如果你对 Solidity 不熟悉，请参阅我们的免费 [Solidity 教程](https://www.rareskills.io/learn-solidity)。

创建一个名为 `tryrust` 的新 Solana Anchor 项目，并设置环境。

## 条件语句

我们可以说在 Solidity 中有两种开发人员可以根据特定条件控制执行流程的方式：

- If-Else 语句
- 三元运算符

现在让我们看看在 Solidity 中的上述内容，以及它们在 Solana 中的翻译。

**If-Else 语句**

在 Solidity 中：

```
function ageChecker(uint256 age)
	public pure returns (string memory) {

    if (age >= 18) {
        return "You are 18 years old or above";
    } else {
        return "You are below 18 years old";
    }
}
```

在 Solana 中，在 [lib.rs](http://lib.rs/) 中添加一个名为 `age_checker` 的新函数：

```
pub fn age_checker(ctx: Context<Initialize>,
                   age: u64) -> Result<()> {
    if age >= 18 {
        msg!("You are 18 years old or above");
    } else {
        msg!("You are below 18 years old");
    }
    Ok(())
 }
```

请注意，条件 `age >= 18` 不需要括号 — if 语句中的括号是可选的。

为了测试，在 ./tests/tryrust.ts 中添加另一个 it 块：

```
it("Age checker", async () => {
    // Add your test here.
    const tx = await program.methods.ageChecker(new anchor.BN(35)).rpc();
    console.log("Your transaction signature", tx);
});
```

运行测试后，我们应该看到以下日志：

![rust 测试控制台](https://static.wixstatic.com/media/935a00_352cf38336e741569ec749be92ea8970~mv2.png/v1/fill/w_740,h_159,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_352cf38336e741569ec749be92ea8970~mv2.png)

**三元运算符**

在 Solidity 中将 if-else 语句赋给变量：

```
function ageChecker(uint256 age) public pure returns (bool a) {
		a = age % 2 == 0 ? true : false;
}
```

在 Solana 中，我们基本上只是将 if-else 语句赋给一个变量。下面的 Solana 程序与上面的相同：

```
pub fn age_checker(ctx: Context<Initialize>,
                   age: u64) -> Result<()> {
		
	let result = if age >= 18 {"You are 18 years old or above"} else { "You are below 18 years old" };
    msg!("{:?}", result);
    Ok(())
}
```

请注意，在 Rust 中的三元运算符示例中，if/else 块以分号结尾，因为这将被赋给一个变量。

还要注意，内部值结尾没有分号，因为它作为返回值返回给变量，类似于你在 `Ok(())` 后面不加分号，因为它是一个表达式而不是语句。

程序在 age 为偶数时输出 true，否则输出 false：

![rust 测试控制台布尔值](https://static.wixstatic.com/media/935a00_c089b9aaebc54a5e93b398f1f34ae4cb~mv2.png/v1/fill/w_740,h_158,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c089b9aaebc54a5e93b398f1f34ae4cb~mv2.png)

Rust 还有一个更强大的控制流构造叫做 [**match**](https://doc.rust-lang.org/book/ch06-02-match.html)**。** 让我们看一个使用 match 的示例：

```
pub fn age_checker(ctx: Context<Initialize>,
                   age: u64) -> Result<()> {
	match age {
        1 => {
            // Code block executed if age equals 1
            msg!("The age is 1");
                    },
        2 | 3 => {
            // Code block executed if age equals 2 or 3
            msg!("The age is either 2 or 3");
                },
        4..=6 => {
            // Code block executed if age is in the 
		    // range 4 to 6 (inclusive)
            msg!("The age is between 4 and 6");
                },
        _ => {
            // Code block executed for any other age
            msg!("The age is something else");
                    }
        }
	Ok(())
}
```

## For 循环

正如我们所知，for 循环允许循环遍历范围、集合和其他可迭代对象，Solidity 中的写法如下：

```
function loopOverSmth() public {
    for (uint256 i=0; i < 10; i++) {
        // do something...
    }
}
```

这是 Solana（Rust）中的等效写法：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    for i in 0..10 {
        // do something...
    }
        
    Ok(())
}
```

是的，就是这么简单，但是如何使用自定义步长迭代范围呢？以下是 Solidity 中预期的行为：

```
function loopOverSmth() public {
		for (uint256 i=0; i < 10; i+=2) {
				// do something...

				// Increment i by 2
		}
}
```

这是在 Solana 中使用 `step_by` 的等效写法：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    for i in (0..10).step_by(2) {
        // do something...
            
        msg!("{}", i);
    }     
        
    Ok(())
}
```

运行测试后，我们应该看到以下日志：

![rust for 循环](https://static.wixstatic.com/media/935a00_5d9b55d26fa54d65b36a721256eb6d8f~mv2.png/v1/fill/w_740,h_220,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_5d9b55d26fa54d65b36a721256eb6d8f~mv2.png)

## 数组和向量

Rust 在数组支持方面与 Solidity 不同。虽然 Solidity 对固定数组和动态数组都有原生支持，但 Rust 只对固定数组有内置支持。如果你想要一个动态长度的列表，请使用向量。

现在，让我们看一些示例，演示如何声明和初始化固定数组和动态数组。

**固定数组**

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Declare an array of u32 with a fixed size of 5
    let my_array: [u32; 5] = [10, 20, 30, 40, 50];

    // Accessing elements of the array
    let first_element = my_array[0];
    let third_element = my_array[2];

    // Declare a mutable array of u32 with a fixed size of 3
    let mut mutable_array: [u32; 3] = [100, 200, 300];

    // Change the second element from 200 to 250
    mutable_array[1] = 250;

    // Rest of your program's logic

    Ok(())        
}
```

**动态数组**

在 Solana 中模拟动态数组的方法涉及使用 Rust 标准库中的 Vec（向量）。以下是一个示例：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // Declare a dynamic array-like structure using Vec
    let mut dynamic_array: Vec<u32> = Vec::new();

    // Add elements to the dynamic array
    dynamic_array.push(10);
    dynamic_array.push(20);
    dynamic_array.push(30);

    // Accessing elements of the dynamic array
    let first_element = dynamic_array[0];
    let third_element = dynamic_array[2];

    // Rest of your program's logic
    msg!("Third element = {}", third_element);

    Ok(())
}
```

`dynamic_array` 变量必须声明为可变的（`mut`），以允许进行变异（推入、弹出、在索引处覆盖等）。

运行测试后，程序应该记录如下：

![rust 向量](https://static.wixstatic.com/media/935a00_caa278163121499cb37eaf83ab946f03~mv2.png/v1/fill/w_740,h_165,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_caa278163121499cb37eaf83ab946f03~mv2.png)

## 映射

与 Solidity 不同，Solana 缺乏内置的映射数据结构。但是，我们可以通过使用 Rust 标准库中的 [HashMap](https://doc.rust-lang.org/std/collections/struct.HashMap.html) 类型来在 Solana 中复制键值映射功能。**与 EVM 链不同，我们在这里演示的映射是在内存中，而不是在存储中。EVM 链没有内存中的哈希映射。** 我们将在稍后的教程中演示 Solana 存储中的映射。

让我们看看如何使用 HashMap 在 Solana 中创建映射。将提供的代码片段复制并粘贴到 [lib.rs](http://lib.rs/) 文件中，并记得用你自己的程序 ID 替换：

```
use anchor_lang::prelude::*;

declare_id!("53hgft52DHUKMPHGu1kusuwxFGk2T8qngwSw2SyGRNrX");

#[program]
pub mod tryrust {
    use super::*;
		// Import HashMap library
    use std::collections::HashMap;

    pub fn initialize(ctx: Context<Initialize>, key: String, value: String) -> Result<()> {
        // Initialize the mapping
        let mut my_map = HashMap::new();

        // Add a key-value pair to the mapping
        my_map.insert(key.to_string(), value.to_string());

        // Log the value corresponding to a key from the mapping
        msg!("My name is {}", my_map[&key]);

        Ok(())
    }
}
```

my_map 变量也被声明为可变的，以便我们可以编辑它（即添加/删除键 → 值对）。还注意到我们如何导入 HashMap 库吗？

由于 initialize 函数接收两个参数，测试也需要更新：

```
it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize("name", "Bob").rpc();
    console.log("Your transaction signature", tx);
});
```

运行测试时，我们看到以下日志：

![rust 哈希映射](https://static.wixstatic.com/media/935a00_16d2a849c1364c6d94182e48d22a3f36~mv2.png/v1/fill/w_740,h_187,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_16d2a849c1364c6d94182e48d22a3f36~mv2.png)

## 结构体

在 Solidity 和 Solana 中，结构体用于定义可以容纳多个字段的自定义数据结构。让我们看一个在 Solidity 和 Solana 中的结构体示例。

在 Solidity 中：

```
contract SolidityStructs {
    
    // Defining a struct in Solidity
    struct Person {
        string my_name;
        uint256 my_age;
    }

    // Creating an instance of the struct
    Person person1;

    function initPerson1(string memory name, uint256 age) public {
        // Accessing and modifying struct fields
        person1.my_name = name;
        person1.my_age = age;
    }
}
```

在 Solana 中的 1-1 对应：

```
pub fn initialize(_ctx: Context<Initialize>, name: String, age: u64) -> Result<()> {
    // Defining a struct in Solana
    struct Person {
        my_name: String,
        my_age: u64,
    }

    // Creating an instance of the struct
    let mut person1: Person = Person {
        my_name: name,
        my_age: age,
    };

    msg!("{} is {} years old", person1.my_name, person1.my_age);

    // Accessing and modifying struct fields
    person1.my_name = "Bob".to_string();
    person1.my_age = 18;

    msg!("{} is {} years old", person1.my_name, person1.my_age);

    Ok(())
}
```

**练习：** 更新测试文件，将两个参数 Alice 和 20 传递给 initialize 函数并运行测试，你应该得到以下日志：

![rust 结构体](https://static.wixstatic.com/media/935a00_98c76b05ce414702b110ebdb09aa42e3~mv2.png/v1/fill/w_740,h_201,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_98c76b05ce414702b110ebdb09aa42e3~mv2.png)

在提供的代码片段中，Solidity 实现将结构体的实例存储在存储中，而 Solana 实现中，一切都发生在 initialize 函数中，没有任何东西存储在链上。存储将在以后的教程中讨论。

## Rust 中的常量

在 Rust 中声明常量变量很简单。不使用 let 关键字，而是使用 const 关键字。这些可以在 #[program] 块之外声明。

```
use anchor_lang::prelude::*;

declare_id!("EiR8gcMCX11tYMRfoZ2vyheZsZ2NvdUTvYrRAUvTtYnL");

// *** CONSTANT DECLARED HERE ***
const MEANING_OF_LIFE_AND_EXISTENCE: u64 = 42;

#[program]
pub mod tryrust {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!(&format!("Answer to the ultimate question: {}", MEANING_OF_LIFE_AND_EXISTENCE)); // new line here
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

## usize 类型和类型转换

在 Solana 中，我们大多数时候可以假设无符号整数是 u64 类型，但在测量列表长度时有一个例外：它将是 usize 类型。你需要像下面的 Rust 代码演示的那样对变量进行转换：

```
use anchor_lang::prelude::*;

declare_id!("EiR8gcMCX11tYMRfoZ2vyheZsZ2NvdUTvYrRAUvTtYnL");

#[program]
pub mod usize_example {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {

       let mut dynamic_array: Vec<u32> = Vec::from([1,2,3,4,5,6]);
       let len = dynamic_array.len(); // this has type usize
       
       let another_var: u64 = 5; // this has type u64

       let len_plus_another_var = len as u64 + another_var;

       msg!("The result is {}", len_plus_another_var);

       Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

## Try Catch

Rust 没有 try catch。失败预期返回错误（就像我们在 Solana 的教程中所做的那样）或对于不可恢复的错误会 panic。

**练习：** 编写一个接受 u64 向量、循环遍历它并将所有偶数推入另一个向量，然后打印新向量的 Solana / Rust 程序。

## 通过 RareSkills 了解更多

本教程是我们免费的 [Solana 课程](https://www.rareskills.io/solana-tutorial) 的一部分。