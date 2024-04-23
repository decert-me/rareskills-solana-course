# 在 Anchor 中的`#[Derive(Accounts)]`：不同类型的账户

`#[Derive(Accounts)]`在 Solana Anchor 中是一个类似属性的宏，用于结构体，该结构体保存函数在执行期间将访问的所有账户的引用。

## 在 Solana 中，事务将访问的每个账户必须事先指定

Solana 之所以如此快，一个原因是它可以并行执行事务。也就是说，如果 Alice 和 Bob 都想执行一个事务，Solana 将尝试同时处理他们的事务。但是，如果他们的事务通过访问相同的存储而发生冲突，则会出现问题。例如，假设 Alice 和 Bob 都试图写入同一个账户。显然，他们的事务无法并行运行。

为了让 Solana 知道 Alice 和 Bob 的事务不能并行化，Alice 和 Bob 都必须事先指定他们的事务将更新的所有账户。

由于 Alice 和 Bob 都指定了一个（存储）账户，Solana 运行时可以推断出两个事务存在冲突。必须选择一个（可能是支付了更高优先级费用的那个），另一个将失败。

这就是为什么每个函数都有自己单独的`#[Derive(Accounts)]`结构体。结构体中的每个字段都是程序在执行期间打算（但不是必须）访问的账户。

