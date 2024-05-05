# Solana 中的 Require、Revert 和自定义错误

更新日期：Feb 29

![#[error_code] 和 require!() 宏](https://static.wixstatic.com/media/935a00_0571a0bf95424f12a489014605ba3cc4~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_0571a0bf95424f12a489014605ba3cc4~mv2.jpg)

在以太坊中，我们经常看到一个 require 语句限制函数参数的值。示例如下：

```js
function foobar(uint256 x) public {
	require(x < 100, "I'm not happy with the number you picked");
  // rest of the function logic
}
```

在上面的代码中，如果 `foobar` 的值为 100 或更大，交易将会回滚。

在 Solana 中，或者更具体地说，在 Anchor 框架中，我们该如何做到这一点呢？

Anchor 提供了 与 Solidity 的自定义错误和 require 类似的语法。可以查看相关[文档](https://www.anchor-lang.com/docs/errors)，我们也将解释如何在函数参数不符合预期时停止交易。

下面的 Solana 程序有一个名为 `limit_range` 的函数，只接受 10 到 100 的值：

```rust
use anchor_lang::prelude::*;

declare_id!("8o3ehd3XnyDocd9hG1uz5trbmSRB7gaLaE9BCXDpEnMY");

#[program]
pub mod day4 {
    use super::*;

    pub fn limit_range(ctx: Context<LimitRange>, a: u64) -> Result<()> {
        if a < 10 {
            return err!(MyError::AisTooSmall);
        }
        if a > 100 {
            return err!(MyError::AisTooBig);
        }
        msg!("Result = {}", a);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct LimitRange {}

#[error_code]
pub enum MyError {
    #[msg("a is too big")]
    AisTooBig,
    #[msg("a is too small")]
    AisTooSmall,
}
```

以下为测试代码：

```js
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor"
import { Day4 } from "../target/types/day4";
import { assert } from "chai";

describe("day4", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Day4 as Program<Day4>;

  it("Input test", async () => {
    // Add your test here.
    try {
      const tx = await program.methods.limitRange(new anchor.BN(9)).rpc();
      console.log("Your transaction signature", tx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
      const err: AnchorError = _err;
      const errMsg =
        "a is too small";
      assert.strictEqual(err.error.errorMessage, errMsg);
      console.log("Error number:", err.error.errorCode.number);
    }

    try {
      const tx = await program.methods.limitRange(new anchor.BN(101)).rpc();
      console.log("Your transaction signature", tx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
      const err: AnchorError = _err;
      const errMsg =
        "a is too big";
      assert.strictEqual(err.error.errorMessage, errMsg);
      console.log("Error number:", err.error.errorCode.number);
    }
  });
});
```

**练习：**

1. 你注意到错误编号有什么规律吗？如果更改枚举 MyError 中错误的顺序，错误代码会发生什么变化？

2. 使用以下代码块将新的函数和错误添加到现有代码中：

```rust
#[program]
pub mod day_4 {
    use super::*;

    pub fn limit_range(ctxThen : Context<LimitRange>, a: u64) -> Result<()> {
        require!(a >= 10, MyError::AisTooSmall);
        require!(a <= 100, MyError::AisTooBig);
        msg!("Result = {}", a);
        Ok(())
    }

    // NEW FUNCTION
    pub fn func(ctx: Context<LimitRange>) -> Result<()> {
        msg!("Will this print?");
        return err!(MyError::AlwaysErrors);
    }
}

#[derive(Accounts)]
pub struct LimitRange {}

#[error_code]
pub enum MyError {
    #[msg("a is too small")]
    AisTooSmall,
    #[msg("a is too big")]
    AisTooBig,
    #[msg("Always errors")]  // NEW ERROR, what do you think the error code will be?
    AlwaysErrors,
}
```

并添加以下测试：

```js
it("Error test", async () => {
    // Add your test here.
    try {
      const tx = await program.methods.func().rpc();
      console.log("Your transaction signature", tx);
    } catch (_err) {
      assert.isTrue(_err instanceof AnchorError);
      const err: AnchorError = _err;
      const errMsg =
        "Always errors";
      assert.strictEqual(err.error.errorMessage, errMsg);
      console.log("Error number:", err.error.errorCode.number);
    }
  });
```

在运行之前，你认为新的错误代码会是什么？

**以太坊和 Solana 在停止具有无效参数的交易方面的显着区别在于，以太坊触发回滚，而 Solana 返回错误。**

## 使用 require 语句

有一个 `require!` 宏，概念上与 Solidity 中的 `require` 相同，我们可以使用它来简化代码。从使用需要三行的 `if` 代码切换到 `require!` 调用，将之前的代码转换为以下内容：

```rust
pub fn limit_range(ctx: Context<LimitRange>, a: u64) -> Result<()> {
	  require!(a >= 10, Day4Error::AisTooSmall);
		require!(a <= 100, Day4Error::AisTooBig);

    msg!("Result = {}", a);
    Ok(())
}
```

在以太坊中，如果函数回滚，即使回滚发生在日志之后，也不会记录任何内容。例如，在下面的合约中调用 `tryToLog` 将不会记录任何内容，因为函数回滚了：

```js
contract DoesNotLog {
	event SomeEvent(uint256);

	function tryToLog() public {
		emit SomeEvent(100);
		require(false);
	}
}
```

**练习：** 如果在 Solana 程序函数中的返回错误语句之前放置一个 msg! 宏会发生什么？如果将 `return err!` 替换为 `Ok(())` 会发生什么？下面有一个使用 `msg!` 记录一些内容然后返回错误的函数。看看 `msg!` 宏的内容是否被记录。

```rust
pub fn func(ctx: Context<ReturnError>) -> Result<()> {
		msg!("Will this print?");
		return err!(Day4Error::AlwaysErrors);
}

#[derive(Accounts)]
pub struct ReturnError {}

#[error_code]
pub enum Day4Error {
    #[msg("AlwaysErrors")]
    AlwaysErrors,
}
```

**在底层，require! 宏与返回错误没有任何不同，它只是语法糖。**

预期结果是当返回 `Ok(())` 时，“Will this print?”将被打印，当你返回错误时将不会打印。

## Solana 和 Solidity 在错误处理方面的区别

在 Solidity 中，require 语句使用 revert 操作码终止执行。Solana 不会终止执行，而只是返回一个不同的值。这类似于 Linux 在成功时返回 0 或 1。如果返回 0（等同于返回 Ok(())），则一切顺利进行。

因此，Solana 程序应该始终返回某些内容 — 要么是 `Ok(())`，要么是错误。

在 Anchor 中，错误是带有 `#[error_code]` 属性的枚举。

请注意，Solana 中的所有函数的返回类型都是 `Result<()>` 。[Result](https://doc.rust-lang.org/std/result/) 是一种类型，可以是 `Ok(())` 或错误。

## 问题与答案

### 为什么 `Ok(())` 末尾没有分号？

如果添加分号，代码将无法编译。如果 Rust 中的最终语句没有分号，则该行的代码将作为返回值。

### 为什么 `Ok(())` 有额外的括号？

在 Rust 中，() 表示“unit”，你可以将其视为 C 中的 void 或 Haskell 中的 Nothing。这里，Ok 是一个包含单元类型的枚举。这就是 get 返回的内容。在 Rust 中，不返回任何东西的函数隐式返回单元类型。没有分号的 `Ok(())` 在语法上等同于 `return Ok(());`。请注意末尾的分号。

### 为什么上面的 `if 语句` 缺少括号？

在 Rust 中，这些是可选的。

## 通过 RareSkills 了解更多

本教程是我们免费的 [Solana 课程](https://www.rareskills.io/solana-tutorial)的一部分。