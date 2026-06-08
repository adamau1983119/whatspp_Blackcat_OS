'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROMPTS_PATH = path.join(__dirname, '..', 'config', 'search-prompts.json');

function loadSearchPrompts() {
  return JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf-8'));
}

/** L2：BYOK LLM（OpenAI 相容 API）→ 對話內文字摘要 */
function fetchLlmAnswer(query, locale) {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return Promise.resolve(null);

  const prompts = loadSearchPrompts();
  const sys = prompts.llm?.system || 'Answer in at most 3 short lines.';
  const userTpl = prompts.llm?.userTemplate || 'Question: {query}';
  const user = userTpl.replace('{query}', query).replace('{locale}', locale || 'zh-TW');
  const model = process.env.AI_MODEL || prompts.llm?.model || 'gpt-4o-mini';

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    max_tokens: 320,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const text = json.choices?.[0]?.message?.content?.trim();
            resolve(text || null);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { fetchLlmAnswer, loadSearchPrompts };
