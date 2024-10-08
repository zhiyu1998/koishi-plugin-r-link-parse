import fs from "node:fs";
import axios from 'axios'
import child_process from 'node:child_process'
import util from "util";
import _ from "lodash";


async function downloadBFile(url, fullFileName, progressCallback) {
    return axios
        .get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
                referer: 'https://www.bilibili.com',
            },
        })
        .then(({ data, headers }) => {
            let currentLen = 0;
            const totalLen: number = Number(headers['content-length']);

            return new Promise((resolve, reject) => {
                data.on('data', ({ length }) => {
                    currentLen += length;
                    progressCallback?.(currentLen / totalLen);
                });

                data.pipe(
                    fs.createWriteStream(fullFileName).on('finish', () => {
                        resolve({
                            fullFileName,
                            totalLen,
                        });
                    }),
                );
            });
        });
}

export async function getDownloadUrl(url) {
    return axios
        .get(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
                referer: 'https://www.bilibili.com',
            },
        })
        .then(({ data }) => {
            const info = JSON.parse(
                data.match(/<script>window\.__playinfo__=({.*})<\/script><script>/)?.[1],
            );
            // 如果是大视频直接最低分辨率
            const videoUrl =
                info?.data?.dash?.video?.[0]?.baseUrl ?? info?.data?.dash?.video?.[0]?.backupUrl?.[0];

            const audioUrl =
                info?.data?.dash?.audio?.[0]?.baseUrl ?? info?.data?.dash?.audio?.[0]?.backupUrl?.[0];
            const title = data.match(/title="(.*?)"/)?.[1]?.replaceAll?.(/\\|\/|:|\*|\?|"|<|>|\|/g, '');


            if (videoUrl && audioUrl) {
                return { videoUrl, audioUrl, title };
            }

            return Promise.reject('获取下载地址失败');
        });
}

async function mergeFileToMp4(vFullFileName, aFullFileName, outputFileName, shouldDelete = true) {
    // 判断当前环境
    let env;
    if (process.platform === "win32") {
        env = process.env
    } else if (process.platform === "linux") {
        env = {
            ...process.env,
            PATH: '/usr/local/bin:' + child_process.execSync('echo $PATH').toString(),
        };
    } else {
        console.warn("暂时不支持当前操作系统！")
    }
    const execFile = util.promisify(child_process.execFile);
    try {
        const cmd = 'ffmpeg';
        const args = ['-y', '-i', vFullFileName, '-i', aFullFileName, '-c', 'copy', outputFileName];
        await execFile(cmd, args, { env });

        if (shouldDelete) {
            await fs.promises.unlink(vFullFileName);
            await fs.promises.unlink(aFullFileName);
        }

        return { outputFileName };
    } catch (err) {
        console.error(err);
    }
}

/**
 * 哔哩哔哩下载
 * @param title
 * @param videoUrl
 * @param audioUrl
 * @returns {Promise<unknown>}
*/
export function downBili(title: string, videoUrl: string, audioUrl: string) {
  return Promise.all([
      downloadBFile(
          videoUrl,
          title + "-video.m4s",
          _.throttle(
              value =>
                  console.info("视频下载进度", {
                      data: value,
                  }),
              1000,
          ),
      ),
      downloadBFile(
          audioUrl,
          title + "-audio.m4s",
          _.throttle(
              value =>
                  console.info("音频下载进度", {
                      data: value,
                  }),
              1000,
          ),
      ),
  ]).then(() => {
      return mergeFileToMp4(title + "-video.m4s", title + "-audio.m4s", `${title}.mp4`);
  });
}

export async function getVideoInfo(url: string) {
  const baseVideoInfo = "http://api.bilibili.com/x/web-interface/view";

  const videoId = /video\/[^\?\/ ]+/.exec(url)[0].split("/")[1];
  // 获取视频信息，然后发送
  return fetch(`${baseVideoInfo}?bvid=${videoId}`)
    .then(async resp => {
      const respJson = await resp.json();
      const respData = respJson.data;
      return {
        title: respData.title,
        pic: respData.pic,
        desc: respData.desc,
        duration: respData.duration,
        dynamic: respJson.data.dynamic,
        stat: respData.stat,
        aid: respData.aid,
        cid: respData.pages?.[0].cid,
        pages: respData?.pages,
      };
    });
}

export async function getDynamic(dynamicId: string | number) {
  const dynamicApi = `https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/get_dynamic_detail?dynamic_id=${dynamicId}`
  return axios.get(dynamicApi, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
      'referer': 'https://www.bilibili.com',
    }
  }).then(resp => {
    const dynamicData = resp.data.data.card
    const card = JSON.parse(dynamicData.card)
    const dynamicOrigin = card.item
    const dynamicDesc = dynamicOrigin.description

    const pictures = dynamicOrigin.pictures
    let dynamicSrc = []
    for (let pic of pictures) {
      const img_src = pic.img_src
      dynamicSrc.push(img_src)
    }
    // console.log(dynamic_src)
    return {
      dynamicSrc,
      dynamicDesc
    }
  })
}
