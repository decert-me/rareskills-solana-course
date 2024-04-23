# 在 Anchor 中读取账户余额：address(account).balance in Solana

更新日期：3 月 5 日

![Solana get account balance](https://static.wixstatic.com/media/935a00_8742c65f9a7a48e3b6db4aa916303cd0~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/935a00_8742c65f9a7a48e3b6db4aa916303cd0~mv2.jpg)

## 在 Anchor Rust 中读取账户余额

要在 Solana 程序内部读取地址的 Solana 余额，请使用以下代码：

```
use anchor_lang::prelude::*;

declare_id!("Gnf6u7S7fGJbqEGH9PuDE5Prq6f6ZrDxHY3jNJ4SYySQ");

#[program]
pub mod balance {
    use super::*;

    pub fn read_balance(ctx: Context<ReadBalance>) -> Result<()> {
        let balance = ctx.accounts.acct.to_account_info().lamports();

        msg!("balance in Lamports is {}", balance);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadBalance<'info> {
    /// CHECK: although we read this account's balance, we don't do anything with the information
    pub acct: UncheckedAccount<'info>,
}
```

以下是用于触发的 web3 js 代码：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Balance } from "../target/types/balance";

describe("balance", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Balance as Program<Balance>;

	// the following is the Solana wallet we are using
  let pubkey = new anchor.web3.PublicKey("5jmigjgt77kAfKsHri3MHpMMFPo6UuiAMF19VdDfrrTj");


  it("Tests the balance", async () => {
    const tx = await program.methods.readBalance().accounts({ acct: pubkey }).rpc();
  });
});
```

在此示例中，有些项目与先前的教程不同，特别是使用 `UncheckedAccount`。

## 什么是 Solana Anchor 中的 UncheckedAccount？

UncheckedAccount 类型告诉 Anchor 不要检查要读取的账户是否由程序拥有。

请注意，我们通过 `Context` 结构传递的账户不是此程序初始化的账户，因此程序不拥有它。

当 Anchor 读取 `#[derive(Accounts)]` 中的 `Account` 类型账户时，它将在幕后检查该账户是否由该程序拥有。如果不是，则执行将停止。

这是一个重要的安全检查。

**如果恶意用户制作了程序未创建的账户，然后将其传递给 Solana 程序，并且 Solana 程序盲目地信任账户中的数据，可能会发生严重错误。**

例如，如果程序是一个银行，账户存储用户的余额，那么黑客可以提供一个余额比实际余额高的*不同*账户。

然而，要实施这种黑客攻击，用户必须在单独的交易中创建虚假账户，然后将其传递给 Solana 程序。然而，Anchor 框架在幕后检查账户是否不属于该程序，并拒绝读取该账户。

`UncheckedAccount` 可以绕过此安全检查。

**重要提示：** `AccountInfo` 和 `UncheckedAccount` 是彼此的别名，`AccountInfo` 具有相同的安全考虑。

在我们的情况下，我们传递的账户肯定不是程序拥有的账户 — 我们要检查*任意*账户的余额。因此，我们必须确保删除此安全检查后不会有任何关键逻辑被篡改。

在我们的情况下，我们只是将余额记录到控制台，但大多数真实用例将具有更复杂的逻辑。

### 什么是 `/// CHECK:`？

由于使用 UncheckedAccount 的危险性，Anchor 强制你包含此注释以鼓励你不要忽视安全考虑。

**练习：** 删除 `/// Check:` 注释并运行 `anchor build`，你应该看到构建停止并要求你添加注释并解释为什么 Unchecked Account 是安全的。也就是说，读取不受信任的账户可能是危险的，Anchor 希望确保你不会对账户中的数据执行任何关键操作。

## 为什么程序中没有 `#[account]` 结构体？

`#[account]` 结构体告诉 Anchor 如何反序列化持有数据的账户。例如，类似以下内容的账户结构体将告诉 Anchor 应该将存储在账户中的数据反序列化为单个 `u64`：

```
#[account]
pub struct Counter {
	counter: u64
}
```

然而，在我们的情况下，我们不是从账户中读取数据 — 我们只是读取余额。这类似于我们如何可以读取以太坊地址的余额，但不读取其代码。由于我们*不*想反序列化数据，因此我们不提供 `#[account]` 结构体。

## 账户中的所有 SOL 都是可花费的

回想一下我们对 [Solana 账户租金](https://www.rareskills.io/post/solana-account-rent) 的讨论，账户必须保持一定数量的 SOL 余额才能“免租”或运行时将删除该账户。账户中有“1 SOL”并不一定意味着账户可以花费全部 1 SOL。

例如，如果你正在构建一个存款或银行应用程序，用户存入的 SOL 保留在单独的账户中，仅仅测量这些账户的 SOL 余额并不准确，因为租金将包含在余额中。

## 通过 RareSkills 了解更多

查看我们的 [Solana 开发者课程](https://www.rareskills.io/solana-tutorial) 获取更多 Solana 资料。