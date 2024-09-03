/**
 * Bilibili 视频分页信息
 */
interface BiliPages {
  cid: number,
  page: number,
  from: string,
  part: string,
  duration: number,
  dimension: {
    width: number,
    height: number,
    rotate: number,
  },
  vid: string,
  weblink: string,
}

/**
 * Bilibili 视频状态
 */
export interface BiliState {
  aid: number,
  view: number,
  danmaku: number,
  reply: number,
  favorite: number,
  coin: number,
  share: number,
  now_rank: number,
  his_rank: number,
  like: number,
  dislike: number,
  evaluation: string,
  argue_msg: string,
}

/**
 * Bilibili 视频信息
 */
export interface VideoInfo {
  title: string;
  pic: string;
  desc: string;
  duration: number;
  dynamic: string;
  stat: BiliState;
  aid: number;
  cid: number;
  pages: Array<BiliPages>;
}
