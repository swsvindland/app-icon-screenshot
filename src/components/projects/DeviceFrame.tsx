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
  
  const borderColor = frameColor === "silver" ? "border-slate-300" : "border-slate-900";
  const bgColor = frameColor === "silver" ? "bg-slate-200" : "bg-slate-900";

  if (isIPhone) {
    return (
      <div className={`relative mx-auto border-[4px] ${borderColor} rounded-[1.25rem] h-full w-full bg-slate-900 shadow-xl overflow-hidden`}>
        {/* Screen */}
        <div className="absolute inset-0.5 rounded-[1.1rem] overflow-hidden bg-white">
          {children}
        </div>
      </div>
    );
  }

  if (isAndroid) {
    return (
      <div className={`relative mx-auto border-[4px] ${borderColor} rounded-[1.25rem] h-full w-full bg-slate-900 shadow-xl overflow-hidden`}>
        {/* Camera Hole */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rounded-full z-20"></div>
        {/* Screen */}
        <div className="absolute inset-0.5 rounded-[1.1rem] overflow-hidden bg-white">
          {children}
        </div>
      </div>
    );
  }

  if (isIPad) {
    return (
      <div className={`relative mx-auto border-[8px] ${borderColor} rounded-[1rem] h-full w-full bg-slate-900 shadow-xl overflow-hidden`}>
        {/* Screen */}
        <div className="absolute inset-1 rounded-[0.75rem] overflow-hidden bg-white">
          {children}
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="relative h-full w-full flex flex-col">
        <div className={`relative border-[4px] ${borderColor} rounded-t-lg h-full w-full bg-slate-900 shadow-xl overflow-hidden`}>
          {/* Top Bar */}
          <div className={`h-2 ${bgColor} flex items-center px-2 gap-1`}>
            <div className="w-1 h-1 rounded-full bg-red-400"></div>
            <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
            <div className="w-1 h-1 rounded-full bg-green-400"></div>
          </div>
          {/* Screen */}
          <div className="relative flex-1 overflow-hidden bg-white">
            {children}
          </div>
        </div>
        {/* Stand for macOS */}
        {platform === "macos" && (
          <div className="mx-auto w-1/4 h-2 bg-slate-400 rounded-b-md"></div>
        )}
      </div>
    );
  }

  // Fallback for other platforms
  return (
    <div className={`relative mx-auto border-[2px] ${borderColor} rounded-md h-full w-full overflow-hidden shadow-sm bg-white`}>
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
