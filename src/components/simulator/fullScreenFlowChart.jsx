// components/FullScreenFlowChart.jsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Filter, Download } from 'lucide-react';
import FlowChart from './FlowChart';
import html2canvas from 'html2canvas';

const STREAM_CONFIG = [
  { num: 1, label: { en: 'Science', hi: 'विज्ञान' } },
  { num: 2, label: { en: 'Commerce', hi: 'कॉमर्स' } },
  { num: 3, label: { en: 'Arts/Humanities', hi: 'कला/मानविकी' } },
  { num: 4, label: { en: 'Diploma/Vocational', hi: 'डिप्लोमा/व्यावसायिक' } },
  { num: 5, label: { en: 'New-Age Careers', hi: 'नई-उम्र करियर' } },
];

const FullScreenFlowChart = ({ onClose, getLabel: getLabelFn = (item, lang = 'en') => item.label?.[lang] || item.label?.en || item, lang = 'en' }) => {
  const [selectedStreams, setSelectedStreams] = useState([1, 2, 3, 4, 5]);
  const [searchQuery, setSearchQuery] = useState('');
  const flowWrapperRef = useRef(null);

  const toggleStream = useCallback((num) => {
    setSelectedStreams(prev => 
      prev.includes(num) 
        ? prev.filter(s => s !== num)
        : [...prev, num]
    );
  }, []);

  // SMART EXPORT: Only visible nodes + edges
  const exportAsPNG = useCallback(async () => {
    if (!flowWrapperRef.current) return;

    const reactFlowPane = flowWrapperRef.current.querySelector('.react-flow__pane');
    const reactFlowNodes = flowWrapperRef.current.querySelectorAll('.react-flow__node:not([style*="display: none"]):not([data-hidden="true"])');
    const reactFlowEdges = flowWrapperRef.current.querySelectorAll('.react-flow__edge');

    if (!reactFlowPane || reactFlowNodes.length === 0) {
      alert("No visible content to export.");
      return;
    }

    // === 1. Find bounds of visible nodes ===
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    reactFlowNodes.forEach(node => {
      const rect = node.getBoundingClientRect();
      const parentRect = reactFlowPane.getBoundingClientRect();

      const x = rect.left - parentRect.left;
      const y = rect.top - parentRect.top;
      const w = rect.width;
      const h = rect.height;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    });

    // Add padding
    const PADDING = 80;
    minX -= PADDING;
    minY -= PADDING;
    maxX += PADDING;
    maxY += PADDING;

    const width = maxX - minX;
    const height = maxY - minY;

    if (width <= 0 || height <= 0) {
      alert("No visible area to export.");
      return;
    }

    // === 2. Hide UI elements ===
    const controls = document.querySelectorAll('.react-flow__controls, .react-flow__minimap');
    const originalDisplay = [];
    controls.forEach(el => {
      originalDisplay.push(el.style.display);
      el.style.display = 'none';
    });

    try {
      // === 3. Create canvas of exact area ===
      const canvas = await html2canvas(reactFlowPane, {
        x: minX,
        y: minY,
        width: width,
        height: height,
        backgroundColor: '#f8fafc',
        scale: window.devicePixelRatio * 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      });

      // === 4. Download ===
      const link = document.createElement('a');
      link.download = `Career-Flow-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      console.log("Smart export successful!");
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      // === 5. Restore UI ===
      controls.forEach((el, i) => {
        el.style.display = originalDisplay[i] || '';
      });
    }
  }, []);

  const streamLabel = (config) => getLabelFn ? getLabelFn(config, lang) : config.label[lang] || config.label.en;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-blue-900/20"></div>
      
      <div className="relative bg-white/95 backdrop-blur-lg w-[98vw] h-[98vh] max-w-[2000px] max-h-[98vh] rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-2xl text-gray-800">Career Flowchart Explorer</h2>
              <p className="text-sm text-gray-600">Navigate your future paths interactively</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search careers..."
                className="pl-10 pr-4 py-2 bg-white/80 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-64 transition-all"
              />
            </div>

            <button
              onClick={exportAsPNG}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export PNG
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-indigo-50">
          {/* Sidebar */}
          <div className="absolute left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-sm border-r border-gray-200 p-6 space-y-4 overflow-y-auto z-20">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-800">Stream Filters</h3>
            </div>
            {selectedStreams.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 text-xs text-yellow-700">
                No streams selected. Select at least one to view paths.
              </div>
            )}
            <div className="space-y-2">
              {STREAM_CONFIG.map((config) => (
                <label key={config.num} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStreams.includes(config.num)}
                    onChange={() => toggleStream(config.num)}
                    className="rounded border-gray-300 focus:ring-indigo-500 h-4 w-4 text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{streamLabel(config)}</span>
                </label>
              ))}
            </div>
            <button 
              onClick={() => setSelectedStreams(selectedStreams.length === 5 ? [] : [1, 2, 3, 4, 5])}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
            >
              {selectedStreams.length === 5 ? 'Clear All' : 'Select All'}
            </button>
          </div>

          {/* FlowChart */}
          <div className="absolute inset-0 md:left-64" ref={flowWrapperRef}>
            <FlowChart
              isFullScreen={true}
              onCloseFullScreen={onClose}
              selectedStreams={selectedStreams}
              searchQuery={searchQuery}
            />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-white/10 backdrop-blur-md border-t border-white/20">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Science</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Commerce</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenFlowChart;