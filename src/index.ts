import {Context, Schema} from 'koishi'
import bili from "./futures/bilibili";
import xhs from "./futures/xhs";

export const name = 'r-link-parse'

export interface Config { }

// 哔哩哔哩
const biliRegex = /(bilibili.com|b23.tv|t.bilibili.com)/i

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  ctx.middleware((session, next) => {
    if (biliRegex.test(session.content)) {
      bili(session);
    } else {
      xhs(session);
    }
  })
}
