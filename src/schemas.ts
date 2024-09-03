import { Schema } from "koishi";
import { RConfig } from "./types";

export const name = 'r-link-parse'

export const Config: Schema<RConfig> = Schema.object({
  biliSession: Schema.string().default("").description("哔哩哔哩的session，https://www.bilibili.com/read/cv12349604"),
  dyCookie: Schema.string().default("").description("抖音的Cookie，【抖音CK提取最佳实践】 感谢@麦满分提供方案\n视频地址（暂时）：https://thumbsnap.com/rKxUGKqp"),
  dyComment: Schema.boolean().default(false).description("是否解析抖音评论，解析评论需要抖音Cookie"),
  douyinCompression: Schema.boolean().default(false).description("是否压缩抖音视频"),
  xhsCookie: Schema.string().default("").description("小红书的Cookie，https://www.xiaohongshu.com/"),
  maxDuration: Schema.number().default(360).description("哔哩哔哩最大时长，超过这个时长不解析，保护服务器，防止有些哥们搞破坏"),
})
