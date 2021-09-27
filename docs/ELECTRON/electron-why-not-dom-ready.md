## 记录一个electron开发过程中主窗口一只不显示的场景

在使用electron+vite开发的过程中突然间遇到了electon不能正常引入的问题，仔细排查后发现是使用import语法导致的错误代码如下
```js
import { ipcRenderer } from 'electron'; // 错误，页面加载失败
const { ipcRenderer } = require('electron'); // 正确，页面加载正常
```

修改完成后重启应用，发现一直卡在加载页面，主窗口一直不能显示分析代码发现主窗口第一次显示依赖"dom-ready"事件，以下为示例代码
```js
this.mainWindow.webContents.once('dom-ready', () => {
    this.mainWindow.show();
}
```
仔细排查确实是事件未接收到，于是我使用系统托盘的显示主页面功能（没有配置托盘的情况下，建议直接显示主页面，不监听dom-ready事件）打开主页面发现主页面处于断点状态，一直处于调试状态，去除断点后应用能够正常加载