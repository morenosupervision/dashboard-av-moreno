import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, BarChart, Bar, Cell, LabelList
} from 'recharts';
import { 
  Briefcase, Activity, Menu, X, FileText, CheckCircle, 
  LayoutDashboard, Info, RefreshCw, AlertTriangle, PieChart as PieChartIcon, Building2, Wallet, Scale, Calculator, ArrowLeft, Users, TrendingDown, Flag, Database, ExternalLink, DollarSign, Clock, Settings, Edit, CheckSquare, Square, Save, Lock, LogOut, Plus, Trash2, Calendar, AlertOctagon
} from 'lucide-react';

// =================================================================================
// 🌐 CONFIGURACIÓN GOOGLE SHEETS
// =================================================================================
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMdJgnalKKHy5JaPC0gFXxLqk2RDGkysZhhLQbtOVYe_La0IP06a6GHW0sz-2rcP1-kfLIdNIu7TrN/pub?gid=0&single=true&output=csv"; 

// =================================================================================
// 🏗️ DATOS MAESTROS INICIALES (VALORES POR DEFECTO)
// =================================================================================
const INITIAL_MASTER_DATA = {
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

const INITIAL_MODIFICATIONS = [
    { id: 'CM-1', name: 'Contrato Modificatorio N°1', type: 'CM', date: '2025-11-20', days: 90, amount: 2123782.08, desc: 'Incremento de monto y ampliación de plazo', active: true },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

// DATOS DE RESPALDO (FALLBACK)
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

const formatDateShort = (date: any) => {
    try {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('es-BO', { month: 'short', year: '2-digit' });
    } catch (e) {
        return '-';
    }
};

const calculateDaysElapsed = (startStr: string) => {
    try {
        const start = new Date(startStr);
        if (isNaN(start.getTime())) return 0;
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch {
        return 0;
    }
};

const parseSmartNumber = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    let str = val.toString().trim();
    str = str.replace(/[Bs\s$]/g, '');

    if (str.includes(',') && str.includes('.')) {
        if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
             str = str.replace(/\./g, '').replace(',', '.');
        } else {
             str = str.replace(/,/g, '');
        }
    } 
    else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    
    return parseFloat(str) || 0;
};

const parseCSVInternal = (csvText: string) => {
    if (csvText.trim().toLowerCase().startsWith('<!doctype') || csvText.includes('<html')) {
        console.warn("El CSV parece ser HTML. Probablemente error de acceso.");
        return [];
    }

    const lines = csvText.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\r\n]+/g, ''));
    if (!headers.includes('item') && !headers.includes('actividad')) return [];

    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue;
        
        const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const entry: any = {};
        
        headers.forEach((header, index) => {
            let val = values[index] ? values[index].trim() : '';
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            
            if (['cantidad_original', 'cantidad_vigente', 'precio_unitario'].includes(header) || header.includes('_cant')) {
                 entry[header] = parseSmartNumber(val);
            } else {
                 entry[header] = val;
            }
        });
        
        if(entry.item || entry.actividad) data.push(entry);
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
    const style = colorStyles[color] || colorStyles.slate;
    const barColorClass = style.split(' ').find((c:string) => c.startsWith('text-'))?.replace('text-', 'bg-') || 'bg-slate-500';
    const valStr = String(value);
    const numVal = parseFloat(valStr.replace(/[^0-9.-]+/g,""));

    return (
        <div className={`p-4 rounded-xl border shadow-lg flex flex-col justify-between h-full transition-transform hover:scale-[1.01] duration-200 ${style}`}>
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
    const projectData = data;
    const displayDate = projectData.calculatedEndDate || projectData.originalEndDate;
    const displayDays = projectData.totalDays || projectData.originalDuration;
    const displayAmount = projectData.totalAmount || projectData.originalAmount;
    const modsToShow = data.modifications || [];

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
                                {modsToShow.length === 0 && <p className="text-xs text-slate-500 italic">No hay modificaciones registradas.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MODALES FUNCIONALES ---

const LoginModal = ({ onClose, onLoginSuccess }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: any) => {
        e.preventDefault();
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
                     <input type="text" placeholder="Usuario" className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600 focus:border-blue-500 outline-none" value={email} onChange={e => setEmail(e.target.value)}/>
                     <input type="password" placeholder="Contraseña" className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600 focus:border-blue-500 outline-none" value={password} onChange={e => setPassword(e.target.value)}/>
                     {error && <p className="text-red-400 text-xs">{error}</p>}
                     <div className="flex gap-2">
                         <button type="button" onClick={onClose} className="w-1/2 p-2 text-slate-400 hover:text-white transition-colors">Cancelar</button>
                         <button type="submit" className="w-1/2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded transition-colors font-bold">Entrar</button>
                     </div>
                 </form>
             </div>
        </div>
    );
};

const DataInputScreen = ({ onCancel }: any) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
             <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 w-full max-w-lg text-center">
                 <Database className="mx-auto text-emerald-400 mb-4" size={48}/>
                 <h2 className="text-white font-bold text-xl mb-2">Modo Google Sheets Activado</h2>
                 <p className="text-slate-400 text-sm mb-6">En este modo, la carga de datos de items se realiza directamente editando tu hoja de cálculo en Google Sheets.</p>
                 <a href={SHEET_URL.replace('pub?output=csv', 'edit')} target="_blank" rel="noreferrer" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded font-bold mb-4 hover:bg-emerald-500 transition-colors">Ir a Google Sheet</a>
                 <br/>
                 <button onClick={onCancel} className="text-slate-500 text-sm hover:text-white">Cerrar</button>
             </div>
        </div>
    );
};

