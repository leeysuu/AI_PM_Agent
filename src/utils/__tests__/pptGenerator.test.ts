import { describe, it, expect } from 'vitest';
import { generateRevealHtml } from '../pptGenerator';
import type { PPTSlide } from '../../types';

const sampleSlides: PPTSlide[] = [
  {
    slideNumber: 1,
    title: '프로젝트 개요',
    content: '목표 설명\n범위 정의',
    keywords: ['AI', 'PM', '자동화'],
    speakerNotes: '첫 슬라이드 발표 노트',
  },
  {
    slideNumber: 2,
    title: '기술 스택',
    content: 'React + TypeScript\nAWS Lambda',
    keywords: ['React', 'Lambda'],
    speakerNotes: '기술 설명',
  },
];

describe('generateRevealHtml', () => {
  it('returns a valid HTML document with reveal.js structure', () => {
    const html = generateRevealHtml(sampleSlides, '테스트 발표');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<div class="reveal">');
    expect(html).toContain('<div class="slides">');
    expect(html).toContain('</html>');
  });

  it('includes reveal.js CDN links', () => {
    const html = generateRevealHtml(sampleSlides);

    expect(html).toContain('reveal.js');
    expect(html).toContain('reveal.css');
    expect(html).toContain('Reveal.initialize');
  });

  it('renders each slide as a <section>', () => {
    const html = generateRevealHtml(sampleSlides);

    const sectionCount = (html.match(/<section /g) || []).length;
    expect(sectionCount).toBe(2);
  });

  it('includes slide titles in <h2> tags', () => {
    const html = generateRevealHtml(sampleSlides);

    expect(html).toContain('<h2>프로젝트 개요</h2>');
    expect(html).toContain('<h2>기술 스택</h2>');
  });

  it('renders content lines as list items', () => {
    const html = generateRevealHtml(sampleSlides);

    expect(html).toContain('<li>목표 설명</li>');
    expect(html).toContain('<li>범위 정의</li>');
    expect(html).toContain('<li>React + TypeScript</li>');
  });

  it('renders keywords with the keyword class', () => {
    const html = generateRevealHtml(sampleSlides);

    expect(html).toContain('<span class="keyword">AI</span>');
    expect(html).toContain('<span class="keyword">PM</span>');
    expect(html).toContain('<span class="keyword">React</span>');
  });

  it('includes speaker notes in data-notes attribute', () => {
    const html = generateRevealHtml(sampleSlides);

    expect(html).toContain('data-notes="첫 슬라이드 발표 노트"');
    expect(html).toContain('data-notes="기술 설명"');
  });

  it('sets the page title from the title parameter', () => {
    const html = generateRevealHtml(sampleSlides, '내 발표');
    expect(html).toContain('<title>내 발표</title>');
  });

  it('uses default title when none provided', () => {
    const html = generateRevealHtml(sampleSlides);
    expect(html).toContain('<title>Presentation</title>');
  });

  it('sorts slides by slideNumber', () => {
    const reversed: PPTSlide[] = [
      { ...sampleSlides[1], slideNumber: 2 },
      { ...sampleSlides[0], slideNumber: 1 },
    ];
    const html = generateRevealHtml(reversed);

    const firstIdx = html.indexOf('프로젝트 개요');
    const secondIdx = html.indexOf('기술 스택');
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('escapes HTML special characters in content', () => {
    const slides: PPTSlide[] = [
      {
        slideNumber: 1,
        title: '<script>alert("xss")</script>',
        content: 'A & B < C > D',
        keywords: ['"quoted"'],
        speakerNotes: 'notes with <html>',
      },
    ];
    const html = generateRevealHtml(slides);

    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B &lt; C &gt; D');
  });

  it('handles empty slides array', () => {
    const html = generateRevealHtml([]);

    expect(html).toContain('<div class="slides">');
    expect(html).not.toContain('<section');
  });
});
