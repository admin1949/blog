## 记录一个在electron和bytenode打包过程中遇到的一个问题及其解决方法

1. 环境信息
- win: x64
- electron: "^13.1.2",
- electron-builder: "^22.11.7"
- bytenode: "^1.3.3"

2. 问题描述
- 在上述环境下对electron的主进程使用bytenode代码处理，打包和运行x64版本的时候都表现正常，ia32版本在打包的时候表现正常，在运行时提示错误信息
```js
Error invalid orincompatible cached data rejected...
```
- 我们知道在bytenode打包electron主进程的时候使用的是electron提供的nodejs环境，初步推测是在x64和ia32中electron提供的nodejs版本不一致，
- 分别打包x64和ia32后观察到入口exe文件的大小不相等x64的入口文件为129MB；ia32的入口文件大小为112MB。去bytenode的github上的issus上搜索发现[类似问题](https://github.com/bytenode/bytenode/issues/98)，其中解决问题的方案为使用ia32版本的electron为bytenode使用。
- 使用npm重新安装ia32版本的electron，再次打包，问题解决感谢[此文章](https://blog.niceue.com/front-end-development/install-32-bit-electron-in-a-64-bit-system.html)的作者提供的安装方法

```cmd
npm i --save-dev -arch=ia32 electron // 安装ia32版本的electron
npmi --save-dev -arch=x64 electron // 安装x64版本的electron
```
- 如果以上方案均不能奏效则手动下载当前版本的electron压缩包，这里提供2个待参考的包
```
https://npm.taobao.org/mirrors/electron/13.1.2/electron-v13.1.2-win32-ia32.zip
https://npm.taobao.org/mirrors/electron/13.1.2/electron-v13.1.2-win32-x64.zip
```
对于其他版本的压缩包只需要替换其中的版本号13.1.2即可或者使用下列函数

```js
function getElectronLink(version, arch) {
    return 'https://npm.taobao.org/mirrors/electron/'
        .concat(version)
        .concat('/electron-v')
        .concat(version)
        .concat('-win32-')
        .concat(arch)
        .concat('.zip')
}

getElectronLink('13.1.2', 'ia32');
```

> 参考资料
> - [https://github.com/bytenode/bytenode/issues/98](https://github.com/bytenode/bytenode/issues/98)