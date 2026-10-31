// LONG-FORM DEMO — "3 นิสัยเล็กๆ ที่ทำให้วันดีขึ้น": 16:9, chapters with title cards, a chapter progress bar,
// keyword subtitles, an end screen. Original content; shows the long-form format (references/long-form.md).
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const Chapters = node ? require('./kit/chapters') : globalThis.Chapters;
  const FPS = 30, FORMAT = U.pickFormat('16:9'), [W, H] = U.formatSize(FORMAT), SAFE = U.safeArea(W, H);
  const clock = MU.makeClock({ bpm: 84, offset: 0 });

  // each chapter: its lines on LOCAL time [start, end, Thai (*keyword*), English]
  const chapters = Chapters.timeline([
    { id: 'intro', title: 'เปิดเรื่อง', dur: 10, card: false, lines: [
      [0.4, 4.6, 'วันที่ดี ไม่ต้องเริ่มจาก*เรื่องใหญ่*', "A good day doesn't start with something big."],
      [4.8, 9.6, 'วันนี้มี*3 นิสัยเล็กๆ*มาฝาก', 'Here are three small habits.']] },
    { id: 'water', title: 'น้ำแก้วแรก', dur: 20, lines: [
      [2.8, 7.6, 'ตื่นมา ดื่ม*น้ำหนึ่งแก้ว*ก่อนอย่างอื่น', 'Wake up, drink a glass of water first.'],
      [7.8, 13.0, 'ร่างกายเพิ่ง*อดน้ำ*มาทั้งคืน', 'Your body went without water all night.'],
      [13.2, 19.4, 'ใช้เวลา*แค่ 30 วินาที*', 'It takes thirty seconds.']] },
    { id: 'walk', title: 'เดินสิบนาที', dur: 20, lines: [
      [2.8, 8.0, 'ออกไป*เดินสิบนาที*', 'Go for a ten-minute walk.'],
      [8.2, 13.6, 'ไม่ต้องเร็ว ไม่ต้อง*ไกล*', 'Not fast, not far.'],
      [13.8, 19.4, 'แค่*ขยับ*ก็พอ', 'Just move.']] },
    { id: 'notes', title: 'จดสามเรื่องดีๆ', dur: 20, lines: [
      [2.8, 8.0, 'ก่อนนอน จด*เรื่องดีๆ 3 เรื่อง*', 'Before bed, write down three good things.'],
      [8.2, 13.6, 'เรื่องเล็กแค่ไหน*ก็นับ*', 'However small, they count.'],
      [13.8, 19.4, 'สมองจะเริ่ม*มองหาเรื่องดี*เอง', 'Your mind starts looking for them.']] },
    { id: 'outro', title: 'สรุป', dur: 10, card: false, lines: [
      [0.4, 5.0, 'น้ำ · เดิน · จด', 'Water · walk · write.'],
      [5.2, 9.4, 'ลอง*พรุ่งนี้*ดูนะ', 'Try it tomorrow.']] },
  ]);
  const DURATION = Chapters.total(chapters);
  const subtitles = chapters.flatMap((c) => (c.lines || []).map(([a, b, text, en]) => ({ t: c.start + a, end: c.start + b, text, en })));
  const SCORE = { STYLE: 'flat', FPS, FORMAT, W, H, SAFE, DURATION, clock, T: clock.T, chapters, subtitles, markers: {} };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
