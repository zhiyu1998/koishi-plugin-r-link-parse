import {Context, Schema} from 'koishi'
import bili from "./futures/bilibili";
import xhs from "./futures/xhs";
import douyin from "./futures/dy";
import acfun from "./futures/acfun";

export const name = 'r-link-parse'

export interface Config { }

// 哔哩哔哩
const biliRegex = /(bilibili.com|b23.tv|t.bilibili.com)/i
// xhs
const xhsRegex = /(xhslink.com|xiaohongshu.com)/i
// 抖音
const dyRegex = /v.douyin.com/i
// acfun
const acfunRegex = /acfun.cn/i

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.middleware((session, next) => {
    const msg = session.content;
    if (biliRegex.test(msg)) {
      bili(session);
    } else if (xhsRegex.test(msg)) {
      xhs(session);
    } else if (dyRegex.test(msg)) {
      douyin(session);
    } else if (acfunRegex.test(msg)) {
      acfun(session);
    }
  })
}
