import {GoogleGenAI} from '@google/genai';
import dotenv from "dotenv"

dotenv.config()
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

import axios from 'axios';
import { exec } from 'node:child_process';


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
    * DO NOT use: 'ls', 'cat', 'grep', 'touch', 'export', 'python3', or bash heredocs ('<< EOF').
    * DO NOT use '&&' or '||' (PowerShell does not support '&&' statement separators in standard mode).
  - Native Windows Equivalents to use:
    * List files: 'dir' or 'Get-ChildItem'
    * View file: 'type <file>' or 'Get-Content <file>'
    * Create/Write file: 'Set-Content -Path "<file>" -Value "<content>"' or 'echo "<content>" > "<file>"'
    * Python runtime: ALWAYS use 'python' (NEVER 'python3')
    * Chaining commands: Execute single atomic commands per step, or chain using ';'
  - When creating complex files (e.g. Word documents, scripts), use 'python -c "..."' with native Windows path separators and proper escaping.

  JSON Formatting Rules:
  - Output ONLY a single valid RFC 8259 JSON object per turn.
  - Do NOT wrap JSON in markdown blocks (no \`\`\`json).
  - Always properly escape double quotes (\\\") and backslashes (\\\\) within strings.
  - Output one step at a time and wait for each step/output before proceeding.

  Example:
  - "USER": What is 2 + 2 - 5 * 10 / 3?
  OUTPUT:
  - "INITIAL": "The user wants me to solve a math equation."
  - "THINK": "I will use BODMAS: first multiply 5 * 10 = 50."
  - "ANALYSE": "The new equation is 2 + 2 - 50 / 3."
  - "THINK": "Next divide: 50 / 3 = 16.666667."
  - "ANALYSE": "The new equation is 2 + 2 - 16.666667."
  - "THINK": "Next add: 2 + 2 = 4; new equation is 4 - 16.666667."
  - "ANALYSE": "Final subtraction: 4 - 16.666667 = -12.666667."
  - "OUTPUT": "-12.666667"

  Example for Windows CLI Tool:
  - "USER": list files in directory
  OUTPUT:
  - "INITIAL": "The user wants to list files in the current directory on Windows."
  - "THINK": "Host OS is Windows. I will use the native Windows command 'dir' via executeCommandOnCli."
  - "ANALYSE": "The tool executeCommandOnCli is available. Passing 'dir' as input."
  - "TOOL_REQUEST": { "functionName": "executeCommandOnCli", "input": "dir" }
  - "TOOL_OUTPUT": "... directory listing ..."
  - "THINK": "The directory listing was captured successfully."
  - "OUTPUT": "Here are the files in the directory..."

  Output Format:
  { "step": "INITIAL" | "THINK" | "TOOL_REQUEST" | "ANALYSE" | "OUTPUT", "text": "<The Actual Text>", "functionName": "<NAME OF FUNCTION>", "input": "<INPUT PARAMS of Function>" }
`;


function parseModelJson(raw) {
  let cleanText = (raw || '').trim();
  if (cleanText.includes('```')) {
    const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match) {
      cleanText = match[1].trim();
    } else {
      cleanText = cleanText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    }
  }

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    const startIdx = cleanText.indexOf('{');
    if (startIdx !== -1) {
      let depth = 0;
      let inString = false;
      let escape = false;

      for (let i = startIdx; i < cleanText.length; i++) {
        const char = cleanText[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (char === '\\') {
          escape = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (char === '{') depth++;
          else if (char === '}') {
            depth--;
            if (depth === 0) {
              const jsonSubstr = cleanText.substring(startIdx, i + 1);
              return JSON.parse(jsonSubstr);
            }
          }
        }
      }
    }
    throw err;
  }
}

const MESSAGES_DB = [];

async function main(prompt = "what is 2 + 2") {
  MESSAGES_DB.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: MESSAGES_DB,
      config: {
        systemInstruction: SystemPrompt,
        responseMimeType: "application/json",
      },
    });

    MESSAGES_DB.push({
      role: "model",
      parts: [{ text: response.text }],
    });

    let res;
    try {
      res = parseModelJson(response.text);
    } catch (e) {
      console.error("Failed to parse model JSON:", e.message);
      console.error("Raw response:", response.text);
      break;
    }

    console.log(`🤖 (${res.step || 'INFO'}): ${res.text || ''}`);
    console.log(` `);

    if (res.step && res.step.toUpperCase() === 'OUTPUT') break;

    if ((res.step && res.step.toUpperCase() === 'TOOL_REQUEST') || res.functionName) {
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
  await main("make a beautiful html page of a chai shop");
} catch (error) {
  console.error(error);
}