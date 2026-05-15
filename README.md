## Pakai LLM Lain (SwiftRouter dll)

Meridian bisa pakai banyak LLM, bukan cuma OpenRouter.

### Cara Paling Mudah
Jalankan:
```bash
npm run setup
```
Lalu pilih **SwiftRouter** saat ditanya.

### Cara Manual
Tambahkan di file `.env`:

```env
LLM_BASE_URL=https://api.swiftrouter.com/v1
LLM_API_KEY=sk-isi-api-key-mu
LLM_MODEL=claude-sonnet-4-6
```

### Lihat Model yang Tersedia
```bash
# Lihat semua model
meridian models --provider swiftrouter

# Hanya lihat model yang bagus untuk tool calling
meridian models --provider swiftrouter --tool-calling
```

**Rekomendasi model bagus:**
- `claude-sonnet-4-6` (paling direkomendasikan)
- `gemini-2.5-pro`
- `deepseek-r1-0528`

### Kami Sudah Membuat Retry Lebih Pintar

Kami memperbaiki cara Meridian berkomunikasi dengan LLM supaya lebih stabil:

- Kalau LLM error atau lambat, otomatis mencoba ulang dengan jeda yang semakin lama (exponential backoff).
- Lebih pintar membedakan error yang bisa dicoba lagi dan yang tidak bisa.
- Kalau gagal terus, otomatis pindah ke model cadangan.
- Bisa handle model yang suka mikir dulu (seperti yang ngasih tag `<think>`).

Jadi agent kamu lebih jarang error meskipun pakai provider yang berbeda-beda.