一些以太坊开发人员可能会注意到这一要求与 [EIP 2930 访问列表事务](https://www.rareskills.io/post/eip-2930-optional-access-list-ethereum)的相似之处。

账户类型中你将最常使用的有：账户（Account）、未经检查的账户（Unchecked Account）、系统程序（System Program）和签名者（Signer）。

在我们用于初始化存储的代码中，我们看到了三种不同的“类型”账户：

- `账户（Account）`
- `签名者（Signer）`
- `程序（Program）`

以下是代码：

![用于初始化存储的代码图，突出显示了三种类型的账户：账户、签名者和程序。](https://static.wixstatic.com/media/706568_f36b7a4b1f4a4c088a92873017cb20ba~mv2.png/v1/fill/w_740,h_413,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/706568_f36b7a4b1f4a4c088a92873017cb20ba~mv2.png)

当我们读取一个账户余额时，我们看到了第四种类型：

- `未经检查的账户（UncheckedAccount）`

以下是我们使用的代码：

![ReadBalance 结构的代码图，突出显示了第四种账户框：未经检查的账户。](https://static.wixstatic.com/media/706568_70999862b3e046069fb16caf2c0a9f74~mv2.png/v1/fill/w_740,h_213,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/706568_70999862b3e046069fb16caf2c0a9f74~mv2.png)

我们用绿色框突出显示的每个项目都是通过文件顶部的`anchor_lang::prelude::*;**;**`导入的。

`账户（Account）`、`未经检查的账户（UncheckedAccount）`、`签名者（Signer）`和`程序（Program）`的目的是在继续之前对传入的账户执行某种检查，并公开用于与这些账户交互的函数。

我们将在以下部分进一步解释这四种类型中的每一种。

## 账户（Account）

`账户（Account）`类型将检查加载的账户的所有者是否实际上由程序拥有。如果所有者不匹配，则不会加载。这是一个重要的安全措施，以防止意外读取程序未创建的数据。

在以下示例中，我们创建了一个密钥对账户，并尝试将其传递给`foo`。因为该账户不是由程序拥有，所以事务失败了。

Rust：

```
use anchor_lang::prelude::*;

declare_id!("ETnqC8mvPRyUVXyXoph22EQ1GS5sTs1zndkn5eGMYWfs");

#[program]
pub mod account_types {    
	use super::*;   

	pub fn foo(ctx: Context<Foo>) -> Result<()> {        
		// we don't do anything with the account SomeAccount        
		Ok(())    
		}
}

#[derive(Accounts)]
pub struct Foo<'info> {    
	some_account: Account<'info, SomeAccount>,
}

#[account]
pub struct SomeAccount {}
```

Typescript：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountTypes } from "../target/types/account_types";

describe("account_types", () => {
	async function airdropSol(publicKey, amount) {    
		let airdropTx = await anchor
			.getProvider()
			.connection.requestAirdrop(
				publicKey, 
				amount * anchor.web3.LAMPORTS_PER_SOL
			);  
  
		await confirmTransaction(airdropTx);  
	}  

	async function confirmTransaction(tx) {    
		const latestBlockHash = await anchor
			.getProvider()
			.connection.getLatestBlockhash();
   
		await anchor
			.getProvider()
			.connection.confirmTransaction({      
				blockhash: latestBlockHash.blockhash,      	
				lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,      
				signature: tx,    
		});  
	}  

// Configure the client to use the local cluster.  
anchor.setProvider(anchor.AnchorProvider.env());  

const program = anchor.workspace.AccountTypes as Program<AccountTypes>;  

it("Wrong owner with Account", async () => {    
	const newKeypair = anchor.web3.Keypair.generate();    
	await airdropSol(newKeypair.publicKey, 10);    

	await program.methods
		.foo()
		.accounts({someAccount: newKeypair
		.publicKey}).rpc();  
	});
});
```

这是执行测试后的输出：

![尝试传递一个不属于程序所有的密钥对账户后显示的错误消息图。](https://static.wixstatic.com/media/706568_ed29ef540894498c9da3913dd241351a~mv2.png/v1/fill/w_740,h_257,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/706568_ed29ef540894498c9da3913dd241351a~mv2.png)

如果我们为`账户（Account）`添加一个`init`宏，那么它将尝试将所有权从系统程序转移给此程序。但是，上面的代码没有`init`宏。

有关`账户（Account）`类型的更多信息，请参阅文档：[https://docs.rs/anchor-lang/latest/anchor_lang/accounts/account/struct.Account.html](https://docs.rs/anchor-lang/latest/anchor_lang/accounts/account/struct.Account.html)

## 未经检查的账户或账户信息（UncheckedAccount or AccountInfo）

`未经检查的账户（UncheckedAccount）`是`账户信息（AccountInfo）`的别名。它不检查所有权，因此必须小心，因为它将接受任意账户。

以下是使用`未经检查的账户（UncheckedAccount）`读取其不拥有的账户数据的示例。

```
use anchor_lang::prelude::*;

declare_id!("ETnqC8mvPRyUVXyXoph22EQ1GS5sTs1zndkn5eGMYWfs");

#[program]
pub mod account_types {    
	use super::*;    
	
	pub fn foo(ctx: Context<Foo>) -> Result<()> {        
		let data = &ctx.accounts.some_account.try_borrow_data()?;        
		msg!("{:?}", data);        
		Ok(())    
	}
}

#[derive(Accounts)]
pub struct Foo<'info> {    
	/// CHECK: we are just printing the data    
	some_account: AccountInfo<'info>,
}
```

以下是我们的 Typescript 代码。请注意，我们直接调用系统程序以创建密钥对账户，以便我们可以分配 16 字节的数据。

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountTypes } from "../target/types/account_types";

describe("account_types", () => {  
	const wallet = anchor.workspace.AccountTypes.provider.wallet;  
	
	// Configure the client to use the local cluster.  
	anchor.setProvider(anchor.AnchorProvider.env());  

	const program = anchor.workspace.AccountTypes as Program<AccountTypes>;  
	it("Load account with accountInfo", async () => {    
	// CREATE AN ACCOUNT NOT OWNED BY THE PROGRAM    
	const newKeypair = anchor.web3.Keypair.generate();    
	const tx = new anchor.web3.Transaction().add(      
		anchor.web3.SystemProgram.createAccount({        
			fromPubkey: wallet.publicKey,        
	 		newAccountPubkey: newKeypair.publicKey,        
			space: 16,        
			lamports: await anchor          
				.getProvider()          				
				.connection
				.getMinimumBalanceForRentExemption(32),        		
			programId: program.programId,      
		})    
	);    

	await anchor.web3.sendAndConfirmTransaction(      
		anchor.getProvider().connection,      
		tx,      
		[wallet.payer, newKeypair]    
	);    

	// READ THE DATA IN THE ACCOUNT    
	await program.methods      
		.foo()      
		.accounts({ someAccount: newKeypair.publicKey })      
		.rpc();  
	});
});
```

程序运行后，我们可以看到它打印出了账户中的数据，其中包含 16 个零字节：

![用于验证交易签名并读取账户余额的签名者输出图。](https://static.wixstatic.com/media/706568_371c2f3187f04177ad78272662d42262~mv2.png/v1/fill/w_740,h_122,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/706568_371c2f3187f04177ad78272662d42262~mv2.png)

当我们传入一个任意地址时，我们需要使用这种账户类型，但是要非常小心数据的使用方式，因为黑客可能能够在一个账户中构建恶意数据，然后将其传递给 Solana 程序。

## 签名者（Signer）

此类型将检查`签名者（Signer）`账户是否签署了交易；它检查签名是否与账户的公钥匹配。

因为签名者也是一个账户，你可以读取签名者的余额或存储在账户中的数据（如果有的话），尽管其主要目的是验证签名。

根据文档（[https://docs.rs/anchor-lang/latest/anchor_lang/accounts/signer/struct.Signer.html](https://docs.rs/anchor-lang/latest/anchor_lang/accounts/signer/struct.Signer.html)），`签名者（Signer）`是一种验证账户是否签署了交易的类型。不会执行其他所有权或类型检查。如果使用了这个类型，就不应尝试访问底层账户数据。

Rust 示例：

```
use anchor_lang::prelude::*;

declare_id!("ETnqC8mvPRyUVXyXoph22EQ1GS5sTs1zndkn5eGMYWfs");#

[program]
pub mod account_types {    
	use super::*;    
	pub fn hello(ctx: Context<Hello>) -> Result<()> {        
		let lamports = ctx.accounts.signer.lamports();        
		let address = &ctx.accounts
			.signer
			.signer_key().unwrap();        
		msg!(
			"hello {:?} you have {} lamports", 
			address, 
			lamports
		);        
		Ok(())    
}}

#[derive(Accounts)]
pub struct Hello<'info> {    
	pub signer: Signer<'info>,
}
```

Typescript：

```
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AccountTypes } from "../target/types/account_types";

describe("account_types", () => {  
	anchor.setProvider(anchor.AnchorProvider.env()); 
 
	const program = anchor.workspace.AccountTypes as Program<AccountTypes>;  

	it("Wrong owner with Account", async () => {    
		await program.methods.hello().rpc();  
	});
});
```

以下是程序的输出：

![用于验证交易签名并读取账户余额的签名者的程序输出图。](https://static.wixstatic.com/media/706568_3eb814a8492a4152bcc3088d4d0f57cb~mv2.png/v1/fill/w_740,h_122,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/706568_3eb814a8492a4152bcc3088d4d0f57cb~mv2.png)

## 程序（Program）

这应该是不言自明的。它向 Anchor 发出信号，表明该账户是一个可执行账户，即一个程序，你可以向其发出跨程序调用。我们一直在使用的是系统程序，尽管以后我们将使用我们自己的程序。

## 了解更多

在我们的以太坊到 Solana 课程中， [学习 Solana](https://www.rareskills.io/solana-tutorial) 开发。