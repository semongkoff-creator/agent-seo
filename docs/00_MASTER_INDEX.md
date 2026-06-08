# 🗂️ MASTER INDEX: SEO Agent V2 Implementation Prompts

## 📌 Overview

Prompt implementasi V2 di-split jadi **5 fase berurutan** untuk minimize error dan memudahkan Codex/Cursor process satu fokus area dalam satu waktu.

**Total**: 5 file prompt + 1 master index (file ini).

## 🔢 Urutan Eksekusi

**WAJIB berurutan**, jangan skip atau parallel. Setiap fase depend pada hasil fase sebelumnya.

### ✅ Phase 1: Database Migration
**File**: `01_PHASE1_DATABASE.md`
**Estimasi**: 1 hari kerja
**Output**: 
- 4 tabel baru: `technical_errors`, `ai_visibility_metrics`, `gsc_metrics`, `ga4_metrics`
- 2 tabel existing di-extend: `seo_diagnoses`, `seo_objectives`
- RLS policies + Realtime config
- Seed function untuk mock data

**Validation**: Run `SELECT seed_mock_data_for_project('<kaitech_id>')` → check 4 tabel terisi.

---

### ✅ Phase 2: Form & Wizard Updates
**File**: `02_PHASE2_FORM_WIZARD.md`
**Estimasi**: 2 hari kerja
**Depends**: Phase 1
**Output**:
- Modal Create Project: 4 field jadi dropdown
- Wizard Step 2: GSC + GA4 mock cards
- Wizard Step 3: dual mode (auto/manual) + clickable error cards

**Validation**: Buka create project modal, submit ke wizard, sampai Step 6.

---

### ✅ Phase 3: Diagnosis Page Restructure
**File**: `03_PHASE3_DIAGNOSIS_PAGE.md`
**Estimasi**: 2 hari kerja
**Depends**: Phase 1, 2
**Output**:
- Halaman /diagnosis/[id] dengan 4 section baru:
  1. Technical Issue (interactive checklist)
  2. Keyword Position (table dengan filter)
  3. AI Overview (Gemini + ChatGPT tabs) ← DIFFERENTIATION
  4. Business Impact (GA4 dashboard)
- API endpoint: PATCH technical-errors status
- HAPUS section lama: Avoid Actions, Status, old Evidence

**Validation**: Buka /diagnosis/[id] existing project KaitechSEO → 4 section render.

---

### ✅ Phase 4: Objective Page Restructure
**File**: `04_PHASE4_OBJECTIVE_PAGE.md`
**Estimasi**: 2 hari kerja
**Depends**: Phase 1, 2, 3
**Output**:
- Halaman /objectives/[id] dengan 3 pillar:
  1. Technical (sync dengan Diagnosis checklist)
  2. Content & Keyword
  3. Business Impact
- Realtime sync setup
- HAPUS section lama: Achievability detail, Avoid Actions, verbose Risk Notes

**Validation**: 
- Buka /objectives/[id] → 3 pillar render
- Buka /diagnosis/[id] di tab lain → toggle checklist
- Objective page auto-update via Realtime

---

### ✅ Phase 5: n8n Workflow Updates
**File**: `05_PHASE5_N8N_WORKFLOW.md`
**Estimasi**: 1 hari kerja
**Depends**: Phase 1-4
**Output**:
- Workflow Identify Problem updated:
  - 4 fetch node baru (GSC, GA4, errors, AI visibility)
  - Merge Data node
  - New AI system prompt
  - New output schema (4 sections + 2 scores)
- Workflow Define Objective updated:
  - AI generate 3 objectives per pillar
  - Insert 3 rows ke seo_objectives

**Validation**: 
- Submit wizard Identify → diagnosis baru ter-generate dengan new structure
- Submit wizard Objective → 3 pillar ter-generate

---

## 🎯 Cara Pakai per Fase

### Step-by-step untuk Setiap Fase:

