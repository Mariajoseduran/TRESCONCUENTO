import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Building2, Package, Shirt, Factory, History,
  Plus, Trash2, Pencil, X, Check, AlertTriangle, ChevronRight,
  LogOut, Camera, FileSpreadsheet, FileText, Layers,
} from "lucide-react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
  berry: "#6D2E46", berryDark: "#4A1E30", rose: "#A26769",
  cream: "#ECE2D0", creamLight: "#F7F3EA", ink: "#3A2530", gray: "#7A736C",
  border: "#E4DCC8", danger: "#A33B2D", dangerBg: "#F6E7E3",
  warning: "#93630F", warningBg: "#FBF0DB", ok: "#3F6B3A", okBg: "#E9F1E5",
};
const TIPOS = ["Tela", "Botón", "Marquilla", "Cierre", "Etiqueta", "Otro"];
const UNIDADES = ["m", "und"];
const TALLAS = ["XS", "S", "M", "L", "XL"];
const SANS = "'Segoe UI', system-ui, -apple-system, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function norm(s) { return (s || "").trim().toLowerCase(); }

const toTaller = (r) => ({ id: r.id, nombre: r.nombre, ciudad: r.ciudad || "" });
const toColeccion = (r) => ({ id: r.id, nombre: r.nombre, temporada: r.temporada || "" });
const toInsumo = (r) => ({
  id: r.id, tallerId: r.taller_id, tipo: r.tipo, nombre: r.nombre, color: r.color || "",
  cantidad: Number(r.cantidad) || 0, unidad: r.unidad, stockMinimo: Number(r.stock_minimo) || 0,
  fotoUrl: r.foto_url || "",
});
const toPrenda = (r) => ({ id: r.id, nombre: r.nombre, coleccionId: r.coleccion_id || "", consumos: r.consumos || [] });
const toStock = (r) => ({ id: r.id, prendaId: r.prenda_id, tallerId: r.taller_id, talla: r.talla, cantidad: Number(r.cantidad) || 0 });
const toMovimiento = (r) => ({
  id: r.id, fecha: r.fecha, tipo: r.tipo, tallerId: r.taller_id, prendaId: r.prenda_id,
  detalle: r.detalle, items: r.items || [],
});

/* ---------- Primitivas de UI ---------- */

function Btn({ children, onClick, variant = "secondary", type = "button", disabled, style }) {
  const base = {
    fontFamily: SANS, fontSize: 13.5, padding: "8px 14px", borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex",
    alignItems: "center", gap: 6, border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { background: C.berry, color: "#fff" },
    secondary: { background: "#fff", color: C.ink, border: `1px solid ${C.border}` },
    danger: { background: C.dangerBg, color: C.danger },
    ghost: { background: "transparent", color: C.gray },
  };
  return <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}
function Field({ label, children, width }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: width || "auto" }}>
      <label style={{ fontFamily: SANS, fontSize: 12, color: C.gray }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = { fontFamily: SANS, fontSize: 13.5, padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "#fff", color: C.ink, outline: "none" };
function TxtInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function SelInput(props) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{props.children}</select>; }
function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: C.ink, margin: 0 }}>{children}</h2>
      {sub && <p style={{ fontFamily: SANS, fontSize: 13.5, color: C.gray, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}
function EmptyState({ text }) {
  return <div style={{ padding: "28px 20px", textAlign: "center", color: C.gray, fontFamily: SANS, fontSize: 13.5, background: "#fff", border: `1px dashed ${C.border}`, borderRadius: 8 }}>{text}</div>;
}
function Badge({ text, tone }) {
  const tones = { ok: { bg: C.okBg, color: C.ok }, warning: { bg: C.warningBg, color: C.warning }, danger: { bg: C.dangerBg, color: C.danger }, neutral: { bg: C.cream, color: C.berry } };
  const t = tones[tone] || tones.neutral;
  return <span style={{ fontFamily: SANS, fontSize: 11.5, padding: "3px 9px", borderRadius: 20, background: t.bg, color: t.color, fontWeight: 600, whiteSpace: "nowrap" }}>{text}</span>;
}

/* ---------- Pantalla de inicio de sesión ---------- */

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Correo o contraseña incorrectos.");
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.berryDark, fontFamily: SANS }}>
      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 12, padding: "36px 34px", width: 340 }}>
        <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.berry, marginBottom: 4 }}>Tresconcuento</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 22 }}>Control de inventario · Inicia sesión</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Correo">
            <TxtInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="empleado@tresconcuento.com" />
          </Field>
          <Field label="Contraseña">
            <TxtInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
        </div>
        {error && <div style={{ marginTop: 12, fontSize: 12.5, color: C.danger }}>{error}</div>}
        <Btn type="submit" variant="primary" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
          {loading ? "Entrando…" : "Iniciar sesión"}
        </Btn>
        <div style={{ marginTop: 16, fontSize: 11.5, color: C.gray, lineHeight: 1.5 }}>
          ¿No tienes cuenta todavía? Pídele a gerencia que te cree un usuario desde el panel de Supabase.
        </div>
      </form>
    </div>
  );
}

function SinPerfil({ email }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.creamLight, fontFamily: SANS, padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 380 }}>
        <AlertTriangle size={28} color={C.warning} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 6 }}>Tu cuenta ({email}) todavía no tiene un perfil asignado.</div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 18 }}>Pídele a gerencia que te asigne un taller y un rol desde la tabla "perfiles" en Supabase.</div>
        <Btn variant="secondary" onClick={() => supabase.auth.signOut()}>Cerrar sesión</Btn>
      </div>
    </div>
  );
}

/* ---------- Sidebar ---------- */

