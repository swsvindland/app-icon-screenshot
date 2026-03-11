interface DeviceFrameProps {
  platform: string;
  children: React.ReactNode;
  frameColor?: string;
}

export function DeviceFrame({ platform, children, frameColor = "black" }: DeviceFrameProps) {
  const isIPhone = platform === "iphone";
  const isIPad = platform === "ipad" || platform.startsWith("android7") || platform.startsWith("android10");
  const isAndroid = platform === "android";
  const isDesktop = platform === "macos" || platform === "web";
  
  const borderColorClass = frameColor === "silver" ? "border-slate-300" : "border-slate-900";
  const bgColorClass = frameColor === "silver" ? "bg-slate-200" : "bg-slate-900";
  
  const borderColorStyle = frameColor === "silver" ? "#cbd5e1" : "#0f172a";
  const bgColorStyle = frameColor === "silver" ? "#e2e8f0" : "#0f172a";

  if (isIPhone) {
    return (
      <div 
        className="relative mx-auto border-2 rounded-lg h-full w-full overflow-hidden"
        style={{ borderColor: borderColorStyle, borderStyle: 'solid' }}
      >
        {/* Screen */}
        <div className="absolute inset-0 overflow-hidden bg-white" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: 'white' }}>
          {children}
        </div>
      </div>
    );
  }

  if (isAndroid) {
    return (
        <div 
          className="relative mx-auto border-2 rounded-sm h-full w-full overflow-hidden"
          style={{ borderColor: borderColorStyle, borderStyle: 'solid' }}
        >
          {/* Screen */}
          <div className="absolute inset-0 overflow-hidden bg-white" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: 'white' }}>
            {children}
          </div>
        </div>
    );
  }

  if (isIPad) {
    return (
      <div 
        className="relative mx-auto rounded-[1rem] h-full w-full shadow-xl overflow-hidden"
        style={{ borderColor: borderColorStyle, borderStyle: 'solid', borderWidth: '8px', backgroundColor: '#0f172a' }}
      >
        {/* Screen */}
        <div className="absolute rounded-[0.75rem] overflow-hidden bg-white" style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px', overflow: 'hidden', backgroundColor: 'white' }}>
          {children}
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="relative h-full w-full flex flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div 
          className="relative rounded-t-lg h-full w-full shadow-xl overflow-hidden"
          style={{ borderColor: borderColorStyle, borderStyle: 'solid', borderWidth: '4px', backgroundColor: '#0f172a', position: 'relative' }}
        >
          {/* Top Bar */}
          <div 
            className="flex items-center px-2 gap-1"
            style={{ backgroundColor: bgColorStyle, height: '8px', display: 'flex', alignItems: 'center', paddingLeft: '8px', paddingRight: '8px', gap: '4px' }}
          >
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#f87171', width: '4px', height: '4px', borderRadius: '9999px' }}></div>
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#fbbf24', width: '4px', height: '4px', borderRadius: '9999px' }}></div>
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#4ade80', width: '4px', height: '4px', borderRadius: '9999px' }}></div>
          </div>
          {/* Screen */}
          <div className="relative flex-1 overflow-hidden bg-white" style={{ position: 'relative', flex: 1, overflow: 'hidden', backgroundColor: 'white' }}>
            {children}
          </div>
        </div>
        {/* Stand for macOS */}
        {platform === "macos" && (
          <div className="mx-auto w-1/4 h-2 rounded-b-md" style={{ backgroundColor: '#94a3b8', marginLeft: 'auto', marginRight: 'auto', width: '25%', height: '8px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' }}></div>
        )}
      </div>
    );
  }

  // Fallback for other platforms
  return (
    <div 
      className="relative mx-auto border-2 rounded-md h-full w-full overflow-hidden shadow-sm bg-white"
      style={{ borderColor: borderColorStyle, borderStyle: 'solid', backgroundColor: 'white' }}
    >
      {children}
    </div>
  );
}

export function getContrastColor(hexcolor: string) {
  if (!hexcolor) return "black";
  // If a name like 'none' or 'transparent' is passed (shouldn't happen with current UI)
  if (hexcolor.startsWith('#')) {
    hexcolor = hexcolor.replace("#", "");
  } else {
    return "black";
  }
  
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}
