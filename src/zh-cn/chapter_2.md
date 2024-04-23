# Solana 和 Rust 中的算术和基本类型

![solana 计算器](https://static.wixstatic.com/media/935a00_d380d746614c490b9722b0bd3c1ddf0d~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_d380d746614c490b9722b0bd3c1ddf0d~mv2.jpg)

今天我们将学习如何创建一个 Solana 程序，实现与下面的 Solidity 合约相同的功能。我们还将学习 Solana 如何处理像溢出这样的算术问题。

```
contract Day2 {

	event Result(uint256);
	event Who(string, address);
	
	function doSomeMath(uint256 a, uint256 b) public {
		uint256 result = a + b;
		emit Result(result);
	}

	function sayHelloToMe() public {
		emit Who("Hello World", msg.sender);
	}
}
```

让我们开始一个新项目

```
anchor init day2
cd day2
anchor build
anchor keys sync
```

确保在一个终端中运行 Solana 测试验证器：

```
solana-test-validator
```

在另一个终端中查看 Solana 日志：

```
solana logs
```

通过运行测试来确保新创建的程序正常工作

```
anchor test --skip-local-validator
```

## 提供函数参数

在进行任何数学运算之前，让我们将 initialize 函数更改为接收两个整数。以太坊使用 uint256 作为“标准”整数大小。在 Solana 中，它是 u64 —— 这相当于 Solidity 中的 uint64。

### 传递无符号整数

默认的 initialize 函数如下所示：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    Ok(())
}
```

将 lib.rs 中的 initialize()函数修改如下。

```
pub fn initialize(ctx: Context<Initialize>,
                  a: u64,
                  b: u64) -> Result<()> {
    msg!("You sent {} and {}", a, b);
    Ok(())
}
```

现在我们需要更改`./tests/day2.ts`中的测试

```
it("Is initialized!", async () => {
  // Add your test here.
  const tx = await program.methods
    .initialize(new anchor.BN(777), new anchor.BN(888)).rpc();
  console.log("Your transaction signature", tx);
});
```

现在重新运行`anchor test --skip-local-validator`。

当我们查看日志时，应该看到类似以下内容

![solana 记录数字](https://static.wixstatic.com/media/935a00_081ec643fd234a8c8dce3b34d4c5ecaa~mv2.png/v1/fill/w_740,h_165,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_081ec643fd234a8c8dce3b34d4c5ecaa~mv2.png)

### 传递字符串

现在让我们演示如何将字符串作为参数传递。

```
pub fn initialize(ctx: Context<Initialize>,
                  a: u64,
                  b: u64,
                  message: String) -> Result<()> {
    msg!("You said {:?}", message);
    msg!("You sent {} and {}", a, b);
    Ok(())
}
```

并更改测试

```
it("Is initialized!", async () => {
  // Add your test here.
  const tx = await program.methods
    .initialize(
       new anchor.BN(777), new anchor.BN(888), "hello").rpc();
    console.log("Your transaction signature", tx);
});
```

运行测试后，我们会看到新的日志

### 数组

接下来，我们添加一个函数（和测试）来演示传递一个数字数组。在 Rust 中，“向量”或`Vec`是 Solidity 中称为“数组”的东西。

```
pub fn initialize(ctx: Context<Initialize>,
                  a: u64,
                  b: u64,
                  message: String) -> Result<()> {
    msg!("You said {:?}", message);
    msg!("You sent {} and {}", a, b);
    Ok(())
}

// added this function
pub fn array(ctx: Context<Initialize>,
             arr: Vec<u64>) -> Result<()> {
    msg!("Your array {:?}", arr);
    Ok(())
}
```

并将单元测试更新如下

```
it("Is initialized!", async () => {
  // Add your test here.
  const tx = await program.methods.initialize(new anchor.BN(777), new anchor.BN(888), "hello").rpc();
  console.log("Your transaction signature", tx);
});

