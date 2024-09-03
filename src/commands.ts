import bili from "./futures/bili";
import xhs from "./futures/xhs";
import douyin from "./futures/douyin";
import acfun from "./futures/acfun";

export const COMMANDS = [
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
