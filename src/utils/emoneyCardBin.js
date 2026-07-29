// Identifikasi penerbit kartu e-money dari 4 digit awal nomor kartu (BIN).
// Sumber header: Mandiri 6032/6017 · BCA Flazz 6019/1200/0145 · BNI TapCash 6010/5020
//                BRI Brizzi 6013/5041 · Bank DKI JakCard 6052
const BIN_MAP = {
  '6032': { bank: 'Mandiri',  produk: 'e-Money' },
  '6017': { bank: 'Mandiri',  produk: 'e-Money' },
  '6019': { bank: 'BCA',      produk: 'Flazz' },
  '1200': { bank: 'BCA',      produk: 'Flazz' },
  '0145': { bank: 'BCA',      produk: 'Flazz' },
  '6010': { bank: 'BNI',      produk: 'TapCash' },
  '5020': { bank: 'BNI',      produk: 'TapCash' },
  '6013': { bank: 'BRI',      produk: 'Brizzi' },
  '5041': { bank: 'BRI',      produk: 'Brizzi' },
  '6052': { bank: 'Bank DKI', produk: 'JakCard' },
}

// { bank, produk } bila prefix dikenal; { bank:'Unknown', produk:'Tidak dikenali' } bila tak dikenal;
// null bila digit < 4 (belum cukup untuk identifikasi).
export function identifyEmoneyCard(number) {
  const clean = String(number || '').replace(/[\s-]/g, '')
  if (clean.length < 4) return null
  return BIN_MAP[clean.substring(0, 4)] || { bank: 'Unknown', produk: 'Tidak dikenali' }
}

// true HANYA bila prefix jelas Mandiri e-Money.
export function isMandiriEmoney(number) {
  return identifyEmoneyCard(number)?.bank === 'Mandiri'
}
