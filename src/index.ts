import {Context, Schema} from 'koishi'
import bili from "./futures/bilibili";

export const name = 'r-link-parse'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
  bili(ctx);
}
