## 记录一个Git使用过程中的小问题

为什么git配置了ssh，添加了私钥，每次push的时候依然需要输入账号密码，有一个原因是应为git远程使用的是http/https协议而不是git协议，可以通过如下代码检查
```shll
git remote -v
origin https://github.com/admin1949/electron-vite-react-template.git (fetch)
origin https://github.com/admin1949/electron-vite-react-template.git (push)
```

此时我们只需要去项目上找到git协议的地址替换便可
```shll
git remote rm origin
git remote add origin git@github.com:admin1949/electron-vite-react-template.git
```
这样我们push的时候就不需要每次都输入密码了

> 参考资料
> - [https://www.jianshu.com/p/ea5ce7b95c73](https://www.jianshu.com/p/ea5ce7b95c73)