## Menggunakan LLM Lain (SwiftRouter, dll)

Meridian tidak harus pakai OpenRouter. Kamu bisa pakai **SwiftRouter**, OpenAI, atau model lokal.

### Cara Paling Gampang

Jalankan perintah ini:

```bash
npm run setup
```

Nanti ada pilihan LLM Provider. Pilih **SwiftRouter** kalau mau pakai SwiftRouter.

### Cara Manual

Edit file `.env`, lalu tambahkan ini:

```env
LLM_BASE_URL=https://api.swiftrouter.com/v1
LLM_API_KEY=sk-isi-api-key-swiftrouter-mu
LLM_MODEL=claude-sonnet-4-6
```

Ganti `LLM_MODEL` sesuai model yang kamu suka.

### Model yang Bagus untuk Meridian

Berikut model SwiftRouter yang kami rekomendasikan:

- `claude-sonnet-4-6` → Paling bagus & stabil (sangat direkomendasikan)
- `gemini-2.5-pro` → Cepat dan murah
- `deepseek-r1-0528` → Reasoning-nya kuat

### Melihat Daftar Model

Kamu bisa lihat semua model yang tersedia di SwiftRouter dengan perintah:

```bash
meridian models --provider swiftrouter
```

Kalau mau **hanya melihat model yang bagus untuk tool calling**, pakai perintah ini:

```bash
meridian models --provider swiftrouter --tool-calling
```

### Kami Sudah Membuatnya Lebih Stabil

Kami sudah memperbaiki cara Meridian ngobrol sama LLM, supaya:
- Lebih tahan kalau lagi error
- Bisa handle model yang suka mikir dulu (reasoning)
- Retry-nya lebih pintar

Jadi kamu lebih bebas pilih provider mana yang mau dipakai.