# 60 Days of Solana Course By Rareskills 

本课程由 [RareSkills](https://www.rareskills.io/) 编写，DeCert.me 翻译为中文版，英文原版在[这里](https://www.rareskills.io/solana-tutorial)

本课程旨在帮助具有以太坊或 EVM 开发的初学者或中级背景的工程师快速掌握 Solana 程序开发

## 如何阅读本书

在线阅读：前往 [DeCert.me](https://decert.me/tutorial/rareskills-solana-course)

本书使用 mdBook 编写，可以按照以下步骤本地运行或部署在服务器上：

### 安装 mdBook

参照官网教程：[https://rust-lang.github.io/mdBook/guide/installation.html](https://rust-lang.github.io/mdBook/guide/installation.html)

### 在本地运行

1. 将本书的源代码克隆到本地：

    `git clone https://github.com/decert-me/rareskills-solana-course`

2. 进入项目目录：
    `cd rareskills-solana-course`

3. 运行以下命令以预览本书：
    `mdbook serve`

4. 打开浏览器，并访问 [http://localhost:3000](http://localhost:3000)，你将看到本书的预览版本

### 部署在服务器上

1. 构建本书静态页面：`mdbook build`
2. 整体将构建出来的`book`文件夹上传到服务器
2. 配置你的服务器以提供静态网页服务，例如使用 Nginx 或 Apache
3. 访问你配置的服务器地址，你将看到部署在服务器上的本书的正式版本


## 共同参与翻译和校对
本课程大部分由 AI 翻译，人工进行校对。可以在[这里](https://github.com/decert-me/rareskills-solana-course/wiki/%E5%8F%82%E4%B8%8E%E7%BF%BB%E8%AF%91%E5%92%8C%E6%A0%A1%E9%AA%8C)查看待翻译/校对的文章，进行翻译或校对。

在翻译/校对前，请新建一个 Issue，按模板填写 Issue 内容。一篇文章对应一个 Issue。

Fork 本项目到自己的仓库。找到对应章节的文件并在源文件上开始编辑，编辑完成后发起 PR 。

发起 PR 时建议：一个 PR 对应一篇文章；PR 标题为“翻译/校对第?章”；在 PR 里提及对应的 Issue 编号。


## 目录

模块 1 | 入门主题
- 第 1 天 [Hello World（以及解决 Solana 安装问题）](./chapter_1.md) 
- 第 2 天 [函数参数、数学和算术溢出](./chapter_2.md)
- 第 3 天 [Anchor 函数魔法和接口定义语言](./chapter_3.md)
- 第 4 天 [Solana 回滚、错误和基本访问控制](./chapter_4.md)
- 第 5 天 [构造函数在哪里？关于 anchor 部署](./chapter_5.md)

模块 2 | 你需要了解的最低限度的 Rust
- 第 6 天 [将 Solidity 翻译为 Rust 和 Solana](./chapter_6.md)
- 第 7 天 [Rust 的不寻常语法](./chapter_7.md)
- 第 8 天 [理解 Rust 中类似函数的宏](./chapter_8.md)
- 第 9 天 [Rust 结构体和类似属性以及自定义派生宏](./chapter_9.md)
- 第 10 天 [将 Solidity 函数可见性和合约继承翻译为 Solana](./chapter_10.md)

模块 3 | Solana 中的重要系统级信息
- 第 11 天 [Solana 中的区块变量：block.timestamp 和 block.number 等](./chapter_11.md)
- 第 12 天 [超越区块：sysvars](./chapter_12.md)
- 第 13 天 [Solana 日志、事件和交易历史](./chapter_13.md)
- 第 14 天 [Solana 中的 tx.origin、msg.sender 和 onlyOwner ](./chapter_14.md)
- 第 15 天 [交易费用和计算单位](./chapter_15.md)

模块 4 | Solana 中的账户和存储
- 第 16 天 [Solana 中的账户](./chapter_16.md)
- 第 17 天 [写入存储](./chapter_17.md)
- 第 18 天 [从 Typescript 读取账户 —— 替代公共变量和查看函数](./chapter_18.md)
- 第 19 天 [在 Solana 中创建映射和嵌套映射](./chapter_19.md)
- 第 20 天 [存储成本、最大存储大小和账户调整大小](./chapter_20.md)
- 第 21 天 [在 Rust 中读取账户余额：Solana 中的 address(account).balance](./chapter_21.md)
- 第 22 天 [更多区别：Solana 中的修饰符、view pure、payable 和 fallback](./chapter_22.md)
- 第 23 天 [构建支付分配器：Solana 中的“payable”和“msg.value”](./chapter_23.md)
- 第 24 天 [授权各种钱包写入账户：“Pranking tx.origin”](./chapter_24.md)
- 第 25 天 [PDA vs Keypair 账户](./chapter_25.md)
- 第 26 天 [理解 Solana 中的账户所有权：将 SOL 转出 PDA](./chapter_26.md)
- 第 27 天 [init_if_needed 和重新初始化攻击](./chapter_27.md)
- 第 28 天 [Solana 中的 Multicall：批处理交易](./chapter_28.md)
- 第 29 天 [所有者 vs 权威](./chapter_29.md)
- 第 30 天 [删除账户和关闭程序](./chapter_30.md)
- 第 31 天 [#[derive(Accounts)]中的账户类型](./chapter_31.md)
- 第 32 天 [在链上读取另一个 Anchor 程序的账户数据](./chapter_32.md)
- 第 33 天 [跨程序调用](./chapter_33.md)


## 贡献者

| Avatar | name | Socials|
| -------------------------------------------------------- | ---- | ----|
| ![](https://learnblockchain.cn/image/avatar/4845_big.jpg) | dwong | https://twitter.com/0xdwong |
| ![](https://ipfs.learnblockchain.cn/avatar/dephy-logo.png) | shooter | DePHY：https://dephy.io  https://twitter.com/liushooter       |
