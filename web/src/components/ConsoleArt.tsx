export default function ConsoleArt() {
  return (
    <svg
      className="console-art"
      viewBox="0 0 1000 450"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="room">
          <stop stopColor="#315222" stopOpacity=".8" />
          <stop offset="1" stopColor="#090e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="screen" x2="0" y2="1">
          <stop stopColor="#152b1a" />
          <stop offset="1" stopColor="#07130e" />
        </linearGradient>
        <linearGradient id="frog" x1="0" x2="1" y2="1">
          <stop stopColor="#a3c650" />
          <stop offset=".4" stopColor="#628b35" />
          <stop offset="1" stopColor="#233c21" />
        </linearGradient>
        <linearGradient id="jacket" x1="0" x2="1">
          <stop stopColor="#152923" />
          <stop offset=".45" stopColor="#34514b" />
          <stop offset="1" stopColor="#102820" />
        </linearGradient>
        <linearGradient id="desk" x2="0" y2="1">
          <stop stopColor="#28412b" />
          <stop offset="1" stopColor="#0b140f" />
        </linearGradient>
        <linearGradient id="fade">
          <stop stopColor="#0a100c" />
          <stop offset=".45" stopColor="#0a100c" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <pattern id="grid" width="30" height="24" patternUnits="userSpaceOnUse">
          <path d="M30 0H0V24" stroke="#406a3d" strokeWidth=".6" opacity=".4" />
        </pattern>
        <pattern id="crt" width="3" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 1h3" stroke="#050905" strokeOpacity=".3" />
        </pattern>
      </defs>
      <ellipse cx="670" cy="226" rx="400" ry="260" fill="url(#room)" />
      <g
        className="digital-rain"
        fill="#a1e770"
        opacity=".13"
        fontFamily="monospace"
        fontSize="10"
      >
        {Array.from({ length: 20 }, (_, i) => (
          <text
            key={i}
            x={240 + i * 38}
            y={-50 + (i % 5) * 20}
            style={{ writingMode: "vertical-rl" }}
          >
            01 11001 0101 00110 101 01
          </text>
        ))}
      </g>
      <path
        d="M300 40Q640 -5 989 48L962 252Q650 209 298 256Z"
        fill="#09160e"
        stroke="#567743"
        strokeWidth="2"
      />
      <path
        d="M312 51Q650 10 978 59L952 237Q650 198 310 241Z"
        fill="url(#screen)"
        stroke="#2e492b"
      />
      <path
        d="M312 51Q650 10 978 59L952 237Q650 198 310 241Z"
        fill="url(#grid)"
      />
      <path d="M542 29v194m222-195-8 194" stroke="#3d6533" strokeWidth="2" />
      <g fontFamily="monospace" fontSize="10" fill="#a7d889">
        <text x="333" y="68" opacity=".7">
          BTC / USDT
        </text>
        <text x="569" y="50" opacity=".7">
          MARKET STRUCTURE
        </text>
        <text x="799" y="64" opacity=".7">
          GLOBAL LIQUIDITY
        </text>
        <text x="337" y="92" fontSize="22" fill="#baf686">
          63,482.60
        </text>
        <text x="801" y="86" fontSize="18">
          +2.34%
        </text>
      </g>
      <path
        d="m324 206 16-8 10 4 12-27 13 8 9-19 11 5 15-22 12 7 10-3 15-31 12 8 8-8 12 15 8-5 15-35 17 5 16-24"
        stroke="#acfa64"
        strokeWidth="2"
      />
      <path
        d="m564 165 13 11 17-26 13 7 16-6 11-14 13 1 17 12 19-22 17 5 20-25 20 4"
        stroke="#80c58a"
        strokeWidth="1.5"
      />
      {Array.from({ length: 24 }, (_, i) => (
        <g
          key={i}
          stroke={i % 4 === 0 ? "#b98a61" : "#94cf6b"}
          fill={i % 4 === 0 ? "#b98a61" : "#94cf6b"}
        >
          <path
            d={`M${570 + i * 7} ${97 + Math.sin(i * 0.8) * 14 - i}v${18 + (i % 5) * 4}`}
          />
          <rect
            x={568 + i * 7}
            y={103 + Math.sin(i * 0.8) * 14 - i}
            width="4"
            height={9 + (i % 4) * 2}
          />
        </g>
      ))}
      {Array.from({ length: 17 }, (_, i) => (
        <rect
          key={i}
          x={801 + i * 8}
          y={192 - ((i * 17 + 11) % 74)}
          width="5"
          height={(i * 17 + 11) % 74}
          fill="#6cae4b"
          opacity={0.35 + (i % 3) * 0.15}
        />
      ))}
      <g stroke="#416b37" strokeWidth="1.2">
        <path d="M197 157 292 175v119l-97-24Z" fill="url(#screen)" />
        <path d="m210 173 68 14v68l-68-14Z" fill="url(#grid)" />
        <path d="m202 216 15-5 12 9 17-17 11 10 22-12" stroke="#88c05b" />
        <path d="m969 175-14 118 45-18V153Z" fill="url(#screen)" />
        <path d="m465 254 134-8-1 87-142 4Z" fill="url(#screen)" />
        <path d="m780 248 137 13 16 83-145-9Z" fill="url(#screen)" />
        <path d="m471 261 120-7v70l-128 5Z" fill="url(#grid)" />
        <path d="m790 258 120 10 11 63-123-6Z" fill="url(#grid)" />
      </g>
      <g fill="#b2f47c" fontFamily="monospace" fontSize="8" opacity=".8">
        <text x="479" y="272">
          WALLET FLOW
        </text>
        <text x="798" y="277">
          SIGNAL / 0048
        </text>
        <text x="799" y="293">
          TREND DETECTED
        </text>
        <text x="802" y="307">
          VERIFY CONDITIONS_
        </text>
      </g>
      <path
        d="m474 312 14-5 9 4 11-12 12 2 8-17 13 8 11-5 14 4 12-12"
        stroke="#b4ee78"
      />
      <path
        d="m304 281 126-17-5 87-136 21Z"
        fill="url(#screen)"
        stroke="#5a7b43"
      />
      <path d="m312 292 104-15-4 58-112 20Z" fill="url(#grid)" />
      <g fill="#95d660" opacity=".6">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={314 + i * 11}
            y={317 - i * 3}
            width="6"
            height={15 + i}
          />
        ))}
      </g>
      <path
        d="M184 328 447 301 992 324 1000 437 272 439Z"
        fill="url(#desk)"
        stroke="#465f38"
      />
      <path d="m188 342 807 31m-751 39 756 9" stroke="#273d2c" />
      <path
        className="data-stream"
        d="M208 318H380l30 36h140M983 367H847l-28-14h-58M525 16v17m256-5V7"
        stroke="#b4fb50"
        strokeWidth="2"
        strokeDasharray="5 8"
        opacity=".55"
      />
      <path d="m471 365 116-7 34 38-127 2Z" fill="#12231a" stroke="#577247" />
      <g stroke="#77955d" strokeWidth="3" opacity=".5">
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`m${482 + i * 5} ${371 + i * 6} 101 -3`} />
        ))}{" "}
      </g>
      <ellipse cx="752" cy="413" rx="154" ry="24" fill="#050a07" opacity=".6" />
      <path
        d="M658 282q-35 17-49 78l-44 15 6 17 84-12 29-49 100 5 21 42 60 9 7-23-36-14q-7-62-54-71Z"
        fill="url(#jacket)"
        stroke="#102317"
        strokeWidth="4"
      />
      <path
        d="m569 374-27 1-13 11 15 8 31-3Z"
        fill="url(#frog)"
        stroke="#233b23"
        strokeWidth="2"
      />
      <path
        d="m855 365 25 1 15 14-8 8-26-5Z"
        fill="url(#frog)"
        stroke="#233b23"
        strokeWidth="2"
      />
      <path
        d="M652 298q-43-34-30-72-8-33 13-44 21-10 36 6 46-18 69 6 30-2 45 22 18 31-7 62-47 37-126 20Z"
        fill="url(#frog)"
        stroke="#20391d"
        strokeWidth="4"
      />
      <path
        d="M633 205q13-20 32-6l-2 17-27 3Z"
        fill="#b1bf78"
        stroke="#3c5b2c"
        strokeWidth="3"
      />
      <path
        d="M683 198q23-20 38 3l-4 14-33-3Z"
        fill="#c1cb91"
        stroke="#3c5b2c"
        strokeWidth="3"
      />
      <path d="m637 212 27-3m20-2 34 3" stroke="#172119" strokeWidth="5" />
      <path d="m649 208 3 10m44-11v10" stroke="#0a160b" strokeWidth="6" />
      <path
        d="M622 240q21 17 54 5"
        stroke="#233f21"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M622 250q27 9 57 1"
        stroke="#b29257"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M680 292q42-1 61-18" stroke="#466a2e" strokeWidth="3" />
      <path d="M688 300q21 10 52-6" stroke="#719957" strokeWidth="4" />
      <path
        d="M654 351q49-20 117-8 22 7 20 39l-4 62H648l-8-58q-2-21 14-35Z"
        fill="#10201a"
        stroke="#496441"
        strokeWidth="3"
      />
      <path
        d="M662 361q48-12 96-5l10 69H656Z"
        fill="#1a2c24"
        stroke="#294333"
      />
      <path d="m702 370 24-2" stroke="#7ca15d" strokeWidth="3" />
      <path d="m945 330 26 3-4 34-24-2Z" fill="#18291b" stroke="#67814b" />
      <path d="m971 342 10 1-1 15-11 1" stroke="#67814b" strokeWidth="3" />
      <path
        d="M948 320q-6-10 1-20"
        stroke="#789668"
        strokeWidth="2"
        opacity=".35"
      />
      <path
        d="M304 40Q640 -5 989 48"
        stroke="#a9e471"
        opacity=".4"
        filter="url(#glow)"
        strokeWidth="5"
      />
      <rect width="1000" height="450" fill="url(#crt)" />
      <rect width="1000" height="450" fill="url(#fade)" />
    </svg>
  );
}
