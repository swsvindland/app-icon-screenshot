interface DeviceFrameProps {
  platform: string;
  children: React.ReactNode;
  frameColor?: string;
  scale?: number;
}

export function DeviceFrame({ platform, children, frameColor = "black", scale = 1 }: DeviceFrameProps) {
  const isIPhone = platform === "iphone";
  const isIPad = platform === "ipad" || platform.startsWith("android7") || platform.startsWith("android10");
  const isAndroid = platform === "android";
  const isDesktop = platform === "macos" || platform === "web";
  
  const borderColorStyle = frameColor === "silver" ? "#cbd5e1" : "#0f172a";
  const bgColorStyle = frameColor === "silver" ? "#e2e8f0" : "#0f172a";

  if (isIPhone) {
    return (
      <div 
        className="relative mx-auto h-full w-full overflow-hidden"
        style={{ 
          borderColor: borderColorStyle, 
          borderStyle: 'solid',
          borderWidth: `${2 * scale}px`,
          borderRadius: `${8 * scale}px`
        }}
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
          className="relative mx-auto h-full w-full overflow-hidden"
          style={{ 
            borderColor: borderColorStyle, 
            borderStyle: 'solid',
            borderWidth: `${2 * scale}px`,
            borderRadius: `${2 * scale}px`
          }}
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
        className="relative mx-auto h-full w-full shadow-xl overflow-hidden"
        style={{ 
          borderColor: borderColorStyle, 
          borderStyle: 'solid', 
          borderWidth: `${8 * scale}px`, 
          backgroundColor: '#0f172a',
          borderRadius: `${16 * scale}px` 
        }}
      >
        {/* Screen */}
        <div 
          className="absolute overflow-hidden bg-white" 
          style={{ 
            position: 'absolute', 
            top: `${4 * scale}px`, 
            left: `${4 * scale}px`, 
            right: `${4 * scale}px`, 
            bottom: `${4 * scale}px`, 
            overflow: 'hidden', 
            backgroundColor: 'white',
            borderRadius: `${12 * scale}px`
          }}
        >
          {children}
        </div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="relative h-full w-full flex flex-col" style={{ display: 'flex', flexDirection: 'column' }}>
        <div 
          className="relative h-full w-full shadow-xl overflow-hidden"
          style={{ 
            borderColor: borderColorStyle, 
            borderStyle: 'solid', 
            borderWidth: `${4 * scale}px`, 
            backgroundColor: '#0f172a', 
            position: 'relative',
            borderTopLeftRadius: `${8 * scale}px`,
            borderTopRightRadius: `${8 * scale}px`
          }}
        >
          {/* Top Bar */}
          <div 
            className="flex items-center"
            style={{ 
              backgroundColor: bgColorStyle, 
              height: `${8 * scale}px`, 
              display: 'flex', 
              alignItems: 'center', 
              paddingLeft: `${8 * scale}px`, 
              paddingRight: `${8 * scale}px`, 
              gap: `${4 * scale}px` 
            }}
          >
            <div className="rounded-full" style={{ backgroundColor: '#f87171', width: `${4 * scale}px`, height: `${4 * scale}px`, borderRadius: '9999px' }}></div>
            <div className="rounded-full" style={{ backgroundColor: '#fbbf24', width: `${4 * scale}px`, height: `${4 * scale}px`, borderRadius: '9999px' }}></div>
            <div className="rounded-full" style={{ backgroundColor: '#4ade80', width: `${4 * scale}px`, height: `${4 * scale}px`, borderRadius: '9999px' }}></div>
          </div>
          {/* Screen */}
          <div className="relative flex-1 overflow-hidden bg-white" style={{ position: 'relative', flex: 1, overflow: 'hidden', backgroundColor: 'white' }}>
            {children}
          </div>
        </div>
        {/* Stand for macOS */}
        {platform === "macos" && (
          <div className="mx-auto" style={{ backgroundColor: '#94a3b8', marginLeft: 'auto', marginRight: 'auto', width: '25%', height: `${8 * scale}px`, borderBottomLeftRadius: `${6 * scale}px`, borderBottomRightRadius: `${6 * scale}px` }}></div>
        )}
      </div>
    );
  }

  // Fallback for other platforms
  return (
    <div 
      className="relative mx-auto h-full w-full overflow-hidden shadow-sm bg-white"
      style={{ 
        borderColor: borderColorStyle, 
        borderStyle: 'solid', 
        borderWidth: `${2 * scale}px`,
        borderRadius: `${6 * scale}px`,
        backgroundColor: 'white' 
      }}
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
