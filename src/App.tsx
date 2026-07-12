import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { supabase } from "./supabaseClient";

// ID del negocio en la tabla `businesses` del panel — pégalo aquí
const BUSINESS_ID = "d464ee1a-44e9-4720-a2a8-f9c4c0fad254";

// ── PALETA ────────────────────────────────────────────────────────────────────
const bg     = "#f0f0f0";
const card   = "#ffffff";
const cardHi = "#e8e8e8";
const border = "#ddd0d2";
const accent = "#8b1729";
const accentS= "#b01e34";
const text   = "#1a1a1a";
const muted  = "#7a6065";
const pill   = "#f0e8ea";

// ── CREDENCIALES ──────────────────────────────────────────────────────────────
const TELEGRAM_TOKEN    = import.meta.env.VITE_TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID  = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const EJS_SERVICE       = import.meta.env.VITE_EMAILJS_SERVICE;
const EJS_TPL_ADMIN     = import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN;
const EJS_TPL_CLIENTE   = import.meta.env.VITE_EMAILJS_TEMPLATE_CLIENTE;
const EJS_KEY           = import.meta.env.VITE_EMAILJS_KEY;

// ── DATOS ─────────────────────────────────────────────────────────────────────
const MENU = {
  especiales: {
    label: "Especiales",
    items: [
      { id: "monte-alban",    img: "https://i.ibb.co/0jPrFDbd/IMG-5715.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Monte Albán",    desc: "Chapulines & Queso Oaxaca",       precios: { Slice: 133, Normal: 333 }, },
      { id: "cowabunga",      img: "https://i.ibb.co/PGWKC6Mw/IMG-5719.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Cowabunga",       desc: "Anchos & Aceituna verde",          precios: { Slice: 133, Normal: 333 } },
      { id: "dolce-pera",     img: "https://i.ibb.co/Rk64DZTm/IMG-5718.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Dolce Pera 22", desc: "Gorgonzola & Pera",               precios: { Slice: 133, Normal: 333 } },
      { id: "serrazul",       img: "https://i.ibb.co/KzmtWG8T/IMG-5713.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Serrazul",       desc: "Jamón Serrano & Roquefort",       precios: { Slice: 133, Normal: 333 } },
      { id: "hellboy",        img: "https://i.ibb.co/nNwPmstH/IMG-5717.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Hellboy",        desc: "Extra Pepperoni",                 precios: { Slice: 133, Normal: 333 }, top: true },
    ],
  },
  clasicas: {
    label: "Clásicas",
    items: [
      { id: "oncerita",       img: "https://i.ibb.co/8nNMVp01/IMG-5714.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Oncerita",       desc: "Margarita Clásica",               precios: { Slice: 111, Normal: 222 } },
      { id: "micelio-urbano", img: "https://i.ibb.co/p6jxJLMd/IMG-5716.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Micelio Urbano", desc: "Hongos silvestres",               precios: { Slice: 111, Normal: 222 } },
      { id: "huerto11",       img: "https://i.ibb.co/YBZXzv94/IMG-5711.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Huerto11",        desc: "Vegetales de temporada",          precios: { Slice: 111, Normal: 222 } },
      { id: "aloha-once",     img: "https://i.ibb.co/ppnXrRy/IMG-5710.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Aloha Once",     desc: "Jamones premium & Piña",          precios: { Slice: 111, Normal: 222 } },
      { id: "triple-corte",   img: "https://i.ibb.co/20Rsj93T/IMG-5712.jpg?w=120&h=120&fit=crop&crop=center", nombre: "Triple Corte",   desc: "Mezcla de jamones premium",       precios: { Slice: 111, Normal: 222 } },
      { id: "11once",         img: "https://i.ibb.co/zV7LZv1Q/IMG-5720.jpg?w=120&h=120&fit=crop&crop=center", nombre: "11Once",         desc: "Mezcla de queso de la casa",      precios: { Slice: 111, Normal: 199 } },
    ],
  },
};

