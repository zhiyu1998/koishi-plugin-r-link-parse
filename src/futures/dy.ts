import {segment, Session} from 'koishi'
import axios from 'axios'
import _ from 'lodash'
import {DY_TYPE_MAP, TMP_PATH} from "../constant";
import {downloadVideo} from "../utils/common";
import * as xBogus from "../utils/x-bogus.cjs";

export default async function douyin(session: Session) {
  const urlRex = /(http:|https:)\/\/v.douyin.com\/[A-Za-z\d._?%&+\-=\/#]*/g;
  const douUrl = urlRex.exec(session.content.trim())[0];

  await douyinRequest(douUrl).then(async res => {
    const douId = /note\/(\d+)/g.exec(res)?.[1] || /video\/(\d+)/g.exec(res)?.[1];
    // 以下是更新了很多次的抖音API历史，且用且珍惜
    // const url = `https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?item_ids=${ douId }`;
    // const url = `https://www.iesdouyin.com/aweme/v1/web/aweme/detail/?aweme_id=${ douId }&aid=1128&version_name=23.5.0&device_platform=android&os_version=2333`;
    // 感谢 Evil0ctal（https://github.com/Evil0ctal）提供的header 和 B1gM8c（https://github.com/B1gM8c）的逆向算法X-Bogus
    const headers = {
      "accept-encoding": "gzip, deflate, br",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
      referer: "https://www.douyin.com/",
      cookie: "s_v_web_id=verify_leytkxgn_kvO5kOmO_SdMs_4t1o_B5ml_BUqtWM1mP6BF;",
    };
    const dyApi = `https://www.douyin.com/aweme/v1/web/aweme/detail/?device_platform=webapp&aid=6383&channel=channel_pc_web&aweme_id=${douId}&pc_client_type=1&version_code=190500&version_name=19.5.0&cookie_enabled=true&screen_width=1344&screen_height=756&browser_language=zh-CN&browser_platform=Win32&browser_name=Firefox&browser_version=110.0&browser_online=true&engine_name=Gecko&engine_version=109.0&os_name=Windows&os_version=10&cpu_core_num=16&device_memory=&platform=PC&webid=7158288523463362079&msToken=abL8SeUTPa9-EToD8qfC7toScSADxpg6yLh2dbNcpWHzE0bT04txM_4UwquIcRvkRb9IU8sifwgM1Kwf1Lsld81o9Irt2_yNyUbbQPSUO8EfVlZJ_78FckDFnwVBVUVK`;
    // xg参数
    const xbParam = xBogus.sign(
      new URLSearchParams(new URL(dyApi).search).toString(),
      headers["User-Agent"],
    );
    // const param = resp.data.result[0].paramsencode;
    const resDyApi = `${dyApi}&X-Bogus=${xbParam}`;
    axios
      .get(resDyApi, {
        headers,
      })
      .then(async resp => {
        if (_.isEmpty(resp?.data)) {
          session.send("解析失败，请重试！");
          return;
        }
        const item = resp.data.aweme_detail;
        session.send(`识别：抖音, ${item.desc}`);
        const urlTypeCode = item.aweme_type;
        const urlType = DY_TYPE_MAP[urlTypeCode];
        if (urlType === "video") {
          const resUrl = item.video.play_addr.url_list[0].replace(
            "http",
            "https",
          );
          const path = `${TMP_PATH}${session.userId || session.guildId}/temp.mp4`;
          await downloadVideo(resUrl, path).then(() => {
            session.send(segment.video(`file:///${path}`));
          });
        } else if (urlType === "image") {
          // 无水印图片列表
          let no_watermark_image_list = [];
          // 有水印图片列表
          // let watermark_image_list = [];
          for (let i of item.images) {
            // 无水印图片列表
            no_watermark_image_list.push(segment.image(i.url_list[0]));
            // 有水印图片列表
            // watermark_image_list.push(i.download_url_list[0]);
            // session.send(segment.image(i.url_list[0]));
          }
          // console.log(no_watermark_image_list)
          session.send(no_watermark_image_list)
        }
      });
  });
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
