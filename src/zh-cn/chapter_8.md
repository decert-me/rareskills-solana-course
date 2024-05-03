# Rust 函数式过程宏

![rust function-like macros](https://static.wixstatic.com/media/706568_60a26cb76a6b4396b529e8a4837d50fc~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/706568_60a26cb76a6b4396b529e8a4837d50fc~mv2.jpg)

本教程解释了函数和函数式宏之间的区别。例如，为什么`msg!`后面有一个感叹号？本教程将解释这种语法。

作为一种强类型语言，Rust 不能接受任意数量的函数参数。

例如，Python 的`print`函数可以接受任意数量的参数：

```python
print(1)
print(1, 2)
print(1, 2, 3)
```

`!` 表示这个“函数”是一个函数式宏。

Rust 函数式宏通过`!`符号来识别，例如在 Solana 中的`println!(...)`或`msg!(...)`。

在 Rust 中，用于打印内容的常规函数（而不是函数式宏）是`std::io::stdout().write`，它只接受一个单字节字符串作为参数。

*如果你想运行以下代码，* [*Rust Playground*](https://play.rust-lang.org/) *是一个方便的工具，如果你不想设置开发环境。*

让我们使用以下示例（来自[这里](https://riptutorial.com/rust/example/1415/console-output-without-macros) ）：

```rust
use std::io::Write;

fn main() {
    std::io::stdout().write(b"Hello, world!\n").unwrap();
}
```

请注意，write 是一个函数，而不是宏，因为它没有`!`。

如果你尝试在 Python 中执行我们上面的操作，代码将无法编译，因为`write`只接受一个参数：

```rust
// this does not compile
use std::io::Write;

fn main() {
    std::io::stdout().write(b"1\n").unwrap();
    std::io::stdout().write(b"1", b"2\n").unwrap();
    std::io::stdout().write(b"1", b"2", b"3\n").unwrap();
}
```

因此，如果你希望打印任意数量的参数，*你需要编写一个自定义打印函数来处理每种情况下的每个参数数量 —— 这是极其低效的！*

这样的代码将如下所示（这是极不推荐的！）：

```rust
use std::io::Write;

// print one argument
fn print1(arg1: &[u8]) -> () {
		std::io::stdout().write(arg1).unwrap();
}

// print two arguments
fn print2(arg1: &[u8], arg2: &[u8]) -> () {
    let combined_vec = [arg1, b" ", arg2].concat();
    let combined_slice = combined_vec.as_slice();
		std::io::stdout().write(combined_slice).unwrap();
}

// print three arguments
fn print3(arg1: &[u8], arg2: &[u8], arg3: &[u8]) -> () {
    let combined_vec = [arg1, b" ", arg2, b" ", arg3].concat();
    let combined_slice = combined_vec.as_slice();
		std::io::stdout().write(combined_slice).unwrap();
}

fn main() {
		print1(b"1\n");
		print2(b"1", b"2\n");
		print3(b"1", b"2", b"3\n");
}
```

如果我们在`print1`、`print2`、`print3`函数中寻找模式，它只是将参数插入向量中，并在它们之间添加一个空格，然后将向量转换回字节字符串（准确地说是字节切片）。

如果我们能够将类似`println!`的代码片段自动扩展为一个打印函数，该函数将接受我们需要的参数数量，那不是很好吗？

这就是 Rust 宏的作用。

**Rust 宏将 Rust 代码作为输入，并将其程序化地扩展为更多的 Rust 代码。**

这有助于我们避免为代码所需的每种打印语句编写打印函数的无聊工作。

### 扩展宏

要查看 Rust 编译器如何扩展`println!`宏的示例，请查看[cargo expand](https://github.com/dtolnay/cargo-expand) github 仓库。结果非常冗长，因此我们不会在这里展示。

## 将宏视为黑盒是可以接受的

当由库提供时，宏非常方便，但手动编写宏非常繁琐，因为它实际上需要解析 Rust 代码。

## Rust 中不同类型的宏

我们提供的`println!`示例是一个函数式宏。Rust 还有其他类型的宏，但我们关心的另外两种是*自定义派生宏*和*属性式宏*。

让我们看一个由 anchor 创建的新程序：

![img](https://static.wixstatic.com/media/935a00_90dbd3b0d418406b8900335888d1516c~mv2.png/v1/fill/w_740,h_310,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_90dbd3b0d418406b8900335888d1516c~mv2.png)

我们将在接下来的教程中解释这些是如何工作的。

## 通过 RareSkills 了解更多

本教程是我们免费的 [Solana 课程](https://www.rareskills.io/solana-tutorial)的一部分。