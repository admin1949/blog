## 迭代器与生成器

迭代协议分为**可迭代协议**和**迭代器协议**

## 可迭代协议

**可迭代协议**允许JavaScript对象定制他们的迭代行为，例如在一个for..for解构中那些值可以被便利到  
要想成为**可迭代**对象，则该对象必须实现 **@@iterator** 方法。这意味着它或者它的原型链上必须有一个 **@@iterator** 属性，可以通过常量 **Symbol.iterator**访问的属性

## 迭代器协议

只有实现了一个拥有一下语义的 **next()** 方法时，一个对象才能成为迭代器
| 属性 | 值 |
| -- | -- |
| next| 一个无参函数返回值应当拥有一下2个值 <br/> done（boolean）当前迭代器是否迭代完毕为true是value属性可以忽略<br/> value（any）迭代器返回的任何JavaScript值 done为true时可以忽略<br/> next必须返回一个对象，如果返回一个非对象则会抛出一个 **TypeError**异常（"iterator.next() returned a non-object value"） |

### 自定义可迭代对象
根据迭代器协议我们可以实现一个自己的可迭代对象
```js
var myIterable = {
    [Symbol.iterator]: function () {
        var value = [1, 2, 3];
        var index = 0;
        return {
            next: function () {
                if (index < value.length) {
                    return {
                        done: false,
                        value: value[index++],
                    }
                }
                return {
                    done: true,
                    value: undefined,
                }
            }
        }
    }
}
[...myIterable]; // [1, 2, 3]
```
## 生成器函数 Generator
为了方便的定义迭代器，JavaScript为我们提供了生成器函数 **function\***

```js
function* makeIterator(start, end, step =1) {
 for(let i = start; i < end; i += step) {
     yield i;
 }
}
var myIteratorDemo = makeIterator(0, 4, 1);
[...myIteratorDemo]; // [0, 1, 2, 3]

```

## 迭代器的自动执行机
常见的 **for..of** 和 **...** 扩展运算符都是迭代器的自动执行机，如下所示，我们实现一个**for..of**
```js
function forOf(object, cb) {
    var iterator = object[Symbol.iterator]();
    
    function next() {
        var res = iterator.next();
        if (res.done) {
            return res.value;
        }
        cb(res.value);
        next();
    }
    next();
}
var testObj = {
    *[Symbol.iterator]() {
        yield 1;
        yield 2;
        yield 3;
    }
}

forOf(testObj, (data) => {
    console.log(data);
})
/**
 * console
 * 1
 * 2
 * 3
 */
```

## 迭代器的异步执行机
上面的**for..of**代码中我们可以通过控制next函数的执行时机来控制当前的执行状态，如我们可以改写为
```js
function forOf(object, cb) {
    var iterator = object[Symbol.iterator]();
    
    function next() {
        var res = iterator.next();
        if (res.done) {
            return res.value;
        }
        cb(res.value);
        setTimeout(next, 1000)
    }
    next();
}
var testObj = {
    *[Symbol.iterator]() {
        yield 1;
        yield 2;
        yield 3;
    }
}

forOf(testObj, (data) => {
    console.log(data);
})
/**
 * 每隔1000ms打印一次
 * 1
 * 2
 * 3
 */
```
这样子就会每隔1000ms才会执行一次

## 迭代器+Promise
我们知道Promise可以通过then方法优雅的实现异步，如果我们在生成函数中通过yield一个Promise对象，让迭代器的自动执行机来包装then函数，控制执行时机，代码如下
```js
function* demo() {
    yield createPromise();
    console.log(1);
    yield createPromise();
    console.log(2);
    yield createPromise();
    console.log(3);
}

function createPromise() {
    return new Promise((res) => {
        setTimeout(() => res(), 1000);
    })
}


function runPromiseGenerator(fn) {
    var gen = fn();

    function next() {
        var res = gen.next();
        if (res.done) {
            return res.value;
        }
        
        res.value.then(function () {
            next();
        })
    }
    next();
}

runPromiseGenerator(demo);
/**
 * 每隔1000ms打印一次
 * 1
 * 2
 * 3
 */
```

## 高级生成器 Generator
上述代码帮我们自动执行迭代器，并等待promise执行，但是有一个问题就是不能得到promise执行完成的返回值  
高级生成器的**next**函数可以接收一个参数用于改变当前生成器的内部状  
Generator + 基于Promise的自动执行控制可以让我们更方便的使用异步  
```js
function* demo() {
    const res1 = yield createPromise(1);
    console.log(res1);
    const res2 = yield createPromise(2);
    console.log(res2);
    const res3 = yield createPromise(3);
    console.log(res3);
}

function createPromise(val) {
    return new Promise((res) => {
        setTimeout(() => res(val), 1000);
    })
}


function runPromiseGenerator(fn) {
    var gen = fn();

    function next(data) {
        var res = gen.next(data);
        if (res.done) {
            return res.value;
        }
        
        res.value.then(function (data) {
            next(data);
        })
    }
    next();
}

runPromiseGenerator(demo);
/**
 * 每隔1000ms打印一次
 * 1
 * 2
 * 3
 */
```

不过在ES7中async函数已经帮我们整理好了**Generator基于Promise的自动执行控制语法糖**并提供了更好的流程控制、代码语义，类型推断、异常处理

```js
async function demo() {
    const res1 = await createPromise(1);
    console.log(res1);
    const res2 = await createPromise(2);
    console.log(res2);
    const res3 = await createPromise(3);
    console.log(res3);
}
function createPromise(val) {
    return new Promise((res) => {
        setTimeout(() => res(val), 1000);
    })
}

demo();
```
>参考资料
> - [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#iterable](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Iteration_protocols#iterable)
> - [https://www.cnblogs.com/libin-1/p/6917097.html](https://www.cnblogs.com/libin-1/p/6917097.html)