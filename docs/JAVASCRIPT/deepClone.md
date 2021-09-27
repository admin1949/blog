# 深复制函数
1. 不考虑数据内的函数，正则表达式，undefined的值的话可以使用JSON.stringify和JSON.parse处理一次

   1. 特殊情况，undefined的值会被舍弃
   2. 函数类型的值会被舍弃
   3. 正则表达式的值会被认为是一个空对象
   4. 如果存在循环引用则会抛出异常
   5. Date对象会被处理成时间戳数字

2. 初级版本，自定义deepClone函数，递归调用自生实现数据的深赋值

   1. 使用Object.prototype.toString.call的工具函数判断当前值的类型

      ```javascript
      function getType(value) {
          return Object.prototype.toString.call(value);
      }
      
      getType(); // [object Undefined]
      getType(1); // [object Number]
      getType(null); // [object Null]
      getType(false); // [object Boolean]
      getType('1'); // [object String]
      getType(Symbol('test')) // [object Symbol]
      getType(/test/); // [object RegExp]
      getType(() => {}); // [object Function]
      getType({test: 1}); // [object Object]
      getType([1]); // [object Array]
      getType(new Date()); // [object Date]
      
      
      ```

   2. 初级版本如下(未考虑到循环引用)

      ```javascript
      function getType(value) {
          return Object.prototype.toString.call(value);
      }
      
      function deepClone(target) {
          let res;
          switch(getType(target)) {
              case '[object Undefined]':
              case '[object Number]':
              case '[object Null]':
              case '[object Boolean]':
              case '[object String]':
              case '[object Symbol]':
              case '[object Function]':
                  return target;
              case '[object Date]':
                  return new Date(target.getTime());
              case '[object RegExp]': // 正则和函数暂不考虑
              case '[object Function]':
                  return target;
              case '[object Object]':
                  res = {};
                  for(const key in target) {
                      res[key] = deepClone(target[key]);
                  }
                  return res;
              case '[object Array]':
                  res = Array.from(target, (item) => {
                      return deepClone(item);
                  });
                  return res;
              default:
                  return target;
          }
      }
      ```

   3. 初级版本存在问题

      循环引用，就会进入死循环，最终抛出异常

      ```javascript
      const a = {};
      a.a = a;
      deepClone(a) // Uncaught RangeError: Maximum call stack size exceeded
      ```

      对象共享

      ```javascript
      const value = { 
      	a: 1,
          b: 2,
      }
      const target = { test1: value, test2: value }; // 从语义分析，target.test1和target.test2共同指向的一个对象
      target.test1.a = 3;
      console.log(target.test2.a) // 3
      const cloend = deepClone(target);
      cloend.test1.a = 5;
      console.log(cloend.test2.a) // 5
      ```

      改造以兼容循环引用和对象共享

      ```javascript
      function deepClone(target, parents = new Map()) {
          let res;
          switch(getType(target)) {
              case '[object Undefined]':
              case '[object Number]':
              case '[object Null]':
              case '[object Boolean]':
              case '[object String]':
              case '[object Symbol]':
              case '[object Function]':
                  return target;
              case '[object Date]':
                  return new Date(target.getTime());
              case '[object RegExp]': // 正则和函数不处理
              case '[object Function]':
                  return target;
              case '[object Object]':
                  res = {};
                  parents.set(target, res);
                  for(const key in target) {
                      res[key] = parents.get(target[key])
                      	|| deepClone(target[key], parents);
                  }
                  return res;
              case '[object Array]':
                  parents.set(target, res);
                  res = Array.from(target, (item) => {
                      if (parents.get(item)) {
                          return parents.get(item);
                      }
                      return deepClone(item, parents);
                  });
                  return res;
              default:
                  return target;
          }
      }
      ```
      