import React from "react";

// Package Card Shimmer
export const PackageSkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
    {/* Image Placeholder */}
    <div className="h-60 w-full bg-slate-200 shimmer" />
    {/* Content */}
    <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
      <div className="space-y-3">
        {/* Duration */}
        <div className="h-3 w-20 bg-slate-200 rounded shimmer" />
        {/* Title */}
        <div className="h-6 w-3/4 bg-slate-200 rounded shimmer" />
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3.5 w-full bg-slate-200 rounded shimmer" />
          <div className="h-3.5 w-5/6 bg-slate-200 rounded shimmer" />
        </div>
      </div>
      {/* Footer price & button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="space-y-1">
          <div className="h-2 w-10 bg-slate-200 rounded shimmer" />
          <div className="h-5 w-20 bg-slate-200 rounded shimmer" />
        </div>
        <div className="h-10 w-24 bg-slate-200 rounded-xl shimmer" />
      </div>
    </div>
  </div>
);

// Monastery Card Shimmer
export const MonasterySkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
    <div className="h-64 w-full bg-slate-200 shimmer" />
    <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-slate-200 rounded shimmer" />
        <div className="h-6 w-2/3 bg-slate-200 rounded shimmer" />
        <div className="h-3.5 w-full bg-slate-200 rounded shimmer" />
      </div>
      <div className="pt-4 border-t border-slate-50 flex gap-4">
        <div className="h-8 flex-1 bg-slate-200 rounded-lg shimmer" />
        <div className="h-8 flex-1 bg-slate-200 rounded-lg shimmer" />
      </div>
    </div>
  </div>
);

// Festival Card Shimmer
export const FestivalSkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
    <div className="h-60 w-full bg-slate-200 shimmer" />
    <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-3 w-16 bg-slate-200 rounded shimmer" />
        <div className="h-6 w-3/4 bg-slate-200 rounded shimmer" />
        <div className="h-3.5 w-full bg-slate-200 rounded shimmer" />
      </div>
      <div className="h-10 w-full bg-slate-200 rounded-xl shimmer" />
    </div>
  </div>
);

// Booking Journey Card Shimmer
export const BookingSkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 animate-pulse">
    {/* Left Image Placeholder */}
    <div className="w-full md:w-48 aspect-[4/3] rounded-2xl bg-slate-200 shimmer flex-shrink-0" />
    {/* Middle content */}
    <div className="flex-1 w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-6 w-1/2 bg-slate-200 rounded shimmer" />
        <div className="h-6 w-20 bg-slate-200 rounded-full shimmer" />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="h-4 w-28 bg-slate-200 rounded shimmer" />
        <div className="h-4 w-24 bg-slate-200 rounded shimmer" />
        <div className="h-4 w-20 bg-slate-200 rounded shimmer" />
      </div>
    </div>
    {/* Right actions */}
    <div className="w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 flex-shrink-0 flex flex-col gap-3">
      <div className="h-10 w-32 bg-slate-200 rounded-xl shimmer" />
      <div className="h-10 w-32 bg-slate-200 rounded-xl shimmer" />
      <div className="h-10 w-32 bg-slate-200 rounded-xl shimmer" />
    </div>
  </div>
);

// Detail Page Shimmer Placeholder (Hero header + text blocks + side cards)
export const DetailSkeleton = () => (
  <div className="min-h-screen bg-slate-50 pt-24 pb-16 animate-pulse">
    {/* Hero Header Shimmer */}
    <div className="h-[400px] w-full bg-slate-200 shimmer" />
    
    {/* Content Area */}
    <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Left Details */}
      <div className="lg:col-span-8 space-y-8">
        <div className="h-4 w-32 bg-slate-200 rounded shimmer" />
        <div className="h-10 w-2/3 bg-slate-200 rounded shimmer" />
        <div className="space-y-4">
          <div className="h-4 w-full bg-slate-200 rounded shimmer" />
          <div className="h-4 w-full bg-slate-200 rounded shimmer" />
          <div className="h-4 w-5/6 bg-slate-200 rounded shimmer" />
        </div>
        <div className="pt-8 space-y-4">
          <div className="h-8 w-48 bg-slate-200 rounded shimmer" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-slate-200 rounded-2xl shimmer" />
            <div className="h-24 bg-slate-200 rounded-2xl shimmer" />
          </div>
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-[2.5rem] p-8 space-y-6 border border-slate-100 shadow-sm">
          <div className="h-6 w-32 bg-slate-200 rounded shimmer" />
          <div className="h-12 w-full bg-slate-200 rounded-xl shimmer" />
          <div className="space-y-3">
            <div className="h-3 w-full bg-slate-200 rounded shimmer" />
            <div className="h-3 w-5/6 bg-slate-200 rounded shimmer" />
          </div>
          <div className="h-12 w-full bg-slate-200 rounded-xl shimmer" />
        </div>
      </div>
    </div>
  </div>
);
