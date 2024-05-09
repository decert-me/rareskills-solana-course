# Rust 的不寻常语法

更新日期：Feb 19

![Rust: The Weird Parts](https://static.wixstatic.com/media/706568_0ea13ed362d34a8cab96a2198c15d40f~mv2.jpg/v1/fill/w_740,h_416,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/706568_0ea13ed362d34a8cab96a2198c15d40f~mv2.jpg)

来自 Solidity 或 Javascript 背景的读者可能会觉得 Rust 对`&`、`mut`、`<_>`、`unwrap()`和`?`的使用和语法很奇怪（甚至丑陋）。本章将解释这些语法的含义。

如果一切没有马上理解，不要担心。如果你忘记了语法定义，随时可以回到本教程。

## **所有权和借用（引用`&`和解引用运算符`*`）：**

### Rust 复制类型

要理解`&`和`*`，我们首先需要了解 Rust 中的“复制类型”。复制类型是一个数据类型，其大小足够小，使得复制值的开销微不足道。以下值是复制类型：

- 整数、无符号整数和浮点数
- 布尔值
- 字符

它们之所以是“复制类型”，是因为它们具有固定的小尺寸。

另一方面，向量、字符串和结构体可以是任意大的，因此它们不是复制类型。

### Rust 为什么区分复制类型和非复制类型

考虑以下 Rust 代码：

```rust
pub fn main() {
	let a: u32 = 2;
	let b: u32 = 3;
	println!("{}", add(a, b)); // a and b a are copied to the add function

	let s1 = String::from("hello");
	let s2 = String::from(" world");

	// if s1 and s2 are copied, this could be a huge data transfer
  // if the strings are very long
	println!("{}", concat(s1, s2));
}

// implementations of add() and concat() are not shown for brevity
// this code does not compile
```

在代码的第一部分中，将`a`和`b`相加时，只需要从变量复制 64 位数据到函数（32 位* 2 个变量）。

然而，在字符串的情况下，*我们并不总是提前知道要复制多少数据*。如果字符串长度为 1GB，程序运行速度将会受到严重影响。

Rust 希望我们明确表达希望如何处理大数据。它不会像动态语言那样在后台复制它。

因此，当我们做一些简单的事情，比如*将字符串分配给一个新变量*时，Rust 会做一些很多人觉得意想不到的事情，我们将在下一节中看到。

## Rust 中的所有权

对于非复制类型（字符串、向量、结构体等），一旦将值分配给变量，该变量就“拥有”它。所有权的影响将很快展示。

以下代码将无法编译。注释中有解释：

```rust
// Example of changing ownership on a non-copy datatype (string)
let s1 = String::from("abc");

// s2 becomes the owner of `String::from("abc")`
let s2 = s1;

// The following line will fail to compile because s1 can no longer access its string value.
println!("{}", s1);

// This line compiles successfully because s2 now owns the string value.
println!("{}", s2);
```

要修复上面的代码，我们有两个选项：使用`&`运算符或克隆`s1`。

### 选项 1：`s2`查看（`view`）`s1`

在下面的代码中，请注意`s1`前的符号`&`：

```rust
pub fn main() {
	let s1 = String::from("abc");

	let s2 = &s1; // s2 can now view `String::from("abc")` but not own it

	println!("{}", s1); // This compiles, s1 still holds its original string value.
	println!("{}", s2); // This compiles, s2 holds a reference to the string value in s1.
}
```

如果我们希望另一个变量“查看”该值（即获得只读访问权限），我们使用`&`运算符。

**为了让另一个变量或函数查看一个拥有的变量，我们在其前面加上`&`。**

将`&`视为非复制类型的“只读”模式可能有所帮助。我们称之为“只读”的技术术语是**借用**。

### 选项 2：克隆`s1`

要了解如何克隆一个值，请考虑以下示例：

```rust
fn main() {
    let mut message = String::from("hello");
    println!("{}", message);
    message = message + " world";
    println!("{}", message);
}
```

上面的代码将按预期打印“hello”，然后“hello world”。

然而，如果我们添加另一个变量`y`来查看`message`，代码将不再编译：

```rust
// Does not compile
fn main() {
    let mut message = String::from("hello");
    println!("{}", message);
    let mut y = &message; // y is viewing message
    message = message + " world";
    println!("{}", message);
    println!("{}", y); // should y be "hello" or "hello world"?
}
```

Rust 不接受上面的代码，因为在查看`message`时无法重新分配该变量。

如果我们希望`y`能够复制`message`的值而不会干扰后续的`message`，我们可以选择克隆它：

```rust
fn main() {
    let mut message = String::from("hello");
    println!("{:?}", message);
    let mut y = message.clone(); // change this to clone
    message = message + " world";
    println!("{:?}", message);
    println!("{:?}", y);
}
```

上面的代码将打印：

```
hello
hello world
hello
```

## 所有权仅适用于非复制类型

如果我们用一个复制类型（如整数）替换我们的字符串（这是一个非复制类型），我们将不会遇到上述任何问题。Rust 将愉快地复制 **复制类型**，因为开销微不足道。

```rust
let s1 = 3;

let s2 = s1;

println!("{}", s1);
println!("{}", s2);
```

## `mut`关键字

在 Rust 中，默认情况下，所有变量都是不可变的，除非指定了`mut`关键字。

以下代码将无法编译：

```rust
pub fn main() {
	let counter = 0;
	counter = counter + 1;

	println!("{}", counter);
}
```

如果我们尝试编译上面的代码，将会得到以下错误：

![Rust mutability compilation error](https://static.wixstatic.com/media/935a00_9f8e31ed1b7c4262bc1aad799e83067a~mv2.png/v1/fill/w_740,h_225,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/935a00_9f8e31ed1b7c4262bc1aad799e83067a~mv2.png)

幸运的是，如果你忘记包含`mut`关键字，编译器通常会明确指出错误。以下代码插入了`mut`关键字，使代码能够编译：

```rust
pub fn main() {
	let mut counter = 0;
	counter = counter + 1;

	println!("{}", counter);
}
```

## Rust 中的泛型：`< >`语法

让我们考虑一个接受*任意类型*值并返回一个包含该值的字段`foo`的结构体的函数。与其为每种可能的类型编写一堆函数，不如使用*泛型*。

下面的示例结构体可以是`i32`或`bool`。

```rust
// derive the debug trait so we can print the struct to the console
#[derive(Debug)]
struct MyValues<T> {
    foo: T,
}

pub fn main() {
    let first_struct: MyValues<i32> = MyValues { foo: 1 }; // foo has type i32
    let second_struct: MyValues<bool> = MyValues { foo: false }; // foo has type bool

    println!("{:?}", first_struct);
    println!("{:?}", second_struct);
}
```

这很方便的原因在于：当我们在 Solana 中“存储”值时，如果要存储数字、字符串或其他内容，我们希望代码非常灵活。

如果我们的结构体有多个字段，用于参数化类型的语法如下：

```rust
struct MyValues<T, U> {
    foo: T,
	bar: U,
}
```

泛型在 Rust 中是一个非常庞大的主题，因此我们在这里并没有给出完整的讨论。然而，这足以让大多数 Solana 程序有一个很好的理解。

## Option、枚举和解引用`*`

为了展示选项和枚举的重要性，让我们考虑以下示例：

```rust
fn main() {
	let v = Vec::from([1,2,3,4,5]);

	assert!(v.iter().max() == 5);
}
```

该代码无法编译，出现以下错误：

```
6 |     assert!(v.iter().max() == 5);
  |                               ^ expected `Option<&{integer}>`, found integer
```

由于向量`v`可能为空，`max()`的输出不是整数。

### Rust Option

为了处理这种情况，Rust 返回一个 Option。Option 是一个枚举，可以包含预期值，也可以包含“没有内容”的特殊值。

要将选项转换为底层类型，我们使用`unwrap()`。如果我们收到“没有内容”，`unwrap()`将导致 panic，因此我们应该仅在希望发生 panic 的情况下使用它，或者我们确信不会得到空值。

为了使代码按预期工作，我们可以执行以下操作：

```rust
fn main() {
	let v = Vec::from([1,2,3,4,5]);

	assert!(v.iter().max().unwrap() == 5);
}
```

### 解引用`*`运算符

但它仍然无法工作！这次我们得到一个错误

```
19 |     assert!(v.iter().max().unwrap() == 5);
   |                                     ^^ no implementation for `&{integer} == {integer}`
```

等式左侧的术语是整数的*视图*（即&），右侧的术语是实际整数。

要将整数的“视图”转换为常规整数，我们需要使用“解引用”操作。这是当我们在值前面加上`*`运算符时发生的。

```rust
fn main() {
	let v = Vec::from([1,2,3,4,5]);

	assert!(*v.iter().max().unwrap() == 5);
}
```

由于数组的元素是复制类型，解引用运算符将默默地复制`max().unwrap()`返回的 5。

你可以将`*`视为在不干扰原始值的情况下“撤消”`&`。

对非复制类型使用`*`运算符是一个复杂的问题。目前，你需要知道的是，如果你收到一个复制类型的视图（借用），并且需要将其转换为“正常”类型，请使用**运算符。

## Rust 中的 Result 与 Option

当可能收到“空”内容时，我们使用 option。当我们可能收到错误时，我们使用`Result`（与`Result` Anchor 程序一直返回的相同`Result`）。

### Result 枚举

Rust 中的`Result<T, E>`枚举用于表示函数的操作可能成功并返回类型 T 的值（一种通用类型），或失败并返回类型 E（通用错误类型）的错误。它旨在处理可能导致成功结果或错误条件的操作。

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

在 Rust 中，`?`运算符用于`Result<T, E>`枚举，而`unwrap()`用于`Result<T, E>`和`Option<T>`枚举。

## `?`运算符

`?`运算符只能用于返回`Result`的函数，因为它是一种语法糖，用于返回`Err`或`Ok`。

`?`运算符用于从`Result<T, E>`枚举中提取数据，并在函数执行成功时返回`OK(T)`变体，或者在出现错误时返回错误`Err(E)`。`unwrap()`方法的工作方式相同，但适用于`Result<T, E>`和`Option<T>`枚举，但是由于其可能导致程序崩溃，应谨慎使用。

现在，请考虑以下代码：

```rust
pub fn encode_and_decode(_ctx: Context<Initialize>) -> Result<()> {
    // Create a new instance of the `Person` struct
    let init_person: Person = Person {
        name: "Alice".to_string(),
        age: 27,
    };

    // Encode the `init_person` struct into a byte vector
    let encoded_data: Vec<u8> = init_person.try_to_vec().unwrap();

    // Decode the encoded data back into a `Person` struct
    let data: Person = decode(_ctx, encoded_data)?;

    // Logs the decoded person's name and age
    msg!("My name is {:?}, I am {:?} years old.", data.name, data.age);

    Ok(())
}

pub fn decode(_accounts: Context<Initialize>, encoded_data: Vec<u8>) -> Result<Person> {
    // Decode the encoded data back into a `Person` struct
    let decoded_data: Person = Person::try_from_slice(&encoded_data).unwrap();

    Ok(decoded_data)
}
```

`try_to_vec()`方法将一个结构编码为字节向量，并返回一个`Result<T, E>`枚举，其中 T 是字节向量，而`unwrap()`方法用于从`OK(T)`中提取字节向量的值。如果该方法无法将结构转换为字节向量，程序将崩溃。

## 通过 RareSkills 了解更多

本教程是我们免费的 [Solana 课程](https://www.rareskills.io/solana-tutorial)的一部分。