const HORARIOS = [
  "Lo antes posible", "12:00–13:00", "13:00–14:00",
  "19:00–20:00", "20:00–21:00", "21:00–22:00", "22:00–23:00",
];

const ZONAS = [
  "Narvarte", "Del Valle", "Coyoacán", "Portales",
  "Roma", "Doctores", "Álamos", "Obrera", "Nápoles",
];

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────
const enviarTelegram = async ({ datos, folio, carrito, entrega }) => {
  const items = carrito
    .map(i => `• ${i.cantidad}× ${i.nombre} (${i.tamano}) — $${i.precio * i.cantidad}`)
    .join("\n");

  const mensaje = `🍕 *Nuevo pedido ${folio}*

👤 ${datos.nombre} | 📞 ${datos.telefono}
${entrega.tipo === "domicilio" ? `📍 ${datos.direccion}${datos.numInt ? ` Int. ${datos.numInt}` : ""}\n🏘 ${datos.colonia} · CP ${datos.cp}` : "🏪 Recoger en tienda"}
⏰ ${entrega.hora}
💳 Pago: ${datos.pago}

*Pedido:*
${items}

🚚 Envío: ${entrega.envio > 0 ? `$${entrega.envio}` : "Gratis"}
💰 *Total: $${entrega.total}*${datos.notas ? `\n\n📝 ${datos.notas}` : ""}`;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: mensaje, parse_mode: "Markdown" }),
  });
};

const enviarEmailAdmin = ({ datos, folio, carrito, entrega }) => {
  const items = carrito
    .map(i => `${i.cantidad}x ${i.nombre} (${i.tamano}) - $${i.precio * i.cantidad}`)
    .join("\n");

  emailjs.send(EJS_SERVICE, EJS_TPL_ADMIN, {
    folio,
    nombre:       datos.nombre,
    telefono:     datos.telefono,
    tipo_entrega: entrega.tipo === "domicilio" ? "A domicilio" : "Recoger en tienda",
    direccion:    datos.direccion || "—",
    colonia:      datos.colonia || "—",
    cp:           datos.cp || "—",
    hora:         entrega.hora,
    pago:         datos.pago,
    items,
    envio:        entrega.envio > 0 ? `$${entrega.envio}` : "Gratis",
    total:        entrega.total,
    notas:        datos.notas || "—",
  }, EJS_KEY);
};

const enviarEmailCliente = ({ datos, folio, carrito, entrega }) => {
  if (!datos.email) return;
  const items = carrito
    .map(i => `${i.cantidad}x ${i.nombre} (${i.tamano}) - $${i.precio * i.cantidad}`)
    .join("\n");

  emailjs.send(EJS_SERVICE, EJS_TPL_CLIENTE, {
    folio,
    nombre:         datos.nombre,
    cliente_email:  datos.email,
    tipo_entrega:   entrega.tipo === "domicilio" ? "A domicilio" : "Recoger en tienda",
    hora:           entrega.hora,
    items,
    total:          entrega.total,
    notas:          datos.notas ? `Notas: ${datos.notas}` : "",
  }, EJS_KEY);
};

// ── ESTILOS BASE ──────────────────────────────────────────────────────────────
const s = {
  label: {
    fontFamily: "system-ui, sans-serif",
    fontSize: 11,
    color: muted,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    display: "block",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    background: card,
    border: `1.5px solid ${border}`,
    borderRadius: 14,
    padding: "13px 16px",
    fontFamily: "system-ui, sans-serif",
    fontSize: 15,
    color: text,
    outline: "none",
  },
};

