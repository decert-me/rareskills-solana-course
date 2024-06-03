<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-1.svg" alt="" width="337" height="63" />
<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/solana.svg" alt="Solana" width="337" height="45" />

# 由 Rareskills 提供的 Solana 课程

本 Solana 课程旨在帮助具有以太坊或 EVM 开发的初学者或中级背景的工程师快速掌握 Solana 程序开发。

[跳转到课程](#solana-课程)


初学者在学习区块链编程时面临的困难是他们必须学习一种新的计算模型、学习一种新的语言和学习一个新的开发框架。

如果你已经在以太坊或兼容以太坊的区块链上开发过，那么你已经对计算模型有了相当好的了解，可以专注于语言和框架。

我们的目标是利用你在以太坊方面的过去经验，更快地学习 Solana。 你无需从零开始。

## Solana 与以太坊在如何运行区块链方面有不同的模型，但并不完全不同。

与其直接解释所有的不同之处，本教程试图将关键信息压缩到以下范式中：

<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-2.svg" alt="" width="10" height="120" />
<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-3.svg" alt="" width="100" height="120" />

“我知道如何在以太坊中做 X，我如何在 Solana 中做 X？

并在某些情况下，

<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-4.svg" alt="" width="10" height="120" />
<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-3.svg" alt="" width="100" height="120" />

“我无法在 Solana 中做 X，为什么？”

我们采取这种方法是因为如果你能够将概念从你已经掌握的心智模型映射到新事物上，那么开发新事物的心智模型会更容易。

如果你像大多数程序员一样，学习 Solidity 可能很容易。 它几乎是一对一对应的 JavaScript。 但是，设计智能合约可能是一个挑战，因为它与其他应用程序非常不同。

我们希望你能够了解 Solana 和以太坊的相似之处，以及它们之间的关键区别。

（注：在本系列中我们经常提到以太坊，但所有的想法也适用于其他兼容 EVM 的区块链，如 Avalanche 和 Polygon）。

## 所有区块链都是去中心化状态机

Solana 的架构确实有很大不同，但它基本上与以太坊做的事情相同：

<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-2.svg" alt="" width="10" height="120" />
<img src="https://static.wixstatic.com/media/a133f4_870a6a75603e40a7b8aaa7f73dc313bc~mv2.png/v1/fill/w_152,h_120,al_c,q_95,enc_auto/a133f4_870a6a75603e40a7b8aaa7f73dc313bc~mv2.png" alt="区块链节点图标" width="152" height="120" />

它是一个分布式状态机，根据签名交易进行状态转换，执行的成本是用生态系统的原生代币支付（以太坊为 ETH，Solana 为 SOL）。  


<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-2.svg" alt="" width="10" height="120" />
<img src="https://static.wixstatic.com/media/a133f4_af6a587fc43444a08974ca01cf7ca265~mv2.png/v1/fill/w_152,h_120,al_c,q_95,enc_auto/solethbooth.png" alt="solana 和 以太坊 logo" width="152" height="120" />

我们的目标是利用你对 EVM 的知识，作为你 Solana 开发之旅的跳板。


> 考虑这个类比：   
    如果一个前端 Web 开发人员和一个后端 API/数据库工程师都决定学习移动应用开发，大多数工程师会说前端 Web 开发人员比后端工程师有更大的优势，即使 Web 开发和移动开发并不是同一个领域，即使开发经验可能非常相似，使用一些工具链。

根据这种推理，我们 RareSkills 认为，一个称职的 EVM 智能合约工程师应该能够比一个以前没有编写过区块链的工程师更快地掌握 Solana。

这门课程旨在利用这种优势。

## 我们从 Solana 与以太坊相似的方面开始

如果你查看我们的大纲，你会发现我们似乎更多地涵盖了中级主题（按 Solidity 标准），如 gas 使用，然后再涵盖更基础的内容（如如何更新存储变量）。 这是有意为之的。

### 从 Solana 中的 EVM 等效开始

我们希望首先介绍那些可以从以太坊概念中进行一对一映射的主题。 我们假设你知道存储是一个重要的主题，并且可以等一会再深入研究它。

### 通过小巧的练习来简化过渡

使用新框架已经会让人感到尴尬。 给你一堆依赖于熟悉心智模型的小练习将会简化过渡。 同时使用新框架和新心智模型会让人望而却步。 我们希望你在早期体验到许多小胜利，以便在接触更不熟悉的方面时能够保持一些动力。

### 一个积极的学习之旅

我们在整个教程中都包含了练习，用粗体字**练习**标记。 这些将是你刚刚学到的知识的实际应用。。 **你应该做这些练习！积极的学习总是胜过被动阅读。**

### 我们期望你熟悉 Solidity

如果你从未进行过智能合约开发，那么本教程并不是直接面向你的。 我们假设你对 Solidity 有初学者到中级水平的了解。 如果 Solidity 的示例让你感到陌生，请练习我们的[免费 Solidity 教程](https://www.rareskills.io/learn-solidity) 一周，然后再回到这里。

## 我需要了解多少 Rust？

不需要很多。

Rust 是一种庞大的语言，其语法足以超过大多数其他流行语言。 在学习 Solana 之前“先精通 Rust”可能是一个错误。 你可能会走上一个持续几个月的弯路！

本课程仅关注你需要了解的最少 Rust。

如果你对开始使用一种以前未使用过的语言感到不舒服，请完成我们的 Rust 入门课程中的免费视频和练习，然后就此打住。 我们的审阅人员在没有先通过 Rust 入门课程的情况下完成了这里的练习，因此我们认为我们成功地在本课程中平衡了教授恰到好处的 Rust 知识。

## 为什么是 60 天？

我们发现学习者在将信息分解为可能的最原子位时保持最活跃。 如果教程太长，只有最感兴趣的读者才会完成。 在将教程限制为尽可能原子化之后，我们估计大约需要六十个教程才能对 Solana 开发生态系统有一个舒适的掌握。

我们已经对这些教程进行了测试，并发现审阅人员能够在不到一个小时的时间内轻松完成。 每天不需要花费太多精力使学习 Solana 更具可持续性，并减少烧脑的可能性。

如果有动力的读者可以根据需要更快地完成课程。

对 Solana 只是感兴趣的读者可以以更轻松的步调消化课程，而不会在任何一天花费太多宝贵的时间和精力。

我们的课程旨在让你在编写应用程序时快速查阅所需内容。 例如，如果你忘记如何在 Solana 中获取当前时间，你将很容易找到适当的部分并复制粘贴所需的代码。

请注意，本文中的代码采用 MIT 许可，但未经许可，严禁复制、复制或创建此课程的衍生作品。

## 致谢

我们要感谢 [Faybian Byrd](https://www.linkedin.com/in/faybianbyrd/)、Devtooligan、Abhi Gulati，他们仔细审查并提供了对这项工作的反馈。


<img src="https://raw.githubusercontent.com/decert-me/rareskills-solana-course/268c72d70e5d30312e244dbd3c67895e1864c3d7/src/assets/0-5.svg" alt="" width="550" height="36" />

## Solana 课程

### 模块 1 | 入门主题
---
#### 第 1 天 [Hello World（以及解决 Solana 安装问题）](./chapter_1.md) 

#### 第 2 天 [函数参数、数学和算术溢出](./chapter_2.md)

#### 第 3 天 [Anchor 函数魔法和接口定义语言](./chapter_3.md)

#### 第 4 天 [Solana 回滚、错误和基本访问控制](./chapter_4.md)

#### 第 5 天 [构造函数在哪里？关于 anchor 部署](./chapter_5.md)


### 模块 2 | 你需要了解的最低限度的 Rust

第 8-10 天并不重要，它们只是解释了大多数读者可能不熟悉的一些语法。但是，你可以编写 Solana 程序并跟随其中，将不寻常的语法视为样板。可以随意略过那几天（的课程）。

#### 第 6 天 [将 Solidity 翻译为 Rust 和 Solana](./chapter_6.md)

#### 第 7 天 [Rust 的不寻常语法](./chapter_7.md)

#### 第 8 天 [理解 Rust 中类似函数的宏](./chapter_8.md)

#### 第 9 天 [Rust 结构体和类似属性以及自定义派生宏](./chapter_9.md)

#### 第 10 天 [将 Solidity 函数可见性和合约继承翻译为 Solana](./chapter_10.md)


### 模块 3 | Solana 中的重要系统级信息

#### 第 11 天 [Solana 中的区块变量：block.timestamp 和 block.number 等](./chapter_11.md)

#### 第 12 天 [超越区块：sysvars](./chapter_12.md)

#### 第 13 天 [Solana 日志、事件和交易历史](./chapter_13.md)

#### 第 14 天 [Solana 中的 tx.origin、msg.sender 和 onlyOwner ](./chapter_14.md)

#### 第 15 天 [交易费用和计算单位](./chapter_15.md)


### 模块 4 | Solana 中的账户和存储

账户是 Solana 开发中最复杂的主题之一，因为它们比以太坊存储变量要灵活得多，因此我们会慢慢介绍它们。每个教程都会逐渐强化概念，所以如果所有新信息没有立即牢记也不用担心。

#### 第 16 天 [Solana 中的账户](./chapter_16.md)

#### 第 17 天 [写入存储](./chapter_17.md)

#### 第 18 天 [从 Typescript 读取账户 —— 替代公共变量和查看函数](./chapter_18.md)

#### 第 19 天 [在 Solana 中创建映射和嵌套映射](./chapter_19.md)

#### 第 20 天 [存储成本、最大存储大小和账户调整大小](./chapter_20.md)

#### 第 21 天 [在 Rust 中读取账户余额：Solana 中的 address(account).balance](./chapter_21.md)

#### 第 22 天 [更多区别：Solana 中的修饰符、view pure、payable 和 fallback](./chapter_22.md)

#### 第 23 天 [构建支付分配器：Solana 中的“payable”和“msg.value”](./chapter_23.md)

#### 第 24 天 [授权各种钱包写入账户：“Pranking tx.origin”](./chapter_24.md)

#### 第 25 天 [PDA vs Keypair 账户](./chapter_25.md)

#### 第 26 天 [理解 Solana 中的账户所有权：将 SOL 转出 PDA](./chapter_26.md)

#### 第 27 天 [init_if_needed 和重新初始化攻击](./chapter_27.md)

#### 第 28 天 [Solana 中的 Multicall：批处理交易](./chapter_28.md)

#### 第 29 天 [所有者 vs 权威](./chapter_29.md)

#### 第 30 天 [删除账户和关闭程序](./chapter_30.md)

#### 第 31 天 [#[derive(Accounts)]中的账户类型](./chapter_31.md)

#### 第 32 天 [在链上读取另一个 Anchor 程序的账户数据](./chapter_32.md)