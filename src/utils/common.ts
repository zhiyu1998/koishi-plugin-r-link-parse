import fs from "node:fs";

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
            await fs.promises.mkdir(dir, { recursive: true });
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

export { checkAndRemoveFile, mkdirIfNotExists, stripQueryParams }
