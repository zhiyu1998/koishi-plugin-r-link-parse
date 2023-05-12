<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/initialencounter/mykoishi">
    <a href="https://koishi.chat/" target="_blank">
    <img width="160" src="https://koishi.chat/logo.png" alt="logo">
  </a>
  </a>

<h3 align="center">koishi-plugin-r-link-parse</h3>

  <p align="center">
    基于koishi机器人的链接分享解析视频、图片链接/小程序插件，支持：tiktok、bilibili、xhs、acfun！
  </p>
</div>


## 📖 前 言
我的原插件：云崽机器人-[R插件](https://gitee.com/kyrzy0416/rconsole-plugin)的大部分核心功能都会转移到这里
> 我深知云崽插件的弊端，无法更好的支持我的插件，决定不再更新，转向koishi，其中一个原因是TypeScript > JavaScript，因为它有更好的类型检测

## 👏 功能介绍

已经实现但还未加入的功能：
- [ ] 支持TikTok
- [ ] 支持Twitter

<details>
  <summary>展开功能</summary>
  <summary>
    <img src="https://github.com/zhiyu1998/nonebot-plugin-resolver/blob/master/img/example.png" alt="图片描述" width="100%" height="100%">
  </summary>
  <summary>
    <img src="https://github.com/zhiyu1998/nonebot-plugin-resolver/raw/master/img/example4.png" alt="图片描述" width="100%" height="100%">
  </summary>
  <summary>
    <img src="https://github.com/zhiyu1998/nonebot-plugin-resolver/blob/master/img/example2.png" alt="图片描述" width="100%" height="100%">
  </summary>
  <summary>
    <img src="https://github.com/zhiyu1998/nonebot-plugin-resolver/blob/master/img/example3.png" alt="图片描述" width="100%" height="100%">
  </summary>
  <summary>
    <img src="https://github.com/zhiyu1998/nonebot-plugin-resolver/blob/master/img/example5.png" alt="图片描述" width="100%" height="100%">
  </summary>
</details>

## 🤓 Q&A

<details>
  <summary>FFmpeg支持</summary>
  <blockquote>
      ubuntu sudo apt-get install ffmpeg
      <br>
      其他linux参考（群友推荐）：https://gitee.com/baihu433/ffmpeg
      <br>
      Windows 参考：https://www.jianshu.com/p/5015a477de3c
  </blockquote>
</details>

<details>
  <summary>GPT引擎支持（主要用于哔哩哔哩总结）</summary>
  <summary>目前也没有比较好的解决方案，如果使用官方每次都要过期都要去复制一下accesskey（其实已经写好了，只是没用这个解决方案），如果你有解决方案欢迎issue</summary>
  <summary>在koishi面板主要填写两个内容：1. 哔哩哔哩session 2. 国内软件提供的key（1块钱一个月）</summary>
  <a href="https://www.bilibili.com/read/cv12349604">点击进入session获取方法</a>
  <br>
  <a href="https://ai.aigcfun.com/">点击进入国内GPT解决方案</a>
  <br>
  <summary>有了这两个就可以去面板填写就可以使用总结了，当然如果你不用不填也没关系</summary>
</details>

## 🦸‍♀️ 未来开发的功能
- [ ] 支持更多的链接解析

## 🌸 贡 献
欢迎来贡献代码

<a href="https://github.com/zhiyu1998/koishi-plugin-r-link-parse/graphs/contributors">
<img src="https://contrib.rocks/image?repo=zhiyu1998/koishi-plugin-r-link-parse&max=1000" />
</a>
