# 如何优雅的使用导航栏背景图

使用vw来表示高度来实现导航栏高度自动随页面宽度适配  
例如我们现在有一张1920*180的图片想作为导航栏的背景图，则css样式应该为宽度100vw，高度为(180/1920) * 100 = 9.375vw

```css
    .nav{
        width: 100vw;
        height: 9.375;
        background-image: url(/path/to/nav/pic.png)
    }
```

此时考虑最小宽度，不能让页面宽度过小导致高度异常

```css
    .nav{
        width: 100vw;
        height: 9.375vw;
        background-image: url(/path/to/nav/image.png);
        min-width: 1000px;
    }
```

因为导航栏容器的宽高是按照背景图的宽高比来设计的，所以图片总是能够完整的显示

> 参考资料
>
> - bilibili首页头部导航栏的设计 [https://www.bilibili.com/](https://www.bilibili.com/)

