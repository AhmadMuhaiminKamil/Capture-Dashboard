"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface EditableFields {
  id: string;
  table: string;
  nomor_tiket: string | null;
  no_service: string;
  sto_lama: string | null;
  sto_baru: string | null;
  domain: string;
  alasan_binding: string;
  jenis: string;
}

interface Props { fields: EditableFields; onClose: () => void; onSaved: () => void; }

const fieldCls = "w-full rounded-lg px-3 py-2 text-sm text-white outline-none transition-colors duration-150 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400/50";
const fieldStyle = { background: "rgba(30,41,59,0.9)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff" };

// ponytail: outside component = stable ref = no remount on state change
function Field({ label, value, onChange, textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(147,197,253,0.6)" }}>{label}</label>
      {textarea
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} className={`${fieldCls} resize-none`} style={fieldStyle} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} className={fieldCls} style={fieldStyle} />}
    </div>
  );
}

export default function EditDeleteModal({ fields, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    nomor_tiket: fields.nomor_tiket ?? "",
    no_service: fields.no_service ?? "",
    sto_lama: fields.sto_lama ?? "",
    sto_baru: fields.sto_baru ?? "",
    domain: fields.domain ?? "",
    alasan_binding: fields.alasan_binding ?? "",
    jenis: fields.jenis ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const handleSave = async () => {
    setSaving(true); setError("");
    const { error: err } = await supabase.from(fields.table).update({
      nomor_tiket: form.nomor_tiket || null,
      no_service: form.no_service,
      sto_lama: form.sto_lama || null,
      sto_baru: form.sto_baru || null,
      domain: form.domain,
      alasan_binding: form.alasan_binding,
      jenis: form.jenis,
    }).eq("id", fields.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  const handleDelete = async () => {
    setDeleting(true); setError("");
    const { error: err } = await supabase.from(fields.table).delete().eq("id", fields.id);
    setDeleting(false);
    if (err) { setError(err.message); return; }
    onSaved(); onClose();
  };

  return (
    <>
      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setConfirmDelete(false)}>
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(10,15,30,0.98)", border: "1px solid rgba(239,68,68,0.3)" }}
            onClick={e => e.stopPropagation()}>
            <div className="h-[2px]" style={{ background: "linear-gradient(90deg,transparent,#ef4444,transparent)" }} />
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">Hapus Data Ini?</h3>
              <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{fields.nomor_tiket || "Lapsung"}</p>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.3)" }}>{fields.no_service}</p>
              <p className="text-xs mb-6" style={{ color: "#f87171" }}>Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>Batal</button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg,#dc2626,#9f1239)" }}>
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "rgba(10,15,30,0.97)", border: "1px solid rgba(59,130,246,0.2)" }}
        onClick={e => e.stopPropagation()}>

        <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,transparent,#3b82f6,#818cf8,transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <h2 className="text-sm font-semibold text-white">Edit Data</h2>
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(147,197,253,0.5)" }}>{fields.no_service}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg transition-all" style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}>✕</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="No Tiket" value={form.nomor_tiket} onChange={set("nomor_tiket")} />
            <Field label="No Service" value={form.no_service} onChange={set("no_service")} />
            <Field label="STO Lama" value={form.sto_lama} onChange={set("sto_lama")} />
            <Field label="STO Baru" value={form.sto_baru} onChange={set("sto_baru")} />
            <Field label="Domain" value={form.domain} onChange={set("domain")} />
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "rgba(147,197,253,0.6)" }}>Jenis</label>
              <select value={form.jenis} onChange={e => set("jenis")(e.target.value)}
                className={fieldCls} style={{ ...fieldStyle, cursor: "pointer" }}>
                <option value="Tiket" style={{ background: "#0f172a" }}>Tiket</option>
                <option value="INC" style={{ background: "#0f172a" }}>INC</option>
                <option value="Lapsung" style={{ background: "#0f172a" }}>Lapsung</option>
              </select>
            </div>
          </div>
          <Field label="Alasan Binding" value={form.alasan_binding} onChange={set("alasan_binding")} textarea />
          {error && <p className="text-xs rounded-lg px-3 py-2" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {/* Delete side */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              Hapus
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#f87171" }}>Yakin hapus?</span>
              <button onClick={handleDelete} disabled={deleting}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#dc2626,#9f1239)" }}>
                {deleting ? "..." : "Ya, Hapus"}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Batal</button>
            </div>
          )}

          {/* Save side */}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Batal</button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
  );
}
