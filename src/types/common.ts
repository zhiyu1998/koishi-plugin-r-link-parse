import { Session } from "koishi";

/**
 * 配置项
 */
export interface RConfig {
  dyCookie: string;
  dyComment: boolean;
  douyinCompression: boolean;
  biliSession: string;
  xhsCookie: string;
  maxDuration: number;
}

export type FutureParams = {
  session: Session,
  config: RConfig,
}
