import { useMemo, useRef } from 'react';
import type { PPTSlide } from '../../types';
import { generateRevealHtml, downloadPptHtml } from '../../utils/pptGenerator';

interface PPTPreviewProps {
  slides: PPTSlide[];
  title?: string;
}

export default function PPTPreview({ slides, title }: PPTPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = useMemo(
    () => generateRevealHtml(slides, title),
    [slides, title],
  );

  const handleDownload = () => {
    downloadPptHtml(html, title ? `${title}.html` : 'presentation.html');
  };

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        생성된 슬라이드가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          PPT 미리보기 ({slides.length}장)
        </h3>
        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          HTML 다운로드
        </button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title="PPT 미리보기"
          className="w-full"
          style={{ height: '480px' }}
          sandbox="allow-scripts"
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-600">슬라이드 목록</h4>
        {slides
          .sort((a, b) => a.slideNumber - b.slideNumber)
          .map((slide) => (
            <div
              key={slide.slideNumber}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600">
                  #{slide.slideNumber}
                </span>
                <span className="font-medium text-gray-800">{slide.title}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {slide.content}
              </p>
              <div className="flex gap-1 mt-2">
                {slide.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    {kw}
                  </span>
                ))}
              </div>
              {slide.speakerNotes && (
                <p className="mt-2 text-xs text-gray-400 italic">
                  발표자 노트: {slide.speakerNotes}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
