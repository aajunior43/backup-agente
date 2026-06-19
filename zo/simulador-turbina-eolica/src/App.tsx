import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TurbineParams {
  windSpeed: number;
  bladeLength: number;
  bladeCount: number;
  airDensity: number;
  efficiency: number;
}

interface TurbineOutput {
  sweptArea: number;
  powerWind: number;
  powerElectric: number;
  tipSpeedRatio: number;
  rotationRPM: number;
  powerCoefficient: number;
  betzLimit: number;
}

function calculateTurbine(params: TurbineParams): TurbineOutput {
  const { windSpeed, bladeLength, bladeCount, airDensity, efficiency } = params;
  const sweptArea = Math.PI * bladeLength * bladeLength;
  const powerWind = 0.5 * airDensity * sweptArea * Math.pow(windSpeed, 3);
  const betzLimit = 16 / 27;

  const optimalTSR = bladeCount === 3 ? 6 : bladeCount === 2 ? 7 : 5;
  const tipSpeedRatio = optimalTSR * (windSpeed / 12);
  const rotationRPM = (tipSpeedRatio * windSpeed * 60) / (2 * Math.PI * bladeLength);

  const cpBase = 0.35;
  const speedFactor = windSpeed < 3 ? windSpeed / 3 : windSpeed > 25 ? 0 : 1;
  const cpCurve = windSpeed < 3
    ? (windSpeed / 3) * cpBase
    : windSpeed > 25
    ? 0
    : windSpeed > 12
    ? cpBase * (1 - ((windSpeed - 12) / 13) * 0.3)
    : cpBase * (0.5 + 0.5 * (windSpeed - 3) / 9);
  const powerCoefficient = Math.min(cpCurve * speedFactor, betzLimit);

  const powerElectric = powerWind * powerCoefficient * efficiency;

  return {
    sweptArea,
    powerWind,
    powerElectric,
    tipSpeedRatio,
    rotationRPM: Math.max(0, rotationRPM),
    powerCoefficient,
    betzLimit,
  };
}

function WindTurbineSVG({
  rotation,
  params,
}: {
  rotation: number;
  params: TurbineParams;
}) {
  const bl = params.bladeLength;
  const scale = 90 / Math.max(bl, 1);
  const bladeLen = bl * scale;

  const blades = Array.from({ length: params.bladeCount }, (_, i) => {
    const angle = (i * 360) / params.bladeCount + rotation;
    return (
      <g key={i} transform={`rotate(${angle}, 110, 130)`}>
        <path
          d={`M110,130 L${110 - 8},135 L110,${130 - bladeLen} L${110 + 8},135 Z`}
          fill="white"
          stroke="#94a3b8"
          strokeWidth="1"
          opacity="0.95"
        />
      </g>
    );
  });

  const cloudCount = Math.min(Math.floor(params.windSpeed / 3), 5);
  const clouds = Array.from({ length: cloudCount }, (_, i) => {
    const y = 30 + i * 35;
    const xOff = (i * 60 + (Date.now() / 100) % 200) % 220;
    return (
      <g key={i} opacity={0.3 + params.windSpeed * 0.03}>
        <ellipse cx={xOff} cy={y} rx="25" ry="10" fill="#94a3b8" />
        <ellipse cx={xOff + 15} cy={y - 5} rx="18" ry="8" fill="#94a3b8" />
        <ellipse cx={xOff - 10} cy={y + 2} rx="15" ry="7" fill="#94a3b8" />
      </g>
    );
  });

  const arrowCount = Math.min(Math.floor(params.windSpeed / 2), 8);
  const windArrows = Array.from({ length: arrowCount }, (_, i) => {
    const y = 150 + i * 15 - (arrowCount * 7);
    const animOffset = (Date.now() / (150 - params.windSpeed * 4)) % 50;
    return (
      <g key={i} opacity={0.5 + params.windSpeed * 0.04}>
        <line
          x1={5 + animOffset}
          y1={y}
          x2={35 + animOffset}
          y2={y}
          stroke="#38bdf8"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
      </g>
    );
  });

  return (
    <svg viewBox="0 0 220 260" className="w-full h-full">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
        </marker>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1445" />
          <stop offset="60%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#166534" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>

      <rect width="220" height="260" fill="url(#skyGrad)" rx="12" />
      {clouds}
      {windArrows}

      <path
        d="M0,210 Q30,205 60,210 Q90,215 120,210 Q150,205 180,210 Q200,212 220,210 L220,260 L0,260 Z"
        fill="url(#groundGrad)"
      />

      <polygon points="105,130 108,210 112,210 115,130" fill="#cbd5e1" />
      <rect x="95" y="205" width="30" height="10" rx="2" fill="#94a3b8" />

      <circle cx="110" cy="130" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="110" cy="130" r="3" fill="#475569" />

      {blades}

      {params.windSpeed > 0 && (
        <>
          <rect x="160" y="204" width="4" height="16" rx="2" fill="#facc15" opacity="0.8" />
          <rect x="155" y="198" width="14" height="3" rx="1" fill="#facc15" opacity="0.6" />
          {Array.from({ length: Math.min(Math.floor(params.windSpeed / 5), 3) }).map((_, i) => (
            <path
              key={`spark${i}`}
              d={`M${160 + (i - 1) * 8},${195 - i * 3} L${162 + (i - 1) * 8},${192 - i * 3} M${161 + (i - 1) * 8},${194 - i * 3} L${159 + (i - 1) * 8},${191 - i * 3}`}
              stroke="#facc15"
              strokeWidth="1.5"
              fill="none"
              opacity="0.6"
            />
          ))}
        </>
      )}
    </svg>
  );
}

