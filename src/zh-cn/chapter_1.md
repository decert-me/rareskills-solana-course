# Solana 你好世界（安装和故障排除）

更新日期：2 月 9 日

![Solana Hello World](https://static.wixstatic.com/media/935a00_8b1bf6c7a2ec4a7a991c2334a103577c~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_8b1bf6c7a2ec4a7a991c2334a103577c~mv2.jpg)

这是一个 Solana 你好世界教程。我们将为你介绍安装 Solana 和解决可能出现的问题的步骤。

**如果遇到问题，请查看本文末尾的故障排除部分。**

## 安装 Rust

如果你已经安装了 Rust，请跳过此步骤。

```
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 安装 Yarn

你需要这个来运行单元测试。如果你已经安装了 yarn，请跳过此步骤。

```
# 安装 yarn -- 假设已安装 node js
corepack enable # corepack 随 node js 一起安装
```

## 安装 Solana 命令行工具

我们强烈建议使用`stable`版本，而不是`latest`。

```
# 安装 solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

## 安装 Anchor

Anchor 是 Solana 开发的一个框架。在许多方面，它与 hardhat 非常相似。

```
# install anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

avm install latest
avm use latest
```

## 初始化并构建一个 Anchor 程序（你好世界）

**Mac 用户：** 我们建议将你的程序命名为`day_1`而不是`day1`，因为 Anchor 似乎有时会在 Mac 机器上悄悄插入下划线。

```
anchor init day1 # use day_1 if you have a mac
cd day1
anchor build
```

根据你的机器和互联网连接，此步骤可能需要一段时间。这也是你可能遇到安装问题的地方，请在必要时查看故障排除部分。

## 配置 Solana 在本地主机上运行

```
# shell 1

solana config set --url localhost
```

## 运行测试验证节点

在新的 shell 中运行以下命令，不要在 Anchor 项目中运行。但不要关闭你运行`anchor build`的 shell。这在你的机器上运行一个本地（测试）Solana 节点实例：

```
# shell 2

solana-test-validator
```

## 确保 program_id 与 Anchor 密钥同步

返回到具有 Anchor 项目的 shell，并运行以下命令：

```
# shell 1

anchor keys sync
```

## 运行测试

在 Anchor 项目中运行此命令

```
# shell 1

anchor test --skip-local-validator
```

上面的命令运行我们程序的测试。如果你还没有创建测试钱包，Anchor 将为你提供如何操作的说明。我们在这里不提供这些说明，因为这将取决于你的操作系统和文件结构。你可能还需要通过在终端中运行`solana airdrop 100 {YOUR_WALLET_ADDRESS}`来向自己空投一些本地 Sol。你可以通过在命令行中运行`solana address`来获取你的钱包地址。

预期输出如下：

![solana anchor 测试通过](https://static.wixstatic.com/media/935a00_2a7ef8344f2f4b44a49d7cbeb25838ab~mv2.png/v1/fill/w_740,h_140,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_2a7ef8344f2f4b44a49d7cbeb25838ab~mv2.png)

## Hello World

现在让我们让我们的程序输出“Hello, world!”。将以下行添加到`programs/day_1/src/lib.rs`中标记为`**** NEW LINE HERE ****`的位置。

```
use anchor_lang::prelude::*;

declare_id!("...");

#[program]
pub mod day_1 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Hello, world!"); // **** NEW LINE HERE ****
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

再次运行测试

```
anchor test --skip-local-validator
```

通过运行以下命令找到日志文件

```
ls .anchor/program-logs/
```

打开该文件以查看记录的“Hello world”

![hello world solana 日志](https://static.wixstatic.com/media/935a00_c67a788b24174d8a9d28c7ac8ce5ee36~mv2.png/v1/fill/w_740,h_145,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c67a788b24174d8a9d28c7ac8ce5ee36~mv2.png)

## 实时 Solana 日志

或者，你可以通过打开第三个 shell 并运行以下命令来查看日志

```
# shell 3

solana logs
```

现在再次运行测试，你应该在运行`solana logs`的终端中看到相同的消息。

## 问题与答案

### 为什么 declare_id!和 msg!后面有感叹号？

在 Rust 中，感叹号表示这些是宏。我们将在以后的教程中重新讨论宏。

### 我需要一个 initialize 函数吗？

不需要，这是由 Anchor 框架自动生成的。你可以随意命名它。

在这种情况下，`initialize`的名称并没有什么特别之处，因此我们可以将名称更改为任何你喜欢的名称。这与其他一些关键字和语言不同，比如在某些语言中`main`是一个特殊的名称，或者在 Solidity 中`constructor`是一个特殊的名称。

**练习：** *尝试将* *`programs/day_1/src/lib.rs`* *中的* *`initialize`* *和* *`tests/day_1.ts`* *中的* *`initialize`* *更名为* *`initialize2`* *，然后再次运行测试。请查看下面用橙色圈圈标记的更改。*

![更改 initialize()函数名称](https://static.wixstatic.com/media/935a00_cd564f43dbd94c15b15249e9083fa91b~mv2.png/v1/fill/w_740,h_201,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_cd564f43dbd94c15b15249e9083fa91b~mv2.png)

### 为什么我们使用--skip-local-validator 运行测试？

当测试针对一个节点运行时，我们将能够查询节点的状态更改。如果你无法使节点运行，可以在不带`--skip-local-validator`标志的情况下运行`anchor test`。但是，你将更难以开发和测试，因此我们建议使本地验证器正常工作。

## 故障排除

Solana 是一个快速发展的软件，你可能会遇到安装问题。我们已记录了你最有可能遇到的问题，以下是各个部分。

我们的教程系列是使用以下版本编写的：

- Anchor = 版本 0.29.0
- Solana = 版本 1.16.25
- Rustc = 1.77.0-nightly

你可以通过运行以下命令更改 Anchor 版本

```
avm install 0.29.0
avm use 0.29.0
```

你可以通过在 curl 命令中指定版本来更改 Solana 版本：

```
# 安装 solana
sh -c "$(curl -sSfL https://release.solana.com/1.16.25/install)"
```

### 错误：包`solana-program v1.18.0`无法构建

```
error: package `solana-program v1.18.0` cannot be built because it requires rustc 1.72.0 or newer, while the currently active rustc version is 1.68.0-dev
Either upgrade to rustc 1.72.0 or newer, or use
cargo update -p solana-program@1.18.0 --precise ver
```

使用`solana --version`检查你正在运行的 Solana 版本。然后将该版本插入上面的`ver`中。下面显示了一个解决方案示例：

![solana 版本安装问题](https://static.wixstatic.com/media/935a00_c534515dbb7c4362a9ad831b30579ad2~mv2.png/v1/fill/w_740,h_118,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c534515dbb7c4362a9ad831b30579ad2~mv2.png)

### 错误[E0658]：使用不稳定的库特性'build_hasher_simple_hash_one'

如果你遇到以下错误：

```
error[E0658]: use of unstable library feature 'build_hasher_simple_hash_one'
--> src/random_state.rs:463:5
|
463 | / fn hash_one<T: Hash>(&self, x: T) -> u64 {
464 | | RandomState::hash_one(self, x)
465 | | }
| |_____^
|
= note: see issue #86161 https://github.com/rust-lang/rust/issues/86161 for more information
= help: add #![feature(build_hasher_simple_hash_one)] to the crate attributes to enable
```

运行以下命令：`cargo update -p ahash@0.8.7 --precise 0.8.6` Credit: https://solana.stackexchange.com/questions/8800/cant-build-hello-world

### 错误：部署程序失败：处理指令 1 时出错：自定义程序错误：0x1

```
错误：部署程序失败：处理指令 1 时出错：自定义程序错误：0x1
存在问题：输出 { status: ExitStatus(unix_wait_status(256)), stdout: "", stderr: "" }。
```

如果遇到此错误，则你的密钥未同步。运行`anchor keys sync`。

### 错误：无法发送交易：交易模拟失败：尝试加载不存在的程序

你的密钥未同步。运行`anchor keys sync`。

### 错误：你配置的 rpc 端口：8899 已被使用

你在后台运行验证器的情况下运行了`anchor test`而没有`--skip-local-validator`。要么关闭验证器并运行`anchor test`，要么在运行验证器的情况下运行`anchor test --skip-local-validator`。跳过本地验证器意味着跳过为项目创建的临时验证器，而不是在后台运行的验证器。

### 错误：帐户 J7t...zjK 的资金不足以支出

运行以下命令向你的开发地址空投 100 SOL

```
solana airdrop 100 J7t...zjK
```

### 错误：RPC 请求错误：集群版本查询失败

```
错误：RPC 请求错误：集群版本查询失败：发送请求时出错的错误（http://localhost:8899/）：尝试连接时出错：tcp 连接错误：连接被拒绝（os 错误 61）
存在问题：输出 { status: ExitStatus(unix_wait_status(256)), stdout: "", stderr: "" }。
```

这意味着`solana-test-validator`未在后台运行。在另一个 shell 中运行`solana-test-validator`。

### 线程'main'在'调用`Option::unwrap()`时恐慌'None'值'

```
线程'main'在'调用`Option::unwrap()`时恐慌'None'值'，/Users/username/.cargo/git/checkouts/anchor-50c4b9c8b5e0501f/347c225/lang/syn/src/idl/file.rs:214:73
注意：使用`RUST_BACKTRACE=1`环境变量显示回溯
```

很可能你尚未运行`anchor build`。

### 我使用 Mac，出现错误：无法启动验证器：无法在 test-ledger 上创建分类帐：块存储错误

按照此 [Stack Exchange 线程](https://solana.stackexchange.com/questions/4499/cant-start-solana-test-validator-on-macos-13-0-1/4761#4761)中的说明操作。

### 我的 Mac 上没有 corepack，尽管已安装 node.js

运行以下命令

```
brew install corepack
brew link --overwrite corepack
```

Credit: [https://stackoverflow.com/questions/70082424/command-not-found-corepack-when-installing-yarn-on-node-v17-0-1](https://stackoverflow.com/questions/70082424/command-not-found-corepack-when-installing-yarn-on-node-v17-0-1)

### 错误：不是一个目录：

```
BPF SDK: /Users/rareskills/.local/share/solana/install/releases/stable-43daa37937907c10099e30af10a5a0b43e2dd2fe/solana-release/bin/sdk/bpf
cargo-build-bpf child: rustup toolchain list -v
cargo-build-bpf child: rustup toolchain link bpf /Users/rareskills/.local/share/solana/install/releases/stable-43daa37937907c10099e30af10a5a0b43e2dd2fe/solana-release/bin/sdk/bpf/dependencies/bpf-tools/rust
error: not a directory:
```

清除缓存：运行`rm -rf ~/.cache/solana/*`

### 错误：target/idl/day_1.json 不存在。你是否运行了`anchor build`？

创建一个名为 day_1 而不是 day1 的新项目。Anchor 似乎在某些机器上悄悄插入下划线。

## 通过 RareSkills 了解更多

这个教程是我们免费的 [Solana 课程](https://www.rareskills.io/solana-tutorial)中的第一个。