import {Context, Schema} from 'koishi'
import bili from "./futures/bilibili";
import xhs from "./futures/xhs";
import douyin from "./futures/dy";
import acfun from "./futures/acfun";

export const name = 'r-link-parse'

const commands = [
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

export interface Config {
  gptEngineKey: string,
  biliSession: string,
}

export const Config: Schema<Config> = Schema.object({
  gptEngineKey: Schema.string().default(""),
  biliSession: Schema.string().default("")
})

export function apply(ctx: Context, config:Config) {
  ctx.middleware((session, next) => {
    const msg = session.content;
    const command = commands.find(({ regex }) => regex.test(msg));

    if (command) {
      // 构造参数传入处理
      command.handler({
        session,
        config
      });
    }
  });
}