// added this test
it("Array test", async () => {
  const tx = await program.methods.array([new anchor.BN(777), new anchor.BN(888)]).rpc();
  console.log("Your transaction signature", tx);
});
```

然后再次运行测试并查看日志以查看数组输出：

![solana 记录数组](https://static.wixstatic.com/media/935a00_7a141f2236be45708917b8c2cf601121~mv2.png/v1/fill/w_740,h_165,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_7a141f2236be45708917b8c2cf601121~mv2.png)

**提示：** 如果在 Anchor 测试中遇到问题，请尝试搜索与你的错误相关的“[Solana web3 js](https://solana-labs.github.io/solana-web3.js/)”。Anchor 使用的 Typescript 库是 Solana web3 js 库。

## Solana 中的数学

### 浮点数运算

Solana 对浮点数操作有一些有限的本地支持。

然而，最好避免浮点数运算，因为它们在计算上是多么耗费资源（稍后我们将看到一个例子）。请注意，Solidity *没有*对浮点数操作提供本地支持。

阅读更多关于使用浮点数的限制[这里](https://docs.solana.com/developing/on-chain-programs/limitations#float-rust-types-support) 。

## 算术溢出

算术溢出曾是 Solidity 中的一个常见攻击向量，直到版本 0.8.0 默认在语言中构建了溢出保护。在 Solidity 0.8.0 或更高版本中，默认会进行溢出检查。由于这些检查会消耗 gas，有时开发人员会有策略性地使用“unchecked”块来禁用它们。

Solana 如何防范算术溢出？

### 方法 1：在 Cargo.toml 中设置 overflow-checks = true

如果在 Cargo.toml 文件中将`overflow-checks`键设置为`true`，那么 Rust 将在编译器级别添加溢出检查。接下来是 Cargo.toml 的截图：

![cargo.toml overflow-checks = true](https://static.wixstatic.com/media/935a00_f7addf4ad1314e70acc2dc025aa2631d~mv2.png/v1/fill/w_350,h_317,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_f7addf4ad1314e70acc2dc025aa2631d~mv2.png)

如果 Cargo.toml 文件以这种方式配置，你就不必担心溢出。

然而，添加溢出检查会增加交易的计算成本（我们很快会重新讨论这一点）。因此，在某些情况下，计算成本是一个问题，你可能希望将`overflow-checks`设置为`false`。为了有策略地检查溢出，你可以在 Rust 中使用`checked_*`运算符。

### 方法 2：使用`checked_*`运算符。

让我们看看溢出检查是如何应用于 Rust 内部的算术运算的。考虑下面的 Rust 代码片段。

- 在第 1 行，我们使用通常的`+`运算符进行算术运算，它会在溢出时默默地溢出。
- 在第 2 行，我们使用`.checked_add`，如果发生溢出，它将抛出错误。请注意，我们还有`.checked_*`可用于其他操作，如`checked_sub`和`checked_mul`。

```
let x: u64 = y + z; // will silently overflow
let xSafe: u64 = y.checked_add(z).unwrap(); // will panic if overflow happens

