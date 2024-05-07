# Solana 中的函数修饰符（view、pure、payable）和回退函数：为什么它们不存在

![Solana 中的 view、pure、payable、fallback 和 receive](https://static.wixstatic.com/media/935a00_ef441e08a8eb49a8876f000a4d2dff1a~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_ef441e08a8eb49a8876f000a4d2dff1a~mv2.jpg)

## Solana 没有回退或 receive 函数

Solana 交易必须预先指定作为交易一部分将修改或读取的账户。如果“回退”函数访问不确定的账户，整个交易将失败。这将使用户需要预料回退函数将访问的账户。因此，简单地禁止这类函数会更简单。

## Solana 没有“view”或“pure”函数的概念

Solidity 中的“view”函数通过两种机制创建一个保证状态不会改变的保证：

- 视图函数中的所有外部调用都是[静态调用](https://www.rareskills.io/post/solidity-staticcall) （如果发生状态更改，则调用将回滚）
- 如果编译器检测到更改状态的操作码，则会抛出错误

纯函数通过编译器检查是否有查看状态的操作码来进一步实现这一点。

这些函数限制主要发生在编译器级别，Anchor 不实现这些编译器检查。Anchor 并不是构建 Solana 程序的唯一框架。[Seahorse](https://seahorse-lang.org/) 是另一个框架。也许会出现另一个框架，明确声明函数可以做什么和不能做什么，但目前我们可以依赖以下保证：如果一个账户未包含在 Context 结构定义中，该函数将不会访问该账户。

这并*不*意味着账户根本无法访问。例如，我们可以编写一个单独的程序来读取一个账户，并以某种方式将数据转发给相关函数。

最后，在 Solana 虚拟机或运行时中并不存在`staticcall`这样的东西。

## Solana 中并不需要视图函数

因为 Solana 程序可以读取传递给它的任何账户，它可以读取另一个程序拥有的账户。

拥有账户的程序不需要实现视图函数来授予另一个程序查看该账户的访问权限。web3 js 客户端 — 或另一个程序 — 可以直接[查看 Solana 账户数据](https://www.rareskills.io/post/solana-read-account-data) 。

这有一个非常重要的含义：

**在 Solana 中，不可能使用递归锁直接防御只读递归。程序必须公开标志，以便读者知道数据是否可靠。**

[只读递归](https://www.rareskills.io/post/where-to-find-solidity-reentrancy-attacks)发生在受害合约访问显示被篡改数据的视图函数时。在 Solidity 中，可以通过向视图函数添加 nonReentrant 修饰符来防御这种情况。然而，在 Solana 中，没有办法阻止另一个程序查看账户中的数据。

但是，Solana 程序仍然可以实现用于检查递归锁使用的标志。消费另一个程序的账户的程序可以检查这些标志，以查看账户当前是否处于递归状态，不应信任该账户。

## Rust 中没有自定义修饰符

像`onlyOwner`或`nonReentrant`这样的自定义修饰符是 Solidity 的创造物，而不是 Rust 中可用的功能。

## Rust 或 Anchor 中没有自定义单位

因为 Solidity 与 Ethereum 紧密相关，它具有方便的关键字，如`ethers`或`wei`来衡量以太坊。不足为奇的是，在 Rust 中未定义`LAMPORTS_PER_SOL`，但有些令人惊讶的是，在 Anchor Rust 框架中也未定义。然而，在 Solana web3 js 库中是可用的。

类似地，Solidity 中有`days`作为 84,600 秒的便捷别名，但在 Rust/Anchor 中没有相对应的。

## Solana 中不存在“可支付”函数。程序从用户那里转移 SOL，用户不会向程序转移 SOL

这是下一个教程的主题。

## 通过 RareSkills 了解更多 Solana

查看我们的 [Solana 开发课程](http://rareskills.io/solana-tutorial)以获取下一章