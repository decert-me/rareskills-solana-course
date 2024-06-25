# A Solana Course By Rareskills

This Solana course is designed for engineers with a beginner or intermediate background in Ethereum or EVM development to get up to speed quickly with Solana program development.

[Skip to Course](#solana-course)


The difficulty engineers face when learning blockchain programming for the first time is they have to learn a new computation model, learn a new language, and learn a new development framework.

If you have already developed on an Ethereum or Ethereum compatible blockchain, you already have a pretty good idea of the computation model and can focus on the language and the framework instead.

Our goal is to leverage your past experience with Ethereum to learn Solana faster.  It is not necessary for you to start from zero.

## Solana has a different model of how to run a blockchain than Ethereum does, but not too different.

Rather than jump into explaining all the differences, this tutorial attempts to compress key information into the following paradigm:



<img src="/src/assets/1.svg" alt="Alt text" width="100" height="100" />

“I know how to do X in Ethereum, how do I do X in Solana?

And under certain circumstances,

<img src="/src/assets/1.svg" alt="Alt text" width="100" height="100" />

“I cannot do X in Solana, why is that?”

We’re taking this approach because it’s far easier to develop a mental model for something new if you are able to map over concepts from a mental model you already have.



If you’re like most programmers, Solidity was probably easy to learn for you. It’s nearly one-to-one with Javascript. However, designing smart contracts was probably a challenge because it’s quite unlike other applications.



We want you to come away with an understanding of how Solana and Ethereum are similar, as well as the key ways in which they differ.



(Note: We talk about Ethereum often throughout this series, but all the ideas are applicable for other EVM-compatible blockchains, such as Avalanche and Polygon).

## All blockchains are decentralized state machines

Solana does have a radically different architecture, but it’s fundamentally doing the same thing Ethereum is doing: 



![blockchain nodes icon](https://static.wixstatic.com/media/a133f4_870a6a75603e40a7b8aaa7f73dc313bc~mv2.png/v1/fill/w_152,h_120,al_c,q_95,enc_auto/a133f4_870a6a75603e40a7b8aaa7f73dc313bc~mv2.png)

It is a distributed state machine that undergoes transitions based on signed transactions where the cost of  execution is paid in the ecosystem’s native token (ETH for Ethereum, and SOL for Solana).



![solana and ethereum logos](https://static.wixstatic.com/media/a133f4_af6a587fc43444a08974ca01cf7ca265~mv2.png/v1/fill/w_152,h_120,al_c,q_95,enc_auto/solethbooth.png)

Our goal is to leverage your EVM knowledge as a springboard for your Solana development journey.


Consider this analogy: 

If a frontend web developer and a backend API/Database engineer both decided to learn mobile app development, most engineers would say the frontend web developer has a massive head start over the backend engineer, even though web development and mobile development are not the same field even if the dev experiences can be very similar with some toolchains. 

Using that line of reasoning, we at RareSkills believe that a competent EVM smart contract engineer should be able to pick up Solana faster than an engineer who hasn’t programmed a blockchain before. 



This course is designed to lean into that advantage.

## We start with the aspects of Solana that are similar to Ethereum

If you look at our outline, you’ll see that it seems like we cover more intermediate subjects (by Solidity standards) like gas usage before we cover more fundamental things (like how to update storage variables). This is by design.



### Start with the EVM's equivalent in Solana

We want to lead with the topics where we can lean on a one-to-one mapping from a concept in Ethereum. We assume you know storage is an important subject and can wait a little bit before we dive into it.



### Ease your transition with bite-sized exercises

It’s already going to feel awkward using a new framework. Giving you a bunch of bite-sized exercises that rely on a familiar mental model will ease the transition. Using both a new framework and a new mental model at the same time is a turn-off. We want you to experience a lot of small victories early on so you can hit the more unfamiliar aspects with some momentum.


### An active learning journey

We have included exercises throughout the tutorial, labeled with the bold word **Exercise**. These will be hands-on applications of the knowledge you just gained. **You should do them! Active learning always beats passive reading.**



### We expect you’re familiar with Solidity

If you’ve never done smart contract development, this tutorial isn’t written directly to you. We assume you know Solidity at a beginner-intermediate level. If the Solidity examples feel unfamiliar, practice our [free Solidity tutorial](https://www.rareskills.io/learn-solidity) for a week, then come back here.

## How much Rust should I know?

Not a lot.

Rust is a huge language with enough syntax to dwarf most other popular languages. It would be a mistake to “get good at Rust first” before learning Solana. You might be on a detour that could last several months!

This course focuses only on the minimum Rust you need to know.

If you feel uncomfortable diving into a language you haven’t used before, complete the free videos and exercises in our Rust Bootcamp and leave it at that. Our reviewers have completed the exercises here without going through the Rust Bootcamp first, so we think we’ve successfully balanced teaching just the right amount of Rust in this course.

## Why 60 days?

We have found learners stay most engaged when information is broken down into the most atomic bits possible. If tutorials are too long, only the most interested readers will complete them. After constraining the tutorials to be as atomic as possible, we estimate that about sixty of them are necessary to have a comfortable grasp fo the Solana development ecosystem.

We have beta tested these tutorials and find that the reviewers are able to comfortably complete them in less than an hour. Not having to expend too much effort each day makes studying Solana more sustainable and reduces the likelihood of burnout.

Motivated readers can complete the course a lot faster if desired.

Readers who are only casually interested in Solana can consume the course at a more leisurely pace without expending too much vaulable time and energy on any given day.

Our course is designed so that you can quickly refer to something you need when programming an application. For example, if you forgot how to get the current time in Solana, you’ll easily be able to jump to the appropriate section and copy and paste the code you need.

Please note that the code in this article is MIT licensed, but copying, duplicating, or creating derivatives works of this course without permission is strictly prohibited.

## Acknowledgements

We would like to thank [Faybian Byrd](https://www.linkedin.com/in/faybianbyrd/), Devtooligan, Abhi Gulati, for their careful review and feedback of this work.


## Solana Course

### MODULE 1 | Introductory Topics
---
#### Day 1 [Hello World (and troubleshooting Solana installation)](./chapter_1.md)

#### Day 2 [ Function arguments, math, and arithmetic overflow](./chapter_2.md)

#### Day 3 [Anchor function magic and the Interface Definition Language](./chapter_3.md)

#### Day 4 [Solana reverts, errors, and basic access control](./chapter_4.md)

#### Day 5 [Where is the constructor? About anchor deploy](./chapter_5.md)


### MODULE 2 | The minimum Rust you need to know

Day 8-10 are not critical, they only explain some syntax which is likely unfamiliar to most readers. However, you can write Solana programs and follow along while treating the unusual syntax as boilerplate. Feel free to skim over those days.

#### Day 6 [Solidity Translations to Rust and Solana](./chapter_6.md)

#### Day 7 [The unusual syntax of Rust](./chapter_7.md)

#### Day 8 [Understanding function-like macros in Rust](./chapter_8.md)

#### Day 9 [Rust Structs and Attribute-like and Custom Derive Macros](./chapter_9.md)

#### Day 10 [Translating Solidity function visibility and contract inheritance to Solana](./chapter_10.md)


### MODULE 3 | Important System-level Information in Solana

#### Day 11 [Block variables in Solana: block.timestamp and block.number and others](./chapter_11.md)

#### Day 12 [Beyond the block: sysvars](./chapter_12.md)

#### Day 13 [Solana logs, events, and transaction history](./chapter_13.md)

#### Day 14 [tx.origin, msg.sender, and onlyOwner in Solana](./chapter_14.md)

#### Day 15 [Transaction fees and compute units](./chapter_15.md)


### MODULE 4 | Accounts and Storage in Solana

Accounts are one of the most complicated topics in Solana development because they are considerably more flexible than Ethereum storage variables., so we go over them slowly. Each tutorial will progressively reinforce concepts, so don’t worry if all the new information doesn’t stick right away.

#### Day 16 [Accounts in Solana](./chapter_16.md)

#### Day 17 [Writing to storage](./chapter_17.md)

#### Day 18 [Reading Accounts from Typescript — an alternative to public variables and view functions](./chapter_18.md)

#### Day 19 [Creating mappings and nested mappings in Solana](./chapter_19.md)

#### Day 20 [Cost of storage, maximum storage size, and account resizing](./chapter_20.md)

#### Day 21 [Reading an account balance in Rust: address(account).balance in Solana](./chapter_21.md)

#### Day 22 [More differences: modifiers, view pure, payable, and fallback in Solana](./chapter_22.md)

#### Day 23 [Building a payment splitter: “payable” and “msg.value” in Solana](./chapter_23.md)

#### Day 24 [Authorizing various wallets to write to an account: "Pranking tx.origin"](./chapter_24.md)

#### Day 25 [PDA vs Keypair Accounts](./chapter_25.md)

#### Day 26 [Understanding Account Ownership in Solana: Transferring SOL out of a PDA](./chapter_26.md)

#### Day 27 [init_if_needed and the Reinitialization Attack](./chapter_27.md)

#### Day 28 [Multicall in Solana: Batching Transactions](./chapter_28.md)

#### Day 29 [Owner vs Authority](./chapter_29.md)

#### Day 30 [Deleting Accounts and Closing Programs](./chapter_30.md)

#### Day 31 [Account types in #[derive(Accounts)]](./chapter_31.md)

#### Day 32 [Reading Another Anchor Program’s Account Data On Chain](./chapter_32.md)

#### Day 33 [Cross Program Invocation](./chapter_33.md)