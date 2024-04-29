# Solana 计算单元和交易费用简介

更新日期：2 月 29 日

![img](https://static.wixstatic.com/media/935a00_16bc80fd8b6d4b4eb9a0b49fd5ed0cb0~mv2.jpeg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_16bc80fd8b6d4b4eb9a0b49fd5ed0cb0~mv2.jpeg)

在以太坊中，交易的价格计算为 gasUsed × gasPrice。这告诉我们将花费多少以太币将交易包含在区块链中。在发送交易之前，需要指定并预付 gasLimit。如果交易用尽了 gas，它将回滚。

与以太坊虚拟机链不同，Solana 操作码/指令消耗“计算单元”（可以说是更好的名称）而不是 gas，每个交易软上限为 200,000 计算单元。如果交易成本超过 200,000 计算单元，它将回滚。

在以太坊中，计算的 gas 成本与存储相关的 gas 成本是一样的。在 Solana 中，存储处理方式不同，因此 Solana 中持久数据的定价是一个不同的讨论主题。

从定价运行操作码的角度来看，以太坊和 Solana 的行为类似。

两个链都执行编译的字节码并为执行的每条指令收费。以太坊使用 EVM 字节码，但 Solana 运行的是一个修改过的 [伯克利数据包过滤器](https://en.wikipedia.org/wiki/Berkeley_Packet_Filter) 称为 Solana 数据包过滤器。

以太坊根据执行时间长短为不同的操作码收取不同的价格，从一个 gas 到数千个 gas 不等。在 Solana 中，每个操作码的成本为一个计算单元。

## 当计算单元不足时该怎么办

在执行无法在限制以下完成的重型计算操作时，传统策略是“保存工作”并在多个交易中执行。

“保存工作”部分需要放入永久存储，这是我们尚未涵盖的内容。这类似于在以太坊中尝试迭代一个庞大循环；你会有一个存储变量用于记录你停止的索引，以及一个存储变量保存到目前为止已完成的计算。

## 计算单元优化

正如我们已经知道的，Solana 使用计算单元来防止停机问题并防止运行永远运行的代码。每个交易的计算单元上限为 200,000 CU（可以在额外成本的情况下增加到 1.4m CU），如果超出了（所选限制），程序将终止，所有更改的状态将恢复，并且费用不会退还给调用者。这可以防止攻击者试图在节点上运行永不结束或计算密集的程序以减慢或停止链。

然而，与 EVM 链不同，交易中使用的计算资源不会影响该交易支付的费用。无论你使用了整个限制还是很少使用，你都将被收取费用。例如，一个 400 计算单元的交易的成本与一个 200,000 计算单元的交易相同。

除了计算单元，Solana 交易的[签名者数量](https://www.rareskills.io/post/msg-sender-solana)也会影响计算单元成本。根据 Solana [文档](https://docs.solana.com/developing/intro/transaction_fees#transaction-fee-calculation)：

*"因此，目前，交易费仅由交易中需要验证的签名数量确定。交易（最大 1232 字节）中签名数量的唯一限制是交易本身的最大大小。交易中的每个签名（64 字节）必须引用一个唯一的公钥（32 字节），因此单个交易最多可以包含多达 12 个签名（不确定为什么要这样做）"*

我们可以通过这个小例子看到这一点。从一个空的 Solana 程序开始，如下所示：

```
use anchor_lang::prelude::*;

declare_id!("6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC");

#[program]
pub mod compute_unit {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

更新测试文件：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ComputeUnit } from "../target/types/compute_unit";

describe("compute_unit", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.ComputeUnit as Program<ComputeUnit>;
  const defaultKeyPair = new anchor.web3.PublicKey(
		// replace this with your default provider keypair, you can get it by running `solana address` in your terminal
    "EXJupeVMqDbHk7xY4XP4TVXq22L3ZJxJ9Gm68hJccpLp"
  );

  it("Is initialized!", async () => {
    // log the keypair's initial balance
    let bal_before = await program.provider.connection.getBalance(
      defaultKeyPair
    );
    console.log("before:", bal_before);

    // call the initialize function of our program
    const tx = await program.methods.initialize().rpc();

    // log the keypair's balance after
    let bal_after = await program.provider.connection.getBalance(
      defaultKeyPair
    );
    console.log("after:", bal_after);

    // log the difference
    console.log(
      "diff:",
      BigInt(bal_before.toString()) - BigInt(bal_after.toString())
    );
  });
});
```

*注意：在 JavaScript 中，数字末尾的“n”表示它是一个 `BigInt`。*

运行：`solana logs`，如果你尚未运行。

当我们运行 `anchor test --skip-local-validator` 时，我们会得到以下输出作为测试日志和 Solana 验证器日志：

```
# test logs
		compute_unit
before: 15538436120
after: 15538431120
diff: 5000n


# solana logs
Status: Ok
Log Messages:
  Program 6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC invoke [1]
  Program log: Instruction: Initialize
  Program 6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC consumed 320 of 200000 compute units
  Program 6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC success
```

`5000` lamports 的余额差异是因为在发送此交易时我们只需要/使用了 1 个签名（即我们的默认提供者地址的签名）。这与我们上面建立的一致，即 `1 * 5000 = 5000`。还请注意，这在计算单元方面的成本为 320，但此金额不影响我们的交易费用。

现在，让我们给我们的程序增加一些复杂性并看看会发生什么：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let mut a = Vec::new();
    a.push(1);
    a.push(2);
    a.push(3);
    a.push(4);
    a.push(5);

    Ok(())
}
```

毫无疑问，这应该会对我们的交易费用产生一些影响对吧？

当我们运行 `anchor test --skip-local-validator` 时，我们会得到以下输出作为测试日志和 Solana 验证器日志：

```
# test logs
compute_unit
before: 15538436120
after: 15538431120
diff: 5000n


# solana logs
Status: Ok
Log Messages:
  Program 6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC invoke [1]
  Program log: Instruction: Initialize
  Program 6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC consumed 593 of 200000 compute units
  Program 6CCLqLGeyExCFegJDjRDirWQRRSbM5XNq3yKvmaWS2ZC success
```

我们可以看到这会消耗更多的计算单元，几乎是我们第一个示例的两倍。但这不会影响我们的交易费用。这是预期的，并显示了无论计算单元消耗多少，用户支付的交易费用都不会受到影响。

**无论消耗的计算单元如何，该交易都将收取 5000 lamports 或 0.000005 SOL。**

回到计算单元。那么，既然计算单元不影响交易的费用，我们为什么要优化计算单元呢？

- 首先，目前是这样，未来 Solana 可能会决定提高上限，必须激励节点不将这些复杂交易与简单交易区别对待。这意味着在计算交易费用时考虑消耗的计算单元。
- 其次，如果有大量网络活动竞争区块空间，较小的交易更有可能被包含在一个块中。
- 第三，这将使你的程序更易与其他程序组合。如果另一个程序调用你的程序，则交易不会获得额外的计算限制。其他程序可能不希望与你集成，如果你的交易使用了太多计算，留下很少的计算给原始程序。

## 更小的整数节省计算单元

使用的值类型越大，消耗的计算单元就越多。最好在适用的情况下使用较小的类型。让我们看一下代码示例和注释：

```
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // this costs 600 CU (type defaults to Vec<i32>)
    let mut a = Vec::new();
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);

    // this costs 618 CU
    let mut a: Vec<u64> = Vec::new();
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);

    // this costs 600 CU (same as the first one but the type was explicitly denoted)
    let mut a: Vec<i32> = Vec::new();
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);

    // this costs 618 CU (takes the same space as u64)
    let mut a: Vec<i64> = Vec::new();
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);

    // this costs 459 CU
    let mut a: Vec<u8> = Vec::new();
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);
    a.push(1);

    Ok(())
}
```

注意随着整数类型的减少，计算单元成本的降低。这是预期内的，因为较大的类型在内存中占用的空间比较小的类型多，而不管所表示的值如何。

在链上使用 `find_program_address` 生成程序派生账户（PDA）可能会使用更多的计算单元，因为此方法会迭代调用 `create_program_address` 直到找到不在 ed25519 曲线上的 PDA。为了减少计算成本，尽可能在链下使用 `find_program_address`() 并在可能时将得到的 bump seed 传递给程序。关于这一点的更多讨论将在后面的部分中进行，因为这超出了本节的范围。

这不是一个详尽的列表，而是一些要点，以便了解什么使一个程序比另一个更具计算密集性。

## 什么是 eBPF？

Solana 的字节码主要源自 BPF。 “eBPF” 简单地表示 “extended（扩展的）BPF”。本节在 Linux 上下文中解释了 BPF。

正如你所期望的那样，Solana 虚拟机不理解 Rust 或 C。用这些语言编写的程序被编译成 eBPF（扩展伯克利数据包过滤器）。

简而言之，eBPF 允许在内核中（在沙箱环境中）执行任意 eBPF 字节码，当内核发出 eBPF 字节码订阅的事件时，例如：

- 网络：打开/关闭套接字
- 磁盘：写入/读取
- 进程的创建
- 线程的创建
- CPU 指令调用
- 支持最多 64 位（这就是为什么 Solana 具有最大 uint 类型为 u64）

你可以将其视为内核的 JavaScript。JavaScript 在事件发生时在浏览器上执行操作，eBPF 在内核中发生事件时执行类似的操作，例如当执行系统调用时。

这使我们能够为各种用例构建程序，例如（基于上述事件）：

- 网络：分析路由等
- 安全性：根据某些规则过滤流量并报告任何不良/被阻止的流量
- 跟踪和分析：从用户空间程序到内核指令收集详细的执行流程
- 可观察性：报告和分析内核活动

仅当我们需要时才执行程序（即在内核中发生事件时）。例如，假设你想要在文件被写入时获取文件名和写入的数据，我们监听/注册/订阅 `vfs_write()` 系统调用事件。现在，每当该文件被写入时，我们就可以使用这些数据。

## Solana 字节码格式（SBF）

Solana 字节码格式是 eBPF 的一种变体，具有某些更改，其中最突出的是删除了字节码验证器。eBPF 中存在字节码验证器，以确保所有可能的执行路径是有限的且安全的。

Solana 使用计算单元限制来处理这个问题。具有限制计算资源消耗的计算计量器，将安全检查移至运行时，并允许任意内存访问、间接跳转、循环和其他有趣的行为。

在以后的教程中，我们将深入研究一个简单程序及其字节码，调整它，了解不同的计算单元成本，并学习 Solana 字节码的工作原理以及如何分析它。

## 通过 RareSkills 了解更多

本教程是我们 [Solana 课程](https://www.rareskills.io/solana-tutorial)的一部分。