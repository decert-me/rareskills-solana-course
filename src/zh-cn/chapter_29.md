# Solana 中的所有者与权限

![solana 所有者与权限](https://static.wixstatic.com/media/935a00_8e90b3254a804e6c8c2db21b5d5eb1c2~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_8e90b3254a804e6c8c2db21b5d5eb1c2~mv2.jpg)

Solana 的新手经常对“所有者”和“权限”之间的区别感到困惑。本文试图尽可能简洁地澄清这种混淆。

## 所有者与权限

只有程序才能向账户写入数据 — 具体来说，只能写入它们拥有的账户。程序不能向任意账户写入数据。

当然，程序不能自发地向账户写入数据。它们需要从钱包接收指令才能这样做。然而，通常情况下，程序只会接受来自特权钱包的写入指令：*权限*。

账户在 Solana 中都具有以下字段，这些字段大多是不言自明的：

- 公钥
- lamport 余额
- 所有者
- 可执行性（布尔标志）
- rent_epoch（对于免租账户可以忽略）
- 数据

我们可以通过在终端中运行 `solana account <我们的钱包地址>` 来查看这些字段（在后台运行 Solana 验证器）：

![系统程序作为所有者](https://static.wixstatic.com/media/935a00_c3fb0f0ed572444bb560f20bfd0b209f~mv2.png/v1/fill/w_740,h_153,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_c3fb0f0ed572444bb560f20bfd0b209f~mv2.png)

注意一个有趣的事实：**我们不是我们钱包的所有者！** 地址 111…111 是**系统程序**的所有者。

为什么系统程序拥有钱包，而不是钱包拥有自己？

**只有账户的所有者才能修改其中的数据。**

这意味着我们无法直接修改我们的余额。只有系统程序才能这样做。要从我们的账户中转移 SOL，我们向系统程序发送一个已签名的交易。系统程序会验证我们拥有账户的私钥，然后代表我们修改余额。

这是你在 Solana 中经常看到的模式：只有账户的所有者才能修改账户中的数据。如果程序看到来自预定地址的有效签名：一个权限，程序将修改账户中的数据。

**权限是程序看到有效签名时将接受指令的地址。权限不能直接修改账户。它需要通过拥有要修改的账户的程序来操作。**

![权限所有者账户流程图](https://static.wixstatic.com/media/935a00_30af1af38d204a449fc06dfe5cb28990~mv2.jpg/v1/fill/w_740,h_249,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_30af1af38d204a449fc06dfe5cb28990~mv2.jpg)

然而，所有者始终是一个程序，如果交易的签名有效，该程序将代表其他人修改账户。

例如，在我们的[使用不同签名者修改账户的教程](https://www.rareskills.io/post/anchor-signer)中，我们看到了这一点。

**练习：** 创建一个初始化存储账户的程序。你可能需要程序和存储账户的地址。考虑将以下代码添加到测试中：

```
console.log(`程序：${program.programId.toBase58()}`);
console.log(`存储账户：${myStorage.toBase58()}`);
```

然后在初始化的账户上运行 `solana account <存储账户>`。你应该看到所有者是程序。

这是运行练习的屏幕截图：

![将程序地址与账户所有者关联](https://static.wixstatic.com/media/935a00_9f1ac64a1b74409b82c8c6c61d7d122b~mv2.png/v1/fill/w_740,h_285,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_9f1ac64a1b74409b82c8c6c61d7d122b~mv2.png)

当我们查看存储账户的元数据时，我们看到程序是所有者。

**因为程序拥有存储账户，所以它能够向其写入数据。** 用户无法直接向存储账户写入数据，他们需要签署交易并要求程序写入数据。

## Solana 中的所有者与 Solidity 中的所有者非常不同

在 Solidity 中，我们通常将所有者称为具有智能合约管理权限的特殊地址。“所有者”不是以太坊运行时级别存在的概念，而是应用于 Solidity 合约的设计模式。Solana 中的所有者更为基础。在以太坊中，智能合约只能写入自己的存储槽。想象一下，如果我们有一种机制允许以太坊智能合约能够写入其他一些存储槽。在 Solana 术语中，它将成为这些存储槽的*所有者*。

## 权限可以表示部署合约的人和可以为特定账户发送写入交易的人

*权限*可以是程序级别的构造。在我们的 [Anchor 签名者教程](https://www.rareskills.io/post/anchor-signer)中，我们创建了一个程序，Alice 可以从她的账户中扣除积分并转移给其他人。为了确保只有 Alice 可以为该账户发送扣除交易，我们将她的地址存储在账户中：

```
#[account]
pub struct Player {
    points: u32,
    authority: Pubkey
}
```

Solana 使用类似的机制来记住谁部署了一个程序。在我们的 [Anchor 部署教程](https://www.rareskills.io/post/solana-anchor-deploy)中，我们注意到部署程序的钱包也能够升级它。

“升级”程序就是向其写入新数据 — 即新的字节码。只有程序的所有者才能向其写入数据（我们很快将看到，这个程序是`BPFLoaderUpgradeable`）。

那么，Solana 如何知道如何授予部署某个程序的钱包升级权限呢？

## 从命令行查看程序的权限

在部署程序之前，让我们通过在终端中运行 `solana address` 来查看 anchor 正在使用的钱包：

![solana 地址 cli 获取地址](https://static.wixstatic.com/media/935a00_fd920364f617483ebf078041d398632d~mv2.png/v1/fill/w_740,h_63,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_fd920364f617483ebf078041d398632d~mv2.png)

请注意我们的地址是 `5jmi...rrTj`。现在让我们创建一个程序。

确保`solana-test-validator`和`solana logs`在后台运行，然后部署 Solana 程序：

```
anchor init owner_authority
cd owner_authority
anchor build
anchor test --skip-local-validator
```

当我们查看日志时，我们会看到我们刚刚部署的程序的地址：

![部署的程序地址](https://static.wixstatic.com/media/935a00_14c5c0492e7e402eb9ce562040210f46~mv2.png/v1/fill/w_740,h_160,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_14c5c0492e7e402eb9ce562040210f46~mv2.png)

请记住，Solana 中的所有内容都是账户，包括程序。现在让我们使用 `solana account 6Ye7CgrwJxH3b4EeWKh54NM8e6ZekPcqREgkrn7Yy3Tg` 来检查此账户。我们得到以下结果：

![打印程序元数据](https://static.wixstatic.com/media/935a00_d164ca02317949f1b748bbdeef4a3a9a~mv2.png/v1/fill/w_740,h_173,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_d164ca02317949f1b748bbdeef4a3a9a~mv2.png)

**请注意，权限字段不存在，因为“权限”不是 Solana 账户持有的字段。** 如果你向本文顶部滚动，你会看到控制台中的密钥与我们在本文顶部列出的字段匹配。

在这里，“所有者”是 BPFLoaderUpgradeable111…111，这是所有 Solana 程序的所有者。

现在让我们运行 `solana program show 6Ye7CgrwJxH3b4EeWKh54NM8e6ZekPcqREgkrn7Yy3Tg`，其中 `6Ye7...y3TG` 是我们程序的地址：

![solana 程序展示](https://static.wixstatic.com/media/935a00_b6ad9392e391401ab078a25f438bf5b1~mv2.png/v1/fill/w_740,h_139,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_b6ad9392e391401ab078a25f438bf5b1~mv2.png)

在上面的绿色框中，我们看到我们的钱包地址 — 用于部署程序的地址，以及我们之前使用 `solana address` 打印出的地址：

![再次在 CLI 中显示我们的地址](https://static.wixstatic.com/media/935a00_6647b07f8ae446b780eff0f4dc63cbda~mv2.png/v1/fill/w_740,h_63,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_6647b07f8ae446b780eff0f4dc63cbda~mv2.png)

但这引出了一个重要问题…

## Solana 将“权限”存储在哪里，目前是我们的钱包？

它不是账户中的字段，因此必须存储在某个 Solana 账户的`data`字段中。“权限”存储在存储程序字节码的`ProgramData`地址中：

![ProgramData 地址](https://static.wixstatic.com/media/935a00_2e253c4d60e74867a2241b1bee25d42a~mv2.png/v1/fill/w_740,h_139,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_2e253c4d60e74867a2241b1bee25d42a~mv2.png)

## 我们钱包的十六进制编码（权限）

在继续之前，将有助于将`ProgramData Address`的 base58 编码转换为十六进制表示。完成此转换的代码提供在文章末尾，但现在请读者接受我们 Solana 钱包地址 `5jmigjgt77kAfKsHri3MHpMMFPo6UuiAMF19VdDfrrTj` 的十六进制表示为：

```
4663b48dfe92ac464658e512f74a8ee0ffa99fffe89fb90e8d0101a0c3c7767a
```

## 查看存储程序字节码的账户中的数据

我们可以使用 `solana account` 查看`ProgramData Address`账户，但我们还将将其发送到临时文件以避免向终端转储过多数据。

```
solana account FkYygT7X7qjifdxfBVWXTHpj87THJGmtmKUyU4SamfQm > tempfile

head -n 10 tempfile
```

上述命令的输出显示我们的钱包（十六进制）嵌入到`data`中。请注意，黄色下划线的十六进制代码与我们的钱包的十六进制编码（权限）匹配：

![我们地址的十六进制编码](https://static.wixstatic.com/media/935a00_20455248359040bea0b891312710c3e9~mv2.png/v1/fill/w_740,h_170,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_20455248359040bea0b891312710c3e9~mv2.png)

## 程序的字节码存储在单独的账户中，而不是程序的地址

这应该可以从上述命令序列中推断出，但值得明确说明。即使程序是一个标记为可执行的账户，字节码也不存储在其自己的数据字段中，而是存储在另一个账户中（有点令人困惑的是，这个账户并非可执行，它只是存储字节码）。

**练习：** 你能找到程序存储持有字节码的账户地址的位置吗？本文附录中的代码可能会有所帮助。

## 总结

只有程序的所有者才能更改其数据。Solana 程序的所有者是`BPFLoaderUpgradeable`系统程序，因此默认情况下，部署程序的钱包无法更改存储在账户中的数据（字节码）。

为了使程序升级，Solana 运行时将部署者的钱包嵌入到程序的字节码中。它将此字段称为“权限”。

当部署的钱包尝试升级字节码时，Solana 运行时将检查事务签名者是否是权限。如果事务签名者与权限匹配，则`BPFLoaderUpgradeable`将代表权限更新程序的字节码。

## 附录：将 base58 转换为十六进制

以下 Python 代码将完成转换。它是由一个聊天机器人生成的，因此仅供说明目的使用：

```
def decode_base58(bc, length):
    base58_digits = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    n = 0
    for char in bc:
        n = n * 58 + base58_digits.index(char)
    return n.to_bytes(length, 'big')

def find_correct_length_for_decoding(base58_string):
    for length in range(25, 50):  # Trying lengths from 25 to 50
        try:
            decoded_bytes = decode_base58(base58_string, length)
            return decoded_bytes.hex()
        except OverflowError:
            continue
    return None

# Base58 string to convert
base58_string = "5jmigjgt77kAfKsHri3MHpMMFPo6UuiAMF19VdDfrrTj"

# Convert and get the hexadecimal string
hex_string = find_correct_length_for_decoding(base58_string)
print(hex_string)
```

## 通过 RareSkills 了解更多

查看我们的 [Solana 开发课程](https://www.rareskills.io/solana-tutorial)以了解更多 Solana 主题！有关其他区块链主题，请查看我们的[区块链训练营](https://www.rareskills.io/web3-blockchain-bootcamps) 。