```
1. Buka file fase yang sesuai (urutan 1 → 5)
2. Copy SELURUH isi file
3. Paste ke Codex/Cursor chat
4. Tunggu Codex propose implementation
5. Review proposal — ada yang gak setuju?
6. Approve / minta adjustment
7. Codex implement
8. Lo test manual sesuai Acceptance Criteria
9. Kalau OK, commit + push
10. Lanjut fase berikutnya
```

### Jangan Skip Validation

Setiap fase **harus pass acceptance criteria** sebelum lanjut. Kalau ada bug, fix dulu, baru lanjut.

---

## 🚨 Common Pitfalls (Avoid Ini)

### ❌ Jangan Lakukan
1. **Run parallel multiple phases** — bakal conflict, susah debug
2. **Skip Phase 1 (database)** — semua fase depend pada schema
3. **Hapus kolom existing** — break backward compatibility
4. **Real integration sekarang** — tetap pakai mock data, real OAuth di future
5. **Edit ulang prompt** — kasih ke Codex apa adanya, biarkan dia interpret

### ✅ Yang Harus Dilakukan
1. **Test per phase** — pastiin satu fase clean sebelum lanjut
2. **Commit per phase** — supaya bisa rollback per fase
3. **Mock data realistic** — bukan random number
4. **Backward compatible** — existing project (KaitechSEO) masih jalan
5. **Bilingual support** — ID/EN tetap berfungsi

---

## 📊 Estimasi Timeline Total

| Phase | Solo Dev | Tim 2 Dev |
|-------|----------|-----------|
| Phase 1 | 1 hari | 0.5 hari |
| Phase 2 | 2 hari | 1 hari |
| Phase 3 | 2 hari | 1 hari |
| Phase 4 | 2 hari | 1 hari |
| Phase 5 | 1 hari | 0.5 hari |
| **Total** | **8 hari** | **4 hari** |

**Catatan**: 
- Estimasi ini full-time. Kalau part-time, multiply.
- Termasuk testing, gak termasuk bug-fix major.
- Real OAuth integration (Phase 6) butuh extra 2 minggu.

---

## 🎬 Quick Start

Untuk mulai sekarang:

1. **Backup DB**: Export Supabase data dulu (jaga-jaga)
2. **Buat branch**: `git checkout -b v2-pivot`
3. **Buka Phase 1**: `01_PHASE1_DATABASE.md`
4. **Copy paste ke Codex**: Tunggu proposal
5. **Approve**: Run migration
6. **Test**: Check tabel terbuat dengan benar
7. **Commit**: `git commit -m "feat(v2): database migration"`
8. **Lanjut Phase 2**

---

## 📞 Kalau Stuck

Kalau ada error di tengah fase:
1. **Don't panic** — kembali ke fase sebelumnya, verify clean
2. **Check acceptance criteria** — apakah ada yang miss?
3. **Read error message** — Codex biasanya kasih hint
4. **Rollback kalau perlu** — `git reset --hard HEAD~1`
5. **Tanya AI lagi** — sertakan error log lengkap

---

## 🎯 Final Outcome

Setelah 5 fase selesai:

✅ Form input lebih efficient (dropdown, auto-data)
✅ Diagnosis dengan technical checklist actionable
✅ AI Overview tracking (Geoptie integration ready)
✅ Objective 3-pillar yang focused
✅ Sync real-time antara Diagnosis & Objective
✅ Mock data ready untuk demo
✅ Backward compatible dengan existing data

**Ready for**: Beta launch dengan technical-first positioning + AI Visibility USP.

---

## 📚 Reference

Files in this folder:
- `00_MASTER_INDEX.md` (file ini)
- `01_PHASE1_DATABASE.md`
- `02_PHASE2_FORM_WIZARD.md`
- `03_PHASE3_DIAGNOSIS_PAGE.md`
- `04_PHASE4_OBJECTIVE_PAGE.md`
- `05_PHASE5_N8N_WORKFLOW.md`

Total: 6 files (1 index + 5 phase prompts).

Original combined prompt: `CODEX_PROMPT_V2_PIVOT.md` (24KB, untuk reference).

---

**Mulai dari Phase 1 ya. Good luck!** 🚀
