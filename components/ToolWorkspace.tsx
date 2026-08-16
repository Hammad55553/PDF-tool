'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { ToolDef } from '@/lib/tools';
import { formatBytes, PLAN_LIMITS, type Plan } from '@/lib/plan';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error';

interface DoneResult {
  blobUrl: string;
  filename: string;
  size: number;
  meta?: Record<string, string>;
}

export default function ToolWorkspace({ tool }: { tool: ToolDef }) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DoneResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tool-specific option state
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3);
  const [watermarkPosition, setWatermarkPosition] = useState('diagonal');
  const [splitMode, setSplitMode] = useState<'range' | 'every'>('every');
  const [splitRange, setSplitRange] = useState('1-1');
  const [splitEveryN, setSplitEveryN] = useState(1);
  const [password, setPassword] = useState('');
  const [rotateAngle, setRotateAngle] = useState(90);
  const [pageNumPosition, setPageNumPosition] = useState('bottom-center');
  const [pageNumStart, setPageNumStart] = useState(1);
  const [cropMargin, setCropMargin] = useState(20);
  const [pageOrder, setPageOrder] = useState('');
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [keepAspect, setKeepAspect] = useState(true);
  const [imageFormat, setImageFormat] = useState('png');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [plan, setPlan] = useState<Plan>('free');
  const LIMITS = PLAN_LIMITS[plan];

  // Look up the signed-in user's real plan from Supabase (defaults to
  // 'free' while loading or if signed out) — this is only used to size the
  // client-side warnings/limits shown below. The server route re-checks the
  // real plan itself via the user's session cookie, so this can't be spoofed
  // to bypass limits (see app/api/tools/[tool]/route.ts).
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let cancelled = false;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user || cancelled) return;
      const { data: row } = await supabase
        .from('pdfkit_users')
        .select('plan')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!cancelled && (row?.plan === 'pro' || row?.plan === 'ultra')) setPlan(row.plan);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const inputFieldName = tool.multiple ? 'files' : 'file';

  function resetOutput() {
    setStatus(files.length ? 'ready' : 'idle');
    setError(null);
    setResult(null);
  }

  const onFilesChosen = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const newFiles = Array.from(list);
      setFiles((prev) => {
        if (!tool.multiple) return [newFiles[0]];
        // Avoid adding duplicates by comparing name and size
        const existingIdentifiers = new Set(prev.map((f) => `${f.name}-${f.size}`));
        const toAdd = newFiles.filter((f) => !existingIdentifiers.has(`${f.name}-${f.size}`));
        return [...prev, ...toAdd];
      });
      setStatus('ready');
      setError(null);
      setResult(null);
    },
    [tool.multiple],
  );

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    onFilesChosen(e.dataTransfer.files);
  }

  function removeFile(idx: number) {
    const next = files.filter((_, i) => i !== idx);
    setFiles(next);
    setStatus(next.length ? 'ready' : 'idle');
    setResult(null);
  }

  async function handleProcess() {
    if (files.length === 0) return;
    setStatus('processing');
    setUploadProgress(0);
    setError(null);
    setResult(null);

    const form = new FormData();
    for (const f of files) form.append(inputFieldName, f);

    if (tool.slug === 'watermark-pdf') {
      form.append('text', watermarkText);
      form.append('opacity', String(watermarkOpacity));
      form.append('position', watermarkPosition);
    }
    if (tool.slug === 'split-pdf') {
      if (splitMode === 'range') {
        form.append('range', splitRange);
      } else {
        form.append('everyNPages', String(splitEveryN));
      }
    }
    if (tool.slug === 'protect-pdf' || tool.slug === 'unlock-pdf') {
      form.append('password', password);
    }
    if (tool.slug === 'rotate-pdf') {
      form.append('angle', String(rotateAngle));
    }
    if (tool.slug === 'page-numbers') {
      form.append('position', pageNumPosition);
      form.append('startAt', String(pageNumStart));
    }
    if (tool.slug === 'crop-pdf') {
      form.append('margin', String(cropMargin));
    }
    if (tool.slug === 'organize-pdf') {
      form.append('order', pageOrder);
    }
    if (tool.slug === 'resize-image') {
      form.append('width', String(resizeWidth));
      form.append('height', String(resizeHeight));
      form.append('keepAspect', keepAspect ? '1' : '0');
    }
    if (tool.slug === 'crop-image') {
      form.append('width', String(resizeWidth));
      form.append('height', String(resizeHeight));
    }
    if (tool.slug === 'rotate-image') {
      form.append('angle', String(rotateAngle));
    }
    if (tool.slug === 'convert-image') {
      form.append('format', imageFormat);
    }
    if (tool.slug === 'add-background') {
      form.append('bgColor', bgColor);
    }

    try {
      const res = await axios.post(`/api/tools/${tool.slug}`, form, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : 'download';

      const meta: Record<string, string> = {};
      const origSize = res.headers['x-original-size'];
      const compSize = res.headers['x-compressed-size'];
      if (origSize) meta.originalSize = origSize;
      if (compSize) meta.compressedSize = compSize;
      const note = res.headers['x-note'];
      if (note) meta.note = decodeURIComponent(note);
      const realEnc = res.headers['x-real-encryption'];
      if (realEnc) meta.realEncryption = realEnc;

      setResult({ blobUrl, filename, size: blob.size, meta });
      setStatus('done');
    } catch (err: any) {
      const isAxiosError = axios.isAxiosError(err);
      if (isAxiosError && err.response && err.response.data) {
        // Blob responses need to be parsed if they contain JSON error messages
        const blobData = err.response.data;
        if (blobData instanceof Blob && blobData.type === 'application/json') {
          const text = await blobData.text();
          try {
            const json = JSON.parse(text);
            setError(json.error || 'Something went wrong while processing your file.');
          } catch {
            setError('Something went wrong while processing your file.');
          }
        } else {
          setError('Something went wrong while processing your file.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
      setStatus('error');
    }
  }

  // Client-side mirror of the server's checkPlanLimits() (lib/plan.ts), so the
  // Free plan's file-count/file-size limits are visible and enforced *before*
  // the user hits Process, not just after the server rejects the request.
  const limitError = useMemo(() => {
    if (files.length === 0) return null;
    if (files.length > LIMITS.maxFilesPerOperation) {
      return `Free plan allows up to ${LIMITS.maxFilesPerOperation} files per operation. You've selected ${files.length}. Remove some files or upgrade to Pro.`;
    }
    const oversized = files.find((f) => f.size > LIMITS.maxFileSizeBytes);
    if (oversized) {
      const maxMb = Math.round(LIMITS.maxFileSizeBytes / (1024 * 1024));
      return `Free plan allows files up to ${maxMb}MB. "${oversized.name}" is ${formatBytes(oversized.size)}. Remove it or upgrade to Pro.`;
    }
    return null;
  }, [files, plan]);

  const canProcess = useMemo(() => {
    if (files.length === 0) return false;
    if (limitError) return false;
    if (tool.multiple && tool.slug === 'merge-pdf' && files.length < 2) return false;
    return true;
  }, [files, tool, limitError]);

  return (
    <div className="space-y-8 relative">
      {status !== 'processing' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`dropzone group ${dragActive ? 'dropzone-active' : ''}`}
        >
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-all duration-300 sm:h-20 sm:w-20 ${dragActive ? 'scale-110 shadow-lg shadow-brand-500/20' : 'group-hover:scale-105'}`}>
            <div className={`absolute inset-0 rounded-full bg-brand-400/20 ${dragActive ? 'animate-ping' : ''}`}></div>
            <svg className="relative z-10 h-7 w-7 sm:h-10 sm:w-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="space-y-1 px-2">
            <p className="text-base font-semibold text-slate-800 sm:text-lg">
              Drag & drop {tool.multiple ? 'files' : 'a file'} here
            </p>
            <p className="text-sm text-slate-500">or click the button below</p>
          </div>
          <label className="btn-primary cursor-pointer mt-2 w-full sm:w-auto">
            Choose {tool.multiple ? 'files' : 'file'}
            <input
              type="file"
              accept={tool.accept}
              multiple={tool.multiple}
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onFilesChosen(e.target.files);
                }
              }}
            />
          </label>
          <p className="text-xs text-slate-400 mt-2 font-medium px-2 text-center">Free plan: up to 10MB per file, 2 files per batch</p>
        </div>
      )}

      {files.length > 0 && status !== 'processing' && status !== 'done' && (
        <div className="glass-panel overflow-hidden">
          <ul className="divide-y divide-slate-200/40">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 px-3 py-3 transition-colors hover:bg-white/40 group sm:px-5 sm:py-4">
                <div className="min-w-0 flex items-center gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="truncate font-semibold text-slate-800">{f.name}</p>
                    <p className="text-xs font-medium text-slate-500">{formatBytes(f.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="rounded-full p-2 text-slate-400 opacity-70 transition hover:bg-red-50 hover:text-red-600 hover:opacity-100"
                  title="Remove file"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tool-specific options */}
      {status !== 'processing' && status !== 'done' && files.length > 0 && (
        <ToolOptions
          tool={tool}
          watermarkText={watermarkText}
          setWatermarkText={setWatermarkText}
          watermarkOpacity={watermarkOpacity}
          setWatermarkOpacity={setWatermarkOpacity}
          watermarkPosition={watermarkPosition}
          setWatermarkPosition={setWatermarkPosition}
          splitMode={splitMode}
          setSplitMode={setSplitMode}
          splitRange={splitRange}
          setSplitRange={setSplitRange}
          splitEveryN={splitEveryN}
          setSplitEveryN={setSplitEveryN}
          password={password}
          setPassword={setPassword}
          rotateAngle={rotateAngle}
          setRotateAngle={setRotateAngle}
          pageNumPosition={pageNumPosition}
          setPageNumPosition={setPageNumPosition}
          pageNumStart={pageNumStart}
          setPageNumStart={setPageNumStart}
          cropMargin={cropMargin}
          setCropMargin={setCropMargin}
          pageOrder={pageOrder}
          setPageOrder={setPageOrder}
          resizeWidth={resizeWidth}
          setResizeWidth={setResizeWidth}
          resizeHeight={resizeHeight}
          setResizeHeight={setResizeHeight}
          keepAspect={keepAspect}
          setKeepAspect={setKeepAspect}
          imageFormat={imageFormat}
          setImageFormat={setImageFormat}
          bgColor={bgColor}
          setBgColor={setBgColor}
        />
      )}

      {limitError && status !== 'processing' && status !== 'done' && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">Free plan limit reached</p>
            <p className="mt-0.5">{limitError}</p>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <button onClick={handleProcess} disabled={!canProcess} className="btn-primary w-full text-base py-4">
          Process {tool.name}
        </button>
      )}
      {tool.slug === 'merge-pdf' && files.length === 1 && (
        <p className="text-center text-sm font-medium text-amber-600 bg-amber-50 py-2 rounded-lg">Add at least one more PDF to merge.</p>
      )}

      <AnimatePresence>
        {status === 'processing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md px-4 py-12 text-center shadow-lg sm:gap-6 sm:rounded-3xl sm:px-8 sm:py-20"
          >
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle className="text-slate-200" strokeWidth="6" stroke="currentColor" fill="transparent" r="46" cx="50" cy="50" />
                <motion.circle
                  className="text-brand-500"
                  strokeWidth="6"
                  strokeDasharray="289.026"
                  strokeDashoffset={289.026 - (uploadProgress / 100) * 289.026}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="46"
                  cx="50"
                  cy="50"
                  initial={{ strokeDashoffset: 289.026 }}
                  animate={{ strokeDashoffset: 289.026 - (uploadProgress / 100) * 289.026 }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-brand-700">{uploadProgress}%</span>
              </div>
            </div>
            
            <div className="space-y-1 w-full max-w-xs">
              <p className="text-xl font-bold text-slate-800">
                {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
              </p>
              <p className="text-sm text-slate-500">
                {uploadProgress < 100 
                  ? 'Transferring your file to the server.' 
                  : 'Almost done! Preparing your file.'}
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div 
                  className="h-full bg-gradient-to-r from-brand-500 to-accent-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ ease: "linear", duration: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'error' && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-6 text-center text-red-800 shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-bold text-lg">Could not process file</p>
          <p className="mt-1 text-red-700/80">{error}</p>
          <button onClick={resetOutput} className="btn-secondary mt-5">
            Try again
          </button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white px-5 py-8 text-center shadow-lg shadow-emerald-500/10 sm:rounded-3xl sm:px-8 sm:py-12">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-brand-400/10 blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm ring-4 ring-white sm:mb-6 sm:h-20 sm:w-20">
              <svg className="h-8 w-8 sm:h-10 sm:w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="text-xl font-extrabold text-slate-800 sm:text-2xl">Done! Your file is ready.</p>
            <p className="mt-2 text-sm font-medium text-slate-500">{formatBytes(result.size)}</p>

            {result.meta?.originalSize && result.meta?.compressedSize && (
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="line-through opacity-70">{formatBytes(Number(result.meta.originalSize))}</span>
                <span>→</span>
                <span>{formatBytes(Number(result.meta.compressedSize))}</span>
                <span className="ml-1 rounded-full bg-emerald-200/50 px-2 py-0.5 text-emerald-800">
                  {Math.max(
                    0,
                    Math.round(
                      (1 - Number(result.meta.compressedSize) / Number(result.meta.originalSize)) * 100,
                    ),
                  )}
                  % smaller
                </span>
              </div>
            )}

            {result.meta?.note && (
              <p className="mx-auto mt-6 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800 shadow-sm">
                {result.meta.note}
              </p>
            )}

            <div className="mt-8 flex flex-col items-center gap-4">
              <a href={result.blobUrl} download={result.filename} className="btn-primary w-full sm:w-auto px-8 py-4 text-base">
                Download {result.filename}
              </a>
              <button onClick={resetOutput} className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                Process another file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolOptionsProps {
  tool: ToolDef;
  watermarkText: string;
  setWatermarkText: (v: string) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (v: number) => void;
  watermarkPosition: string;
  setWatermarkPosition: (v: string) => void;
  splitMode: 'range' | 'every';
  setSplitMode: (v: 'range' | 'every') => void;
  splitRange: string;
  setSplitRange: (v: string) => void;
  splitEveryN: number;
  setSplitEveryN: (v: number) => void;
  password: string;
  setPassword: (v: string) => void;
  rotateAngle: number;
  setRotateAngle: (v: number) => void;
  pageNumPosition: string;
  setPageNumPosition: (v: string) => void;
  pageNumStart: number;
  setPageNumStart: (v: number) => void;
  cropMargin: number;
  setCropMargin: (v: number) => void;
  pageOrder: string;
  setPageOrder: (v: string) => void;
  resizeWidth: number;
  setResizeWidth: (v: number) => void;
  resizeHeight: number;
  setResizeHeight: (v: number) => void;
  keepAspect: boolean;
  setKeepAspect: (v: boolean) => void;
  imageFormat: string;
  setImageFormat: (v: string) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-brand-500/50 transition-all focus:border-brand-400 focus:bg-white focus:ring-4';

function ToolOptions(props: ToolOptionsProps) {
  const { tool } = props;

  if (tool.slug === 'rotate-pdf' || tool.slug === 'rotate-image') {
    return (
      <div className="space-y-3 glass-panel p-6">
        <label className="block text-sm font-semibold text-slate-800">Rotation</label>
        <div className="flex gap-2">
          {[90, 180, 270].map((a) => (
            <button
              key={a}
              onClick={() => props.setRotateAngle(a)}
              className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                props.rotateAngle === a ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {a}°
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tool.slug === 'page-numbers') {
    return (
      <div className="space-y-4 glass-panel p-6">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">Position</label>
          <select value={props.pageNumPosition} onChange={(e) => props.setPageNumPosition(e.target.value)} className={inputCls}>
            <option value="bottom-center">Bottom center</option>
            <option value="bottom-right">Bottom right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="top-center">Top center</option>
            <option value="top-right">Top right</option>
            <option value="top-left">Top left</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">Start at</label>
          <input type="number" min={1} value={props.pageNumStart} onChange={(e) => props.setPageNumStart(parseInt(e.target.value || '1', 10))} className={inputCls} />
        </div>
      </div>
    );
  }

  if (tool.slug === 'crop-pdf') {
    return (
      <div className="space-y-2 glass-panel p-6">
        <label className="block text-sm font-semibold text-slate-800">Margin to crop (points): {props.cropMargin}</label>
        <input type="range" min={5} max={100} step={5} value={props.cropMargin} onChange={(e) => props.setCropMargin(parseInt(e.target.value, 10))} className="w-full accent-brand-600" />
        <p className="text-xs text-slate-500">Trims this much off all four edges of every page.</p>
      </div>
    );
  }

  if (tool.slug === 'organize-pdf') {
    return (
      <div className="space-y-2 glass-panel p-6">
        <label className="block text-sm font-semibold text-slate-800">Page order</label>
        <input type="text" placeholder="e.g. 1,3,2 (omit a number to delete that page)" value={props.pageOrder} onChange={(e) => props.setPageOrder(e.target.value)} className={inputCls} />
        <p className="text-xs text-slate-500">List page numbers in the order you want. Leave a page out to delete it.</p>
      </div>
    );
  }

  if (tool.slug === 'resize-image' || tool.slug === 'crop-image') {
    const isCrop = tool.slug === 'crop-image';
    return (
      <div className="space-y-4 glass-panel p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Width (px)</label>
            <input type="number" min={1} value={props.resizeWidth} onChange={(e) => props.setResizeWidth(parseInt(e.target.value || '1', 10))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">Height (px)</label>
            <input type="number" min={1} value={props.resizeHeight} onChange={(e) => props.setResizeHeight(parseInt(e.target.value || '1', 10))} className={inputCls} />
          </div>
        </div>
        {isCrop ? (
          <p className="text-xs text-slate-500">Crops a {props.resizeWidth}×{props.resizeHeight}px area from the top-left.</p>
        ) : (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={props.keepAspect} onChange={(e) => props.setKeepAspect(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Keep aspect ratio (fit within width × height)
          </label>
        )}
      </div>
    );
  }

  if (tool.slug === 'convert-image') {
    return (
      <div className="space-y-2 glass-panel p-6">
        <label className="block text-sm font-semibold text-slate-800">Convert to</label>
        <select value={props.imageFormat} onChange={(e) => props.setImageFormat(e.target.value)} className={inputCls}>
          <option value="png">PNG</option>
          <option value="jpeg">JPG</option>
          <option value="webp">WEBP</option>
        </select>
      </div>
    );
  }

  if (tool.slug === 'add-background') {
    const presets = ['#ffffff', '#000000', '#3A42EA', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#64748B'];
    return (
      <div className="space-y-3 glass-panel p-6">
        <label className="block text-sm font-semibold text-slate-800">Background color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={props.bgColor}
            onChange={(e) => props.setBgColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          />
          <input
            type="text"
            value={props.bgColor}
            onChange={(e) => props.setBgColor(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((c) => (
            <button
              key={c}
              onClick={() => props.setBgColor(c)}
              style={{ backgroundColor: c }}
              className={`h-7 w-7 rounded-full border ${props.bgColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-brand-500 ring-offset-2' : 'border-slate-200'}`}
              aria-label={c}
            />
          ))}
        </div>
        <p className="text-xs text-slate-500">Works best on a transparent PNG (e.g. after Background Remover).</p>
      </div>
    );
  }

  if (tool.slug === 'watermark-pdf') {
    return (
      <div className="space-y-5 glass-panel p-6">
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">Watermark text</label>
          <input
            type="text"
            value={props.watermarkText}
            onChange={(e) => props.setWatermarkText(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-brand-500/50 transition-all focus:border-brand-400 focus:bg-white focus:ring-4"
          />
        </div>
        <div>
          <div className="mb-1 flex justify-between">
            <label className="text-sm font-semibold text-slate-800">Opacity</label>
            <span className="text-sm font-medium text-brand-600">{Math.round(props.watermarkOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={props.watermarkOpacity}
            onChange={(e) => props.setWatermarkOpacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-1">Position</label>
          <select
            value={props.watermarkPosition}
            onChange={(e) => props.setWatermarkPosition(e.target.value)}
            className="w-full rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-brand-500/50 transition-all focus:border-brand-400 focus:bg-white focus:ring-4"
          >
            <option value="center">Center</option>
            <option value="diagonal">Diagonal</option>
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
          </select>
        </div>
      </div>
    );
  }

  if (tool.slug === 'split-pdf') {
    return (
      <div className="space-y-5 glass-panel p-6">
        <div className="flex rounded-xl bg-slate-100/60 p-1 shadow-inner border border-slate-200/50">
          <button
            onClick={() => props.setSplitMode('every')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              props.splitMode === 'every' ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            Split every N pages
          </button>
          <button
            onClick={() => props.setSplitMode('range')}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              props.splitMode === 'range' ? 'bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            Extract page range
          </button>
        </div>
        
        {props.splitMode === 'every' ? (
          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-800 mb-1">Pages per file</label>
            <input
              type="number"
              min={1}
              value={props.splitEveryN}
              onChange={(e) => props.setSplitEveryN(parseInt(e.target.value || '1', 10))}
              className="w-full rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-brand-500/50 transition-all focus:border-brand-400 focus:bg-white focus:ring-4"
            />
            <p className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Result will be a single PDF, or a ZIP if multiple files are created.
            </p>
          </div>
        ) : (
          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-800 mb-1">Page range</label>
            <input
              type="text"
              placeholder="e.g. 1-3 or 2,4,6"
              value={props.splitRange}
              onChange={(e) => props.setSplitRange(e.target.value)}
              className="w-full rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-brand-500/50 transition-all focus:border-brand-400 focus:bg-white focus:ring-4"
            />
          </div>
        )}
      </div>
    );
  }

  if (tool.slug === 'protect-pdf' || tool.slug === 'unlock-pdf') {
    return (
      <div className="space-y-3 glass-panel p-6">
        <label className="block text-sm font-semibold text-slate-800 mb-1">
          {tool.slug === 'protect-pdf' ? 'Choose a password' : 'Enter the PDF password'}
        </label>
        <input
          type="password"
          value={props.password}
          onChange={(e) => props.setPassword(e.target.value)}
          minLength={4}
          className="w-full rounded-xl border border-slate-200/70 bg-white/60 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none ring-brand-500/50 transition-all focus:border-brand-400 focus:bg-white focus:ring-4"
          placeholder="At least 4 characters"
        />
        {tool.slug === 'protect-pdf' && (
          <div className="mt-3 rounded-lg border border-amber-200/50 bg-amber-50/50 p-3 flex gap-2 items-start">
            <svg className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-xs font-medium text-amber-700">
              Note: real AES-256 encryption requires <code>qpdf</code> installed on the server. Otherwise a metadata lock is applied.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
