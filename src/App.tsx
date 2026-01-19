import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, BarChart, Bar, Cell, LabelList
} from 'recharts';
import { 
  Briefcase, Activity, Menu, X, FileText, CheckCircle, 
  LayoutDashboard, Info, RefreshCw, AlertTriangle, PieChart as PieChartIcon, Building2, Wallet, Scale, Calculator, ArrowLeft, Users, TrendingDown, Flag, Database, ExternalLink, DollarSign, Clock, Settings, Edit3, CheckSquare, Square, Save, Lock, LogOut
} from 'lucide-react';

// =================================================================================
// 🌐 CONFIGURACIÓN GOOGLE SHEETS
// =================================================================================
// PEGA AQUÍ TU ENLACE CSV (Archivo -> Compartir -> Publicar en la web -> CSV)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMdJgnalKKHy5JaPC0gFXxLqk2RDGkysZhhLQbtOVYe_La0IP06a6GHW0sz-2rcP1-kfLIdNIu7TrN/pub?gid=0&single=true&output=csv"; 

// =================================================================================
// 🏗️ DATOS MAESTROS - PROYECTO AVENIDA DEL MORENO
// =================================================================================
const MASTER_PROJECT_DATA = {
    name: "CONST. LA AVENIDA DEL MORENO (PAVIMENTO AVENIDA DE LA INTEGRACIÓN) - GAM ORURO",
    contractNumber: "SMAJ-LP-10-2025",
    entity: "Gobierno Autónomo Municipal de Oruro (GAMO)",
    contractor: "C.I.C.C.P. S.R.L.",
    contractorRep: "Arq. Blanca Cruz Gutierrez",
    supervisor: "Asociación Accidental BIM MORENO",
    supervisorRep: "Mgr. Ing. Zacarias Ortega R.",
    fiscal: "GAMO",
    fiscalRep: "Ing. Luis Alberto Olorio Bazan",
    surfaceArea: "22,000.00",
    signingDate: "2025-06-20",
    startDate: "2025-07-03", 
    originalDuration: 290,
    originalEndDate: "2026-04-18",
    originalAmount: 21360803.45,
    advanceAmount: 4272160.69,
    advancePercent: 20.00,
};

const PROJECT_MILESTONES = [
    { id: 1, day: 126, percent: 12.50, desc: "Avance Financiero 12.50%" },
    { id: 2, day: 251, percent: 46.00, desc: "Avance Financiero 46.00%" },
    { id: 3, day: 380, percent: 100.00, desc: "Entrega Definitiva (100%)" }
];

const MODIFICATIONS = [
    { id: 'CM-1', name: 'Contrato Modificatorio N°1', type: 'CM', date: '2025-11-20', days: 90, amount: 2123782.08, desc: 'Incremento de monto y ampliación de plazo', active: true },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

// DATOS DE RESPALDO (MOCK DATA)
// Se usan solo si no hay enlace de Google Sheets conectado
const FALLBACK_ITEMS = [
    { modulo: 'M1 - INSTALACIÓN DE FAENAS', item: '1', actividad: 'INSTALACIÓN DE FAENAS', unidad: 'GLB', fecha_inicio: '2025-07-05', fecha_fin: '2025-07-20', cantidad_original: 1, cantidad_vigente: 1, precio_unitario: 350000.00, p1_cant: 1 },
    { modulo: 'M1 - INSTALACIÓN DE FAENAS', item: '2', actividad: 'LETRERO DE OBRA', unidad: 'PZA', fecha_inicio: '2025-07-05', fecha_fin: '2025-07-10', cantidad_original: 2, cantidad_vigente: 2, precio_unitario: 5000.00, p1_cant: 2 },
    { modulo: 'M2 - MOVIMIENTO DE TIERRAS', item: '3', actividad: 'EXCAVACIÓN NO CLASIFICADA', unidad: 'M3', fecha_inicio: '2025-07-15', fecha_fin: '2025-09-30', cantidad_original: 35000, cantidad_vigente: 35000, precio_unitario: 65.00, p1_cant: 5000, p2_cant: 15000, p3_cant: 15000 },
    { modulo: 'M2 - MOVIMIENTO DE TIERRAS', item: '4', actividad: 'CONFORMACIÓN DE TERRAPLÉN', unidad: 'M3', fecha_inicio: '2025-08-01', fecha_fin: '2025-10-15', cantidad_original: 25000, cantidad_vigente: 25000, precio_unitario: 80.00, p1_cant: 0, p2_cant: 5000, p3_cant: 10000, p4_cant: 10000 },
    { modulo: 'M3 - PAVIMENTO RÍGIDO', item: '5', actividad: 'CAPA SUB BASE (e=20cm)', unidad: 'M2', fecha_inicio: '2025-09-01', fecha_fin: '2025-11-30', cantidad_original: 22000, cantidad_vigente: 22000, precio_unitario: 120.00, p3_cant: 5000, p4_cant: 10000, p5_cant: 7000 },
    { modulo: 'M3 - PAVIMENTO RÍGIDO', item: '6', actividad: 'LOSA HORMIGÓN (e=20cm)', unidad: 'M2', fecha_inicio: '2025-09-15', fecha_fin: '2025-12-20', cantidad_original: 22000, cantidad_vigente: 22000, precio_unitario: 450.00, p3_cant: 2000, p4_cant: 8000, p5_cant: 8000, p6_cant: 4000 },
    { modulo: 'M4 - OBRAS DE ARTE', item: '8', actividad: 'CUNETAS DE HORMIGÓN', unidad: 'ML', fecha_inicio: '2025-10-01', fecha_fin: '2026-01-15', cantidad_original: 3500, cantidad_vigente: 3500, precio_unitario: 250.00, p4_cant: 500, p5_cant: 1500, p6_cant: 1500 },
];

// --- UTILIDADES ---
const formatCurrency = (val: any) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(val) || 0);
const formatDateShort = (date: any) => date.toLocaleDateString('es-BO', { month: 'short', year: '2-digit' });
const calculateDaysElapsed = (startStr: string) => {
    const start = new Date(startStr);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Lector CSV Interno (Sin dependencias externas)
const parseCSVInternal = (csvText: string) => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    // Limpieza de encabezados
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\r\n]+/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue;
        
        // Split simple respetando comillas
        const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const entry: any = {};
        
        headers.forEach((header, index) => {
            let val = values[index] ? values[index].trim() : '';
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            
            // Detección de columnas numéricas
            if (['cantidad_original', 'cantidad_vigente', 'precio_unitario'].includes(header) || header.includes('_cant')) {
                 entry[header] = Number(val.replace(/[^0-9.-]+/g,"")) || 0;
            } else {
                 entry[header] = val;
            }
        });
        
        // Solo agregar si tiene ítem válido
        if(entry.item) data.push(entry);
    }
    return data;
};