// ── COMPONENTES PEQUEÑOS ──────────────────────────────────────────────────────
function Tag({ children, color = accent }) {
  return (
    <span style={{
      background: color + "22", color,
      borderRadius: 20, padding: "4px 10px",
      fontSize: 11, fontWeight: 700,
      fontFamily: "system-ui, sans-serif",
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const base = {
    border: "none", cursor: disabled ? "default" : "pointer",
    borderRadius: 14, fontFamily: "system-ui, sans-serif",
    fontWeight: 700, fontSize: 15, transition: "opacity 0.15s",
    opacity: disabled ? 0.4 : 1, ...style,
  };
  if (variant === "primary")
    return <button onClick={onClick} disabled={disabled} style={{ ...base, background: accent, color: "#fff", padding: "14px 0", width: "100%" }}>{children}</button>;
  if (variant === "ghost")
    return <button onClick={onClick} disabled={disabled} style={{ ...base, background: "none", color: muted, padding: "14px 0" }}>{children}</button>;
  if (variant === "pill")
    return <button onClick={onClick} style={{ ...base, background: pill, color: text, padding: "9px 18px", fontSize: 13 }}>{children}</button>;
}

// ── PASO INDICADOR ────────────────────────────────────────────────────────────
function Pasos({ paso }) {
  const steps = ["Pizzas", "Entrega", "Confirmar"];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, margin: "8px 0 28px" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = paso === n;
        const done = paso > n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 14,
                background: active ? accent : done ? "#2a5c2a" : pill,
                color: active || done ? "#fff" : muted,
                border: active ? `2px solid ${accentS}` : "2px solid transparent",
              }}>{done ? "✓" : n}</div>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: active ? text : muted, fontWeight: active ? 600 : 400 }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 48, height: 2, background: paso > n ? "#2a5c2a" : border, margin: "0 8px", marginBottom: 18 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── TARJETA DE PIZZA ──────────────────────────────────────────────────────────
function PizzaCard({ item, onAdd, carritoItems }) {
  const tamanos = Object.keys(item.precios);
  const [tam, setTam] = useState(tamanos[Math.min(1, tamanos.length - 1)]);
  const [flash, setFlash] = useState(false);

  const enCarrito = carritoItems.filter(i => i.id === item.id).reduce((s, i) => s + i.cantidad, 0);

  const handleAdd = () => {
    onAdd({ id: item.id, nombre: item.nombre, tamano: tam, precio: item.precios[tam], img: item.img });
    setFlash(true);
    setTimeout(() => setFlash(false), 900);
  };

  return (
    <div style={{
      background: card,
      border: `1.5px solid ${border}`,
      borderRadius: 18,
      padding: "18px 16px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      transition: "border-color 0.2s",
      cursor: "default",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent + "66"}
      onMouseLeave={e => e.currentTarget.style.borderColor = border}
    >
      <img src={item.img} alt={item.nombre} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: text }}>{item.nombre}</span>
          {item.top && <Tag>☆Popular</Tag>}
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: muted, margin: "0 0 10px", lineHeight: 1.4, textAlign: "left" }}>{item.desc}</p>

        {tamanos.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 0 }}>
            {tamanos.map(t => (
              <button key={t} onClick={() => setTam(t)} style={{
                border: `1.5px solid ${t === tam ? accent : border}`,
                background: t === tam ? accent + "22" : "none",
                borderRadius: 8, padding: "4px 10px",
                fontFamily: "system-ui, sans-serif", fontSize: 11,
                color: t === tam ? accent : muted, cursor: "pointer", fontWeight: 600,
              }}>{t}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 17, color: accent }}>
          ${item.precios[tam]}
        </span>
        <button onClick={handleAdd} style={{
          border: "none", cursor: "pointer", borderRadius: 10,
          padding: "7px 14px",
          background: flash ? "#2a5c2a" : pill,
          color: flash ? "#7fff7f" : text,
          fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 13,
          transition: "all 0.2s", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {flash ? "✓" : enCarrito > 0 ? `+1 (${enCarrito})` : "+ Agregar"}
        </button>
      </div>
    </div>
  );
}

// ── PASO 1: MENÚ ──────────────────────────────────────────────────────────────
function PasoPizzas({ carrito, onAdd, onNext }) {
  const total = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const count = carrito.reduce((s, i) => s + i.cantidad, 0);

  return (
    <div>
      <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 22, color: text, margin: "0 0 20px", textAlign: "center" }}>
        ¿Qué te pedimos hoy?
      </h2>

      {Object.entries(MENU).map(([key, cat]) => (
        <div key={key} style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: 12,
            textTransform: "uppercase", letterSpacing: "0.12em", color: muted,
            marginBottom: 12,
          }}>{cat.label}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cat.items.map(item => (
              <PizzaCard key={item.id} item={item} onAdd={onAdd} carritoItems={carrito} />
            ))}
          </div>
        </div>
      ))}

      {count > 0 && (
        <div style={{
          position: "sticky", bottom: 16,
          background: accent,
          borderRadius: 16, padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", boxShadow: "0 8px 32px rgba(230,50,50,0.4)",
        }} onClick={onNext}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              background: "rgba(255,255,255,0.25)", borderRadius: "50%",
              width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 13, color: "#fff",
            }}>{count}</span>
            <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15, color: "#fff" }}>Ver pedido</span>
          </div>
          <span style={{ fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>${total.toFixed(0)} →</span>
        </div>
      )}
    </div>
  );
}

