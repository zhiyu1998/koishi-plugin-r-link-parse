import {segment, Session} from 'koishi'
import {mkdirIfNotExists} from "../utils/common";
import {parseUrl, parseM3u8, mergeAcFileToMp4, downloadM3u8Videos} from '../utils/acfun-core'
import {TMP_PATH} from "../constant";
import {FutureParams} from "../types";


export default async function acfun(futureParams: FutureParams) {
  const {session} = futureParams;
  const path = `${TMP_PATH}${session.userId||session.guildId}/temp/`;
  await mkdirIfNotExists(path);

  let inputMsg = session.content.trim();
  // 适配手机分享：https://m.acfun.cn/v/?ac=32838812&sid=d2b0991bd6ad9c09
  if (inputMsg.includes("m.acfun.cn")) {
    inputMsg = `https://www.acfun.cn/v/ac${/ac=([^&?]*)/.exec(inputMsg)[1]}`;
  }

  parseUrl(inputMsg).then(res => {
    session.send(`识别：猴山，${res.videoName}`);
    parseM3u8(res.urlM3u8s[res.urlM3u8s.length - 1]).then(res2 => {
      downloadM3u8Videos(res2.m3u8FullUrls, path).then(_ => {
        mergeAcFileToMp4(res2.tsNames, path, `${path}out.mp4`).then(_ => {
          session.send(segment.video(`file:///${path}out.mp4`));
        });
      });
    });
  });
}
