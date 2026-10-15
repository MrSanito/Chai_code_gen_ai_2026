import { GoogleGenAI } from '@google/genai';
import dotenv from "dotenv";
import axios from 'axios';
import { exec } from 'node:child_process';

dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function getWeather(cityName) {
  const url = `https://wttr.in/${cityName.toLowerCase()}?format=%C+%t`;
  const response = await axios.get(url, { responseType: 'text' });
  return JSON.stringify({ cityName, weatherInfo: response.data });
}

async function executeCommandOnCli(cmd) {
  return new Promise((res, rej) => {
    exec(cmd, { shell: process.platform === 'win32' ? 'powershell.exe' : undefined }, (err, out, stderr) => {
      if (err) return res(`There was an Error: ${err.message || err}`);
      else return res(out || stderr);
    });
  });
}

const SystemPrompt = `
  You are an expert AI engineer. Only and only answer questions related to coding and engineering.
  
  Persona: You are a senior software developer.
  Persona Traits:
- You always sound technical and use engineering terminology.
  - You never answer personal questions and focus purely on code and systems.
  - All you know is how and what code is.

  You have to analyse the user's input carefully and then you need to
  break down the problem into multiple sub-problems before arriving at the final result. Always break down
  the user's intention and solve it step-by-step.

  We are going to follow a pipeline of "INITIAL", "THINK", "TOOL_REQUEST", "ANALYSE" and "OUTPUT".

  The Pipeline:
- "INITIAL": When the user gives an input, express an initial thought process on what the user is trying to accomplish.
  - "THINK": Think about how to solve this and start breaking down the problem.
  - "ANALYSE": Analyse the solution and verify if the approach or output is correct.
  - "THINK": Return to think mode to assess remaining sub-problems.
  - "ANALYSE": Re-analyse and verify progress.
  - "TOOL_REQUEST": Use this for calling or requesting a tool.
    Format: { "step": "TOOL_REQUEST", "functionName": "executeCommandOnCli", "input": "<COMMAND>" }
- "OUTPUT": Deliver the final result to the user.

  Available Tools:
- "getWeatherData": getWeatherData(cityName: string): Returns the realtime weather information of a city.
  - "executeCommandOnCli": executeCommandOnCli(command: string): Executes a command on the user's Windows machine and returns stdout.

  CRITICAL Operating System & CLI Rules:
- Target OS: The host environment is strictly WINDOWS (PowerShell / Command Prompt).
  - ONLY use native Windows / PowerShell commands.
  - NEVER use Linux/macOS/Bash commands:
    - DO NOT use: 'ls', 'cat', 'grep', 'touch', 'export', 'python3', or bash heredocs ('<< EOF').
    - DO NOT use '&&' or '||' (PowerShell does not support '&&' statement separators in standard mode).
  - Native Windows Equivalents to use:
    - List files: 'dir' or 'Get-ChildItem'
    - View file: 'type <file>' or 'Get-Content <file>'
    - Create/Write file: 'Set-Content -Path "<file>" -Value "<content>"' or 'echo "<content>" > "<file>"'
    - Python runtime: ALWAYS use 'python' (NEVER 'python3')
    - Chaining commands: Execute single atomic commands per step, or chain using ';'
  - When creating complex files (e.g. Word documents, scripts), use 'python -c "..."' with native Windows path separators and proper escaping.

  JSON Formatting Rules:
- Output ONLY a single valid RFC 8259 JSON object per turn.
  - Do NOT wrap JSON in markdown blocks (no \`\`\`json).
  - Always properly escape double quotes (\\\") and backslashes (\\\\) within strings.
  - Output one step at a time and wait for each step/output before proceeding.
`;

const MESSAGES_DB = [];

async function main(prompt = "what is 2 + 2") {
  MESSAGES_DB.push({
    role: "user",
    parts: [{ text: `${SystemPrompt}\n\nUSER INPUT:\n${prompt}` }],
  });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: MESSAGES_DB,
    });

    MESSAGES_DB.push({
      role: "model",
      parts: [{ text: response.text }],
    });

    let cleanText = response.text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    let res;
    try {
        res = JSON.parse(cleanText);
    } catch(e) {
        console.error("Gemma returned invalid JSON:", cleanText);
        break;
    }
    
    console.log(res)
    console.log(`🤖 (${res.step}): ${res.thought || ''}`);
    console.log(` `)

    if (res.step && res.step.toUpperCase() === 'OUTPUT') break;

    if (res.step && res.step.toUpperCase() === 'TOOL_REQUEST') {
      const { functionName, input } = res;

      switch (functionName) {
        case 'executeCommandOnCli': {
          try {
            const toolResult = await executeCommandOnCli(input);
            console.log(`🛠️(${functionName}):${input}`, toolResult);
            MESSAGES_DB.push({
              role: 'user',
              parts: [{
                text: JSON.stringify({
                  step: 'TOOL_OUTPUT',
                  output: toolResult,
                }),
              }],
            });
          } catch (error) {
            MESSAGES_DB.push({
              role: 'user',
              parts: [{
                text: JSON.stringify({
                  step: 'TOOL_OUTPUT',
                  error: error?.message || String(error),
                }),
              }],
            });
          }
          continue;
        }

        case 'getWeatherData': {
          try {
            const toolResult = await getWeather(input);
            console.log(`🛠️(${functionName}):${input}`, toolResult);
            MESSAGES_DB.push({
              role: 'user',
              parts: [{
                text: JSON.stringify({
                  step: 'TOOL_OUTPUT',
                  output: toolResult,
                }),
              }],
            });
          } catch (error) {
            MESSAGES_DB.push({
              role: 'user',
              parts: [{
                text: JSON.stringify({
                  step: 'TOOL_OUTPUT',
                  error: error?.message || String(error),
                }),
              }],
            });
          }
          continue;
        }
        default:
          break;
      }
      continue;
    }

    MESSAGES_DB.push({
      role: 'user',
      parts: [{ text: 'continue' }],
    });
  }
}

try {
  await main("can you make a file and write 500 lines of essagy on friendship a txt file with native approach    ");
} catch (error) {
  console.error(error);
}