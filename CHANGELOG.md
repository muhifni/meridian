# Changelog

Semua perubahan penting pada proyek Meridian akan didokumentasikan di file ini.

## [1.2.0] - 2026-05-15

### Added
- **utils/lessonManager.js**: Sistem Lesson Scoring + Auto-Pruning untuk HiveMind
  - Scoring otomatis berdasarkan outcome performa selanjutnya
  - Auto-prune lesson dengan score rendah atau sudah terlalu lama
  - Feedback loop agar swarm learning semakin cerdas (Darwinian)
  - Fungsi `applyPerformanceFeedback`, `pruneLessons`, `runMaintenance`

### Changed
- `lessons.js`: Integrasi dasar dengan lessonManager (inisialisasi score + periodic prune + feedback)
- Version bump ke 1.2.0

### Technical
- Backward compatible: lesson lama otomatis mendapat score default
- Pruning aman: pinned + high-score + recent lessons dilindungi

Lihat `utils/lessonManager.js` untuk detail implementasi scoring & pruning.