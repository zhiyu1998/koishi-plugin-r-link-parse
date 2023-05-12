type gptPrompt = {
  content: string;
  role: string;
}

export default class GPT {
  private GPT_ENGINE_URL: string;
  constructor(key: string) {
    this.GPT_ENGINE_URL = `https://api.aigcfun.com/api/v1/text?key=${key}`
  }

  async sendMessage(input: string): Promise<string> {
    // 提取文字
    let inputValue = input.trim();
    let messages: Array<gptPrompt> = [];
    messages.push({
      content: inputValue,
      role: "user",
    })
    // 获取openapi数据
    return await fetch(this.GPT_ENGINE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages
      })
    }).then(async resp => {
      try {
        const response = await resp.json();
        return response?.choices?.[0]?.text || response?.choices?.[0]?.message?.content;
      } catch (err) {
        console.error("出错了，请稍后再试");
      }
    });
  }
}
