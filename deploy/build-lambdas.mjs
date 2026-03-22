#!/usr/bin/env node
/**
 * Lambda 함수 빌드 스크립트 (Node.js — 크로스 플랫폼)
 * esbuild로 각 Lambda를 번들링하고 zip 파일 생성
 *
 * 사용법: node deploy/build-lambdas.mjs
 */

import { execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, createWriteStream, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createGzip } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const buildDir = join(__dirname, 'dist');

const LAMBDAS = [
  'team',
  'chat',
  'review',
  'decision',
  'merge',
  'check',
  'points-settle',
  'points-predict',
];

// 빌드 디렉토리 초기화
if (existsSync(buildDir)) {
  rmSync(buildDir, { recursive: true, force: true });
}
mkdirSync(buildDir, { recursive: true });

let success = 0;
let failed = 0;

for (const lambda of LAMBDAS) {
  const funcName = `ai-pm-${lambda}`;
  const lambdaDir = join(projectRoot, 'lambda', lambda);
  const outDir = join(buildDir, funcName);

  mkdirSync(outDir, { recursive: true });

  console.log(`📦 빌드 중: ${funcName}`);

  try {
    execSync(
      `npx esbuild "${join(lambdaDir, 'index.ts')}" ` +
      `--bundle --platform=node --target=node20 ` +
      `--outfile="${join(outDir, 'index.mjs')}" ` +
      `--format=esm ` +
      `--external:@aws-sdk/client-bedrock-runtime ` +
      `--minify`,
      { stdio: 'pipe', cwd: projectRoot }
    );

    // zip 생성 (npx를 통한 archiver 대신 PowerShell/tar 사용)
    const zipPath = join(buildDir, `${funcName}.zip`);
    try {
      // Windows: PowerShell Compress-Archive
      execSync(
        `powershell -Command "Compress-Archive -Path '${join(outDir, 'index.mjs')}' -DestinationPath '${zipPath}' -Force"`,
        { stdio: 'pipe' }
      );
    } catch {
      // Linux/Mac: zip 명령어
      execSync(`zip -j "${zipPath}" "${join(outDir, 'index.mjs')}"`, { stdio: 'pipe' });
    }

    console.log(`✅ ${funcName}.zip 생성 완료`);
    success++;
  } catch (err) {
    console.error(`❌ ${funcName} 빌드 실패:`, err.message);
    failed++;
  }
}

console.log('');
console.log(`🎉 빌드 완료: ${success}/${LAMBDAS.length} 성공${failed > 0 ? `, ${failed} 실패` : ''}`);
console.log(`   출력 디렉토리: deploy/dist/`);

if (failed > 0) process.exit(1);