// --- GESTOR DE CONFIGURACIÓN Y MODIFICACIONES (NUEVO) ---
const SettingsModal = ({ onClose, currentData, setProjectData, currentMods, setMods, currentPenalties, setPenalties }: any) => {
    const [tab, setTab] = useState('general'); // general | mods | penalties
    const [localData, setLocalData] = useState({...currentData});
    
    // Estado para nueva modificación
    const [newMod, setNewMod] = useState({
        id: '', name: '', type: 'OC', date: '', days: 0, amount: 0, desc: '', active: true
    });

    // Estado para nueva penalidad
    const [newPenalty, setNewPenalty] = useState({
        period: 1, amount: 0, reason: ''
    });

    const handleSaveGeneral = () => {
        setProjectData(localData);
        alert("Datos maestros actualizados correctamente.");
    };

    const handleAddMod = () => {
        if(!newMod.id || !newMod.name) return;
        setMods([...currentMods, newMod]);
        setNewMod({ id: '', name: '', type: 'OC', date: '', days: 0, amount: 0, desc: '', active: true });
    };

    const handleDeleteMod = (index: number) => {
        const newMods = [...currentMods];
        newMods.splice(index, 1);
        setMods(newMods);
    };

    const toggleModActive = (index: number) => {
        const newMods = [...currentMods];
        newMods[index].active = !newMods[index].active;
        setMods(newMods);
    };

    const handleAddPenalty = () => {
        if(newPenalty.amount <= 0 || !newPenalty.reason) return;
        // Check if penalty exists for period and update or add
        const existingIdx = currentPenalties.findIndex((p:any) => p.period === newPenalty.period);
        let updatedPenalties = [...currentPenalties];
        if (existingIdx >= 0) {
            updatedPenalties[existingIdx] = newPenalty;
        } else {
            updatedPenalties.push(newPenalty);
        }
        setPenalties(updatedPenalties);
        setNewPenalty({ period: 1, amount: 0, reason: '' });
    };
    
    const handleDeletePenalty = (index: number) => {
        const updated = [...currentPenalties];
        updated.splice(index, 1);
        setPenalties(updated);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
             <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                     <h2 className="text-white font-bold text-lg flex items-center gap-2"><Settings size={20}/> Gestión del Proyecto</h2>
                     <button onClick={onClose}><X className="text-slate-400 hover:text-white" size={24}/></button>
                 </div>
                 
                 <div className="flex border-b border-slate-700 bg-slate-800">
                     <button onClick={() => setTab('general')} className={`flex-1 py-3 text-sm font-bold ${tab === 'general' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-900' : 'text-slate-400 hover:text-white'}`}>Datos Generales</button>
                     <button onClick={() => setTab('mods')} className={`flex-1 py-3 text-sm font-bold ${tab === 'mods' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-900' : 'text-slate-400 hover:text-white'}`}>Modificaciones (OC/CM)</button>
                     <button onClick={() => setTab('penalties')} className={`flex-1 py-3 text-sm font-bold ${tab === 'penalties' ? 'text-rose-400 border-b-2 border-rose-400 bg-slate-900' : 'text-slate-400 hover:text-white'}`}>Penalidades</button>
                 </div>

                 <div className="p-6 overflow-y-auto flex-1">
                     {tab === 'general' && (
                         <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div><label className="text-xs text-slate-400 block mb-1">Nombre del Proyecto</label><input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm" value={localData.name} onChange={e => setLocalData({...localData, name: e.target.value})}/></div>
                                 <div><label className="text-xs text-slate-400 block mb-1">Número de Contrato</label><input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm" value={localData.contractNumber} onChange={e => setLocalData({...localData, contractNumber: e.target.value})}/></div>
                                 <div><label className="text-xs text-slate-400 block mb-1">Monto Original (Bs.)</label><input type="number" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm font-mono" value={localData.originalAmount} onChange={e => setLocalData({...localData, originalAmount: parseFloat(e.target.value)})}/></div>
                                 <div><label className="text-xs text-slate-400 block mb-1">Plazo Original (Días)</label><input type="number" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm font-mono" value={localData.originalDuration} onChange={e => setLocalData({...localData, originalDuration: parseInt(e.target.value)})}/></div>
                                 <div><label className="text-xs text-slate-400 block mb-1">Fecha de Inicio (Orden de Proceder)</label><input type="date" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm" value={localData.startDate} onChange={e => setLocalData({...localData, startDate: e.target.value})}/></div>
                                 <div><label className="text-xs text-slate-400 block mb-1">Empresa Contratista</label><input type="text" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm" value={localData.contractor} onChange={e => setLocalData({...localData, contractor: e.target.value})}/></div>
                             </div>
                             <div className="pt-4 border-t border-slate-700">
                                 <button onClick={handleSaveGeneral} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2"><Save size={16}/> Guardar Cambios Maestros</button>
                             </div>
                         </div>
                     )}

                     {tab === 'mods' && (
                         <div className="space-y-6">
                             <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                 <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Plus size={16} className="text-emerald-400"/> Registrar Nueva Modificación</h3>
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                     <input type="text" placeholder="Código (Ej: OC-1)" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newMod.id} onChange={e => setNewMod({...newMod, id: e.target.value})}/>
                                     <input type="text" placeholder="Nombre (Ej: Orden de Cambio N1)" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs md:col-span-2" value={newMod.name} onChange={e => setNewMod({...newMod, name: e.target.value})}/>
                                     <select className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newMod.type} onChange={e => setNewMod({...newMod, type: e.target.value})}>
                                         <option value="OC">Orden de Cambio</option>
                                         <option value="CM">Contrato Modificatorio</option>
                                         <option value="AP">Ampliación Plazo</option>
                                     </select>
                                     <input type="number" placeholder="Días Adicionales" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newMod.days} onChange={e => setNewMod({...newMod, days: parseFloat(e.target.value)})}/>
                                     <input type="number" placeholder="Monto Adicional (Bs.)" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newMod.amount} onChange={e => setNewMod({...newMod, amount: parseFloat(e.target.value)})}/>
                                     <input type="text" placeholder="Descripción / Justificación" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs md:col-span-2" value={newMod.desc} onChange={e => setNewMod({...newMod, desc: e.target.value})}/>
                                     <button onClick={handleAddMod} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-2 rounded font-bold text-xs md:col-span-4 mt-2">Agregar Modificación</button>
                                 </div>
                             </div>

                             <div>
                                 <h3 className="text-white font-bold text-sm mb-3">Historial de Modificaciones</h3>
                                 <div className="overflow-x-auto">
                                     <table className="w-full text-xs text-left text-slate-300">
                                         <thead className="bg-slate-800 text-slate-400">
                                             <tr>
                                                 <th className="p-2">ID</th>
                                                 <th className="p-2">Nombre</th>
                                                 <th className="p-2">Tipo</th>
                                                 <th className="p-2 text-right">Días (+)</th>
                                                 <th className="p-2 text-right">Monto (+)</th>
                                                 <th className="p-2 text-center">Estado</th>
                                                 <th className="p-2 text-center">Acciones</th>
                                             </tr>
                                         </thead>
                                         <tbody className="divide-y divide-slate-800">
                                             {currentMods.map((mod: any, idx: number) => (
                                                 <tr key={idx} className="hover:bg-slate-800/50">
                                                     <td className="p-2 font-bold text-white">{mod.id}</td>
                                                     <td className="p-2">{mod.name}</td>
                                                     <td className="p-2"><span className="bg-slate-700 px-1 rounded text-[10px]">{mod.type}</span></td>
                                                     <td className="p-2 text-right font-mono text-blue-400">+{mod.days}</td>
                                                     <td className="p-2 text-right font-mono text-emerald-400">+{formatCurrency(mod.amount)}</td>
                                                     <td className="p-2 text-center">
                                                         <button onClick={() => toggleModActive(idx)} className={`px-2 py-0.5 rounded text-[10px] font-bold ${mod.active ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' : 'bg-slate-700 text-slate-400'}`}>
                                                             {mod.active ? 'ACTIVO' : 'INACTIVO'}
                                                         </button>
                                                     </td>
                                                     <td className="p-2 text-center">
                                                         <button onClick={() => handleDeleteMod(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                                                     </td>
                                                 </tr>
                                             ))}
                                             {currentMods.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-slate-500 italic">No hay modificaciones registradas</td></tr>}
                                         </tbody>
                                     </table>
                                 </div>
                             </div>
                         </div>
                     )}
                     
                     {tab === 'penalties' && (
                         <div className="space-y-6">
                            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><AlertOctagon size={16} className="text-rose-400"/> Registrar Penalidad</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-slate-400 mb-1">Nro Planilla</label>
                                        <input type="number" min="1" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newPenalty.period} onChange={e => setNewPenalty({...newPenalty, period: parseInt(e.target.value)})}/>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-[10px] text-slate-400 mb-1">Monto (Bs.)</label>
                                        <input type="number" min="0" step="0.01" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newPenalty.amount} onChange={e => setNewPenalty({...newPenalty, amount: parseFloat(e.target.value)})}/>
                                    </div>
                                    <div className="flex flex-col md:col-span-3">
                                        <label className="text-[10px] text-slate-400 mb-1">Motivo / Descripción</label>
                                        <input type="text" className="bg-slate-900 border border-slate-600 rounded p-2 text-white text-xs" value={newPenalty.reason} onChange={e => setNewPenalty({...newPenalty, reason: e.target.value})}/>
                                    </div>
                                    <button onClick={handleAddPenalty} className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-2 rounded font-bold text-xs md:col-span-3 mt-1">Registrar Penalidad</button>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-white font-bold text-sm mb-3">Historial de Penalidades</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left text-slate-300">
                                        <thead className="bg-slate-800 text-slate-400">
                                            <tr>
                                                <th className="p-2">Planilla</th>
                                                <th className="p-2 text-right">Monto</th>
                                                <th className="p-2">Motivo</th>
                                                <th className="p-2 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {currentPenalties.map((p: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-800/50">
                                                    <td className="p-2 font-bold text-white">Planilla {p.period}</td>
                                                    <td className="p-2 text-right font-mono text-rose-400">-{formatCurrency(p.amount)}</td>
                                                    <td className="p-2">{p.reason}</td>
                                                    <td className="p-2 text-center">
                                                        <button onClick={() => handleDeletePenalty(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {currentPenalties.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-slate-500 italic">No hay penalidades registradas</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                         </div>
                     )}
                 </div>
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
  const [certificateView, setCertificateView] = useState(false);

  // ESTADO DE DATOS MAESTROS Y MODIFICACIONES
  const [masterData, setMasterData] = useState(INITIAL_MASTER_DATA);
  const [modifications, setModifications] = useState(INITIAL_MODIFICATIONS);
  const [penalties, setPenalties] = useState<{period: number, amount: number, reason: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        if(SHEET_URL.includes("AQUI_PEGA_TU_ENLACE")) {
            setProjectItems(FALLBACK_ITEMS);
            setAppState('dashboard');
            return;
        }
        try {
            const response = await fetch(SHEET_URL);
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("text/html")) throw new Error("HTML response");
            const csvText = await response.text();
            if(csvText.includes("<!DOCTYPE") || csvText.includes("<html")) throw new Error("HTML content");

            const cleanItems = parseCSVInternal(csvText);
            
            if (cleanItems.length === 0) {
                 setProjectItems(FALLBACK_ITEMS);
            } else {
                 setProjectItems(cleanItems);
            }
            setLastUpdate(new Date().toLocaleTimeString());
            setAppState('dashboard');
        } catch (error) {
            console.error("Error Fetch, usando datos locales:", error);
            setProjectItems(FALLBACK_ITEMS);
            setAppState('dashboard');
        }
    };
    fetchData();
    const handleResize = () => { if (window.innerWidth >= 768) setSidebarOpen(true); else setSidebarOpen(false); };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    setDaysElapsed(calculateDaysElapsed(masterData.startDate));
    return () => window.removeEventListener('resize', handleResize);
  }, [masterData.startDate]);

  // Recalculo dinámico basado en ESTADO (masterData y modifications)
  const dynamicConfig = useMemo(() => {
      let totalAmount = masterData.originalAmount;
      let totalDays = masterData.originalDuration;
      let hasActiveMods = false;
      
      modifications.forEach((mod: any) => {
          if (mod.active) {
              totalDays += (mod.days || 0);
              totalAmount += (mod.amount || 0);
              hasActiveMods = true;
          }
      });
      
      const endDate = new Date(masterData.startDate);
      endDate.setDate(endDate.getDate() + totalDays);
      
      return { 
          ...masterData, 
          totalAmount, 
          totalDays, 
          calculatedEndDate: formatDateShort(endDate), 
          modifications: modifications, 
          hasActiveMods 
      };
  }, [masterData, modifications]);

  const processDataInternal = () => {
    const items = projectItems;
    if (!items || items.length === 0) return null;
    
    const sampleItem: any = items[0] || {};
    const periodKeys = Object.keys(sampleItem).filter(k => k.toLowerCase().startsWith('p') && k.toLowerCase().endsWith('_cant'));
    periodKeys.sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')));
    
    const totalPeriods = periodKeys.length || 1;
    const projAdvanceAmount = masterData.advanceAmount;
    
    const monthlyData: any[] = [];
    let accumExecutedPhysical = 0;
    let accumLiquidPaid = 0;
    let accumPlanned = 0;
    let accumAmortization = 0;
    const modulesMap: any = {};

    const getPeriodLabel = (pIndex: any) => {
        try {
            const i = pIndex + 1;
            const baseDate = new Date(2025, 7, 1); 
            baseDate.setMonth(baseDate.getMonth() + (i - 1));
            return formatDateShort(baseDate);
        } catch { return `Mes ${pIndex+1}`; }
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
             if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                if (start < nextPeriodDate && end >= periodDate) {
                    const activityDuration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
                    if (activityDuration > 0) {
                        const dailyValue = (item.cantidad_vigente * precio) / activityDuration;
                        const overlapStart = start > periodDate ? start : periodDate;
                        const overlapEnd = end < nextPeriodDate ? end : new Date(nextPeriodDate.getTime() - 86400000);
                        const overlapDays = Math.max(0, Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                        periodPlannedAmount += (dailyValue * overlapDays);
                    }
                }
             }
          }
      });

      const amortization = periodPhysicalAmount * (masterData.advancePercent / 100);
      accumAmortization += amortization; 
      
      // Aplicar penalidad si existe para este periodo
      const penaltyObj = penalties.find(p => p.period === i);
      const penalty = penaltyObj ? penaltyObj.amount : 0;
      const penaltyReason = penaltyObj ? penaltyObj.reason : '';

      const liquidPayable = periodPhysicalAmount - amortization - penalty;
      
      accumExecutedPhysical += periodPhysicalAmount;
      accumLiquidPaid += liquidPayable;
      const totalCashReceived = projAdvanceAmount + accumLiquidPaid;
      accumPlanned += periodPlannedAmount;
      if(accumPlanned > dynamicConfig.totalAmount) accumPlanned = dynamicConfig.totalAmount;
      
      // Calculo del % Cobrado en el Mes (LiquidoPagable / MontoTotalContrato) * 100
      const percentCollectedPeriod = dynamicConfig.totalAmount > 0 ? (liquidPayable / dynamicConfig.totalAmount) * 100 : 0;

      monthlyData.push({
        period: `P${i}`,
        label: getPeriodLabel(i-1),
        fullLabel: `Planilla ${i} (${getPeriodLabel(i-1)})`,
        month: i,
        physicalPartial: periodPhysicalAmount, 
        amortization, 
        amortizationAccum: accumAmortization, 
        penalty: penalty, 
        penaltyReason: penaltyReason,
        liquidPartial: liquidPayable, 
        physicalAccum: accumExecutedPhysical, 
        financialAccum: totalCashReceived,
        financialAccumNoAdv: accumLiquidPaid,
        plannedAccum: accumPlanned,
        plannedPartial: periodPlannedAmount,
        progressPhysical: dynamicConfig.totalAmount > 0 ? (accumExecutedPhysical / dynamicConfig.totalAmount) * 100 : 0,
        progressFinancial: dynamicConfig.totalAmount > 0 ? (totalCashReceived / dynamicConfig.totalAmount) * 100 : 0, 
        progressFinancialNoAdv: dynamicConfig.totalAmount > 0 ? (accumLiquidPaid / dynamicConfig.totalAmount) * 100 : 0, 
        percentCollectedPeriod: percentCollectedPeriod,
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
           const partialAmount = qty * precio;
           
           // Calcular Incidencia en Planilla (MontoItem / MontoTotalPlanilla)
           const periodTotal = monthlyData[i-1].physicalPartial;
           const incidence = periodTotal > 0 ? (partialAmount / periodTotal) * 100 : 0;

           newItem.historial[i] = { 
               qtyPartial: qty, 
               qtyAccum: accumQty, 
               amtPartial: partialAmount, 
               amtAccum: accumQty * precio,
               incidence: incidence
           };
           itemAccumAmount += partialAmount;
       }
       return newItem;
    });

    const moduleStats = Object.values(modulesMap).map((m: any) => ({
        ...m,
        incidence: dynamicConfig.totalAmount > 0 ? (m.totalBudget / dynamicConfig.totalAmount) * 100 : 0,
        progress: m.totalBudget > 0 ? (m.executedAccum / m.totalBudget) * 100 : 0
    }));

    return { monthlyData, processedItems, totalPeriods, advanceAmount: projAdvanceAmount, moduleStats };
  };

  const projectData = useMemo(() => processDataInternal(), [projectItems, dynamicConfig, masterData, penalties]);

  if (appState === 'loading') return <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-400 gap-2"><RefreshCw className="animate-spin"/> Cargando...</div>;
  if (appState === 'sheet') return (<ProjectSheet onBack={() => setAppState('dashboard')} data={dynamicConfig} />);

  if (!projectData) {
      return (
          <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
             <AlertTriangle size={48} className="mb-4 text-amber-500"/>
             <h2 className="text-xl font-bold text-white">No hay datos disponibles</h2>
             <button onClick={() => setProjectItems(FALLBACK_ITEMS)} className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Cargar Demo</button>
          </div>
      );
  }

  const { monthlyData, processedItems, moduleStats, advanceAmount } = projectData;
  const maxPeriod = monthlyData.length;
  const safeSelectedPeriod = (selectedPeriod > maxPeriod || selectedPeriod < 1) ? (maxPeriod > 0 ? maxPeriod : 1) : selectedPeriod;
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

                <div className="mt-6">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Admin</p>
                    {user ? (
                        <>
                            <button onClick={() => { setAppState('input'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-slate-800 text-emerald-400 transition-colors"><Database size={18}/> Ver Enlace de Datos</button>
                            <button onClick={() => { setShowSettings(true); setSidebarOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm hover:bg-slate-800 text-blue-400 transition-colors"><Settings size={18}/> Gestión del Proyecto</button>
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
                             <span className="truncate hidden sm:inline">Contrato: <span className="font-semibold text-slate-300">{masterData.contractNumber}</span></span>
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
                                <div><h3 className="font-bold text-slate-100 text-sm">Control de Anticipo Financiero</h3><p className="text-[10px] text-slate-400">Amortización del {masterData.advancePercent}% otorgado</p></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <KPICard label="Anticipo Otorgado" value={formatCurrency(advanceAmount)} subtext={`Monto Fijo (${masterData.advancePercent}%)`} icon={Briefcase} color="cyan" isPercentage={false}/>
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
                                    <tr><th className="px-4 py-3">Periodo</th><th className="px-4 py-3 text-right">Monto Bruto (EV)</th><th className="px-4 py-3 text-right">Amort. Anticipo</th><th className="px-4 py-3 text-right">Penalización</th><th className="px-4 py-3 text-right text-emerald-400">Líquido Pagable</th><th className="px-4 py-3 text-right text-blue-400">% Cobrado (Mes)</th><th className="px-4 py-3 text-right">% Cobrado (Acum)</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {monthlyData.map((row) => (
                                        <tr key={row.month} className={`hover:bg-slate-800 transition-colors ${row.month === safeSelectedPeriod ? "bg-blue-900/20" : ""}`}>
                                            <td className="px-4 py-2 font-medium text-slate-200">{row.label} ({row.period})</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(row.physicalPartial)}</td>
                                            <td className="px-4 py-2 text-right text-amber-500">-{formatCurrency(row.amortization)}</td>
                                            <td className="px-4 py-2 text-right text-rose-500" title={row.penaltyReason ? row.penaltyReason : ""}>{row.penalty > 0 ? `-${formatCurrency(row.penalty)}` : '-'}</td>
                                            <td className="px-4 py-2 text-right font-bold text-emerald-400">{formatCurrency(row.liquidPartial)}</td>
                                            <td className="px-4 py-2 text-right font-bold text-blue-400">{row.percentCollectedPeriod?.toFixed(2)}%</td>
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
                                    <th className="px-4 py-2 border-b border-slate-800 w-16">Unid.</th>
                                    <th className="px-4 py-2 border-b border-slate-800 text-right">Cant. {currentPeriodData.period}</th>
                                    <th className="px-4 py-2 border-b border-slate-800 text-right">Bs. {currentPeriodData.period}</th>
                                    <th className="px-4 py-2 border-b border-slate-800 text-right">% Incid.</th>
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
                                            <td className="px-4 py-2 text-slate-400">{item.unidad}</td>
                                            <td className="px-4 py-2 text-right font-bold text-blue-400 bg-blue-900/10">{hist.qtyPartial}</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-200">{formatCurrency(hist.amtPartial)}</td>
                                            <td className="px-4 py-2 text-right text-slate-400 text-[10px]">{hist.incidence?.toFixed(2)}%</td>
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
                            <div className="text-right">
                                <span className="block uppercase font-bold tracking-wider mb-0.5">Penalidades</span>
                                <span className="font-bold text-sm text-rose-500">-{formatCurrency(currentPeriodData.penalty)}</span>
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
      
      {/* SECCIÓN ACTUALIZADA DE CONFIGURACIÓN CON EDICIÓN REAL */}
      {showSettings && (
          <SettingsModal 
              onClose={() => setShowSettings(false)} 
              currentData={masterData}
              setProjectData={setMasterData}
              currentMods={modifications}
              setMods={setModifications}
              currentPenalties={penalties}
              setPenalties={setPenalties}
          />
      )}
    </div>
  );
}
