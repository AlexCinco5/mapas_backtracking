import React, { useState, useEffect, useRef } from 'react';
import { Delaunay } from 'd3-delaunay';
import './App.css';

const URL_BACKEND = "https://mapas-backtracking-algoritmos.onrender.com";

const PALETA_COLORES = { 1: '#ff99c8', 2: '#fcf6bd', 3: '#d0f4de', 4: '#a9def9', 5: '#e4c1f9' };
const NOMBRES_COLORES = { 1: 'Rosa', 2: 'Amarillo', 3: 'Verde', 4: 'Azul', 5: 'Lila' };

function App() {
  // Configuración
  const [cantidadPiezas, setCantidadPiezas] = useState(15);
  const [numColores, setNumColores] = useState(4);
  const [semilla, setSemilla] = useState(1);

  // Datos
  const [mapaData, setMapaData] = useState({ connections: {}, polygons: [], centers: [] });
  const [historialPasos, setHistorialPasos] = useState([]);
  const [coloresRegiones, setColoresRegiones] = useState({});
  
  // Controles
  const [estaAnimando, setEstaAnimando] = useState(false);
  const [indicePaso, setIndicePaso] = useState(-1);
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState({ show: false, tipo: '', mensaje: '' });

  const rowRef = useRef(null);

  // GENERAR TANGRAM 
  useEffect(() => { generarTangram(); }, [cantidadPiezas, semilla]);

  const generarTangram = () => {
    const width = 1200; const height = 700; 
    const points = Array.from({ length: cantidadPiezas }, () => [Math.random() * width, Math.random() * height]);
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);

    const newConnections = {}; const newPolygons = []; const newCenters = [];

    for (let i = 0; i < points.length; i++) {
      const regionId = `R${i + 1}`;
      const polygonPath = voronoi.renderCell(i);
      newPolygons.push({ id: regionId, path: polygonPath });
      newCenters.push({ id: regionId, x: points[i][0], y: points[i][1] });
      const neighbors = Array.from(delaunay.neighbors(i)).map(n => `R${n + 1}`);
      newConnections[regionId] = neighbors;
    }

    setMapaData({ connections: newConnections, polygons: newPolygons, centers: newCenters });
    setColoresRegiones({}); setHistorialPasos([]); setIndicePaso(-1); setToast({show:false, tipo:'', mensaje:''});
  };

  // BACKEND
  const resolverMapa = async () => {
    setCargando(true); setToast({ show: false, tipo: '', mensaje: '' });
    try {
      const res = await fetch(`${URL_BACKEND}/resolver_coloreo/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapa_regiones: mapaData.connections, num_colores: numColores })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHistorialPasos(data.animacion_pasos);
      setIndicePaso(-1); setColoresRegiones({});

      if (data.solucion_encontrada) {
        setToast({ show: true, tipo: 'success', mensaje: '¡Solución Encontrada!' });
      } else {
        setToast({ show: true, tipo: 'error', mensaje: 'No existe solución posible.' });
      }
    } catch (e) {
        setToast({ show: true, tipo: 'error', mensaje: `Error: ${e.message}` });
    } finally {
      setCargando(false);
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    }
  };

  // CONTROL DE ANIMACIÓN
  const reconstruirEstado = (idx) => {
    const c = {};
    for (let i = 0; i <= idx; i++) {
        const p = historialPasos[i];
        if (p.retroceso) delete c[p.region]; else if (p.valido) c[p.region] = PALETA_COLORES[p.color_intento];
    }
    return c;
  };

  const avanzarPaso = () => {
    if (historialPasos.length === 0 || indicePaso >= historialPasos.length - 1) { setEstaAnimando(false); return; }
    const nuevo = indicePaso + 1; setIndicePaso(nuevo); setColoresRegiones(reconstruirEstado(nuevo));
  };

  const retrocederPaso = () => {
    if (historialPasos.length === 0 || indicePaso < 0) return;
    setEstaAnimando(false); const nuevo = indicePaso - 1; setIndicePaso(nuevo); setColoresRegiones(nuevo === -1 ? {} : reconstruirEstado(nuevo));
  };

  const reiniciar = () => { setEstaAnimando(false); setIndicePaso(-1); setColoresRegiones({}); };

  useEffect(() => { if (rowRef.current) rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [indicePaso]);
  useEffect(() => {
    let t; if (estaAnimando) t = setInterval(avanzarPaso, 200);
    return () => clearInterval(t);
  }, [estaAnimando, indicePaso]);

  // EXPLICACIÓN
  const generarExplicacion = () => {
    if (indicePaso === -1) {
        if (toast.mensaje.includes("No existe")) return "El algoritmo determinó que **no hay solución**.";
        return "Configura y pulsa 'Resolver Mapa', puedes ver la animación paso a paso o reiniciarla.";
    }
    const p = historialPasos[indicePaso];
    if (!p) return "Fin del proceso.";
    const col = NOMBRES_COLORES[p.color_intento];
    const hex = PALETA_COLORES[p.color_intento];
    
    if (p.retroceso) return `🔙 **Backtracking:** Región **${p.region}** sin opciones. Retrocedemos.`;
    if (p.valido) return ` **Éxito:** Región **${p.region}** pintada de <span style="color:${hex}; font-weight:bold">${col}</span>.`;
    return ` **Conflicto:** **${p.region}** no puede ser ${col}.`;
  };
  const renderHTML = (html) => ({ __html: html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') });

  return (
    <div className="app-container">
      <div className={`toast-notification ${toast.show ? 'show' : ''} ${toast.tipo === 'success' ? 'toast-success' : 'toast-error'}`}>
          <span>{toast.mensaje}</span>
      </div>

      <header>
        <h1>Mapa tipo Voronoi <span>Backtracking</span></h1>
        <div className="status-badge">
            {cargando ? 'Calculando...' : (indicePaso === -1 ? 'Listo' : `Paso ${indicePaso + 1} / ${historialPasos.length}`)}
        </div>
      </header>

      <div className="main-grid">
        {/* SIDEBAR */}
        <aside className="config-panel">
          <h2>Configuración</h2>
          
          <div className="control-group">
            <div className="label-row"><label>Piezas (Complejidad)</label><span>{cantidadPiezas}</span></div>
            <input type="range" min="3" max="60" value={cantidadPiezas} onChange={(e) => setCantidadPiezas(parseInt(e.target.value))} />
            
            <button className="btn-secondary" onClick={() => setSemilla(Math.random())}>
                {/* Icono Regenerar (Negro) */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                Regenerar
            </button>
          </div>

          <div className="control-group">
            <label>Colores Disponibles</label>
            <input type="number" min="2" max="5" className="input-number" value={numColores} onChange={(e) => setNumColores(parseInt(e.target.value))} />
          </div>

          <button className="btn-main btn-primary" onClick={resolverMapa} disabled={cargando}>
            {cargando ? '...' : ' Resolver Mapa'}
          </button>

          <div className="playback-container">
             <span className="playback-label">Control de Animación</span>
             <div className="playback-bar">
                
                {/* Reiniciar (Icono Rojo) */}
                <button className="btn-control btn-reset" onClick={reiniciar} title="Reiniciar">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 1 20.49 15"></path></svg>
                </button>

                {/* Anterior (Icono Gris Oscuro) */}
                <button className="btn-control btn-nav" onClick={retrocederPaso} disabled={indicePaso < 0} title="Paso Anterior">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                </button>

                {/* Play/Pausa (Icono Blanco - Fondo Azul por CSS) */}
                <button className="btn-control btn-play" onClick={() => setEstaAnimando(!estaAnimando)} title={estaAnimando ? "Pausar" : "Reproducir"}>
                   {estaAnimando ? (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                   ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff" stroke="none" style={{marginLeft:'4px'}}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                   )}
                </button>

                {/* Siguiente (Icono Gris Oscuro) */}
                <button className="btn-control btn-nav" onClick={avanzarPaso} disabled={indicePaso >= historialPasos.length - 1} title="Siguiente">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                </button>
             </div>
          </div>
          <div className="explanation-box" dangerouslySetInnerHTML={renderHTML(generarExplicacion())} />
        </aside>

        {/* ÁREA PRINCIPAL */}
        <div className="main-content">
            {/* MAPA */}
            <div className="visualization-card">
                <div className="visualization-area">
                    <svg viewBox="0 0 1200 700" style={{width:'100%', height:'100%'}}>
                    {mapaData.polygons.map((poly) => (
                        <g key={poly.id}>
                        <path d={poly.path} className={`tangram-piece ${coloresRegiones[poly.id] ? 'painted' : ''}`} style={{ fill: coloresRegiones[poly.id] || 'transparent' }} />
                        {cantidadPiezas <= 50 && mapaData.centers.find(c => c.id === poly.id) && (
                            <text x={mapaData.centers.find(c => c.id === poly.id).x} y={mapaData.centers.find(c => c.id === poly.id).y} className="region-label" style={{fontSize: cantidadPiezas > 20 ? '10px' : '12px'}}>
                            {poly.id}
                            </text>
                        )}
                        </g>
                    ))}
                    </svg>
                </div>
            </div>

            {/* TABLA */}
            <div className="table-wrapper">
                <div className="history-table-container">
                    <table className="history-table">
                        <thead><tr><th>#</th><th>Región</th><th>Acción</th><th>Estado</th></tr></thead>
                        <tbody>
                            {historialPasos.map((p, i) => (
                                <tr key={i} ref={i === indicePaso ? rowRef : null} className={i === indicePaso ? 'active-row' : ''}>
                                    <td>{i + 1}</td>
                                    <td><strong>{p.region}</strong></td>
                                    <td>{p.retroceso ? <span className="badge badge-backtrack">Backtrack</span> : `Prueba ${NOMBRES_COLORES[p.color_intento]}`}</td>
                                    <td>{p.retroceso ? '↩️' : (p.valido ? <span className="badge badge-success">Válido</span> : <span className="badge badge-fail">Falló</span>)}</td>
                                </tr>
                            ))}
                            {historialPasos.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#9ca3af'}}>Resultados aquí...</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;

//en mapas_backtracking -> python -m uvicorn api_backtracking:app --reload
//en cmd en frontend como admin -> npm run dev