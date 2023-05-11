import {Session, segment} from 'koishi'
import {TMP_PATH, XHS_CK} from "../constant";
import {downloadImg, downloadVideo} from "../utils/common";


export default async function xhs(session: Session) {
  // 正则说明：匹配手机链接、匹配PC链接
  const msgMatch = session.content.match(/(http:|https:)\/\/(xhslink|xiaohongshu).com\/[A-Za-z\d._?%&+\-=\/#@]*/)
    || session.content.match(/(http:|https:)\/\/www\.xiaohongshu\.com\/explore\/(\w+)/);
  const msgUrl = msgMatch[0];
  // 解析短号
  let id;
  if (msgUrl.includes("xhslink")) {
    await fetch(msgUrl, {
      redirect: "follow",
    }).then(resp => {
      const uri = decodeURIComponent(resp.url);
      id = /explore\/(\w+)/.exec(uri)?.[1];
    });
  } else {
    id = /explore\/(\w+)/.exec(msgUrl)?.[1] || /discovery\/item\/(\w+)/.exec(msgUrl)?.[1];
  }
  const downloadPath = `${TMP_PATH}${session.userId || session.guildId}/`;
  // 获取信息
  fetch(`https://www.xiaohongshu.com/discovery/item/${id}`, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/110.0.0.0",
      cookie: Buffer.from(XHS_CK, "base64").toString("utf-8"),
    },
  }).then(async resp => {
    const xhsHtml = await resp.text();
    const reg = /window.__INITIAL_STATE__=(.*?)<\/script>/;
    const resJson = xhsHtml.match(reg)[0];
    const res = JSON.parse(resJson.match(reg)[1]);
    const noteData = res.noteData.data.noteData;
    const {title, desc, type} = noteData;
    session.send(`识别：小红书, ${title}\n${desc}`);
    let imgPromise = [];
    if (type === "video") {
      const url = noteData.video.url;
      downloadVideo(url, `${downloadPath}temp.mp4`).then(path => {
        session.send(segment.video(`file:///${path}/temp.mp4`));
      });
      return true;
    } else if (type === "normal") {
      noteData.imageList.map(async (item, index) => {
        imgPromise.push(downloadImg(`https:${item.url}`, downloadPath, `${index.toString()}.jpg`));
      });
    }
    const paths = await Promise.all(imgPromise);
    session.send(paths.map((path) => segment.image(`file:///${path}`)).join("\n"));
  });
}
