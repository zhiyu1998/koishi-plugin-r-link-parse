import { segment } from 'koishi'
import axios from 'axios'
import _ from 'lodash'
import {
  COMMON_USER_AGENT,
  DIVIDING_LINE,
  DY_TYPE_MAP,
  HELP_DOC,
  TMP_PATH,
  DY_INFO,
  DY_TOUTIAO_INFO,
  DY_COMMENT
} from "../constant";
import { FutureParams } from "../types";
import * as aBogus from "../utils/a-bogus.cjs";
import { downloadVideo, retryAxiosReq } from "../utils/common";


export default async function douyin(futureParams: FutureParams) {
  const { session, config } = futureParams;
  const urlRex = /(http:|https:)\/\/v.douyin.com\/[A-Za-z\d._?%&+\-=\/#]*/g;
  const douUrl = urlRex.exec(session.content.trim())[0];

  const res = await douyinRequest(douUrl);
  // 当前版本需要填入cookie
  if (_.isEmpty(config.dyCookie)) {
    await session.send(`检测到没有Cookie，无法解析抖音${ HELP_DOC }`);
    return;
  }
  const douId = /note\/(\d+)/g.exec(res)?.[1] || /video\/(\d+)/g.exec(res)?.[1];
  // 以下是更新了很多次的抖音API历史，且用且珍惜
  // const url = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${ douId }`;
  // const url = `https://www.iesdouyin.com/aweme/v1/web/aweme/detail/?aweme_id=${ douId }&aid=1128&version_name=23.5.0&device_platform=android&os_version=2333`;
  // 感谢 Evil0ctal（https://github.com/Evil0ctal）提供的header 和 B1gM8c（https://github.com/B1gM8c）的逆向算法X-Bogus
  const headers = {
    "Accept-Language": "zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2",
    "User-Agent": COMMON_USER_AGENT,
    Referer: "https://www.douyin.com/",
    cookie: config.dyCookie,
  };
  const dyApi = DY_INFO.replace("{}", douId);
  // a-bogus参数
  const abParam = aBogus.generate_a_bogus(
    new URLSearchParams(new URL(dyApi).search).toString(),
    headers["User-Agent"],
  );
  // const param = resp.data.result[0].paramsencode;
  const resDyApi = `${ dyApi }&a_bogus=${ abParam }`;
  headers['Referer'] = `https://www.douyin.com/video/${ douId }`
  // 定义一个dy请求
  const dyResponse = () => axios.get(resDyApi, {
    headers,
  });
  // 如果失败进行3次重试
  try {
    const data = await retryAxiosReq(dyResponse)
    // logger.info(data)
    const item = await data.aweme_detail;
    // await saveJsonToFile(item);
    // 如果为null则退出
    if (item == null) {
      await session.send("R插件无法识别到当前抖音内容，请换一个试试！");
      return;
    }
    const urlTypeCode = item.aweme_type;
    const urlType = DY_TYPE_MAP[urlTypeCode];
    // 核心内容
    if (urlType === "video") {
      // logger.info(item.video);
      // 多位面选择：play_addr、play_addr_265、play_addr_h264
      const { play_addr: { uri: videoAddrURI }, duration, cover } = item.video;
      // 进行时间判断，如果超过时间阈值就不发送
      const dyDuration = Math.trunc(duration / 1000);
      const durationThreshold = config.maxDuration;
      // 一些共同发送内容
      let dySendContent = `识别：抖音，${ item.author.nickname }\n📝 简介：${ item.desc }`;
      if (dyDuration >= durationThreshold) {
        // 超过阈值，不发送的情况
        // 封面
        const dyCover = cover.url_list?.pop();
        // logger.info(cover.url_list);
        dySendContent += `\n
                    ${ DIVIDING_LINE.replace('{}', '限制说明') }\n当前视频时长约：${ Math.trunc(dyDuration / 60) }分钟，\n大于管理员设置的最大时长 ${ durationThreshold / 60 } 分钟！`;
        await session.send([segment.image(dyCover), dySendContent]);
        // 如果开启评论的就调用
        await douyinComment(futureParams, douId, headers);
        return;
      }
      await session.send(`${ dySendContent }`);
      // 分辨率判断是否压缩
      const resolution = config.douyinCompression ? "720p" : "1080p";
      // 使用今日头条 CDN 进一步加快解析速度
      const resUrl = DY_TOUTIAO_INFO.replace("1080p", resolution).replace("{}", videoAddrURI);

      // ⚠️ 暂时废弃代码
      /*if (config.douyinCompression) {
          // H.265压缩率更高、流量省一半. 相对于H.264
          // 265 和 264 随机均衡负载
          const videoAddrList = Math.random() > 0.5 ? play_addr_265.url_list : play_addr_h264.url_list;
          resUrl = videoAddrList[videoAddrList.length - 1] || videoAddrList[0];
      } else {
          // 原始格式，ps. videoAddrList这里[0]、[1]是 http，[最后一个]是 https
          const videoAddrList = play_addr.url_list;
          resUrl = videoAddrList[videoAddrList.length - 1] || videoAddrList[0];
      }*/

      // logger.info(resUrl);
      const currentPath = TMP_PATH + `${ session.userId || session.guildId }/`;
      const path = `${ currentPath }/temp.mp4`;
      // 加入队列
      await downloadVideo(resUrl, path);
      await session.send(segment.video(path))
    } else if (urlType === "image") {
      // 发送描述
      await session.send(`识别：抖音, ${ item.desc }`);
      // 无水印图片列表
      let no_watermark_image_list = [];
      // 有水印图片列表
      // let watermark_image_list = [];
      for (let i of item.images) {
        // 无水印图片列表
        no_watermark_image_list.push(segment.image(i.url_list[0]));
        // 有水印图片列表
        // watermark_image_list.push(i.download_url_list[0]);
        // e.reply(segment.image(i.url_list[0]));
      }
      // console.log(no_watermark_image_list)
      await session.send(no_watermark_image_list);
    }
    // 如果开启评论的就调用
    await douyinComment(futureParams, douId, headers);
  } catch (err) {
    console.error(err);
    await session.send(`Cookie 过期或者 Cookie 没有填写，请参考\n${ HELP_DOC }\n尝试无效后可以到官方QQ群[575663150]提出 bug 等待解决`)
  }
  return true;
}

/**
 * douyin 请求参数
 * @param url
 * @returns {Promise<unknown>}
 */
async function douyinRequest(url: string) {
  try {
    const resp = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.25 Mobile Safari/537.36",
      },
      timeout: 10000,
    });
    return resp.request.res.responseUrl;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * 获取 DY 评论
 * @param futureParams
 * @param douId
 * @param headers
 */
async function douyinComment(futureParams: FutureParams, douId: string, headers: any) {
  if (!futureParams.config.dyComment) {
    return;
  }
  const dyCommentUrl = DY_COMMENT.replace("{}", douId);
  const abParam = aBogus.generate_a_bogus(
    new URLSearchParams(new URL(dyCommentUrl).search).toString(),
    headers["User-Agent"],
  );
  const commentsResp = await axios.get(`${ dyCommentUrl }&a_bogus=${ abParam }`, {
    headers
  })
  // logger.info(headers)
  // saveJsonToFile(commentsResp.data, "data.json", _);
  const comments = commentsResp.data.comments;
  const replyComments = comments.map(item => item.text)
  await futureParams.session.send(replyComments);
}
