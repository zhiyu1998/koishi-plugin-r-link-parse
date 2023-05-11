import axios, {AxiosRequestConfig} from 'axios'
import fs from "node:fs";
import * as path from 'path';

/**
 * 检查文件是否存在并且删除
 * @param file
 * @returns {Promise<void>}
 */
async function checkAndRemoveFile(file: string): Promise<void> {
  try {
    await fs.promises.access(file);
    await fs.promises.unlink(file);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * 创建文件夹，如果不存在
 * @param dir
 * @returns {Promise<void>}
 */
async function mkdirIfNotExists(dir: string): Promise<void> {
  try {
    await fs.promises.access(dir);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await fs.promises.mkdir(dir, {recursive: true});
    } else {
      throw err;
    }
  }
}

/**
 * 删除url多余查询参数
 * @param url
 */
function stripQueryParams(url: string): string {
  const urlObj = new URL(url);
  urlObj.search = "";
  return urlObj.toString();
}

/**
 * 下载一张网络图片(自动以url的最后一个为名字)
 * @param img
 * @param dir
 * @param fileName
 * @param isProxy
 * @returns {Promise<unknown>}
 */
async function downloadImg(img, dir, fileName = "", isProxy = false) {
  if (fileName === "") {
    fileName = img.split("/").pop();
  }
  const filepath = `${dir}/${fileName}`;
  await mkdirIfNotExists(dir)
  const writer = fs.createWriteStream(filepath);
  const axiosConfig: AxiosRequestConfig = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.25 Mobile Safari/537.36",
    },
    responseType: "stream",
  };

  // if (isProxy) {
  //   axiosConfig.httpAgent = tunnel.httpOverHttp({
  //     proxy: { host: this.proxyAddr, port: this.proxyPort },
  //   });
  //   axiosConfig.httpsAgent = tunnel.httpOverHttp({
  //     proxy: { host: this.proxyAddr, port: this.proxyPort },
  //   });
  // }
  try {
    const res = await axios.get(img, axiosConfig);
    res.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        writer.close(() => {
          resolve(filepath);
        });
      });
      writer.on("error", err => {
        fs.unlink(filepath, () => {
          reject(err);
        });
      });
    });
  } catch (err) {
    console.error("图片下载失败");
  }
}

/**
 * 工具：根URL据下载视频 / 音频
 * @param url       下载地址
 * @param filePath  下载路径
 * @param headers   覆盖头节点
 * @returns {Promise<unknown>}
 */
async function downloadVideo(url: string, filePath: string, headers = null) {
  const groupPath = path.dirname(filePath);

  await mkdirIfNotExists(groupPath);

  const userAgent =
    "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.25 Mobile Safari/537.36";
  const axiosConfig: AxiosRequestConfig = {
    headers: headers || {"User-Agent": userAgent},
    responseType: "stream",
  };

  try {
    await checkAndRemoveFile(filePath);

    const res = await axios.get(url, axiosConfig);
    console.info(`开始下载: ${url}`);
    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(groupPath));
      writer.on("error", reject);
    });
  } catch (err) {
    console.error("下载视频发生错误！");
  }
}

export {checkAndRemoveFile, mkdirIfNotExists, stripQueryParams, downloadImg, downloadVideo}
