import {segment} from 'koishi'
import {getDynamic, getVideoInfo} from '../utils/bilibili-info'
import {TEN_THOUSAND, TMP_PATH} from '../constant'
import {downBili, getDownloadUrl} from '../utils/bilibili-core'
import {mkdirIfNotExists} from '../utils/common'
import {FutureParams} from "../types";
import {getBiliGptInputText} from "../utils/bilibili-summary";
import GPT from "../utils/gpt-engine";


export default async function bili(futureParams: FutureParams) {
  const {session, config} = futureParams;
  // koishi机器人 正则匹配
  const urlRex = /(?:https?:\/\/)?www\.bilibili\.com\/[A-Za-z\d._?%&+\-=\/#]*/g;
  const bShortRex = /(http:|https:)\/\/b23.tv\/[A-Za-z\d._?%&+\-=\/#]*/g;
  // 匹配短链接
  const shortMatch = session.content.match(bShortRex);
  // 匹配长链接
  const pcMatch = session.content.match(urlRex);
  // 处理核心： 1. 短链接 2. 长链接 3. 动态
  let url = '';
  // 短号处理
  if (shortMatch) {
    const bShortUrl = session.content.match(bShortRex)[0]
    await fetch(bShortUrl, {
      method: "HEAD"
    }).then(resp => {
      url = resp.url;
    });
  } else if (pcMatch) {
    [url] = pcMatch;
  }
  // 补充https
  url = url.startsWith("https://") ? url : "https://" + url;
  // 动态
  if (url.includes("t.bilibili.com")) {
    // 去除多余参数
    if (url.includes("?")) {
      url = url.substring(0, url.indexOf("?"));
    }
    const dynamicId = /[^/]+(?!.*\/)/.exec(url)[0];
    getDynamic(dynamicId).then(resp => {
      if (resp.dynamicSrc.length > 0) {
        session.send(`识别：哔哩哔哩动态, ${resp.dynamicDesc}`);
        // 使用koishi机器人发送resp.dynamicSrc的图片
        for (let img of resp.dynamicSrc) {
          session.send(img);
        }

      } else {
        session.send(`识别：哔哩哔哩动态, 但是失败！`);
      }
    });
  }
  // 视频信息获取例子：http://api.bilibili.com/x/web-interface/view?bvid=BV1hY411m7cB
  // 请求视频信息
  const videoInfo = await getVideoInfo(url);
  const {title, pic, desc, duration, dynamic, stat, aid, cid, pages} = videoInfo;
  // 视频信息
  let {view, danmaku, reply, favorite, coin, share, like} = stat;
  // 数据处理
  const dataProcessing = data => {
    return Number(data) >= TEN_THOUSAND ? (data / TEN_THOUSAND).toFixed(1) + "万" : data;
  };
  // 格式化数据
  const combineContent =
    `\n点赞：${dataProcessing(like)} | 硬币：${dataProcessing(
      coin,
    )} | 收藏：${dataProcessing(favorite)} | 分享：${dataProcessing(share)}\n` +
    `总播放量：${dataProcessing(view)} | 弹幕数量：${dataProcessing(
      danmaku,
    )} | 评论：${dataProcessing(reply)}\n` +
    `简介：${desc}`;
  let biliInfo = [segment.image(pic), `识别：哔哩哔哩：${title}`, combineContent]
  session.send(biliInfo);
  // 使用Node.js找到当前文件位置
  const currentPath = TMP_PATH + `${session.userId || session.guildId}/`;
  // 下载视频
  await mkdirIfNotExists(currentPath);
  // 下载文件 & 发送
  getDownloadUrl(url)
    .then(data => {
      downBili(`${currentPath}temp`, data.videoUrl, data.audioUrl)
        .then(_ => {
          session.send(segment.video(`file:///${currentPath}temp.mp4`))
        })
        .catch(err => {
          console.error(err);
          session.send("解析失败：可能是哔哩哔哩服务器不稳定导致");
        });
    })
    .catch(err => {
      console.error(err);
      session.send("解析失败：合并视频失败，重试一下！");
    });
  // 总结
  const summary = await getBiliSummary(videoInfo, config.biliSession, config.gptEngineKey);
  console.log("总结：" + summary)
  summary && session.send(summary);
};

/**
 * 哔哩哔哩总结
 * @returns Promise{string}
 * @param videoInfo
 * @param biliSession
 * @param key
 */
async function getBiliSummary(videoInfo, biliSession?, key?): Promise<string>  {
  if (biliSession && key) {
    try {
      const prompt = await getBiliGptInputText(videoInfo, biliSession);
      const gpt = new GPT(key);
      // 暂时不设计上下文
      return await gpt.sendMessage(prompt);
    } catch (err) {
      console.error("总结失败，可能是没有弹幕或者网络问题！\n", err);
      return ""
    }
  } else {
    return ""
  }
}
