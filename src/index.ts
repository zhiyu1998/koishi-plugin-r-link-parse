import {Context, Schema} from 'koishi'
import bili from "./futures/bilibili";
import xhs from "./futures/xhs";
import douyin from "./futures/dy";
import acfun from "./futures/acfun";

export const name = 'r-link-parse'

const platforms = [
  {
    regex: /(bilibili.com|b23.tv|t.bilibili.com)/i,
    handler: bili,
  },
  {
    regex: /(xhslink.com|xiaohongshu.com)/i,
    handler: xhs,
  },
  {
    regex: /v.douyin.com/i,
    handler: douyin,
  },
  {
    regex: /acfun.cn/i,
    handler: acfun,
  },
];

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.middleware((session, next) => {
    const msg = session.content;
    const platform = platforms.find(({ regex }) => regex.test(msg));

    if (platform) {
      platform.handler(session);
    }
  });
}