// ── PASO 2: ENTREGA ───────────────────────────────────────────────────────────
function PasoEntrega({ carrito, onQuitar, onAdd, onNext, onBack }) {
  const [tipo, setTipo] = useState("domicilio");
  const [hora, setHora] = useState(HORARIOS[0]);

  const subtotal = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const envio = tipo === "domicilio" && subtotal < 300 ? 35 : 0;
  const total = subtotal + envio;

  return (
    <div>
      <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 22, color: text, margin: "0 0 24px", textAlign: "center" }}>
        ¿Cómo lo recibas?
      </h2>

      <div style={{ marginBottom: 20 }}>
        <span style={s.label}>Tipo de entrega</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["domicilio", "🛵", "A domicilio"], ["recoger", "🏪", "Recoger en tienda"]].map(([v, emoji, lbl]) => (
            <div key={v} onClick={() => setTipo(v)} style={{
              background: tipo === v ? accent + "22" : card,
              border: `1.5px solid ${tipo === v ? accent : border}`,
              borderRadius: 16, padding: "18px 12px",
              textAlign: "center", cursor: "pointer",
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: tipo === v ? accent : text }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <span style={s.label}>{tipo === "domicilio" ? "Horario de entrega" : "Hora para recoger"}</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {HORARIOS.map(h => (
            <button key={h} onClick={() => setHora(h)} style={{
              border: `1.5px solid ${h === hora ? accent : border}`,
              background: h === hora ? accent + "22" : card,
              borderRadius: 10, padding: "8px 14px",
              fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600,
              color: h === hora ? accent : muted, cursor: "pointer",
            }}>{h}</button>
          ))}
        </div>
      </div>

      <div style={{ background: card, border: `1.5px solid ${border}`, borderRadius: 18, padding: 18, marginBottom: 20 }}>
        <span style={s.label}>Tu pedido</span>
        {carrito.map(i => (
          <div key={`${i.id}-${i.tamano}`} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <img src={i.img} alt={i.nombre} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 600, color: text }}>{i.nombre}</div>
              <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, color: muted }}>{i.tamano}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => onQuitar(i.id, i.tamano)} style={{ background: pill, border: "none", borderRadius: 8, width: 26, height: 26, color: text, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: text, minWidth: 16, textAlign: "center" }}>{i.cantidad}</span>
              <button onClick={() => onAdd(i.id, i.tamano, i.precio, i.img, i.nombre)} style={{ background: pill, border: "none", borderRadius: 8, width: 26, height: 26, color: text, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: accent, minWidth: 52, textAlign: "right" }}>${(i.precio * i.cantidad).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${border}`, marginTop: 8, paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 13, color: muted, marginBottom: 4 }}>
            <span>Subtotal</span><span>${subtotal.toFixed(0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 13, color: muted, marginBottom: 4 }}>
            <span>Envío</span>
            <span>{tipo === "recoger" ? "—" : envio === 0 ? "🎉 Gratis" : `$${envio}`}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 17, fontWeight: 800, color: text, marginTop: 8 }}>
            <span>Total</span><span style={{ color: accent }}>${total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <Btn onClick={() => onNext({ tipo, hora, subtotal, envio, total })} variant="primary">Continuar →</Btn>
      <div style={{ textAlign: "center", marginTop: 10 }}>
        <Btn onClick={onBack} variant="ghost">← Volver al menú</Btn>
      </div>
    </div>
  );
}

// ── PASO 3: DATOS ─────────────────────────────────────────────────────────────
function PasoDatos({ entrega, carrito, onBack, onConfirmar }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [colonia, setColonia] = useState("");
  const [numInt, setNumInt] = useState("");
  const [cp, setCp] = useState("");
  const [pago, setPago] = useState("efectivo");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleConfirmar = async () => {
    if (!nombre.trim() || !telefono.trim()) { setError("Falta tu nombre o teléfono."); return; }
    if (entrega.tipo === "domicilio" && !direccion.trim()) { setError("Falta la dirección de entrega."); return; }
    if (entrega.tipo === "domicilio" && !colonia) { setError("Selecciona tu colonia."); return; }
    if (entrega.tipo === "domicilio" && !cp.trim()) { setError("Falta el código postal."); return; }
    setError(null);
    setEnviando(true);
    await onConfirmar({ nombre, telefono, email, direccion, numInt, colonia, cp, pago, notas });
    setEnviando(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 22, color: text, margin: "0 0 24px", textAlign: "center" }}>
        Tus datos
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <span style={s.label}>Nombre</span>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="¿Cómo te llamas?" style={s.input} />
        </div>
        <div>
          <span style={s.label}>Teléfono</span>
          <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="442 000 0000" type="tel" style={s.input} />
        </div>
        <div>
          <span style={s.label}>Correo electrónico <span style={{ color: muted, textTransform: "none", fontSize: 10 }}>(para tu confirmación)</span></span>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" type="email" style={s.input} />
        </div>

        {entrega.tipo === "domicilio" && (
          <div>
            <span style={s.label}>Dirección de entrega</span>
            <textarea value={direccion} onChange={e => setDireccion(e.target.value)}
              placeholder="Calle, número y referencias"
              rows={2} style={{ ...s.input, resize: "vertical" }} />
          </div>
        )}

        {entrega.tipo === "domicilio" && (
          <div>
            <span style={s.label}>Número interior <span style={{ color: muted, textTransform: "none", fontSize: 10 }}>(opcional)</span></span>
            <input value={numInt} onChange={e => setNumInt(e.target.value)} placeholder='Ej: "102A", Solo si aplica' style={s.input} />
          </div>
        )}

        {entrega.tipo === "domicilio" && (
          <div>
            <span style={s.label}>Colonia</span>
            <select value={colonia} onChange={e => setColonia(e.target.value)} style={{ ...s.input, appearance: "none", WebkitAppearance: "none" }}>
              <option value="">Selecciona tu colonia…</option>
              {ZONAS.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
        )}

        {entrega.tipo === "domicilio" && (
          <div>
            <span style={s.label}>Código postal</span>
            <input value={cp} onChange={e => setCp(e.target.value)} placeholder="03100" type="tel" maxLength={5} style={s.input} />
          </div>
        )}

        <div>
          <span style={s.label}>Forma de pago</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[["efectivo", "💵", "Efectivo"], ["tarjeta", "💳", "Tarjeta"], ["transferencia", "📲", "Transferencia"]].map(([v, emoji, lbl]) => (
              <div key={v} onClick={() => setPago(v)} style={{
                background: pago === v ? accent + "22" : card,
                border: `1.5px solid ${pago === v ? accent : border}`,
                borderRadius: 14, padding: "14px 8px",
                textAlign: "center", cursor: "pointer",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
                <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, color: pago === v ? accent : muted }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <span style={s.label}>Notas (opcional)</span>
          <textarea value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Sin cebolla, picante extra, tocar el timbre…"
            rows={2} style={{ ...s.input, resize: "vertical" }} />
        </div>

        <div style={{ background: card, border: `1.5px solid ${border}`, borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 13, color: muted, marginBottom: 4 }}>
            <span>{entrega.tipo === "domicilio" ? "🛵 Entrega" : "🏪 Recoger"}</span>
            <span>{entrega.hora}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 16, fontWeight: 800, color: text }}>
            <span>Total</span>
            <span style={{ color: accent }}>${entrega.total.toFixed(0)}</span>
          </div>
        </div>

        {error && (
          <div style={{ background: accent + "18", border: `1px solid ${accent}55`, borderRadius: 12, padding: "12px 16px", fontFamily: "system-ui, sans-serif", fontSize: 13, color: accent }}>
            {error}
          </div>
        )}

        <Btn onClick={handleConfirmar} variant="primary" disabled={enviando}>
          {enviando ? "Enviando pedido…" : "Confirmar pedido 🍕"}
        </Btn>
        <div style={{ textAlign: "center" }}>
          <Btn onClick={onBack} variant="ghost" disabled={enviando}>← Volver</Btn>
        </div>
      </div>
    </div>
  );
}

// ── CONFIRMACIÓN ──────────────────────────────────────────────────────────────
function Confirmacion({ folio, nombre, entrega, carrito, onNuevoPedido }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2 style={{ fontFamily: "system-ui, sans-serif", fontWeight: 800, fontSize: 24, color: text, margin: "0 0 8px" }}>
        ¡Pedido recibido!
      </h2>
      <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, color: muted, margin: "0 0 28px" }}>
        Ya estamos horneando tu pizza, {nombre.split(" ")[0]}.
      </p>

      <div style={{ background: card, border: `1.5px solid ${border}`, borderRadius: 20, padding: 24, marginBottom: 24, textAlign: "left" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Folio</span>
          <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 800, color: accent, marginTop: 4 }}>{folio}</div>
        </div>

        <div style={{ borderTop: `1px dashed ${border}`, paddingTop: 16 }}>
          {carrito.map(i => (
            <div key={`${i.id}-${i.tamano}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontFamily: "system-ui, sans-serif" }}>
              <img src={i.img} alt={i.nombre} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6, marginRight: 8, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 14, color: text }}>{i.cantidad}× {i.nombre} <span style={{ color: muted, fontSize: 12 }}>({i.tamano})</span></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>${(i.precio * i.cantidad).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px dashed ${border}`, paddingTop: 14, marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "system-ui, sans-serif", fontSize: 18, fontWeight: 800, color: text }}>
            <span>Total</span>
            <span style={{ color: accent }}>${entrega.total.toFixed(0)}</span>
          </div>
          <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, color: muted, marginTop: 10 }}>
            {entrega.tipo === "domicilio" ? `🛵 Entrega: ${entrega.hora}` : `🏪 Recoger: ${entrega.hora}`}
          </div>
        </div>
      </div>

      <Btn onClick={onNuevoPedido} variant="primary">Hacer otro pedido</Btn>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [paso, setPaso] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [entrega, setEntrega] = useState(null);
  const [abierto, setAbierto] = useState(null);

  useEffect(() => {
    fetch("https://timeapi.io/api/time/current/zone?timeZone=America%2FMexico_City")
      .then(r => r.json())
      .then(data => {
        const mins = data.hour * 60 + data.minute;
        setAbierto(mins >= 11 * 60 + 11 && mins < 23 * 60 + 11);
      })
      .catch(() => setAbierto(null));
  }, []);
  const [confirmacion, setConfirmacion] = useState(null);

  const agregar = ({ id, nombre, tamano, precio, img }) => {
    setCarrito(prev => {
      const ex = prev.find(i => i.id === id && i.tamano === tamano);
      if (ex) return prev.map(i => i === ex ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { id, nombre, tamano, precio, img, cantidad: 1 }];
    });
  };

  const quitar = (id, tamano) => {
    setCarrito(prev => {
      const ex = prev.find(i => i.id === id && i.tamano === tamano);
      if (!ex) return prev;
      if (ex.cantidad <= 1) return prev.filter(i => i !== ex);
      return prev.map(i => i === ex ? { ...i, cantidad: i.cantidad - 1 } : i);
    });
  };

  const incrementarDrawer = (id, tamano, precio, img, nombre) => {
    agregar({ id, nombre, tamano, precio, img });
  };

  const guardarPedidoEnPanel = async ({ datos, entrega, carrito }) => {
    try {
      const { data: pedido, error: pedidoError } = await supabase
        .from("orders")
        .insert({
          business_id: BUSINESS_ID,
          customer_name: datos.nombre,
          total: entrega.total,
          status: "pendiente",
        })
        .select()
        .single();

      if (pedidoError) {
        console.error("Error guardando pedido en panel:", pedidoError);
        return;
      }
      if (!pedido) return;

      const items = carrito.map((i) => ({
        order_id: pedido.id,
        product_name: `${i.nombre} (${i.tamano})`,
        quantity: i.cantidad,
        price: i.precio,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(items);
      if (itemsError) console.error("Error guardando items del pedido:", itemsError);
    } catch (err) {
      console.error("Error inesperado guardando pedido:", err);
    }
  };

  const handleConfirmar = async (datos) => {
    const num = Math.floor(Math.random() * 9999) + 1;
    const folio = `#11:${String(num).padStart(4, "0")}`;

    await guardarPedidoEnPanel({ datos, entrega, carrito });
    await enviarTelegram({ datos, folio, carrito, entrega });
    enviarEmailAdmin({ datos, folio, carrito, entrega });
    enviarEmailCliente({ datos, folio, carrito, entrega });

    setConfirmacion({ folio, datos });
    setPaso(4);
  };

  const reset = () => {
    setCarrito([]); setEntrega(null); setConfirmacion(null); setPaso(1);
  };

  return (
    <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input, textarea, select { color-scheme: light; }
        button:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: bg, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
<img src="https://i.ibb.co/F4f7xnh8/Disen-o-sin-ti-tulo-6.png" alt="11once Pizzas" style={{ width: 70, height: 70, objectFit: "contain", borderRadius: 8, marginRight: -8 }} />          <div>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>11once Pizzas</div>
            <div style={{ fontSize: 12, color: muted }}>CDMX</div>
          </div>
        </div>
        {abierto !== null && (
          <div style={{
            background: abierto ? "#1a0008" : "#1a1a1a",
            border: `1.5px solid ${abierto ? "#8b1729" : "#555"}`,
            borderRadius: 20, padding: "6px 14px",
            fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700,
            color: "#fcfcfc", display: "flex", alignItems: "center", gap: 5,
          }}>
            <span>{abierto ? "⚡" : "🌙"}</span>
            {abierto ? "Abierto ahora" : "Cerrado · volvemos a las 11:11"}
          </div>
        )}
      </div>

      {/* ZONA */}
      <div style={{ background: cardHi, borderBottom: `1px solid ${border}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14 }}>📍</span>
        <span style={{ fontFamily: "system-ui, sans-serif", fontSize: 12, color: muted }}>
          Zonas: <b style={{ color: text }}>Narvarte · Del Valle · Coyoacán · Portales · Roma · Doctores · Alamos · Obrera · Napoles</b>
        </span>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 40px" }}>
        {paso < 4 && <Pasos paso={paso} />}

        {paso === 1 && <PasoPizzas carrito={carrito} onAdd={agregar} onNext={() => setPaso(2)} />}
        {paso === 2 && <PasoEntrega carrito={carrito} onQuitar={quitar} onAdd={incrementarDrawer} onNext={(e) => { setEntrega(e); setPaso(3); }} onBack={() => setPaso(1)} />}
        {paso === 3 && <PasoDatos entrega={entrega} carrito={carrito} onBack={() => setPaso(2)} onConfirmar={handleConfirmar} />}
        {paso === 4 && confirmacion && (
          <Confirmacion
            folio={confirmacion.folio}
            nombre={confirmacion.datos.nombre}
            entrega={entrega}
            carrito={carrito}
            onNuevoPedido={reset}
          />
        )}
      </div>
    </div>
  );
}
