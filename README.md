# Meridian

**Meridian** adalah agent otonom berbasis AI yang dirancang untuk mengelola likuiditas secara otomatis di **Meteora DLMM** (Dynamic Liquidity Market Maker) di blockchain Solana.

## Apa itu Meridian?

Meridian bekerja seperti seorang trader atau liquidity provider yang cerdas. Ia bisa:

- Mencari pool-pool bagus secara otomatis
- Men-deploy likuiditas ke posisi yang menguntungkan
- Mengelola posisi yang sudah dibuka (claim fee, close, adjust)
- Belajar dari hasil posisi sebelumnya untuk meningkatkan performa di masa depan

Agent ini menggunakan pendekatan **ReAct** (Reasoning + Acting), di mana LLM berpikir langkah demi langkah sebelum mengambil keputusan on-chain. Selain itu, Meridian juga memiliki sistem **HiveMind** yang memungkinkan beberapa agent saling berbagi pelajaran.

## Fitur Utama

- Fully autonomous (bisa jalan sendiri tanpa intervensi manual)
- Non-custodial (private key tetap di tangan kamu)
- Mendukung berbagai LLM Provider (SwiftRouter, OpenRouter, OpenAI, Local, dll)
- Memiliki sistem retry yang lebih stabil
- Dilengkapi CLI yang powerful untuk monitoring dan kontrol manual
- Bisa belajar dan meningkatkan strategi seiring waktu

## Mulai Cepat

```bash
# Clone repository
git clone https://github.com/muhifni/meridian.git
cd meridian

# Install dependencies
npm install

# Jalankan setup wizard
npm run setup

# Jalankan agent
npm start
```

Lihat bagian di bawah untuk penjelasan lebih lengkap.

---

## Menggunakan LLM Provider Lain (SwiftRouter, OpenAI, Local, dll)

Meridian tidak terbatas hanya bisa pakai OpenRouter. Kamu bisa menggunakan **SwiftRouter**, OpenAI, Groq, Together AI, atau bahkan model lokal (seperti LM Studio atau Ollama).

### Cara Paling Mudah: Menggunakan Setup Wizard

Cara termudah adalah menjalankan setup wizard:

```bash
npm run setup
```

Nanti wizard akan bertanya LLM Provider mana yang ingin kamu pakai. Pilih **SwiftRouter** jika kamu ingin menggunakannya.

### Cara Manual (Edit File .env)

Jika kamu ingin mengatur secara manual, tambahkan baris berikut di file `.env`:

```env
# === LLM Configuration ===
LLM_BASE_URL=https://api.swiftrouter.com/v1
LLM_API_KEY=sk-isi-dengan-api-key-swiftrouter-mu
LLM_MODEL=claude-sonnet-4-6
```

Ganti nilai `LLM_MODEL` sesuai dengan model yang ingin kamu gunakan.

### Melihat Daftar Model yang Tersedia

Kamu bisa melihat model apa saja yang tersedia di SwiftRouter dengan perintah berikut:

```bash
meridian models --provider swiftrouter
```

Jika kamu hanya ingin melihat **model yang bagus untuk tool calling** (sangat direkomendasikan untuk Meridian), gunakan perintah ini:

```bash
meridian models --provider swiftrouter --tool-calling
```

### Rekomendasi Model di SwiftRouter

Berikut beberapa model yang bagus digunakan bersama Meridian:

| Model                        | Kualitas          | Catatan                              | Rekomendasi          |
|-----------------------------|-------------------|--------------------------------------|----------------------|
| `claude-sonnet-4-6`         | Sangat Baik       | Paling stabil dan bagus tool calling | **Sangat Direkomendasikan** |
| `gemini-2.5-pro`            | Baik              | Cepat dan cukup murah                | Bagus                |
| `deepseek-r1-0528`          | Baik              | Reasoning sangat kuat                | Bisa dicoba          |

### Kami Sudah Memperbaiki Retry Logic

Kami telah melakukan perbaikan pada cara Meridian berkomunikasi dengan LLM agar lebih stabil, terutama saat menggunakan provider selain OpenRouter:

- **Retry otomatis** dengan jeda yang semakin lama (exponential backoff + jitter)
- Lebih pintar dalam menentukan error mana yang bisa dicoba ulang
- Otomatis menggunakan model cadangan jika terus gagal
- Mendukung model reasoning yang sering mengembalikan tag `<think>` atau `reasoning_content`

Dengan perbaikan ini, agent menjadi lebih tahan terhadap gangguan dari provider LLM.

## Versioning & Changelog

Mulai dari versi **1.1.0**, proyek ini menggunakan **Semantic Versioning**.

Semua perubahan penting akan dicatat di file [CHANGELOG.md](./CHANGELOG.md). Kamu bisa membuka file tersebut untuk melihat apa saja yang berubah dari versi sebelumnya.