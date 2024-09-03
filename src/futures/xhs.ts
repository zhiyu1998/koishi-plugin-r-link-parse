import { segment } from 'koishi'
import { HELP_DOC, TMP_PATH } from "../constant";
import { downloadImg, downloadVideo } from "../utils/common";
import { FutureParams } from "../types";
import { XHS_NO_WATERMARK_HEADER, XHS_REQ_LINK } from "../constant/xhs";
import _ from "lodash";
import fs from "node:fs";


export default async function xhs(futureParams: FutureParams) {
  const { session, config } = futureParams;
  // 正则说明：匹配手机链接、匹配小程序、匹配PC链接
  let msgUrl =
    /(http:|https:)\/\/(xhslink|xiaohongshu).com\/[A-Za-z\d._?%&+\-=\/#@]*/.exec(
      session.content,
    )?.[0]
    || /(http:|https:)\/\/www\.xiaohongshu\.com\/explore\/(\w+)/.exec(
      session.content,
    )?.[0]
  // 注入ck
  XHS_NO_WATERMARK_HEADER.cookie = config.xhsCookie;
  // 解析短号
  let id;
  if (msgUrl.includes("xhslink")) {
    await fetch(msgUrl, {
      headers: XHS_NO_WATERMARK_HEADER,
      redirect: "follow",
    }).then(resp => {
      const uri = decodeURIComponent(resp.url);
      // 如果出现了网页验证uri:https://www.xiaohongshu.com/website-login/captcha?redirectPath=https://www.xiaohongshu.com/discovery/item/63c93ac3000000002203b28a?app_platform=android&app_version=8.23.1&author_share=1&ignoreEngage=true&share_from_user_hidden=true&type=normal&xhsshare=CopyLink&appuid=62c58b90000000000303dc54&apptime=1706149572&exSource=&verifyUuid=a5f32b62-453e-426b-98fe-2cfe0c16776d&verifyType=102&verifyBiz=461
      const verify = uri.match(/\/item\/([0-9a-fA-F]+)/);
      // 一般情况下不会出现问题就使用这个正则
      id = /noteId=(\w+)/.exec(uri)?.[1] ?? verify?.[1];
    });
  } else {
    id = /explore\/(\w+)/.exec(msgUrl)?.[1] || /discovery\/item\/(\w+)/.exec(msgUrl)?.[1];
  }
  const downloadPath = TMP_PATH;
  // 检测没有 cookie 则退出
  if (_.isEmpty(config.xhsCookie)) {
    await session.send(`2024-8-2后反馈必须使用ck，不然无法解析请填写相关ck\n${ HELP_DOC }`);
    return;
  }
  // 获取信息
  fetch(`${ XHS_REQ_LINK }${ id }`, {
    headers: XHS_NO_WATERMARK_HEADER,
  }).then(async resp => {
    const xhsHtml = await resp.text();
    const reg = /window\.__INITIAL_STATE__=(.*?)<\/script>/;
    const res = xhsHtml.match(reg)[1].replace(/undefined/g, "null");
    const resJson = JSON.parse(res);
    const noteData = resJson.note.noteDetailMap[id].note;
    const { title, desc, type } = noteData;
    if (type === "video") {
      // 封面
      const cover = noteData.imageList?.[0].urlDefault;
      await session.send([segment.image(cover), `识别：小红书, ${ title }\n${ desc }`]);
      // ⚠️ （暂时废弃）构造xhs视频链接（有水印）
      const xhsVideoUrl = noteData.video.media.stream.h264?.[0]?.masterUrl;

      // 构造无水印
      // const xhsVideoUrl = `http://sns-video-bd.xhscdn.com/${ noteData.video.consumer.originVideoKey }`
      // 下载视频
      downloadVideo(xhsVideoUrl, downloadPath).then(path => {
        if (path === undefined) {
          // 创建文件，如果不存在
          path = `${ TMP_PATH }/`;
        }
        session.send(segment.video(`${ path }/temp.mp4`))
      });
      return true;
    } else if (type === "normal") {
      await session.send(`识别：小红书, ${ title }\n${ desc }`);
      const imagePromises = [];
      // 使用 for..of 循环处理异步下载操作
      for (let [index, item] of noteData.imageList.entries()) {
        imagePromises.push(downloadImg(item.urlDefault, downloadPath, `${ index }.png`));
      }
      // 等待所有图片下载完成
      const paths = await Promise.all(imagePromises);

      // 直接构造 imagesData 数组
      const imagesData = await Promise.all(paths.map(async (item) => segment.image(`file://${item}`)));

      // 回复带有转发消息的图片数据
      await session.send(imagesData);

      // 批量删除下载的文件
      await Promise.all(paths.map(item => fs.promises.rm(item, { force: true })));
    }
  });
  return true;
}
