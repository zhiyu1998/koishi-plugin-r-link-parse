import { Context } from 'koishi'
import { COMMANDS } from "./commands";
import { RConfig } from "./types";

export * from './schemas';

export function apply(ctx: Context, config: RConfig) {
  ctx.middleware((session, next) => {
    const msg = session.content;
    const command = COMMANDS.find(({ regex }) => regex.test(msg));

    if (command) {
      // 构造参数传入处理
      command.handler({
        session,
        config
      });
    }
  });
}
