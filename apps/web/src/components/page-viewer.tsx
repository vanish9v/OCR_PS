"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { pageImageUrl } from "@/lib/api";

interface PageViewerProps {
  packetId: string;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PageViewer({ packetId, totalPages, currentPage, onPageChange }: PageViewerProps) {
  const [zoom, setZoom] = useState(100);

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div className="flex h-full flex-col">
      {/* Controls */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => onPageChange(currentPage - 1)}
            className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-neutral-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={!canNext}
            onClick={() => onPageChange(currentPage + 1)}
            className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
            disabled={zoom <= 50}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs text-neutral-500">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
            className="rounded p-1 hover:bg-neutral-100 disabled:opacity-30"
            disabled={zoom >= 200}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(100)}
            className="rounded p-1 hover:bg-neutral-100"
            aria-label="Fit width"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div className="flex-1 overflow-auto bg-neutral-100 p-4">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pageImageUrl(packetId, currentPage)}
            alt={`Page ${currentPage}`}
            style={{ width: `${zoom}%`, maxWidth: `${zoom}%` }}
            className="rounded shadow-md"
          />
        </div>
      </div>
    </div>
  );
}