function Sidebar({ tab, setTab, perfil }) {
  const items = [
    { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
    ...(perfil.rol === "gerencia" ? [{ id: "talleres", label: "Talleres", icon: Building2 }] : []),
    { id: "inventario", label: "Inventario", icon: Package },
    ...(perfil.rol === "gerencia" ? [
      { id: "colecciones", label: "Colecciones", icon: Layers },
      { id: "prendas", label: "Prendas (recetas)", icon: Shirt },
    ] : []),
    { id: "produccion", label: "Producción", icon: Factory },
    ...(perfil.rol === "gerencia" ? [{ id: "stock_prendas", label: "Prendas por colección", icon: Shirt }] : []),
    { id: "historial", label: "Historial", icon: History },
    ...(perfil.rol === "gerencia" ? [{ id: "reportes", label: "Reportes", icon: FileSpreadsheet }] : []),
  ];
  return (
    <div style={{ width: 220, background: C.berryDark, padding: "24px 12px", display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
      <div style={{ fontFamily: SERIF, fontSize: 17, color: "#fff", fontWeight: 700, padding: "0 12px 4px" }}>Tresconcuento</div>
      <div style={{ fontFamily: SANS, fontSize: 11.5, color: "#C9A9B2", padding: "0 12px 18px" }}>
        {perfil.nombre || "Usuario"} · {perfil.rol === "gerencia" ? "Gerencia" : "Taller"}
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, border: "none",
            cursor: "pointer", background: active ? C.berry : "transparent", color: active ? "#fff" : "#D9C7CD",
            fontFamily: SANS, fontSize: 13.5, textAlign: "left",
          }}>
            <Icon size={16} strokeWidth={2} />
            {it.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button onClick={() => supabase.auth.signOut()} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7, border: "none",
        cursor: "pointer", background: "transparent", color: "#D9C7CD", fontFamily: SANS, fontSize: 13,
      }}>
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ talleres, insumos, prendas, movimientos, setTab, perfil }) {
  const bajoStock = insumos.filter((i) => i.stockMinimo > 0 && i.cantidad <= i.stockMinimo);
  const recientes = [...movimientos].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 6);
  const stats = [
    { label: "Talleres", value: talleres.length },
    { label: "Insumos registrados", value: insumos.length },
    { label: "Prendas con receta", value: prendas.length },
    { label: "Movimientos totales", value: movimientos.length },
  ];
  return (
    <div>
      <SectionTitle sub={perfil.rol === "gerencia" ? "Vista general de todos los talleres." : "Vista general de tu taller."}>Resumen</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.gray }}>{s.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 700, color: C.berry }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.ink, margin: 0 }}>Insumos en bajo stock</h3>
            {bajoStock.length > 0 && <Badge text={`${bajoStock.length}`} tone="warning" />}
          </div>
          {bajoStock.length === 0 ? <EmptyState text="No hay insumos por debajo del mínimo definido." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {bajoStock.map((i) => {
                const taller = talleres.find((t) => t.id === i.tallerId);
                return (
                  <div key={i.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, padding: "10px 12px", display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 13 }}>
                    <span><strong>{i.nombre}</strong> {i.color ? `· ${i.color}` : ""} — {taller ? taller.nombre : ""}</span>
                    <span style={{ color: C.warning }}>{i.cantidad} {i.unidad} (mín. {i.stockMinimo})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: C.ink, margin: "0 0 10px" }}>Movimientos recientes</h3>
          {recientes.length === 0 ? <EmptyState text="Todavía no hay movimientos registrados." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recientes.map((m) => (
                <div key={m.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, padding: "9px 12px", fontFamily: SANS, fontSize: 12.5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600 }}>{m.detalle}</span>
                    <span style={{ color: C.gray }}>{m.fecha ? new Date(m.fecha).toLocaleDateString("es-CO") : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {perfil.rol === "gerencia" && talleres.length === 0 && (
        <div style={{ marginTop: 24 }}><Btn variant="primary" onClick={() => setTab("talleres")}>Empezar registrando un taller <ChevronRight size={14} /></Btn></div>
      )}
    </div>
  );
}

/* ---------- Talleres (solo gerencia) ---------- */

function TalleresTab({ talleres, insumos, onAdd, onEdit, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ nombre: "", ciudad: "" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  async function addTaller() {
    if (!draft.nombre.trim()) return;
    await onAdd(draft.nombre.trim(), draft.ciudad.trim());
    setDraft({ nombre: "", ciudad: "" });
    setAdding(false);
  }
  function startEdit(t) { setEditingId(t.id); setEditDraft({ nombre: t.nombre, ciudad: t.ciudad }); }
  async function saveEdit(id) { await onEdit(id, editDraft); setEditingId(null); }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SectionTitle sub="Los talleres donde se confeccionan las prendas. Cada uno solo ve su propio inventario al iniciar sesión.">Talleres</SectionTitle>
        {!adding && <Btn variant="primary" onClick={() => setAdding(true)}><Plus size={14} /> Nuevo taller</Btn>}
      </div>
      {adding && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Field label="Nombre del taller" width={220}><TxtInput value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} placeholder="Taller Confecciones López" /></Field>
          <Field label="Ciudad" width={180}><TxtInput value={draft.ciudad} onChange={(e) => setDraft({ ...draft, ciudad: e.target.value })} placeholder="Medellín" /></Field>
          <Btn variant="primary" onClick={addTaller}><Check size={14} /> Guardar</Btn>
          <Btn variant="ghost" onClick={() => setAdding(false)}>Cancelar</Btn>
        </div>
      )}
      {talleres.length === 0 && !adding ? <EmptyState text="Todavía no has registrado ningún taller." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {talleres.map((t) => {
            const nInsumos = insumos.filter((i) => i.tallerId === t.id).length;
            const editing = editingId === t.id;
            return (
              <div key={t.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {editing ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
                    <TxtInput value={editDraft.nombre} onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })} style={{ width: 200 }} />
                    <TxtInput value={editDraft.ciudad} onChange={(e) => setEditDraft({ ...editDraft, ciudad: e.target.value })} style={{ width: 160 }} />
                  </div>
                ) : (
                  <div style={{ fontFamily: SANS }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{t.nombre}</div>
                    <div style={{ fontSize: 12.5, color: C.gray }}>{t.ciudad || "Sin ciudad"} · {nInsumos} insumo{nInsumos !== 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 10.5, color: C.gray, marginTop: 2 }}>ID: {t.id}</div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6 }}>
                  {editing ? (
                    <>
                      <Btn variant="primary" onClick={() => saveEdit(t.id)}><Check size={13} /></Btn>
                      <Btn variant="ghost" onClick={() => setEditingId(null)}><X size={13} /></Btn>
                    </>
                  ) : (
                    <>
                      <Btn variant="ghost" onClick={() => startEdit(t)}><Pencil size={13} /></Btn>
                      <Btn variant="ghost" onClick={() => onDelete(t.id)}><Trash2 size={13} color={C.danger} /></Btn>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 16, fontSize: 12, color: C.gray, fontFamily: SANS, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
        Para crear el usuario de este taller: copia el ID del taller de arriba, ve a Supabase → Authentication → Add user, y luego en la tabla "perfiles" crea una fila con rol "taller" y ese taller_id.
      </div>
    </div>
  );
}

/* ---------- Inventario ---------- */

function InventarioTab({ talleres, insumos, perfil, onAddInsumo, onEditInsumo, onDeleteInsumo, onAddEntrada, onSubirFoto }) {
  const soloUnTaller = perfil.rol === "taller";
  const [tallerId, setTallerId] = useState(soloUnTaller ? perfil.tallerId : (talleres[0]?.id || ""));
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ tipo: "Tela", nombre: "", color: "", cantidad: "", unidad: "m", stockMinimo: "" });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});
  const [entradaFor, setEntradaFor] = useState(null);
  const [entradaCantidad, setEntradaCantidad] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(null);
  const fileInputs = useRef({});

  useEffect(() => { if (!soloUnTaller && !tallerId && talleres[0]) setTallerId(talleres[0].id); }, [talleres]);

  const lista = insumos.filter((i) => i.tallerId === tallerId);

  async function addInsumo() {
    if (!draft.nombre.trim() || !tallerId) return;
    await onAddInsumo({ tallerId, tipo: draft.tipo, nombre: draft.nombre.trim(), color: draft.color.trim(), cantidad: parseFloat(draft.cantidad) || 0, unidad: draft.unidad, stockMinimo: parseFloat(draft.stockMinimo) || 0 });
    setDraft({ tipo: "Tela", nombre: "", color: "", cantidad: "", unidad: "m", stockMinimo: "" });
    setAdding(false);
  }
  function startEdit(i) { setEditingId(i.id); setEditDraft({ ...i }); }
  async function saveEdit(id) {
    await onEditInsumo(id, { ...editDraft, cantidad: parseFloat(editDraft.cantidad) || 0, stockMinimo: parseFloat(editDraft.stockMinimo) || 0 });
    setEditingId(null);
  }
  async function registrarEntrada(insumo) {
    const cant = parseFloat(entradaCantidad);
    if (!cant || cant <= 0) return;
    await onAddEntrada(insumo, cant);
    setEntradaFor(null);
    setEntradaCantidad("");
  }
  async function handleFotoChange(insumo, e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoFoto(insumo.id);
    await onSubirFoto(insumo, file);
    setSubiendoFoto(null);
  }

  const tallerActual = talleres.find((t) => t.id === tallerId);

  return (
    <div>
      <SectionTitle sub="Telas, botones, marquillas y demás insumos disponibles en cada taller.">Inventario {soloUnTaller ? `· ${tallerActual?.nombre || ""}` : "por taller"}</SectionTitle>
      {talleres.length === 0 ? <EmptyState text="Todavía no hay talleres visibles para tu cuenta." /> : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            {!soloUnTaller && (
              <Field label="Taller" width={260}>
                <SelInput value={tallerId} onChange={(e) => setTallerId(e.target.value)}>
                  {talleres.map((t) => <option key={t.id} value={t.id}>{t.nombre} {t.ciudad ? `· ${t.ciudad}` : ""}</option>)}
                </SelInput>
              </Field>
            )}
            <div style={{ marginLeft: "auto" }}>
              <Btn variant="primary" onClick={() => setAdding(true)}><Plus size={14} /> Nuevo insumo</Btn>
            </div>
          </div>

          {adding && (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
              <Field label="Tipo" width={120}><SelInput value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</SelInput></Field>
              <Field label="Nombre" width={170}><TxtInput value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} placeholder="Algodón Primatela" /></Field>
              <Field label="Color" width={120}><TxtInput value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} placeholder="Azul" /></Field>
              <Field label="Cantidad" width={90}><TxtInput type="number" value={draft.cantidad} onChange={(e) => setDraft({ ...draft, cantidad: e.target.value })} placeholder="0" /></Field>
              <Field label="Unidad" width={80}><SelInput value={draft.unidad} onChange={(e) => setDraft({ ...draft, unidad: e.target.value })}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</SelInput></Field>
              <Field label="Stock mínimo" width={100}><TxtInput type="number" value={draft.stockMinimo} onChange={(e) => setDraft({ ...draft, stockMinimo: e.target.value })} placeholder="0" /></Field>
              <Btn variant="primary" onClick={addInsumo}><Check size={14} /> Guardar</Btn>
              <Btn variant="ghost" onClick={() => setAdding(false)}>Cancelar</Btn>
            </div>
          )}

          {lista.length === 0 ? <EmptyState text={`${tallerActual ? tallerActual.nombre : "Este taller"} todavía no tiene insumos registrados.`} /> : (
            <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.creamLight, textAlign: "left" }}>
                    {["Foto", "Tipo", "Nombre", "Color", "Cantidad", "Mínimo", ""].map((h) => <th key={h} style={{ padding: "9px 12px", fontWeight: 600, color: C.gray, fontSize: 11.5 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {lista.map((i, idx) => {
                    const editing = editingId === i.id;
                    const bajo = i.stockMinimo > 0 && i.cantidad <= i.stockMinimo;
                    return (
                      <tr key={i.id} style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : "none" }}>
                        <td style={{ padding: 8 }}>
                          <input ref={(el) => (fileInputs.current[i.id] = el)} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFotoChange(i, e)} />
                          {i.fotoUrl ? (
                            <img src={i.fotoUrl} alt={i.nombre} onClick={() => fileInputs.current[i.id]?.click()} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: `1px solid ${C.border}` }} />
                          ) : (
                            <button onClick={() => fileInputs.current[i.id]?.click()} style={{ width: 36, height: 36, borderRadius: 6, border: `1px dashed ${C.border}`, background: C.creamLight, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Camera size={14} color={C.gray} />
                            </button>
                          )}
                          {subiendoFoto === i.id && <div style={{ fontSize: 9, color: C.gray }}>Subiendo…</div>}
                        </td>
                        {editing ? (
                          <>
                            <td style={{ padding: 8 }}><SelInput value={editDraft.tipo} onChange={(e) => setEditDraft({ ...editDraft, tipo: e.target.value })}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</SelInput></td>
                            <td style={{ padding: 8 }}><TxtInput value={editDraft.nombre} onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })} style={{ width: 130 }} /></td>
                            <td style={{ padding: 8 }}><TxtInput value={editDraft.color} onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })} style={{ width: 90 }} /></td>
                            <td style={{ padding: 8 }}><TxtInput type="number" value={editDraft.cantidad} onChange={(e) => setEditDraft({ ...editDraft, cantidad: e.target.value })} style={{ width: 70 }} /></td>
                            <td style={{ padding: 8 }}><TxtInput type="number" value={editDraft.stockMinimo} onChange={(e) => setEditDraft({ ...editDraft, stockMinimo: e.target.value })} style={{ width: 70 }} /></td>
                            <td style={{ padding: 8, display: "flex", gap: 4 }}>
                              <Btn variant="primary" onClick={() => saveEdit(i.id)}><Check size={12} /></Btn>
                              <Btn variant="ghost" onClick={() => setEditingId(null)}><X size={12} /></Btn>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: "9px 12px", color: C.gray }}>{i.tipo}</td>
                            <td style={{ padding: "9px 12px", fontWeight: 600 }}>{i.nombre}</td>
                            <td style={{ padding: "9px 12px", color: C.gray }}>{i.color || "—"}</td>
                            <td style={{ padding: "9px 12px" }}>{i.cantidad} {i.unidad} {bajo && <Badge text="Bajo stock" tone="warning" />}</td>
                            <td style={{ padding: "9px 12px", color: C.gray }}>{i.stockMinimo || "—"}</td>
                            <td style={{ padding: "9px 12px" }}>
                              {entradaFor === i.id ? (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <TxtInput type="number" autoFocus value={entradaCantidad} onChange={(e) => setEntradaCantidad(e.target.value)} placeholder="Cant." style={{ width: 70 }} />
                                  <Btn variant="primary" onClick={() => registrarEntrada(i)}><Check size={12} /></Btn>
                                  <Btn variant="ghost" onClick={() => { setEntradaFor(null); setEntradaCantidad(""); }}><X size={12} /></Btn>
                                </div>
                              ) : (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <Btn variant="secondary" onClick={() => setEntradaFor(i.id)}><Plus size={12} /> Entrada</Btn>
                                  <Btn variant="ghost" onClick={() => startEdit(i)}><Pencil size={12} /></Btn>
                                  <Btn variant="ghost" onClick={() => onDeleteInsumo(i.id)}><Trash2 size={12} color={C.danger} /></Btn>
                                </div>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Colecciones (solo gerencia) ---------- */

function ColeccionesTab({ colecciones, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ nombre: "", temporada: "" });

  async function add() {
    if (!draft.nombre.trim()) return;
    await onAdd(draft.nombre.trim(), draft.temporada.trim());
    setDraft({ nombre: "", temporada: "" });
    setAdding(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SectionTitle sub="Agrupa tus prendas por colección o temporada.">Colecciones</SectionTitle>
        {!adding && <Btn variant="primary" onClick={() => setAdding(true)}><Plus size={14} /> Nueva colección</Btn>}
      </div>
      {adding && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end" }}>
          <Field label="Nombre" width={220}><TxtInput value={draft.nombre} onChange={(e) => setDraft({ ...draft, nombre: e.target.value })} placeholder="Verano 2026" /></Field>
          <Field label="Temporada" width={180}><TxtInput value={draft.temporada} onChange={(e) => setDraft({ ...draft, temporada: e.target.value })} placeholder="Primavera-Verano" /></Field>
          <Btn variant="primary" onClick={add}><Check size={14} /> Guardar</Btn>
          <Btn variant="ghost" onClick={() => setAdding(false)}>Cancelar</Btn>
        </div>
      )}
      {colecciones.length === 0 && !adding ? <EmptyState text="Todavía no has creado ninguna colección." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {colecciones.map((c) => (
            <div key={c.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: SANS }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{c.nombre}</div>
                <div style={{ fontSize: 12.5, color: C.gray }}>{c.temporada || "Sin temporada"}</div>
              </div>
              <Btn variant="ghost" onClick={() => onDelete(c.id)}><Trash2 size={13} color={C.danger} /></Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Prendas (recetas, solo gerencia) ---------- */

function emptyConsumo() { return { key: Math.random().toString(36).slice(2), tipo: "Tela", nombre: "", color: "", cantidad: "", unidad: "m" }; }

function PrendasTab({ prendas, colecciones, onAdd, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [nombre, setNombre] = useState("");
  const [coleccionId, setColeccionId] = useState("");
  const [consumos, setConsumos] = useState([emptyConsumo()]);
  const [expandedId, setExpandedId] = useState(null);

  function addConsumoRow() { setConsumos([...consumos, emptyConsumo()]); }
  function updateConsumoRow(key, field, value) { setConsumos(consumos.map((c) => (c.key === key ? { ...c, [field]: value } : c))); }
  function removeConsumoRow(key) { setConsumos(consumos.filter((c) => c.key !== key)); }

  async function savePrenda() {
    const validConsumos = consumos.filter((c) => c.nombre.trim() && parseFloat(c.cantidad) > 0);
    if (!nombre.trim() || validConsumos.length === 0) return;
    await onAdd(nombre.trim(), coleccionId || null, validConsumos.map((c) => ({ tipo: c.tipo, nombre: c.nombre.trim(), color: c.color.trim(), cantidad: parseFloat(c.cantidad), unidad: c.unidad })));
    setNombre(""); setColeccionId(""); setConsumos([emptyConsumo()]); setAdding(false);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <SectionTitle sub="Define cuánta tela e insumos gasta cada prenda por unidad.">Prendas y recetas</SectionTitle>
        {!adding && <Btn variant="primary" onClick={() => setAdding(true)}><Plus size={14} /> Nueva prenda</Btn>}
      </div>

      {adding && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Nombre de la prenda" width={280}><TxtInput value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Camisa Emilia" /></Field>
            <Field label="Colección (opcional)" width={220}>
              <SelInput value={coleccionId} onChange={(e) => setColeccionId(e.target.value)}>
                <option value="">Sin colección</option>
                {colecciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </SelInput>
            </Field>
          </div>
          <div style={{ marginTop: 14, marginBottom: 6, fontFamily: SANS, fontSize: 12.5, color: C.gray }}>Consumo de insumos por unidad producida (1 prenda)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {consumos.map((c) => (
              <div key={c.key} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <Field label="Tipo" width={110}><SelInput value={c.tipo} onChange={(e) => updateConsumoRow(c.key, "tipo", e.target.value)}>{TIPOS.map((t) => <option key={t}>{t}</option>)}</SelInput></Field>
                <Field label="Nombre del insumo" width={160}><TxtInput value={c.nombre} onChange={(e) => updateConsumoRow(c.key, "nombre", e.target.value)} placeholder="Algodón Primatela" /></Field>
                <Field label="Color" width={110}><TxtInput value={c.color} onChange={(e) => updateConsumoRow(c.key, "color", e.target.value)} placeholder="Azul" /></Field>
                <Field label="Cant. por unidad" width={100}><TxtInput type="number" step="0.01" value={c.cantidad} onChange={(e) => updateConsumoRow(c.key, "cantidad", e.target.value)} placeholder="1.5" /></Field>
                <Field label="Unidad" width={80}><SelInput value={c.unidad} onChange={(e) => updateConsumoRow(c.key, "unidad", e.target.value)}>{UNIDADES.map((u) => <option key={u}>{u}</option>)}</SelInput></Field>
                <Btn variant="ghost" onClick={() => removeConsumoRow(c.key)}><Trash2 size={13} color={C.danger} /></Btn>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}><Btn variant="secondary" onClick={addConsumoRow}><Plus size={13} /> Agregar insumo a la receta</Btn></div>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Btn variant="primary" onClick={savePrenda}><Check size={14} /> Guardar prenda</Btn>
            <Btn variant="ghost" onClick={() => { setAdding(false); setConsumos([emptyConsumo()]); setNombre(""); }}>Cancelar</Btn>
          </div>
        </div>
      )}

      {prendas.length === 0 && !adding ? <EmptyState text="Todavía no has definido ninguna receta de producción." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prendas.map((p) => {
            const expanded = expandedId === p.id;
            const col = colecciones.find((c) => c.id === p.coleccionId);
            return (
              <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : p.id)}>
                  <div>
                    <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14, color: C.ink }}>{p.nombre}</div>
                    {col && <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.gray }}>{col.nombre}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: SANS, fontSize: 12, color: C.gray }}>{p.consumos.length} insumo{p.consumos.length !== 1 ? "s" : ""}</span>
                    <Btn variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}><Trash2 size={13} color={C.danger} /></Btn>
                    <ChevronRight size={15} style={{ transform: expanded ? "rotate(90deg)" : "none", color: C.gray }} />
                  </div>
                </div>
                {expanded && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 16px", background: C.creamLight }}>
                    {p.consumos.map((c, idx) => (
                      <div key={idx} style={{ fontFamily: SANS, fontSize: 12.5, color: C.ink, padding: "4px 0" }}>
                        {c.cantidad} {c.unidad} de {c.tipo.toLowerCase()} <strong>{c.nombre}</strong>{c.color ? ` (${c.color})` : ""} por unidad
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Producción ---------- */

function ProduccionTab({ talleres, insumos, prendas, perfil, onRegistrar }) {
  const soloUnTaller = perfil.rol === "taller";
  const [tallerId, setTallerId] = useState(soloUnTaller ? perfil.tallerId : (talleres[0]?.id || ""));
  const [prendaId, setPrendaId] = useState(prendas[0]?.id || "");
  const [curva, setCurva] = useState(Object.fromEntries(TALLAS.map((t) => [t, ""])));
  const [confirmando, setConfirmando] = useState(false);
  const [registrado, setRegistrado] = useState(null);

  useEffect(() => { if (!soloUnTaller && !tallerId && talleres[0]) setTallerId(talleres[0].id); }, [talleres]);
  useEffect(() => { if (!prendaId && prendas[0]) setPrendaId(prendas[0].id); }, [prendas]);

  const prenda = prendas.find((p) => p.id === prendaId);
  const totalUnidades = TALLAS.reduce((sum, t) => sum + (parseFloat(curva[t]) || 0), 0);

  const preview = !prenda ? [] : prenda.consumos.map((c) => {
    const necesario = round2(c.cantidad * totalUnidades);
    const match = insumos.find((i) => i.tallerId === tallerId && i.tipo === c.tipo && norm(i.nombre) === norm(c.nombre) && norm(i.color) === norm(c.color));
    let estado = "ok";
    if (!match) estado = "no_encontrado"; else if (match.cantidad < necesario) estado = "insuficiente";
    return { ...c, necesario, disponible: match ? match.cantidad : null, insumoId: match ? match.id : null, estado };
  });
  const hayProblemas = preview.some((p) => p.estado !== "ok");

  async function registrarProduccion() {
    if (totalUnidades <= 0 || !prenda || !tallerId) return;
    const items = [];
    const updates = [];
    preview.forEach((p) => {
      if (p.insumoId) {
        const actual = insumos.find((i) => i.id === p.insumoId);
        const nuevaCantidad = Math.max(0, round2(actual.cantidad - p.necesario));
        items.push({ nombre: actual.nombre, color: actual.color, usado: p.necesario, unidad: p.unidad });
        updates.push({ insumoId: p.insumoId, nuevaCantidad });
      } else {
        items.push({ nombre: p.nombre, color: p.color, usado: p.necesario, unidad: p.unidad, noEncontrado: true });
      }
    });
    const curvaPorTalla = TALLAS.map((t) => ({ talla: t, cantidad: parseFloat(curva[t]) || 0 })).filter((c) => c.cantidad > 0);
    const curvaTexto = curvaPorTalla.map((c) => `${c.talla}:${c.cantidad}`).join(" ");
    const detalle = `Producción de ${totalUnidades} · ${prenda.nombre} (${curvaTexto})`;
    await onRegistrar({ tallerId, prendaId, detalle, items, updates, curvaPorTalla });
    setRegistrado(detalle);
    setCurva(Object.fromEntries(TALLAS.map((t) => [t, ""])));
    setConfirmando(false);
  }

  if (talleres.length === 0 || prendas.length === 0) {
    return (
      <div>
        <SectionTitle sub="Registra la entrada de una curva a producción y el sistema descuenta los insumos automáticamente.">Registrar producción</SectionTitle>
        <EmptyState text="Necesitas al menos un taller y una prenda con receta antes de registrar producción." />
      </div>
    );
  }

  return (
    <div>
      <SectionTitle sub="Registra la entrada de una curva a producción y el sistema descuenta los insumos automáticamente.">Registrar producción</SectionTitle>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {!soloUnTaller && (
          <Field label="Taller" width={220}>
            <SelInput value={tallerId} onChange={(e) => { setTallerId(e.target.value); setRegistrado(null); }}>
              {talleres.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </SelInput>
          </Field>
        )}
        <Field label="Prenda" width={220}>
          <SelInput value={prendaId} onChange={(e) => { setPrendaId(e.target.value); setRegistrado(null); }}>
            {prendas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </SelInput>
        </Field>
      </div>

      <div style={{ marginBottom: 6, fontFamily: SANS, fontSize: 12.5, color: C.gray }}>Curva de tallas que entra a producción</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
        {TALLAS.map((t) => (
          <Field key={t} label={t} width={64}>
            <TxtInput type="number" min="0" value={curva[t]} onChange={(e) => { setCurva({ ...curva, [t]: e.target.value }); setRegistrado(null); }} placeholder="0" />
          </Field>
        ))}
        <div style={{ display: "flex", alignItems: "flex-end", fontFamily: SANS, fontSize: 13, color: C.ink, paddingBottom: 7 }}><strong>&nbsp;= {totalUnidades} unidades</strong></div>
      </div>

      {prenda && totalUnidades > 0 && (
        <>
          <div style={{ marginBottom: 8, fontFamily: SANS, fontSize: 12.5, color: C.gray }}>Consumo estimado en {talleres.find((t) => t.id === tallerId)?.nombre}</div>
          <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 13 }}>
              <thead><tr style={{ background: C.creamLight, textAlign: "left" }}>{["Insumo", "Necesario", "Disponible", "Estado"].map((h) => <th key={h} style={{ padding: "9px 12px", fontWeight: 600, color: C.gray, fontSize: 11.5 }}>{h}</th>)}</tr></thead>
              <tbody>
                {preview.map((p, idx) => (
                  <tr key={idx} style={{ borderTop: idx > 0 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>{p.nombre}{p.color ? ` (${p.color})` : ""}</td>
                    <td style={{ padding: "9px 12px" }}>{p.necesario} {p.unidad}</td>
                    <td style={{ padding: "9px 12px" }}>{p.disponible === null ? "—" : `${p.disponible} ${p.unidad}`}</td>
                    <td style={{ padding: "9px 12px" }}>
                      {p.estado === "ok" && <Badge text="Suficiente" tone="ok" />}
                      {p.estado === "insuficiente" && <Badge text="Insuficiente" tone="warning" />}
                      {p.estado === "no_encontrado" && <Badge text="No encontrado en este taller" tone="danger" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hayProblemas && !confirmando && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: C.warningBg, color: C.warning, padding: "10px 14px", borderRadius: 7, fontFamily: SANS, fontSize: 13, marginBottom: 12 }}>
              <AlertTriangle size={16} /> Hay insumos insuficientes o no encontrados. Puedes registrar de todas formas; el faltante quedará en cero.
            </div>
          )}
          {!confirmando ? <Btn variant="primary" onClick={() => setConfirmando(true)}>Continuar</Btn> : (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" onClick={registrarProduccion}><Check size={14} /> Confirmar y descontar inventario</Btn>
              <Btn variant="ghost" onClick={() => setConfirmando(false)}>Cancelar</Btn>
            </div>
          )}
        </>
      )}
      {registrado && <div style={{ marginTop: 18, background: C.okBg, color: C.ok, padding: "12px 16px", borderRadius: 8, fontFamily: SANS, fontSize: 13 }}>Producción registrada. El inventario y el stock de prendas se actualizaron automáticamente.</div>}
    </div>
  );
}

/* ---------- Stock de prendas por colección (solo gerencia) ---------- */

function StockPrendasTab({ prendas, colecciones, talleres, stock }) {
  const [coleccionFiltro, setColeccionFiltro] = useState("todas");
  const prendasFiltradas = prendas.filter((p) => coleccionFiltro === "todas" || p.coleccionId === coleccionFiltro);

  return (
    <div>
      <SectionTitle sub="Cuántas unidades de cada prenda ya se produjeron, por talla y por taller.">Prendas por colección</SectionTitle>
      <Field label="Filtrar por colección" width={240}>
        <SelInput value={coleccionFiltro} onChange={(e) => setColeccionFiltro(e.target.value)}>
          <option value="todas">Todas las colecciones</option>
          {colecciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </SelInput>
      </Field>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {prendasFiltradas.length === 0 ? <EmptyState text="No hay prendas para esta colección." /> : prendasFiltradas.map((p) => {
          const filas = stock.filter((s) => s.prendaId === p.id);
          const total = filas.reduce((sum, f) => sum + f.cantidad, 0);
          return (
            <div key={p.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, marginBottom: filas.length ? 8 : 0 }}>
                <strong style={{ fontSize: 14, color: C.ink }}>{p.nombre}</strong>
                <Badge text={`${total} unidades en total`} tone="neutral" />
              </div>
              {filas.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {filas.map((f) => {
                    const t = talleres.find((tt) => tt.id === f.tallerId);
                    return (
                      <div key={f.id} style={{ fontFamily: SANS, fontSize: 12, color: C.gray, background: C.creamLight, borderRadius: 6, padding: "4px 9px" }}>
                        {f.talla}: <strong style={{ color: C.ink }}>{f.cantidad}</strong> ({t?.nombre || "—"})
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Historial ---------- */

function HistorialTab({ movimientos, talleres }) {
  const [tallerFiltro, setTallerFiltro] = useState("todos");
  const lista = [...movimientos].filter((m) => tallerFiltro === "todos" || m.tallerId === tallerFiltro).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
  return (
    <div>
      <SectionTitle sub="Registro de entradas y consumos de insumos por taller.">Historial de movimientos</SectionTitle>
      {talleres.length > 1 && (
        <Field label="Filtrar por taller" width={240}>
          <SelInput value={tallerFiltro} onChange={(e) => setTallerFiltro(e.target.value)}>
            <option value="todos">Todos los talleres</option>
            {talleres.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </SelInput>
        </Field>
      )}
      <div style={{ marginTop: 16 }}>
        {lista.length === 0 ? <EmptyState text="No hay movimientos para este filtro." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lista.map((m) => {
              const taller = talleres.find((t) => t.id === m.tallerId);
              return (
                <div key={m.id} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS }}>
                    <div>
                      <Badge text={m.tipo === "produccion" ? "Producción" : "Entrada"} tone={m.tipo === "produccion" ? "neutral" : "ok"} />
                      <span style={{ marginLeft: 8, fontSize: 13.5, fontWeight: 600, color: C.ink }}>{m.detalle}</span>
                    </div>
                    <span style={{ fontSize: 12, color: C.gray }}>{m.fecha ? new Date(m.fecha).toLocaleString("es-CO") : ""} · {taller ? taller.nombre : ""}</span>
                  </div>
                  {m.items && m.items.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 3 }}>
                      {m.items.map((it, idx) => (
                        <div key={idx} style={{ fontFamily: SANS, fontSize: 12.5, color: C.gray }}>
                          {it.nombre}{it.color ? ` (${it.color})` : ""}: {m.tipo === "produccion" ? `-${it.usado}` : `+${it.usado || it.cantidad}`} {it.unidad}
                          {it.noEncontrado && <span style={{ color: C.danger }}> · no encontrado en inventario</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Reportes (solo gerencia) ---------- */

function ReportesTab({ talleres, insumos, prendas, movimientos, stock }) {
  function descargarInventarioExcel() {
    const filas = insumos.map((i) => ({
      Taller: talleres.find((t) => t.id === i.tallerId)?.nombre || "",
      Tipo: i.tipo, Nombre: i.nombre, Color: i.color, Cantidad: i.cantidad, Unidad: i.unidad, "Stock mínimo": i.stockMinimo,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_tresconcuento_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function descargarHistorialExcel() {
    const filas = movimientos.map((m) => ({
      Fecha: m.fecha ? new Date(m.fecha).toLocaleString("es-CO") : "",
      Tipo: m.tipo, Taller: talleres.find((t) => t.id === m.tallerId)?.nombre || "", Detalle: m.detalle,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");
    XLSX.writeFile(wb, `historial_tresconcuento_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function descargarStockExcel() {
    const filas = stock.map((s) => ({
      Prenda: prendas.find((p) => p.id === s.prendaId)?.nombre || "",
      Taller: talleres.find((t) => t.id === s.tallerId)?.nombre || "",
      Talla: s.talla, Cantidad: s.cantidad,
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prendas");
    XLSX.writeFile(wb, `prendas_tresconcuento_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function descargarInventarioPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Tresconcuento · Inventario de insumos", 14, 16);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString("es-CO"), 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Taller", "Tipo", "Nombre", "Color", "Cantidad", "Mínimo"]],
      body: insumos.map((i) => [
        talleres.find((t) => t.id === i.tallerId)?.nombre || "", i.tipo, i.nombre, i.color || "-",
        `${i.cantidad} ${i.unidad}`, i.stockMinimo || "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [109, 46, 70] },
    });
    doc.save(`inventario_tresconcuento_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  function descargarAlertasPDF() {
    const bajoStock = insumos.filter((i) => i.stockMinimo > 0 && i.cantidad <= i.stockMinimo);
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Tresconcuento · Alertas de inventario bajo", 14, 16);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString("es-CO"), 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Taller", "Insumo", "Cantidad actual", "Mínimo"]],
      body: bajoStock.map((i) => [
        talleres.find((t) => t.id === i.tallerId)?.nombre || "", `${i.nombre}${i.color ? " " + i.color : ""}`,
        `${i.cantidad} ${i.unidad}`, i.stockMinimo,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [163, 59, 45] },
    });
    doc.save(`alertas_tresconcuento_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const reportes = [
    { titulo: "Inventario de insumos", desc: "Todos los talleres, con cantidades y stock mínimo.", excel: descargarInventarioExcel, pdf: descargarInventarioPDF },
    { titulo: "Historial de movimientos", desc: "Entradas y producciones registradas.", excel: descargarHistorialExcel, pdf: null },
    { titulo: "Prendas por colección", desc: "Unidades producidas por prenda, talla y taller.", excel: descargarStockExcel, pdf: null },
    { titulo: "Alertas de inventario bajo", desc: "Solo los insumos por debajo del mínimo.", excel: null, pdf: descargarAlertasPDF },
  ];

  return (
    <div>
      <SectionTitle sub="Descarga la información para compartirla con gerencia o los proveedores.">Reportes</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reportes.map((r) => (
          <div key={r.titulo} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: SANS }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.ink }}>{r.titulo}</div>
              <div style={{ fontSize: 12.5, color: C.gray }}>{r.desc}</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {r.excel && <Btn variant="secondary" onClick={r.excel}><FileSpreadsheet size={14} /> Excel</Btn>}
              {r.pdf && <Btn variant="secondary" onClick={r.pdf}><FileText size={14} /> PDF</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- App con autenticación ---------- */

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = cargando, null = sin sesión
  const [perfil, setPerfil] = useState(undefined);
  const [tab, setTab] = useState("dashboard");
  const [talleres, setTalleres] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [prendas, setPrendas] = useState([]);
  const [colecciones, setColecciones] = useState([]);
  const [stock, setStock] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
    if (session === null) { setPerfil(null); return; }
    (async () => {
      const { data, error } = await supabase.from("perfiles").select("*").eq("id", session.user.id).maybeSingle();
      if (error || !data) { setPerfil(null); return; }
      setPerfil({ nombre: data.nombre, rol: data.rol, tallerId: data.taller_id });
    })();
  }, [session]);

  async function refresh() {
    try {
      const [t, i, p, c, s, m] = await Promise.all([
        supabase.from("talleres").select("*").order("nombre"),
        supabase.from("insumos").select("*"),
        supabase.from("prendas").select("*").order("nombre"),
        supabase.from("colecciones").select("*").order("nombre"),
        supabase.from("prendas_stock").select("*"),
        supabase.from("movimientos").select("*").order("fecha", { ascending: false }),
      ]);
      const firstError = t.error || i.error || p.error || c.error || s.error || m.error;
      if (firstError) throw firstError;
      setTalleres(t.data.map(toTaller));
      setInsumos(i.data.map(toInsumo));
      setPrendas(p.data.map(toPrenda));
      setColecciones(c.data.map(toColeccion));
      setStock(s.data.map(toStock));
      setMovimientos(m.data.map(toMovimiento));
      setError(null);
    } catch (e) {
      console.error(e);
      setError("No se pudo conectar con la base de datos.");
    }
  }

  useEffect(() => { if (perfil) refresh(); }, [perfil]);

  // Talleres
  async function addTaller(nombre, ciudad) { await supabase.from("talleres").insert({ nombre, ciudad }); await refresh(); }
  async function editTaller(id, patch) { await supabase.from("talleres").update({ nombre: patch.nombre, ciudad: patch.ciudad }).eq("id", id); await refresh(); }
  async function deleteTaller(id) { await supabase.from("talleres").delete().eq("id", id); await refresh(); }

  // Colecciones
  async function addColeccion(nombre, temporada) { await supabase.from("colecciones").insert({ nombre, temporada }); await refresh(); }
  async function deleteColeccion(id) { await supabase.from("colecciones").delete().eq("id", id); await refresh(); }

  // Insumos
  async function addInsumo(insumo) {
    await supabase.from("insumos").insert({ taller_id: insumo.tallerId, tipo: insumo.tipo, nombre: insumo.nombre, color: insumo.color, cantidad: insumo.cantidad, unidad: insumo.unidad, stock_minimo: insumo.stockMinimo });
    await refresh();
  }
  async function editInsumo(id, patch) {
    await supabase.from("insumos").update({ tipo: patch.tipo, nombre: patch.nombre, color: patch.color, cantidad: patch.cantidad, unidad: patch.unidad, stock_minimo: patch.stockMinimo }).eq("id", id);
    await refresh();
  }
  async function deleteInsumo(id) { await supabase.from("insumos").delete().eq("id", id); await refresh(); }
  async function addEntrada(insumo, cantidad) {
    const nuevaCantidad = round2(insumo.cantidad + cantidad);
    await supabase.from("insumos").update({ cantidad: nuevaCantidad }).eq("id", insumo.id);
    await supabase.from("movimientos").insert({ tipo: "entrada", taller_id: insumo.tallerId, detalle: `Entrada de ${cantidad} ${insumo.unidad} · ${insumo.nombre}${insumo.color ? " " + insumo.color : ""}`, items: [{ nombre: insumo.nombre, color: insumo.color, usado: cantidad, unidad: insumo.unidad }] });
    await refresh();
  }
  async function subirFoto(insumo, file) {
    const ext = file.name.split(".").pop();
    const path = `${insumo.tallerId}/${insumo.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("insumos-fotos").upload(path, file, { upsert: true });
    if (upErr) { console.error(upErr); return; }
    const { data } = supabase.storage.from("insumos-fotos").getPublicUrl(path);
    await supabase.from("insumos").update({ foto_url: data.publicUrl }).eq("id", insumo.id);
    await refresh();
  }

  // Prendas
  async function addPrenda(nombre, coleccionId, consumos) { await supabase.from("prendas").insert({ nombre, coleccion_id: coleccionId, consumos }); await refresh(); }
  async function deletePrenda(id) { await supabase.from("prendas").delete().eq("id", id); await refresh(); }

  // Producción
  async function registrarProduccion({ tallerId, prendaId, detalle, items, updates, curvaPorTalla }) {
    for (const u of updates) await supabase.from("insumos").update({ cantidad: u.nuevaCantidad }).eq("id", u.insumoId);
    for (const c of curvaPorTalla) {
      const existente = stock.find((s) => s.prendaId === prendaId && s.tallerId === tallerId && s.talla === c.talla);
      const nuevaCantidad = round2((existente?.cantidad || 0) + c.cantidad);
      await supabase.from("prendas_stock").upsert({ prenda_id: prendaId, taller_id: tallerId, talla: c.talla, cantidad: nuevaCantidad }, { onConflict: "prenda_id,taller_id,talla" });
    }
    await supabase.from("movimientos").insert({ tipo: "produccion", taller_id: tallerId, prenda_id: prendaId, detalle, items });
    await refresh();
  }

  if (session === undefined || (session && perfil === undefined)) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, color: C.gray, background: C.creamLight }}>Cargando…</div>;
  }
  if (!session) return <LoginScreen />;
  if (!perfil) return <SinPerfil email={session.user.email} />;

  const talleresVisibles = perfil.rol === "taller" ? talleres.filter((t) => t.id === perfil.tallerId) : talleres;

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: SANS, color: C.ink, background: C.creamLight }}>
      <Sidebar tab={tab} setTab={setTab} perfil={perfil} />
      <div style={{ flex: 1, padding: "28px 32px", minWidth: 0, overflowX: "auto" }}>
        {error && <div style={{ background: C.dangerBg, color: C.danger, padding: "10px 14px", borderRadius: 7, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        {tab === "dashboard" && <Dashboard talleres={talleresVisibles} insumos={insumos} prendas={prendas} movimientos={movimientos} setTab={setTab} perfil={perfil} />}
        {tab === "talleres" && perfil.rol === "gerencia" && <TalleresTab talleres={talleresVisibles} insumos={insumos} onAdd={addTaller} onEdit={editTaller} onDelete={deleteTaller} />}
        {tab === "inventario" && <InventarioTab talleres={talleresVisibles} insumos={insumos} perfil={perfil} onAddInsumo={addInsumo} onEditInsumo={editInsumo} onDeleteInsumo={deleteInsumo} onAddEntrada={addEntrada} onSubirFoto={subirFoto} />}
        {tab === "colecciones" && perfil.rol === "gerencia" && <ColeccionesTab colecciones={colecciones} onAdd={addColeccion} onDelete={deleteColeccion} />}
        {tab === "prendas" && perfil.rol === "gerencia" && <PrendasTab prendas={prendas} colecciones={colecciones} onAdd={addPrenda} onDelete={deletePrenda} />}
        {tab === "produccion" && <ProduccionTab talleres={talleresVisibles} insumos={insumos} prendas={prendas} perfil={perfil} onRegistrar={registrarProduccion} />}
        {tab === "stock_prendas" && perfil.rol === "gerencia" && <StockPrendasTab prendas={prendas} colecciones={colecciones} talleres={talleresVisibles} stock={stock} />}
        {tab === "historial" && <HistorialTab movimientos={movimientos} talleres={talleresVisibles} />}
        {tab === "reportes" && perfil.rol === "gerencia" && <ReportesTab talleres={talleresVisibles} insumos={insumos} prendas={prendas} movimientos={movimientos} stock={stock} />}
      </div>
    </div>
  );
}
