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
  summaryDuration: number,
  biliMaxDuration: number,
}

export const Config: Schema<Config> = Schema.object({
  gptEngineKey: Schema.string().default("").description("AI-edu的Key，https://ai.aigcfun.com/"),
  biliSession: Schema.string().default("").description("哔哩哔哩的session，https://www.bilibili.com/read/cv12349604"),
  summaryDuration: Schema.number().default(60).description("限制低于时常不进行总结，设置这个主要是一些很短已经总结的很好了，不用总结了"),
  biliMaxDuration: Schema.number().default(360).description("哔哩哔哩最大时长，超过这个时长不解析，保护服务器，防止有些哥们搞破坏"),
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
