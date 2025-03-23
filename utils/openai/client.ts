import OpenAI from "openai";
import { config } from "@/config";
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export default openai;