// --- COMPONENTES UI ---

const KPICard = ({ label, value, subtext, icon: Icon, color, isPercentage }: any) => {
    const colorStyles: any = {
        blue: "bg-slate-800 border-slate-700 text-blue-400",
        emerald: "bg-slate-800 border-slate-700 text-emerald-400",
        amber: "bg-slate-800 border-slate-700 text-amber-400",
        rose: "bg-slate-800 border-slate-700 text-rose-400",
        indigo: "bg-slate-800 border-slate-700 text-indigo-400",
        slate: "bg-slate-800 border-slate-700 text-slate-400",
        violet: "bg-slate-800 border-slate-700 text-violet-400",
        cyan: "bg-slate-800 border-slate-700 text-cyan-400",
        orange: "bg-slate-800 border-slate-700 text-orange-400"
    };
    const barColorClass = colorStyles[color]?.split(' ').find((c:string) => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-slate-500';
    const valStr = String(value);
    const numVal = parseFloat(valStr.replace(/[^0-9.-]+/g,""));

    return (
        <div className={`p-4 rounded-xl border shadow-lg flex flex-col justify-between h-full transition-transform hover:scale-[1.01] duration-200 ${colorStyles[color] || colorStyles.slate}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 text-slate-300 truncate">{label}</span>
                <Icon size={16} className="opacity-90 flex-shrink-0"/>
            </div>
            <div className="text-base md:text-lg font-medium tracking-tight whitespace-pre-wrap text-slate-100 break-words">{value}</div>
            {isPercentage && (
                <div className="w-full bg-slate-700/50 rounded-full h-1 mt-2">
                    <div className={`h-1 rounded-full ${barColorClass}`} style={{width: `${Math.min(numVal || 0, 100)}%`}}></div>
                </div>
            )}
            {subtext && <div className="text-[9px] md:text-[10px] mt-1 font-medium opacity-60 text-slate-300 whitespace-pre-line">{subtext}</div>}
        </div>
    );
};

const MilestoneCard = ({ currentDays, totalAmount }: any) => {
    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4 h-full">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Flag className="text-yellow-500" size={16}/>
                <div>
                    <h3 className="font-bold text-slate-100 text-xs">Control de Hitos</h3>
                    <p className="text-[9px] text-slate-400">Día actual: <span className="text-white font-bold">{currentDays}</span></p>
                </div>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-60">
                {PROJECT_MILESTONES.map((hito) => {
                    const daysRemaining = hito.day - currentDays;
                    let statusColor = "border-slate-700 bg-slate-800/50 text-slate-400";
                    let statusText = `Faltan ${daysRemaining} días`;
                    let IconStatus = Clock;

                    if (daysRemaining < 0) {
                        statusColor = "border-emerald-900/50 bg-emerald-900/10 text-emerald-400";
                        statusText = "Cumplido";
                        IconStatus = CheckCircle;
                    } else if (daysRemaining <= 30) {
                        statusColor = "border-rose-900/50 bg-rose-900/10 text-rose-400 animate-pulse";
                        statusText = `¡ALERTA! ${daysRemaining} días`;
                        IconStatus = AlertTriangle;
                    } else if (daysRemaining <= 60) {
                        statusColor = "border-amber-900/50 bg-amber-900/10 text-amber-400";
                        statusText = `Atención: ${daysRemaining} días`;
                        IconStatus = AlertTriangle;
                    }
                    const targetAmount = totalAmount * (hito.percent / 100);
                    return (
                        <div key={hito.id} className={`border rounded-md p-2 flex flex-col sm:flex-row justify-between items-start sm:items-center ${statusColor} gap-1`}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <IconStatus size={12}/>
                                    <span className="text-[10px] font-bold uppercase">Hito {hito.id} (Día {hito.day})</span>
                                </div>
                                <p className="text-[9px] mt-0.5">{hito.desc}</p>
                                <p className="text-[9px] font-mono opacity-80">Meta: {formatCurrency(targetAmount)}</p>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto mt-1 sm:mt-0">
                                <span className="text-[9px] font-bold block">{statusText}</span>
                                <span className="text-[8px] opacity-70">{hito.percent}% Total</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ProjectSheet = ({ onBack, data }: any) => {
    const projectData = data || MASTER_PROJECT_DATA;
    const displayDate = projectData.calculatedEndDate || projectData.originalEndDate;
    const displayDays = projectData.totalDays || projectData.originalDuration;
    const displayAmount = projectData.totalAmount || projectData.originalAmount;
    const modsToShow = MODIFICATIONS;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col animate-fade-in text-slate-200">
            <div className="bg-slate-900 p-4 shadow-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="bg-blue-600/20 p-2 rounded-lg flex-shrink-0 text-blue-400"><Building2 size={20}/></div>
                        <div><h1 className="text-base md:text-lg font-bold uppercase tracking-tight text-white">Ficha Técnica</h1><p className="text-[10px] text-slate-400 line-clamp-1">{projectData.name}</p></div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-bold text-xs border border-slate-700 flex items-center gap-2 transition-colors"><ArrowLeft size={14}/> Dashboard</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Monto Vigente</p>
                            <p className="text-lg font-medium text-white mt-1">{formatCurrency(displayAmount)}</p>
                            <p className="text-[9px] bg-slate-800 text-slate-300 inline-block px-1.5 py-0.5 rounded mt-2 font-bold">{projectData.hasActiveMods ? 'Con Modificaciones' : 'Original'}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Plazo Vigente</p>
                            <p className="text-lg font-medium text-white mt-1">{displayDate}</p>
                            <p className="text-[9px] text-blue-400 bg-blue-900/20 inline-block px-1.5 py-0.5 rounded mt-2 font-bold">{displayDays} días</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800"><h3 className="font-bold text-white flex items-center gap-2 text-xs"><Briefcase size={14} className="text-slate-400"/> Datos Contractuales</h3></div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Monto Original</span><span className="font-medium text-slate-200">{formatCurrency(projectData.originalAmount)}</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Plazo Original</span><span className="font-medium text-slate-200">{projectData.originalDuration} días</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Orden de Proceder</span><span className="font-medium text-slate-200">{projectData.startDate}</span></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Monto Vigente</span><span className="font-bold text-emerald-400">{formatCurrency(displayAmount)}</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Fecha Fin</span><span className="font-bold text-blue-400">{displayDate}</span></div>
                                <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Duración Total</span><span className="font-medium text-slate-200">{displayDays} días</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
                        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800"><h3 className="font-bold text-white flex items-center gap-2 text-xs"><Users size={14} className="text-slate-400"/> Actores</h3></div>
                        <div className="p-4 grid grid-cols-1 gap-4 text-xs">
                            <div className="border-b border-slate-800 pb-2">
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Entidad Contratante</p>
                                <p className="font-bold text-white text-xs">{projectData.entity}</p>
                            </div>
                            <div className="border-b border-slate-800 pb-2">
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Empresa Contratista</p>
                                <p className="font-bold text-white text-xs mb-0.5">{projectData.contractor}</p>
                                <p className="text-slate-400"><span className="text-slate-500">Rep. Legal:</span> {projectData.contractorRep}</p>
                            </div>
                            <div className="border-b border-slate-800 pb-2">
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Supervisión</p>
                                <p className="font-bold text-white text-xs mb-0.5">{projectData.supervisor}</p>
                                <p className="text-slate-400"><span className="text-slate-500">Gerente:</span> {projectData.supervisorRep}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Fiscalización</p>
                                <p className="font-bold text-white text-xs mb-0.5">{projectData.fiscal}</p>
                                <p className="text-slate-400"><span className="text-slate-500">Fiscal:</span> {projectData.fiscalRep}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="md:col-span-4 space-y-6">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex flex-col h-full">
                        <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-800"><h3 className="font-bold text-white flex items-center gap-2 text-xs"><Scale size={14} className="text-slate-400"/> Historial Legal</h3></div>
                        <div className="p-4 flex-1 overflow-y-auto max-h-[600px]">
                            <div className="relative border-l-2 border-slate-700 ml-3 space-y-6">
                                {modsToShow.map((mod: any, idx: any) => (
                                    <div key={idx} className="relative pl-6">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 shadow-sm ${mod.amount > 0 ? 'bg-emerald-500' : mod.days > 0 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-bold text-slate-900 bg-slate-400 px-1.5 rounded">{mod.id}</span>
                                            {mod.active ? <span className="text-[8px] bg-emerald-900/30 text-emerald-400 px-1 rounded border border-emerald-900">ACTIVO</span> : <span className="text-[8px] bg-slate-800 text-slate-500 px-1 rounded">INACTIVO</span>}
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-200">{mod.name}</h4>
                                        <p className="text-[9px] text-slate-500 italic mt-0.5">{mod.desc}</p>
                                        {mod.amount > 0 && <p className="text-[10px] font-bold mt-1 text-emerald-400">+{formatCurrency(mod.amount)}</p>}
                                        {mod.days > 0 && <p className="text-[10px] font-bold mt-0.5 text-blue-400">+{mod.days} días</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODALES (Simulados para Demo) ---
const LoginModal = ({ onClose, onLoginSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: any) => {
        e.preventDefault();
        // Login simulado para que puedas ver el menú admin
        if(email === 'admin@obra.com' && password === '123456') {
            onLoginSuccess({ email: 'admin@obra.com' });
            onClose();
        } else {
            setError('Credenciales Demo: admin@obra.com / 123456');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
             <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 w-full max-w-sm">
                 <h2 className="text-white font-bold mb-4">Acceso Admin (Demo)</h2>
                 <form onSubmit={handleLogin} className="space-y-4">
                     <input type="text" placeholder="Usuario" className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600" value={email} onChange={e => setEmail(e.target.value)}/>
                     <input type="password" placeholder="Contraseña" className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600" value={password} onChange={e => setPassword(e.target.value)}/>
                     {error && <p className="text-red-400 text-xs">{error}</p>}
                     <div className="flex gap-2">
                         <button type="button" onClick={onClose} className="w-1/2 p-2 text-slate-400">Cancelar</button>
                         <button type="submit" className="w-1/2 bg-blue-600 text-white p-2 rounded">Entrar</button>
                     </div>
                 </form>
             </div>
        </div>
    );
};

const DataInputScreen = ({ onDataLoaded, onCancel }: any) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
             <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 w-full max-w-lg text-center">
                 <Database className="mx-auto text-emerald-400 mb-4" size={48}/>
                 <h2 className="text-white font-bold text-xl mb-2">Modo Google Sheets Activado</h2>
                 <p className="text-slate-400 text-sm mb-6">En este modo, la carga de datos se realiza directamente editando tu hoja de cálculo en Google Sheets. No necesitas cargar archivos aquí.</p>
                 <a href={SHEET_URL.replace('pub?output=csv', 'edit')} target="_blank" rel="noreferrer" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded font-bold mb-4 hover:bg-emerald-500">Ir a mi Google Sheet</a>
                 <br/>
                 <button onClick={onCancel} className="text-slate-500 text-sm hover:text-white">Cerrar</button>
             </div>
        </div>
    );
};

const SettingsModal = ({ onClose }: any) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
             <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 w-full max-w-lg">
                 <h2 className="text-white font-bold mb-4">Configuración del Proyecto</h2>
                 <p className="text-slate-400 text-sm mb-4">Para modificar los parámetros maestros (Monto original, plazos, etc.), debes editar la constante MASTER_PROJECT_DATA en el código fuente (App.tsx).</p>
                 <button onClick={onClose} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Entendido</button>
             </div>
        </div>
    );
};

// --- LOGICA PRINCIPAL (APP) ---
export default function App() {
  const [appState, setAppState] = useState('loading'); 
  const [projectItems, setProjectItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedPeriod, setSelectedPeriod] = useState(1); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        // MODO DEMO AUTOMÁTICO PARA VISTA PREVIA
        if(SHEET_URL.includes("AQUI_PEGA_TU_ENLACE")) {
            console.log("Modo Demo: Usando datos de ejemplo");
            setProjectItems(FALLBACK_ITEMS);
            setAppState('dashboard');
            return;
        }

        try {
            const response = await fetch(SHEET_URL);
            const csvText = await response.text();
            const cleanItems = parseCSVInternal(csvText);
            setProjectItems(cleanItems);
            setLastUpdate(new Date().toLocaleTimeString());
            setAppState('dashboard');
        } catch (error) {
            console.error("Error Fetch:", error);
            setProjectItems(FALLBACK_ITEMS);
            setAppState('dashboard');
        }
    };

    fetchData();
    const handleResize = () => { if (window.innerWidth >= 768) setSidebarOpen(true); else setSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    setDaysElapsed(calculateDaysElapsed(MASTER_PROJECT_DATA.startDate));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dynamicConfig = useMemo(() => {
      let totalAmount = MASTER_PROJECT_DATA.originalAmount;
      let totalDays = MASTER_PROJECT_DATA.originalDuration;
      let hasActiveMods = false;
      MODIFICATIONS.forEach((mod: any) => {
          if (mod.active) {
              totalDays += (mod.days || 0);
              totalAmount += (mod.amount || 0);
              hasActiveMods = true;
          }
      });
      const endDate = new Date(MASTER_PROJECT_DATA.startDate);
      endDate.setDate(endDate.getDate() + totalDays);
      return { ...MASTER_PROJECT_DATA, totalAmount, totalDays, calculatedEndDate: formatDateShort(endDate), modifications: MODIFICATIONS, hasActiveMods };
  }, []);

  const processDataInternal = () => {
    const items = projectItems;
    if (!items || items.length === 0) return null;
    
    const sampleItem: any = items[0] || {};
    const periodKeys = Object.keys(sampleItem).filter(k => k.toLowerCase().startsWith('p') && k.toLowerCase().endsWith('_cant'));
    periodKeys.sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')));
    
    const totalPeriods = periodKeys.length || 1;
    const projAdvanceAmount = MASTER_PROJECT_DATA.advanceAmount;
    
    const plannedFactors = [];
    for(let i=0; i<totalPeriods; i++) {
        const x = (i+1) / totalPeriods;
        plannedFactors.push(x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    }

    const monthlyData: any[] = [];
    let accumExecutedPhysical = 0;
    let accumLiquidPaid = 0;
    let accumPlanned = 0;
    let accumAmortization = 0;
    
    const modulesMap: any = {};

    const getPeriodLabel = (pIndex: any) => {
        const i = pIndex + 1;
        const baseDate = new Date(2025, 7, 1); // Agosto 2025
        baseDate.setMonth(baseDate.getMonth() + (i - 1));
        return formatDateShort(baseDate);
    };

    items.forEach((item: any) => {
        let modName = (item['modulo'] || 'GENERAL').toString().toUpperCase().trim();
        if(!modulesMap[modName]) modulesMap[modName] = { name: modName, totalBudget: 0, executedAccum: 0 };
        const qtyVigente = item['cantidad_vigente'] || 0;
        const price = item['precio_unitario'] || 0;
        modulesMap[modName].totalBudget += (qtyVigente * price);
    });

    for (let i = 1; i <= totalPeriods; i++) {
      const periodKey = periodKeys[i-1];
      let periodPhysicalAmount = 0;
      let periodPlannedAmount = 0;
      
      const periodDate = new Date(2025, 7 + (i - 1), 1); 
      const nextPeriodDate = new Date(2025, 7 + i, 1); 

      items.forEach((item: any) => { 
          const precio = item['precio_unitario'] || 0;
          const cantidadPeriodo = item[periodKey] || 0;
          periodPhysicalAmount += (cantidadPeriodo * precio); 
          
          let modName = (item['modulo'] || 'GENERAL').toString().toUpperCase().trim();
          modulesMap[modName].executedAccum += (cantidadPeriodo * precio);

          if(item.fecha_inicio && item.fecha_fin) {
             const start = new Date(item.fecha_inicio);
             const end = new Date(item.fecha_fin);
             
             if (start < nextPeriodDate && end >= periodDate) {
                 const activityDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
                 const dailyValue = (item.cantidad_vigente * precio) / activityDuration;
                 const overlapStart = start > periodDate ? start : periodDate;
                 const overlapEnd = end < nextPeriodDate ? end : new Date(nextPeriodDate.getTime() - 86400000);
                 const overlapDays = Math.max(0, Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                 periodPlannedAmount += (dailyValue * overlapDays);
             }
          }
      });

      const amortization = periodPhysicalAmount * (MASTER_PROJECT_DATA.advancePercent / 100);
      accumAmortization += amortization; 
      
      const penalty = 0; 
      const liquidPayable = periodPhysicalAmount - amortization - penalty;
      
      accumExecutedPhysical += periodPhysicalAmount;
      accumLiquidPaid += liquidPayable;
      const totalCashReceived = projAdvanceAmount + accumLiquidPaid;
      
      accumPlanned += periodPlannedAmount;
      
      if(accumPlanned > dynamicConfig.totalAmount) accumPlanned = dynamicConfig.totalAmount;

      monthlyData.push({
        period: `P${i}`,
        label: getPeriodLabel(i-1),
        fullLabel: `Planilla ${i} (${getPeriodLabel(i-1)})`,
        month: i,
        physicalPartial: periodPhysicalAmount, 
        amortization, 
        amortizationAccum: accumAmortization, 
        penalty, 
        liquidPartial: liquidPayable, 
        physicalAccum: accumExecutedPhysical, 
        financialAccum: totalCashReceived,
        financialAccumNoAdv: accumLiquidPaid,
        plannedAccum: accumPlanned,
        plannedPartial: periodPlannedAmount,
        progressPhysical: (accumExecutedPhysical / dynamicConfig.totalAmount) * 100,
        progressFinancial: (totalCashReceived / dynamicConfig.totalAmount) * 100, 
        progressFinancialNoAdv: (accumLiquidPaid / dynamicConfig.totalAmount) * 100, 
        spi: accumPlanned > 0 ? (accumExecutedPhysical / accumPlanned) : 1,
        cpi: totalCashReceived > 0 ? (accumExecutedPhysical / totalCashReceived) : 1,
        spiPeriod: periodPlannedAmount > 0 ? (periodPhysicalAmount / periodPlannedAmount) : 1,
        cpiPeriod: 1 
      });
    }

    const processedItems = items.map((item: any) => {
       const newItem = { ...item };
       const precio = item['precio_unitario'] || 0;
       newItem.historial = {};
       let itemAccumAmount = 0;
       let accumQty = 0;
       for(let i=1; i<=totalPeriods; i++) {
           const qty = item[periodKeys[i-1]] || 0;
           accumQty += qty;
           newItem.historial[i] = { qtyPartial: qty, qtyAccum: accumQty, amtPartial: qty * precio, amtAccum: accumQty * precio };
           itemAccumAmount += (qty * precio);
       }
       return newItem;
    });

    const moduleStats = Object.values(modulesMap).map((m: any) => ({
        ...m,
        incidence: (m.totalBudget / dynamicConfig.totalAmount) * 100,
        progress: m.totalBudget > 0 ? (m.executedAccum / m.totalBudget) * 100 : 0
    }));

    return { monthlyData, processedItems, totalPeriods, advanceAmount: projAdvanceAmount, moduleStats };
  };

  const projectData = useMemo(() => processDataInternal(), [projectItems, dynamicConfig]);

  if (appState === 'loading') return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-2"><RefreshCw className="animate-spin"/> Cargando...</div>;
  if (appState === 'sheet') return (<ProjectSheet onBack={() => setAppState('dashboard')} data={dynamicConfig} onLoginRequest={() => setShowLogin(true)} onEnterData={() => setAppState('input')} user={user} />);

  // Si no hay datos, mostrar pantalla de espera
  if (!projectData) return <div className="text-white p-10 text-center">Esperando datos...</div>;

  const { monthlyData, processedItems, moduleStats, advanceAmount } = projectData!;
  const maxPeriod = monthlyData.length;
  const safeSelectedPeriod = selectedPeriod > maxPeriod ? maxPeriod : selectedPeriod;
  const currentPeriodData = monthlyData[safeSelectedPeriod - 1] || {};
  
  const totalPagadoCorte = currentPeriodData.financialAccum || 0; 
  const totalPagadoLiquido = currentPeriodData.financialAccumNoAdv || 0;
  const saldoPorCancelar = dynamicConfig.totalAmount - totalPagadoCorte;

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden flex-col">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }`}</style>
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR */}
        {sidebarOpen && (<div className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />)}
        <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl border-r border-slate-800`}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-md"><Activity size={18} className="text-white"/></div>
                    <div><span className="font-bold text-white tracking-tight block text-sm">Supervisión</span><span className="text-[10px] text-blue-400 font-medium">BIM MORENO</span></div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white bg-slate-800 p-1 rounded"><X size={18}/></button>
            </div>
            <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Principal</p>
                <button onClick={() => { setActiveTab('general'); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${activeTab === 'general' ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}><LayoutDashboard size={18}/> Tablero de Control</button>
                <button onClick={() => { setActiveTab('items'); if(window.innerWidth < 768) setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all ${activeTab === 'items' ? 'bg-blue-600/20 text-blue-400 font-bold border-l-2 border-blue-500' : 'hover:bg-slate-800 hover:text-white'}`}><FileText size={18}/> Planillas / Items</button>
                <button onClick={() => setAppState('sheet')} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-slate-800 hover:text-white transition-all"><Info size={18}/> Ficha Técnica</button>
                
                <div className="mt-auto pt-6 border-t border-slate-800">
                    <div className="bg-emerald-900/20 p-3 rounded border border-emerald-900/50">
                        <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Database size={10}/> GOOGLE SHEETS MODE</p>
                        <p className="text-[9px] text-slate-400 mt-1">Fuente: {SHEET_URL.includes("AQUI") ? "Datos Demo" : "Conectado"}</p>
                    </div>
                </div>

                {/* Admin Menu */}
                <div className="mt-6">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Admin</p>
                    {user ? (
                        <>
                            <button onClick={() => { setAppState('input'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-slate-800 text-emerald-400 transition-colors"><Database size={18}/> Ver Enlace de Datos</button>
                            <button onClick={() => { setShowSettings(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-slate-800 text-blue-400 transition-colors"><Settings size={18}/> Configuración</button>
                            <button onClick={() => setUser(null)} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-red-900/30 text-red-400 transition-colors mt-2"><LogOut size={18}/> Salir</button>
                        </>
                    ) : (
                        <button onClick={() => { setShowLogin(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-slate-800 text-slate-400 transition-colors"><Lock size={18}/> Acceso Admin</button>
                    )}
                </div>
            </nav>
        </aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1"><Menu size={24}/></button>
                    <div className="min-w-0">
                        <h2 className="text-xs md:text-sm font-bold text-slate-100 uppercase tracking-wide truncate">CONST. AV. DEL MORENO</h2>
                        <div className="flex gap-4 text-[10px] md:text-xs text-slate-400 items-center">
                             <span className="truncate hidden sm:inline">Contrato: <span className="font-semibold text-slate-300">{MASTER_PROJECT_DATA.contractNumber}</span></span>
                             <span className="bg-emerald-900/30 text-emerald-400 px-1.5 rounded font-bold border border-emerald-900 text-[9px]">ONLINE v8.0</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 px-2 py-1.5 rounded-md border border-slate-700 shadow-inner flex-shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Corte:</span>
                    <select value={safeSelectedPeriod} onChange={(e) => setSelectedPeriod(Number(e.target.value))} className="bg-transparent border-none text-xs md:text-sm font-bold text-blue-400 focus:ring-0 cursor-pointer pr-1 outline-none w-20 sm:w-auto">
                        {monthlyData.map(m => <option key={m.month} value={m.month}>{m.fullLabel}</option>)}
                    </select>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-950">
            {activeTab === 'general' ? (
                <div className="space-y-6 animate-fade-in pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                         <KPICard label="Avance Físico" value={`${currentPeriodData.progressPhysical?.toFixed(2)}%`} subtext="Ejecutado Acumulado" icon={Activity} color="indigo" isPercentage={true}/>
                         <KPICard label="Avance Financiero" value={`${currentPeriodData.progressFinancial?.toFixed(2)}% (C/Ant)`} subtext={`${currentPeriodData.progressFinancialNoAdv?.toFixed(2)}% (Sin Anticipo)`} icon={DollarSign} color="emerald" isPercentage={true}/>
                         <KPICard label="Total Cancelado" value={formatCurrency(totalPagadoCorte)} subtext={`C/Anticipo\n${formatCurrency(totalPagadoLiquido)} (Solo Líquido)`} icon={CheckCircle} color="blue" isPercentage={false}/>
                         <KPICard label="Saldo por Cancelar" value={formatCurrency(saldoPorCancelar)} subtext="Vs. Monto Vigente" icon={Wallet} color="amber" isPercentage={false}/>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <MilestoneCard currentDays={daysElapsed} totalAmount={dynamicConfig.totalAmount} />
                        </div>
                        <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                                <PieChartIcon className="text-cyan-400" size={20}/>
                                <div><h3 className="font-bold text-slate-100 text-sm">Control de Anticipo Financiero</h3><p className="text-[10px] text-slate-400">Amortización del {MASTER_PROJECT_DATA.advancePercent}% otorgado</p></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <KPICard label="Anticipo Otorgado" value={formatCurrency(advanceAmount)} subtext={`Monto Fijo (${MASTER_PROJECT_DATA.advancePercent}%)`} icon={Briefcase} color="cyan" isPercentage={false}/>
                                <KPICard label="Amortizado en Planilla" value={formatCurrency(currentPeriodData.amortization)} subtext={`Descuento en ${currentPeriodData.label}`} icon={TrendingDown} color="orange" isPercentage={false}/>
                                <KPICard label="Saldo por Amortizar" value={formatCurrency(advanceAmount - currentPeriodData.amortizationAccum)} subtext="Restante de Devolución" icon={PieChartIcon} color="rose" isPercentage={false}/>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN EVM */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2"><Calculator className="text-violet-400" size={20}/><div><h3 className="font-bold text-slate-100 text-sm">Valor Ganado Acumulado (EVM)</h3><p className="text-[10px] text-slate-400">Estado global del proyecto</p></div></div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-2 bg-slate-800/50 rounded"><p className="text-[9px] text-slate-400 uppercase">Valor Planificado (PV)</p><p className="font-bold text-slate-200">{formatCurrency(currentPeriodData.plannedAccum)}</p></div>
                                <div className="p-2 bg-slate-800/50 rounded"><p className="text-[9px] text-slate-400 uppercase">Valor Ganado (EV)</p><p className="font-bold text-blue-400">{formatCurrency(currentPeriodData.physicalAccum)}</p></div>
                                <div className="p-2 bg-slate-800/50 rounded"><p className="text-[9px] text-slate-400 uppercase">Costo Real (AC)</p><p className="font-bold text-emerald-400">{formatCurrency(currentPeriodData.financialAccum)}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-violet-900/20 rounded-lg border border-violet-800 text-center"><span className="text-[10px] font-bold text-violet-400 uppercase block mb-1">SPI (Cronograma)</span><span className={`text-base font-medium ${currentPeriodData.spi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{currentPeriodData.spi?.toFixed(2)}</span></div>
                                <div className="p-3 bg-violet-900/20 rounded-lg border border-violet-800 text-center"><span className="text-[10px] font-bold text-violet-400 uppercase block mb-1">CPI (Costo)</span><span className={`text-base font-medium ${currentPeriodData.cpi >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentPeriodData.cpi?.toFixed(2)}</span></div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2"><Activity className="text-blue-400" size={20}/><div><h3 className="font-bold text-slate-100 text-sm">Desempeño del Periodo ({currentPeriodData.label})</h3><p className="text-[10px] text-slate-400">Eficiencia mensual</p></div></div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-2 bg-slate-800/50 rounded"><p className="text-[9px] text-slate-400 uppercase">Planificado Mes (PV)</p><p className="font-bold text-slate-200">{formatCurrency(currentPeriodData.plannedPartial)}</p></div>
                                <div className="p-2 bg-slate-800/50 rounded"><p className="text-[9px] text-slate-400 uppercase">Ejecutado Mes (EV)</p><p className="font-bold text-blue-400">{formatCurrency(currentPeriodData.physicalPartial)}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800 text-center"><span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">SPI (Mes)</span><span className={`text-base font-medium ${currentPeriodData.spiPeriod >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{currentPeriodData.spiPeriod?.toFixed(2)}</span></div>
                                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800 text-center"><span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">CPI (Mes)</span><span className={`text-base font-medium ${currentPeriodData.cpiPeriod >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>{currentPeriodData.cpiPeriod?.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 md:p-5 rounded-lg border border-slate-800 shadow-sm h-64 md:h-80">
                        <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-bold text-slate-100">Curva S de Inversión</h3></div>
                        <div className="h-48 md:h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155"/>
                                    <XAxis dataKey="label" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                                    <YAxis tickFormatter={(val: any) => `${(val/1000000).toFixed(1)}M`} tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} width={30} />
                                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #475569', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)', backgroundColor: '#1e293b', color: '#fff'}} formatter={(value: any) => formatCurrency(value)} />
                                    <Line type="monotone" dataKey="plannedAccum" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Planificado" />
                                    <Area type="monotone" dataKey="physicalAccum" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth={3} name="Ejecutado" />
                                    <Line type="monotone" dataKey="financialAccum" stroke="#10b981" strokeWidth={2} dot={{r: 4, strokeWidth: 0, fill: '#10b981'}} name="Pagado" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm p-4 md:p-5 flex flex-col">
                            <h3 className="font-bold text-slate-100 text-sm mb-4">Incidencia por Módulos (%)</h3>
                            <div className="h-64 md:h-[400px] w-full"> 
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={moduleStats} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155"/>
                                        <XAxis type="number" hide domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 8, fill: '#94a3b8'}} interval={0} tickFormatter={(val) => val.length > 12 ? val.substring(0, 12) + '...' : val}/>
                                        <RechartsTooltip cursor={{fill: '#334155'}} formatter={(value: any) => [`${value.toFixed(2)}%`, 'Incidencia']} contentStyle={{borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#fff', fontSize: '11px'}}/>
                                        <Bar dataKey="incidence" radius={[0, 4, 4, 0]} barSize={15}>
                                            <LabelList dataKey="incidence" position="right" formatter={(val: any) => `${val.toFixed(1)}%`} style={{ fontSize: '9px', fill: '#94a3b8', fontWeight: 'bold' }} />
                                            {moduleStats.map((entry: any, index: any) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 shadow-sm overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-800 bg-slate-900"><h3 className="text-sm font-bold text-slate-100">Estado de Avance por Módulos</h3></div>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-xs text-left min-w-[600px] text-slate-300">
                                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800"><tr><th className="px-4 py-3">Módulo</th><th className="px-4 py-3 text-right">Presupuesto</th><th className="px-4 py-3 text-right">Ejecutado</th><th className="px-4 py-3 text-center">Avance</th></tr></thead>
                                    <tbody className="divide-y divide-slate-800">{moduleStats.map((mod: any, idx: any) => (<tr key={idx} className="hover:bg-slate-800 transition-colors"><td className="px-4 py-3 font-medium text-slate-200 flex items-center gap-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div><span className="truncate max-w-[150px]">{mod.name}</span></td><td className="px-4 py-3 text-right text-slate-400">{formatCurrency(mod.totalBudget)}</td><td className="px-4 py-3 text-right font-medium text-blue-400">{formatCurrency(mod.executedAccum)}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-full bg-slate-800 rounded-full h-1.5 flex-1 border border-slate-700"><div className="bg-emerald-500 h-1.5 rounded-full" style={{width: `${Math.min(mod.progress, 100)}%`}}></div></div><span className="text-[10px] font-bold w-8 text-right">{mod.progress.toFixed(0)}%</span></div></td></tr>))}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden mt-6">
                        <div className="p-4 border-b border-slate-800 bg-slate-900"><h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><DollarSign size={16} className="text-emerald-400"/> Histórico de Cobros por Planilla</h3></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left min-w-[700px] text-slate-300">
                                <thead className="bg-slate-950 font-bold text-slate-400 border-b border-slate-800">
                                    <tr><th className="px-4 py-3">Periodo</th><th className="px-4 py-3 text-right">Monto Bruto (EV)</th><th className="px-4 py-3 text-right">Amort. Anticipo</th><th className="px-4 py-3 text-right">Penalización</th><th className="px-4 py-3 text-right text-emerald-400">Líquido Pagable</th><th className="px-4 py-3 text-right">% Cobrado (Mes)</th><th className="px-4 py-3 text-right">% Cobrado (Acum)</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {monthlyData.map((row) => (
                                        <tr key={row.month} className={`hover:bg-slate-800 transition-colors ${row.month === safeSelectedPeriod ? "bg-blue-900/20" : ""}`}>
                                            <td className="px-4 py-2 font-medium text-slate-200">{row.label} ({row.period})</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.physicalPartial)}</td>
                                            <td className="px-4 py-2 text-right text-amber-500">-{formatCurrency(row.amortization)}</td>
                                            <td className="px-4 py-2 text-right text-rose-500">{row.penalty > 0 ? `-${formatCurrency(row.penalty)}` : '-'}</td>
                                            <td className="px-4 py-2 text-right font-bold text-emerald-400">{formatCurrency(row.liquidPartial)}</td>
                                            <td className="px-4 py-2 text-right"><span className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-900">{row.percentCollectedPeriod?.toFixed(2)}%</span></td>
                                             <td className="px-4 py-2 text-right font-medium text-slate-500">{row.progressFinancialNoAdv?.toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 rounded-lg border border-slate-800 shadow-sm flex flex-col h-full animate-fade-in overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <h3 className="font-bold text-slate-100 text-sm whitespace-nowrap">Planilla {currentPeriodData.fullLabel}</h3>
                            <span className="text-[9px] bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold hidden sm:inline-block border border-emerald-900 truncate">Detalle Actividades</span>
                        </div>
                        <button onClick={() => setCertificateView(!certificateView)} className="text-[10px] md:text-xs px-2 md:px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 whitespace-nowrap">{certificateView ? 'Ver Completo' : 'Solo Movimiento'}</button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs text-left text-slate-300 min-w-[800px]">
                            <thead className="bg-slate-950 sticky top-0 z-10 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-2 border-b border-slate-800 w-16">Item</th>
                                    <th className="px-4 py-2 border-b border-slate-800">Descripción</th>
                                    <th className="px-4 py-2 border-b border-slate-800 text-right">Cant. {currentPeriodData.period}</th>
                                    <th className="px-4 py-2 border-b border-slate-800 text-right">Bs. {currentPeriodData.period}</th>
                                    {!certificateView && <th className="px-4 py-2 border-b border-slate-800 text-right">% Acum</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {processedItems.filter(i => (i.historial[safeSelectedPeriod]?.qtyPartial > 0 || !certificateView)).map((item, idx) => {
                                    const hist = item.historial[safeSelectedPeriod];
                                    return (
                                        <tr key={idx} className="hover:bg-slate-800">
                                            <td className="px-4 py-2 font-mono text-slate-500">{item.item}</td>
                                            <td className="px-4 py-2 truncate max-w-xs">{item.actividad}</td>
                                            <td className="px-4 py-2 text-right font-bold text-blue-400 bg-blue-900/10">{hist.qtyPartial}</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-200">{formatCurrency(hist.amtPartial)}</td>
                                            {!certificateView && <td className="px-4 py-2 text-right text-slate-500">{((hist.qtyAccum/item.cantidad_vigente)*100).toFixed(0)}%</td>}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-2">
                        <div className="flex justify-end gap-4 md:gap-8 text-xs text-slate-400">
                            <div className="text-right">
                                <span className="block uppercase font-bold tracking-wider mb-0.5">Monto Certificado</span>
                                <span className="font-bold text-sm text-slate-200">{formatCurrency(currentPeriodData.physicalPartial)}</span>
                            </div>
                            <div className="text-right">
                                <span className="block uppercase font-bold tracking-wider mb-0.5">Amort. Anticipo</span>
                                <span className="font-bold text-sm text-amber-500">-{formatCurrency(currentPeriodData.amortization)}</span>
                            </div>
                        </div>
                        <div className="flex justify-end pt-3 border-t border-slate-800">
                            <div className="text-right">
                                <span className="block uppercase font-black tracking-wider mb-0.5 text-blue-500">Líquido Pagable</span>
                                <span className="font-medium text-lg md:text-xl text-blue-400">{formatCurrency(currentPeriodData.liquidPartial)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
      </div>
      <div className="bg-slate-950 text-white font-bold text-xs md:text-sm py-4 px-6 text-center border-t border-slate-900 z-50">
          Desarrollado por <span className="text-emerald-400 uppercase tracking-widest px-1">Zacarias Ortega</span> para el Proyecto Construcción Av. del Moreno - Oruro
      </div>
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onLoginSuccess={(u: any) => setUser(u)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} currentMods={MODIFICATIONS} onSaveMods={() => {}}/>}
    </div>
  );
}