// checked_sub, checked_mul, etc are also available
```

**练习 1：** 设置`overflow-checks = true`，创建一个测试用例，通过执行`0 - 1`来使`u64`发生下溢。你需要将这些数字作为参数传递，否则代码将无法编译。会发生什么？

当运行测试时，你会看到交易失败（下面显示了一个相当神秘的错误消息）。这是因为 Anchor 打开了溢出保护：

![算术溢出导致的程序错误](https://static.wixstatic.com/media/935a00_2ed0f5f6e2bb4d858e556662dbe458a2~mv2.png/v1/fill/w_740,h_272,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_2ed0f5f6e2bb4d858e556662dbe458a2~mv2.png)

**练习 2：** 现在将`overflow-checks`更改为`false`，然后再次运行测试。你应该看到一个下溢值为 18446744073709551615。

**练习 3：** 在 Cargo.toml 中禁用溢出保护后，使用`let result = a.checked_sub(b).unwrap();`，其中 a = 0，b = 1。会发生什么？

是否应该为你的 Anchor 项目在 Cargo.toml 文件中保留`overflow-checks = true`？一般来说，是的。但是，如果你正在进行一些密集的计算，你可能希望将`overflow-checks`设置为 false，并在关键时刻有策略地防范溢出，以节省计算成本，我们将在接下来演示。

## Solana 计算单元 101

在以太坊中，交易运行直到消耗了交易指定的“gas 限制”。Solana 将“gas”称为“计算单元”。默认情况下，交易限制为 200,000 个计算单元。如果消耗了超过 200,000 个计算单元，交易将回滚。

### 确定 Solana 中交易的计算成本

与以太坊相比，Solana 确实使用起来便宜，但这并不意味着你在以太坊开发中的优化技能是无用的。让我们测量一下我们的数学函数需要多少计算单元。

Solana 日志终端还显示了使用了多少计算单元。我们提供了检查和未检查的减法的基准如下。

禁用溢出保护时消耗 824 个计算单元：

![没有算术溢出保护时的 Solana 计算单元消耗](https://static.wixstatic.com/media/935a00_9a62a329009141ce921cc279c1c8caf5~mv2.png/v1/fill/w_740,h_165,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_9a62a329009141ce921cc279c1c8caf5~mv2.png)

启用溢出保护时消耗 872 个计算单元：

![启用算术溢出保护时的 Solana 计算单元消耗](https://static.wixstatic.com/media/935a00_77f7568de9da41e093468fdf5b8be9ee~mv2.png/v1/fill/w_740,h_165,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_77f7568de9da41e093468fdf5b8be9ee~mv2.png)

正如你所看到的，仅进行简单的数学运算就占用了近 1000 个单位。由于我们有 20 万个单位，我们只能在每个交易的 gas 限制内进行几百次简单的算术运算。因此，虽然 Solana 上的交易通常比以太坊上便宜，但我们仍然受到相对较小的计算单元上限的限制，无法在 Solana 链上执行像流体动力学模拟这样的计算密集型任务。

稍后我们将重新讨论交易成本。

## Powers 不使用与 Solidity 相同的语法

在 Solidity 中，如果我们想将 x 提高到 y 次方，我们会这样做

```
uint256 result = x ** y;
```

Rust 不使用这种语法。相反，它使用.pow

```
let x: u64 = 2; // it is important that the base's data type is explicit
let y = 3; // the exponent data type can be inferred
let result = x.pow(y);
```

如果你担心溢出，还有.checked_pow。

## 浮点数

在智能合约中使用 Rust 的一个好处是，我们不必导入类似 Solmate 或 Solady 这样的库来进行数学运算。Rust 是一种非常复杂的语言，具有许多内置操作，如果我们需要某段代码，我们可以在 Solana 生态系统之外寻找一个 Rust crate（这是 Rust 中称为库的东西）来完成这项工作。

让我们计算 50 的立方根。浮点数的立方根函数内置在 Rust 语言中，使用函数`cbrt()`。

```
// note that we changed `a` to f32 (float 32)
// because `cbrt()` is not available for u64
pub fn initialize(ctx: Context<Initialize>, a: f32) -> Result<()> {
  msg!("You said {:?}", a.cbrt());
  Ok(());
}
```

还记得我们在前面的部分提到浮点数可能会消耗大量计算资源吗？好吧，在这里我们看到我们的立方根运算消耗了超过 5 倍的简单无符号整数算术：

![立方根的高计算单元成本](https://static.wixstatic.com/media/935a00_c213af0c6371485a9eb71c345f08cc80~mv2.png/v1/fill/w_740,h_165,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c213af0c6371485a9eb71c345f08cc80~mv2.png)

**练习 4：** 构建一个计算器，可以执行+，-，x 和÷，还有 sqrt 和 log10。