function GaugeChart({
  value,
  max,
  label,
  unit,
  color,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
}) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 270;
  const rad = (angle - 135) * (Math.PI / 180);
  const endX = 50 + 40 * Math.cos(rad);
  const endY = 50 + 40 * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;

  const startRad = -135 * (Math.PI / 180);
  const sx = 50 + 40 * Math.cos(startRad);
  const sy = 50 + 40 * Math.sin(startRad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 80" className="w-full h-20">
        <path
          d={`M${sx.toFixed(1)},${sy.toFixed(1)} A40,40 0 ${largeArc},1 ${endX.toFixed(1)},${endY.toFixed(1)}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M46.4,78.3 A40,40 0 1,1 78.3,78.3`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.2"
        />
        <text x="50" y="55" textAnchor="middle" className="text-xs" fill="white" fontSize="10">
          {value < 1000 ? value.toFixed(1) : (value / 1000).toFixed(2)}
        </text>
      </svg>
      <div className="text-center -mt-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-[10px] text-slate-500">{unit}</div>
      </div>
    </div>
  );
}

function PowerCurveChart({ params }: { params: TurbineParams }) {
  const points: string[] = [];
  const pointsElec: string[] = [];
  const width = 280;
  const height = 100;
  const maxPower = 0.5 * params.airDensity * Math.PI * params.bladeLength ** 2 * 25 ** 3;
  const maxWind = 30;

  for (let ws = 0; ws <= 25; ws += 0.5) {
    const out = calculateTurbine({ ...params, windSpeed: ws });
    const x = (ws / maxWind) * width;
    const y = height - (out.powerWind / maxPower) * height;
    const ye = height - (out.powerElectric / maxPower) * height;
    points.push(`${x},${y}`);
    pointsElec.push(`${x},${ye}`);
  }

  const currentX = (params.windSpeed / maxWind) * width;
  const outNow = calculateTurbine(params);
  const currentYWind = height - (outNow.powerWind / maxPower) * height;
  const currentYElec = height - (outNow.powerElectric / maxPower) * height;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width + 30} ${height + 30}`} className="w-full h-32">
        <line x1="25" y1={height + 5} x2={width + 25} y2={height + 5} stroke="#475569" strokeWidth="1" />
        <line x1="25" y1="5" x2="25" y2={height + 5} stroke="#475569" strokeWidth="1" />
        <text x="25" y={height + 18} fill="#94a3b8" fontSize="8" textAnchor="middle">0</text>
        <text x={(12.5 / maxWind) * width + 25} y={height + 18} fill="#94a3b8" fontSize="8" textAnchor="middle">12</text>
        <text x={(25 / maxWind) * width + 25} y={height + 18} fill="#94a3b8" fontSize="8" textAnchor="middle">25</text>
        <text x="5" y="10" fill="#94a3b8" fontSize="7">P</text>
        <text x={width + 10} y={height + 18} fill="#94a3b8" fontSize="7">m/s</text>

        <polyline points={points.map(p => `${parseFloat(p.split(",")[0]) + 25},${p.split(",")[1] + 5}`).join(" ")} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
        <polyline points={pointsElec.map(p => `${parseFloat(p.split(",")[0]) + 25},${p.split(",")[1] + 5}`).join(" ")} fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.8" />

        <line x1={currentX + 25} y1="5" x2={currentX + 25} y2={height + 5} stroke="#facc15" strokeWidth="1.5" strokeDasharray="4,2" />

        <circle cx={currentX + 25} cy={currentYWind + 5} r="4" fill="#3b82f6" />
        <circle cx={currentX + 25} cy={currentYElec + 5} r="4" fill="#22c55e" />
      </svg>
      <div className="flex justify-center gap-4 text-[10px] mt-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Pot. Vento
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-green-500 inline-block" /> Pot. Elétrica
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-yellow-400 inline-block" /> Atual
        </span>
      </div>
    </div>
  );
}

export default function WindTurbineSimulator() {
  const [params, setParams] = useState<TurbineParams>({
    windSpeed: 10,
    bladeLength: 40,
    bladeCount: 3,
    airDensity: 1.225,
    efficiency: 0.85,
  });

  const [rotation, setRotation] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [output, setOutput] = useState<TurbineOutput>(calculateTurbine(params));

  useEffect(() => {
    setOutput(calculateTurbine(params));
  }, [params]);

  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current) {
        const dt = time - lastTimeRef.current;
        const speedFactor = params.windSpeed < 3 ? params.windSpeed / 3 : params.windSpeed > 25 ? 0 : 1;
        const rpm = calculateTurbine(params).rotationRPM * speedFactor;
        const degreesPerMs = (rpm * 360) / 60000;
        setRotation((r) => (r + degreesPerMs * dt) % 360);
      }
      lastTimeRef.current = time;
      animRef.current = requestAnimationFrame(animate);
    },
    [params]
  );

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = 0;
      animRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, animate]);

  const update = (key: keyof TurbineParams, value: number) =>
    setParams((p) => ({ ...p, [key]: value }));

  const formatPower = (w: number) => {
    if (w >= 1_000_000) return `${(w / 1_000_000).toFixed(2)} MW`;
    if (w >= 1_000) return `${(w / 1_000).toFixed(2)} kW`;
    return `${w.toFixed(2)} W`;
  };

  const housesPowered = Math.max(0, Math.floor(output.powerElectric / 5000));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            ⚡ Simulador de Turbina Eólica
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ajuste os parâmetros e veja como a energia eólica é convertida em eletricidade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Turbine Animation */}
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>🌬️ Turbina</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs border-slate-600"
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? "⏸ Pausar" : "▶ Iniciar"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-48 h-56">
                <WindTurbineSVG rotation={rotation} params={params} />
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2 text-center">
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <div className="text-lg font-bold text-cyan-400">{params.windSpeed.toFixed(1)}</div>
                  <div className="text-[10px] text-slate-400">m/s vento</div>
                </div>
                <div className="bg-slate-800/60 rounded-lg p-2">
                  <div className="text-lg font-bold text-green-400">{output.rotationRPM.toFixed(0)}</div>
                  <div className="text-[10px] text-slate-400">RPM</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🎛️ Parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Velocidade do Vento</span>
                  <Badge variant="secondary" className="text-xs bg-slate-700">
                    {params.windSpeed.toFixed(1)} m/s
                  </Badge>
                </div>
                <Slider
                  value={[params.windSpeed]}
                  onValueChange={([v]) => update("windSpeed", v)}
                  min={0}
                  max={30}
                  step={0.5}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Calmo</span>
                  <span>Furacão</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Comprimento das Pás</span>
                  <Badge variant="secondary" className="text-xs bg-slate-700">
                    {params.bladeLength} m
                  </Badge>
                </div>
                <Slider
                  value={[params.bladeLength]}
                  onValueChange={([v]) => update("bladeLength", v)}
                  min={5}
                  max={80}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Número de Pás</span>
                  <Badge variant="secondary" className="text-xs bg-slate-700">
                    {params.bladeCount}
                  </Badge>
                </div>
                <Slider
                  value={[params.bladeCount]}
                  onValueChange={([v]) => update("bladeCount", v)}
                  min={2}
                  max={5}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Densidade do Ar</span>
                  <Badge variant="secondary" className="text-xs bg-slate-700">
                    {params.airDensity.toFixed(3)} kg/m³
                  </Badge>
                </div>
                <Slider
                  value={[params.airDensity]}
                  onValueChange={([v]) => update("airDensity", v)}
                  min={0.8}
                  max={1.5}
                  step={0.005}
                  className="cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Eficiência Elétrica</span>
                  <Badge variant="secondary" className="text-xs bg-slate-700">
                    {(params.efficiency * 100).toFixed(0)}%
                  </Badge>
                </div>
                <Slider
                  value={[params.efficiency]}
                  onValueChange={([v]) => update("efficiency", v)}
                  min={0.5}
                  max={0.98}
                  step={0.01}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📊 Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <GaugeChart
                  value={output.powerElectric}
                  max={0.5 * params.airDensity * Math.PI * params.bladeLength ** 2 * 25 ** 3 * 0.59 * 0.98}
                  label="Potência"
                  unit={formatPower(output.powerElectric)}
                  color="#22c55e"
                />
                <GaugeChart
                  value={output.powerCoefficient}
                  max={0.59}
                  label="Cp"
                  unit={`${(output.powerCoefficient * 100).toFixed(1)}%`}
                  color="#3b82f6"
                />
                <GaugeChart
                  value={output.rotationRPM}
                  max={50}
                  label="RPM"
                  unit={`${output.rotationRPM.toFixed(0)} rpm`}
                  color="#f59e0b"
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Área Varrida</span>
                  <span className="text-white font-mono">
                    {output.sweptArea.toFixed(0)} m²
                  </span>
                </div>
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Pot. do Vento</span>
                  <span className="text-blue-400 font-mono">
                    {formatPower(output.powerWind)}
                  </span>
                </div>
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Pot. Elétrica</span>
                  <span className="text-green-400 font-mono font-bold">
                    {formatPower(output.powerElectric)}
                  </span>
                </div>
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Coef. Potência (Cp)</span>
                  <span className="text-yellow-400 font-mono">
                    {(output.powerCoefficient * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Limite Betz</span>
                  <span className="text-slate-300 font-mono">
                    {(output.betzLimit * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Rotação</span>
                  <span className="text-amber-400 font-mono">
                    {output.rotationRPM.toFixed(1)} RPM
                  </span>
                </div>
                <div className="flex justify-between bg-slate-800/50 rounded p-2">
                  <span className="text-slate-400">Casas abastecidas</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ~{housesPowered}
                  </span>
                </div>
              </div>

              <div className="mt-2 p-2 bg-blue-900/30 border border-blue-800/50 rounded text-[10px] text-slate-400">
                💡 Baseado no consumo médio de 5 kW por residência
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Power Curve */}
        <Card className="bg-slate-900/80 border-slate-700/50 mt-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">📈 Curva de Potência</CardTitle>
          </CardHeader>
          <CardContent>
            <PowerCurveChart params={params} />
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="bg-slate-900/80 border-slate-700/50 mt-4">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">🔧 Como Funciona uma Turbina Eólica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">💨</div>
                <div className="font-semibold text-blue-300">1. Vento</div>
                <div className="text-slate-400 mt-1">
                  O vento incide sobre as pás, exercendo força aerodinâmica que as faz girar.
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">⚙️</div>
                <div className="font-semibold text-cyan-300">2. Rotor</div>
                <div className="text-slate-400 mt-1">
                  As pás convertem energia cinética em rotação mecânica. O ângulo das pás é otimizado para máximo Cp.
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🔋</div>
                <div className="font-semibold text-yellow-300">3. Gerador</div>
                <div className="text-slate-400 mt-1">
                  A caixa multiplicadora aumenta a rotação para o gerador, que converte energia mecânica em elétrica.
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🏠</div>
                <div className="font-semibold text-green-300">4. Rede</div>
                <div className="text-slate-400 mt-1">
                  A eletricidade passa por transformadores e é distribuída para residências e indústrias.
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg text-xs">
              <span className="text-amber-400 font-semibold">📐 Limite de Betz:</span>{" "}
              <span className="text-slate-300">
                Nenhuma turbina pode extrair mais que <strong>59,3%</strong> da energia cinética do vento
                (16/27). Isso ocorre porque o vento precisa continuar fluindo para fora da turbina — 
                se extrair toda a energia, o ar pararia e não haveria fluxo. Turbinas reais operam 
                com Cp entre 35-45%.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}