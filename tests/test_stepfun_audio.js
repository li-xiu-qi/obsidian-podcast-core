import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const STEP_API_KEY = process.env.API_KEY;
const STEP_API_MODEL = process.env.AUDIO_MODEL;

const openai = new OpenAI({
apiKey: STEP_API_KEY,
baseURL: process.env.BASE_URL,
});

async function main() {
const speechFile = path.resolve("./speech.mp3");
const mp3 = await openai.audio.speech.create({
  model: STEP_API_MODEL,
  voice: "qinhenvsheng",
  input: "智能阶跃，十倍每个人的可能.",
  extra_body:{
    "volume":2.0, // volume 在拓展参数里
    "voice_label": {
      "emotion": "高兴",   // 可选：情感
      "style": "慢速"      // 可选：说话语速
    },
    "pronunciation_map":{
      "tone":[
          "阿胶/e1胶",
          "扁舟/偏舟",
          "LOL/laugh out loudly"
      ]
    }
  }
});
console.log(speechFile);
const buffer = Buffer.from(await mp3.arrayBuffer());
await fs.promises.writeFile(speechFile, buffer);
}
 
main();