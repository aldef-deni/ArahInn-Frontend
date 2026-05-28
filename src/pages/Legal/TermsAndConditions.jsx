import { useState, useEffect } from 'react'
import {
  FileText, Shield, ShoppingBag, CreditCard, RefreshCw, RotateCcw,
  Lock, User, Database, Scale, Phone, Mail, MessageCircle, ArrowUp,
  List, X,
} from 'lucide-react'
import SEO from '@/components/SEO'

const SECTIONS = [
  { id: 'pendahuluan',    label: 'Pendahuluan',                Icon: FileText },
  { id: 'umum',           label: 'Umum',                        Icon: Shield },
  { id: 'penggunaan',     label: 'Penggunaan',                  Icon: User },
  { id: 'layanan',        label: 'Layanan ArahInn.com',         Icon: ShoppingBag },
  { id: 'pemesanan',      label: 'Pemesanan / Pembelian',       Icon: ShoppingBag },
  { id: 'harga',          label: 'Harga Produk',                Icon: CreditCard },
  { id: 'pembayaran',     label: 'Pembayaran',                  Icon: CreditCard },
  { id: 'pembatalan',     label: 'Perubahan & Pembatalan',      Icon: RefreshCw },
  { id: 'pengembalian',   label: 'Pengembalian Dana',           Icon: RotateCcw },
  { id: 'keamanan',       label: 'Keamanan',                    Icon: Lock },
  { id: 'akun',           label: 'Akun Anda',                   Icon: User },
  { id: 'data',           label: 'Kebijakan Penggunaan Data',   Icon: Database },
  { id: 'lain',           label: 'Ketentuan Lain',              Icon: Scale },
]

export default function TermsAndConditions() {
  const [activeId, setActiveId]   = useState('pendahuluan')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [mobileTocOpen, setMobileTocOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 600)
      const offsets = SECTIONS.map(s => {
        const el = document.getElementById(s.id)
        return { id: s.id, top: el ? el.getBoundingClientRect().top : Infinity }
      })
      const active = offsets.filter(o => o.top <= 160).pop()
      if (active) setActiveId(active.id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile TOC sheet is open
  useEffect(() => {
    document.body.style.overflow = mobileTocOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileTocOpen])

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    const offset = window.innerWidth < 1024 ? 80 : 100
    window.scrollTo({ top: el.offsetTop - offset, behavior: 'smooth' })
    setMobileTocOpen(false)
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <SEO
        title="Syarat & Ketentuan"
        description="Ketentuan penggunaan layanan ArahInn: pemesanan, pembayaran, pembatalan, refund, keamanan akun, dan kebijakan privasi pengguna."
        url="/syarat-ketentuan"
        type="article"
      />

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand via-brand-700 to-blue-900 text-white">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="container relative py-8 sm:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 shadow-xl mb-4 sm:mb-6">
            <img src="/logo-arahin.png" alt="ArahInn" className="h-8 sm:h-10 md:h-12 w-auto" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
            Syarat &amp; Ketentuan
          </h1>
          <p className="text-white/80 text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed px-2">
            Ketentuan penggunaan platform <span className="font-semibold">ArahInn.com</span> — mohon dibaca dengan saksama sebelum menggunakan layanan kami.
          </p>
          <p className="mt-3 sm:mt-4 text-[11px] sm:text-xs text-white/60">Diperbarui terakhir: 27 Mei 2026</p>
        </div>
      </section>

      {/* ── Main content + TOC ───────────────────────────────────────── */}
      <section className="container py-6 sm:py-10 lg:py-16">
        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">

          {/* Desktop TOC sidebar (hidden on mobile) */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Daftar Isi</p>
              <nav className="space-y-1">
                {SECTIONS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                      activeId === id
                        ? 'bg-brand/10 text-brand font-bold border-l-2 border-brand'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <article className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-5 sm:p-7 md:p-10 shadow-sm prose-content">
            <Section id="pendahuluan" title="Pendahuluan" Icon={FileText}>
              <p>
                Terima kasih atas kunjungan Anda ke aplikasi, website dan Layanan Kami. Kami berharap kunjungan Anda dapat bermanfaat dan memberi kenyamanan dalam mengakses dan menggunakan seluruh Layanan yang tersedia di aplikasi atau website Kami. Kami terus menerus berupaya memperbaiki dan meningkatkan mutu pelayanan Kami, dan sangat menghargai segala kritik, saran dan masukan dari Anda. Silakan Anda menyampaikannya ke Kami melalui surel di <a href="mailto:cs@arahinn.com" className="text-brand font-semibold break-all">cs@arahinn.com</a> atau telepon di <a href="tel:+6285188136009" className="text-brand font-semibold whitespace-nowrap">+62 851-8813-6009</a>.
              </p>
              <p>
                Aplikasi dan website ini dimiliki, dioperasikan dan diselenggarakan oleh <strong>PT. Redy Hospitality Management</strong> perseroan terbatas yang berdiri atas dasar hukum Republik Indonesia termasuk afiliasi kami, (selanjutnya secara bersama-sama disebut sebagai <em>"Kami"</em> atau <em>"ArahInn.com"</em>). Layanan Kami tersedia secara online melalui: <code>www.arahinn.com</code> atau mobile: <code>m.arahinn.com</code> atau berbagai akses, media, perangkat dan platform lainnya, baik yang sudah atau akan tersedia di kemudian hari.
              </p>
            </Section>

            <Section id="umum" title="Umum" Icon={Shield}>
              <p>Dengan mengakses dan menggunakan aplikasi, website atau Layanan Kami, Anda menyatakan telah membaca, memahami, menyetujui dan menyatakan tunduk pada Syarat dan Ketentuan Umum ini.</p>
              <p>Dengan menggunakan aplikasi atau situs web ArahInn.com, Pelanggan menyatakan dan menjamin telah berusia minimal <strong>18 (delapan belas) tahun</strong> atau telah memperoleh persetujuan tertulis dari orang tua/wali hukum yang sah. Pelanggan dengan ini setuju bertanggung jawab atas segala konsekuensi hukum akibat pelanggaran ketentuan ini dan membebaskan ArahInn.com dari segala tuntutan, klaim, atau gugatan hukum terkait. ArahInn.com berhak untuk membatalkan transaksi, menangguhkan atau memblokir akun, serta mengambil langkah hukum lainnya tanpa pemberitahuan sebelumnya, tanpa mengurangi kewajiban ArahInn.com untuk mematuhi peraturan perundang-undangan yang berlaku.</p>
              <p>Syarat dan Ketentuan Umum ini terdiri atas (i) Syarat dan Ketentuan Umum yang berlaku untuk setiap akses dan Layanan yang tersedia pada Website, dan (ii) syarat dan ketentuan khusus yang mengatur lebih lanjut ketentuan penggunaan produk atau Layanan tertentu.</p>
              <p>Syarat dan Ketentuan Umum dapat Kami ubah, modifikasi, tambah, hapus atau koreksi <em>("perubahan")</em> setiap saat sesuai dengan pengembangan Website dan peraturan perundang-undangan. Anda Kami anjurkan untuk mengunjungi Website Kami secara berkala agar dapat mengetahui adanya perubahan tersebut.</p>
            </Section>

            <Section id="penggunaan" title="Penggunaan" Icon={User}>
              <p>Produk-produk, teknologi dan proses yang terdapat atau terkandung dalam aplikasi atau website, dimiliki oleh Kami atau pihak ketiga yang memberi hak kepada Kami. Kecuali untuk penggunaan yang secara tegas diijinkan dan diperbolehkan dalam Syarat dan Ketentuan Umum ini, Anda tidak memiliki ataupun menerima apapun dari ArahInn.com dan ArahInn.com tidak memberikan hak lain apapun ke Anda atas aplikasi atau website ini, berikut dengan segala data, informasi dan konten di dalamnya.</p>
              <p>Dengan menggunakan aplikasi, website atau Layanan yang tersedia di dalamnya, maka Anda menyatakan setuju tidak akan mengunduh, menayangkan atau mentransmisi dengan cara apa pun, dan atau membuat konten apa pun tersedia untuk umum yang tidak konsisten dengan penggunaan yang diijinkan dalam Syarat dan Ketentuan Umum ini.</p>
              <p>Dalam aplikasi atau website ini mungkin terdapat link (tautan) ke website yang dikelola oleh pihak ketiga <em>("Situs Eksternal")</em> yang melakukan kerjasama dengan Kami.</p>
              <p>Kami tidak mengoperasikan, mengendalikan atau mendukung dalam bentuk apa pun Situs Eksternal yang bersangkutan ataupun konten/isinya. Anda bertanggung jawab penuh atas penggunaan Situs Eksternal tersebut dan dianjurkan untuk mempelajari syarat dan ketentuan dari Situs Eksternal itu secara seksama.</p>
              <p>Layanan yang tersedia dalam aplikasi atau website ini secara umum menggunakan sistem re-marketing dan sistem cookies yang memungkinkan pihak ketiga (termasuk dan tidak terbatas pada Google) mengakses dan menggunakan data kunjungan dalam sistem Cookies website ini untuk menampilkan dan menayangkan kembali tiap iklan ArahInn.com melalui internet.</p>
              <p>Anda tidak boleh membuat link, melakukan screen capture atau data crawling ke aplikasi atau website tanpa adanya persetujuan tertulis sebelumnya dari ArahInn.com. Hal-hal tersebut dianggap sebagai pelanggaran hak milik intelektual ArahInn.com.</p>
            </Section>

            <Section id="layanan" title="Layanan ArahInn.com" Icon={ShoppingBag}>
              <p>ArahInn.com menyediakan dan menyelenggarakan sistem dan fasilitas pemesanan online secara terpadu <em>("Layanan")</em>, yang dapat melayani pemesanan/pemesanan termasuk namun tidak terbatas pada: <strong>AKOMODASI</strong> (hotel, apartment, guest house dan lain-lain), <strong>TRANSPORTASI</strong> (udara-laut-darat), <strong>EVENT &amp; Destinasi</strong> (bioskop, pertunjukan, leisure, dan lain-lain), <em>("Produk")</em> yang memungkinkan Anda untuk mencari informasi atas Produk yang Anda inginkan, serta melakukan pemesanan dan pembelian dan sekaligus melakukan pembayaran secara online dan aman melalui berbagai sistem dan fasilitas pembayaran yang tersedia.</p>
              <p>Layanan Kami secara umum dapat tersedia secara online selama dua puluh empat jam sehari dan tujuh hari dalam seminggu; kecuali dalam hal adanya perbaikan, peningkatan atau pemeliharaan pada aplikasi atau website Kami.</p>
              <p>Produk disediakan, disuplai dan diselenggarakan oleh pihak ketiga <em>("Mitra Penyedia")</em> yang telah mengadakan kerjasama dan telah mengadakan ikatan, baik secara langsung ataupun tidak langsung, dengan Kami. Anda memahami dan mengakui bahwa:</p>
              <ul>
                <li>Pemesanan dan pembelian yang Anda lakukan melalui ArahInn.com, merupakan hubungan hukum dan kontrak yang mengikat antara Anda dan Mitra Penyedia Kami. ArahInn.com bertindak sebagai agen atau perantara yang bertugas untuk memfasilitasi transaksi antara Anda dan Mitra Penyedia. Mitra Penyedia <strong>BUKAN</strong> merupakan bagian dari ArahInn.com.</li>
                <li>Data dan informasi termasuk foto terkait dengan Produk tertentu yang Kami cantumkan pada aplikasi atau website merupakan data dan informasi yang Kami terima dari Mitra Penyedia. Oleh karena itu, data, informasi dan foto dapat berbeda dengan aslinya.</li>
                <li>Kami tidak memiliki kendali atas data dan informasi yang diberikan oleh Mitra Penyedia, dan Kami tidak menjamin bahwa data dan informasi yang disajikan adalah akurat, lengkap, atau benar, dan terbebas dari kesalahan.</li>
                <li>Kami tidak memiliki kendali atas tindakan dan kesalahan yang dilakukan oleh Mitra Penyedia sehingga menyebabkan kerugian yang dialami oleh Anda di kemudian hari.</li>
                <li>Anda tidak diperbolehkan untuk menjual kembali Produk Kami, menggunakan, menyalin, mengawasi, menampilkan, men-download, atau mereproduksi konten atau informasi, piranti lunak, atau Layanan apa pun yang tersedia di aplikasi atau website Kami untuk kegiatan atau tujuan komersial apapun, tanpa persetujuan tertulis dari Kami sebelumnya.</li>
              </ul>
              <p>Anda dapat menggunakan aplikasi, website dan Layanan yang tersedia untuk membuat pemesanan/pembelian yang sah. Anda tidak diperbolehkan untuk membuat pemesanan/pembelian untuk tujuan spekulasi, tidak benar atau melanggar hukum.</p>
              <p>Anda juga menjamin bahwa data dan informasi yang Anda berikan ke Kami adalah data dan informasi yang akurat, terkini dan lengkap.</p>
              <p>Transaksi ArahInn.com yang resmi hanyalah yang dilakukan melalui website dan/atau aplikasi ArahInn.com. Komunikasi yang resmi dari Kami hanyalah yang berasal dari alamat email: <a href="mailto:cs@arahinn.com" className="text-brand font-semibold break-all">cs@arahinn.com</a>.</p>
            </Section>

            <Section id="pemesanan" title="Pemesanan / Pembelian Produk" Icon={ShoppingBag}>
              <p>Pemesanan/pembelian Produk dianggap berhasil atau selesai setelah Anda melakukan pelunasan pembayaran dan ArahInn.com menerbitkan dan mengirim ke Anda surat konfirmasi pemesanan/pembelian <em>("Surat Konfirmasi")</em>. Apabila terjadi perselisihan atau permasalahan, maka data yang terdapat pada ArahInn.com akan menjadi acuan utama dan dianggap sah.</p>
              <p>Dengan menyelesaikan pemesanan/pembelian, maka Anda dianggap setuju untuk menerima: (i) email yang akan Kami kirim tidak lama sebelum tanggal pelayanan yang Anda pesan, dan (ii) email yang akan Kami kirim tidak lama setelah tanggal pelayanan untuk mengundang Anda melengkapi formulir ulasan pengguna Produk Kami.</p>
              <p>Anda diwajibkan untuk memperhatikan syarat dan ketentuan Produk yang terkait dengan: (i) pembatasan usia, (ii) diperlukannya reservasi dan/atau konfirmasi terlebih dahulu sebelum kehadiran, (iii) adanya tanggal tetap (fixed) yang tidak bisa diubah, (iv) ketidakhadiran (no show) oleh Anda dan keterkaitannya dengan pengembalian dana, (v) pembatasan pengalihan atau perubahan nama pada Surat Konfirmasi, (vi) dokumen yang harus dibawa pada saat penukaran Surat Konfirmasi, (vii) kartu kredit asli yang dipakai saat pemesanan/pembelian yang harus dibawa pada saat penukaran Surat Konfirmasi.</p>
              <p>Untuk jalur penerbangan internasional, Anda atau pengguna harus memiliki paspor dengan masa berlaku sekurang-kurangnya <strong>6 (enam) bulan</strong>, pada saat tanggal keberangkatan dan/atau kepulangan.</p>
              <p>Khusus untuk Produk dalam bentuk Tiket pesawat:</p>
              <ol>
                <li>Masa berlaku Produk adalah sebagaimana ditentukan oleh Mitra Penyedia dan/atau Kami.</li>
                <li>Semua aturan terkait bagasi, termasuk berat, ukuran, jumlah, untuk Produk yang berlaku adalah sesuai kebijakan Mitra Penyedia dan dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
                <li>Kecuali ditentukan lain oleh Mitra Penyedia, Tiket hanya dapat digunakan oleh yang namanya tercantum pada Surat Konfirmasi.</li>
              </ol>
            </Section>

            <Section id="harga" title="Harga Produk" Icon={CreditCard}>
              <ol>
                <li>Kami selalu berupaya untuk menyediakan harga terbaik atas Produk untuk dapat dipesan oleh Anda. Harga yang tertera mungkin memiliki syarat dan ketentuan khusus, sehingga Anda harus memeriksa sendiri dan memahami syarat dan ketentuan khusus yang berlaku terhadap suatu harga atau tarif tertentu sebelum Anda melakukan pemesanan.</li>
                <li>Harga yang tercantum belum termasuk pajak, pungutan, biaya dan ongkos lainnya yang akan Kami uraikan secara tegas pada aplikasi, website atau Surat Konfirmasi dari Kami. Terkadang harga yang Kami peroleh dari Mitra Penyedia dalam mata uang Negara lain, dan Kami berupaya untuk mengkonversi harga sesuai dengan mata uang yang Anda pilih.</li>
                <li>Harga yang ditampilkan dapat berubah berdasarkan keadaan tertentu. Walaupun sangat kecil kemungkinannya, Kami dapat membatalkan, menolak atau merubah pemesanan Anda dalam hal terdapat penyesuaian ataupun kesalahan Mitra Penyedia. Sebagai akibatnya, Kami dapat menyesuaikan pemesanan yang Anda buat atau Kami akan melakukan pengembalian dana. Keputusan akhir adalah diskresi ArahInn.com.</li>
              </ol>
            </Section>

            <Section id="pembayaran" title="Pembayaran" Icon={CreditCard}>
              <ol>
                <li>Pelunasan atas harga pembelian merupakan syarat untuk mendapatkan Produk dari Mitra Penyedia Kami.</li>
                <li>Kami menerima pembayaran dengan sistem pembayaran menggunakan kartu kredit (VISA, Master Card, American Express dan JCB), Virtual Account, transfer antar rekening serta antar bank ke rekening bank ArahInn.com, dan metode pembayaran lainnya sebagaimana tercantum di aplikasi atau website.</li>
                <li>Untuk melindungi dan mengenskripsi informasi kartu kredit Anda, Kami menggunakan fasilitas teknologi <strong>"Secure Socket Layer (SSL)"</strong>.</li>
                <li>Dalam hal terjadi kasus penipuan kartu kredit atau penyalahgunaan sistem pembayaran oleh pihak ketiga manapun, maka kejadian tersebut harus segera dilaporkan ke Kami dan perusahaan/bank penerbit kartu kredit Anda.</li>
                <li>Apabila berdasarkan pertimbangan Kami terdapat indikasi penyalahgunaan atau penipuan (fraud) pada kartu kredit Anda, maka ArahInn.com berhak untuk melakukan pembatalan atas transaksi atau memblokir fitur pembayaran tanpa pemberitahuan.</li>
                <li>ArahInn.com memiliki hak untuk melaporkan kepada pihak yang berwenang dalam hal ditemukan adanya indikasi penyalahgunaan, penipuan atau tindakan melanggar hukum lainnya.</li>
                <li>Anda wajib memperhatikan secara teliti instruksi pembayaran yang Kami berikan. Kekeliruan pembayaran (pengisian nomor rekening / Virtual Account / nominal yang salah) yang mengakibatkan tidak terkonfirmasinya pesanan menjadi resiko dan tanggung jawab Anda sepenuhnya.</li>
                <li>Pembayaran dengan gift voucher, points, gift card dan/atau bentuk lainnya yang secara resmi diterbitkan oleh Kami akan diterima, namun dalam hal pembatalan, pengembalian dana hanya akan sebesar pembayaran tunai. Nilai non-tunai menjadi hangus.</li>
                <li>Atas setiap pemesanan/pembelian yang dapat Kami konfirmasi, Kami akan mengirim Anda Surat Konfirmasi via email. Anda bertanggung-jawab untuk mencetak dan menjaga informasi yang tertera pada Surat Konfirmasi.</li>
                <li>Konfirmasi yang Anda terima dari Kami setelah selesai pemesanan dan sebelum melakukan pembayaran adalah acuan bahwa proses transaksi sedang terjadi. Anda hanya dapat melakukan pembatalan setiap saat sebelum pembayaran dilakukan.</li>
                <li>Untuk pembayaran kartu kredit, semua permintaan pengembalian dana yang diajukan ke ArahInn.com adalah persetujuan tegas dari Anda untuk menghentikan permintaan ke bank penerbit kartu kredit atas transaksi yang sama.</li>
                <li>Dalam hal Anda meminta perubahan atau pembatalan pada transaksi, ArahInn.com dapat menyesuaikan atau membatalkan manfaat dari transaksi tersebut, termasuk points.</li>
                <li>Segala bentuk masalah seperti keluhan, klaim, pembatalan, atau permintaan pengembalian dana akan diselesaikan secara langsung antara Anda dan pihak akomodasi. ArahInn.com akan membantu dalam memberikan informasi atau dukungan yang dibutuhkan.</li>
                <li>Kami menyarankan Anda untuk membaca dan mengetahui ketentuan serta kebijakan yang diberlakukan oleh pihak akomodasi, termasuk kebijakan pembayaran, pembatalan, serta prosedur check-in dan check-out.</li>
                <li>ArahInn.com memfasilitasi proses pemesanan Anda, namun penting bagi Anda untuk memastikan pembayaran langsung ke pihak akomodasi sesuai kebijakan mereka untuk menjaga validitas reservasi.</li>
                <li>Pihak akomodasi mungkin memerlukan detail kartu kredit Anda untuk menjamin pemesanan kamar. Anda menyetujui bahwa ArahInn.com dapat membagikan informasi kartu kredit Anda kepada pihak akomodasi untuk kebutuhan pemesanan.</li>
                <li>Pihak akomodasi dapat melakukan proses verifikasi pemesanan kamar dengan mengenakan biaya di muka melalui kartu kredit Anda. Pihak akomodasi juga dapat memproses pembayaran penuh sebelum tanggal check-in jika diperlukan.</li>
                <li>Anda memahami bahwa bank atau penerbit kartu kredit Anda dapat membebankan biaya tambahan untuk transaksi yang melibatkan konversi mata uang asing.</li>
                <li>Pembayaran dilakukan dalam mata uang yang diterapkan oleh pihak akomodasi sebagaimana tercantum dalam konfirmasi pemesanan kamar. Harga yang ditampilkan dalam mata uang pilihan Anda merupakan estimasi berdasarkan kurs terkini.</li>
                <li>Jika Anda tidak hadir (no-show) pada tanggal check-in yang telah ditentukan, kebijakan pembatalan dan penalti yang berlaku akan mengikuti ketentuan pihak akomodasi. ArahInn.com tidak dapat memproses pengembalian dana atau perubahan terkait dengan no-show.</li>
                <li>Informasi mengenai akomodasi (deskripsi, harga, ketersediaan) disediakan oleh pihak akomodasi. ArahInn.com berusaha untuk memberikan informasi yang akurat, namun ketidakakuratan atau perubahan informasi yang dilakukan oleh pihak akomodasi merupakan tanggung jawab pihak akomodasi terkait.</li>
                <li>Kualitas layanan, fasilitas, atau pengalaman selama Anda menginap merupakan tanggung jawab dari pihak akomodasi.</li>
              </ol>
            </Section>

            <Section id="pembatalan" title="Perubahan dan Pembatalan" Icon={RefreshCw}>
              <ol>
                <li>Kecuali secara tegas dinyatakan lain, semua pembelian Produk di ArahInn.com tidak dapat diubah, dibatalkan, dikembalikan uang, ditukar atau dialihkan ke orang/pihak lain.</li>
                <li>Dengan melakukan pemesanan, Anda dianggap telah memahami, menerima dan menyetujui kebijakan pembatalan, serta syarat tambahan yang diberlakukan oleh Mitra Penyedia. Tarif atau penawaran tertentu tidak memenuhi syarat untuk pembatalan atau pengubahan.</li>
                <li>Tata cara pengajuan perubahan dan pembatalan atas pesanan (jika ada) diatur dalam Surat Konfirmasi maupun media lainnya yang dapat Kami perbaharui dari waktu ke waktu.</li>
                <li>Untuk setiap pembatalan pesanan, Kami akan melakukan pengembalian dana dengan ketentuan yang berlaku.</li>
                <li>Kami memerlukan waktu untuk mendapatkan kembali pembayaran yang Anda lakukan sebelumnya, yang telah Kami teruskan kepada Mitra Penyedia.</li>
                <li>Untuk pemesanan akomodasi, setiap permohonan reschedule dan/atau refund akan dikenakan biaya layanan (<em>service fee</em>). Biaya layanan ini akan ditampilkan atau diinformasikan sebelum pemohonan Anda diproses, dan akan dipotong terlebih dahulu dari jumlah dana pengembalian (jika ada).</li>
                <li>Anda menyetujui bahwa Kami hanya dapat memproses pengajuan pembatalan yang sesuai dengan syarat dan ketentuan yang berlaku.</li>
                <li>Khusus untuk pemesanan multi order, ArahInn.com hanya bertanggung jawab terhadap pesanan Anda per Order Detail ID.</li>
                <li>Walaupun sangat kecil kemungkinan Kami membatalkan atau mengubah pemesanan, namun dalam hal terjadi, Kami akan memberitahu Anda secepat mungkin. Tanggung jawab Kami hanya terbatas pada pelaksanaan pengembalian dana sesuai arahan Mitra Penyedia dan peraturan yang berlaku.</li>
                <li>Dalam hal Mitra Penyedia tidak bisa menyerahkan atau menyediakan Produk, Anda tunduk pada syarat dan ketentuan Mitra Penyedia.</li>
                <li>Baik ArahInn.com maupun Mitra Penyedia tidak dapat bertanggung jawab atas kerugian Anda, dalam hal terjadi <em>force majeure</em>: perang, kerusuhan, terorisme, perselisihan industrial, tindakan pemerintah, epidemik, pandemik, bencana alam, kebakaran atau banjir, cuaca ekstrim, dan lain sebagainya.</li>
                <li>Jika Anda tidak mendapatkan Produk sesuai Surat Konfirmasi, Kami akan merekomendasikan Produk sejenis tanpa biaya tambahan, atau memberikan uang Anda kembali secara penuh.</li>
                <li>ArahInn.com dapat menyesuaikan atau membatalkan manfaat yang Anda dapat dari transaksi (points, reward, dll) jika Anda meminta perubahan/pembatalan.</li>
              </ol>
            </Section>

            <Section id="pengembalian" title="Ketentuan Pengembalian Dana" Icon={RotateCcw}>
              <ol>
                <li>Dengan mengajukan fitur pengembalian dana dan memasukkan rekening bank, Pelanggan dianggap setuju terhadap setiap Syarat dan ketentuan terkait pengembalian dana ini.</li>
                <li>Pengembalian dana dilakukan dengan jumlah dan waktu sesuai dengan kebijakan pembatalan yang diberlakukan oleh Mitra Penyedia dan/atau Kami dari waktu ke waktu.</li>
                <li>Jumlah dana yang dikembalikan kepada Anda tidak lebih besar dari jumlah nominal yang Anda bayarkan kepada Kami pada saat transaksi pembelian.</li>
                <li>Pelanggan wajib memastikan keakuratan informasi rekening bank yang akan digunakan untuk proses pengembalian dana.</li>
                <li>ArahInn.com dapat meminta detail rekening bank. Dalam hal setelah 1×24 jam Pelanggan belum mengirimkan, ArahInn.com berhak memproses pengembalian dana ke saldo Points Pelanggan.</li>
                <li>Syarat dan ketentuan ini hanya berlaku untuk transaksi pembelian produk yang menggunakan media pembayaran selain paylater atau kartu kredit.</li>
                <li>Untuk transaksi yang pembayarannya menggunakan kartu kredit atau paylater, pengembalian dana dilakukan melalui kartu/paylater yang digunakan saat transaksi.</li>
                <li>Pengembalian dana akan diproses sesuai dengan metode pembayaran:
                  <ul>
                    <li><strong>Kartu kredit</strong> — pengembalian dikreditkan kembali ke limit kartu kredit.</li>
                    <li><strong>Selain kartu kredit/PayLater/e-wallet</strong> — pengembalian ditransfer ke rekening bank Pelanggan.</li>
                    <li><strong>PayLater</strong> — pengembalian dana langsung mengurangi saldo terutang pada akun PayLater.</li>
                    <li><strong>E-wallet (ShopeePay, GoPay, Blu, DANA, OVO)</strong> — pengembalian dikreditkan ke e-wallet. Apabila terjadi gangguan, ArahInn.com dapat mengalihkan ke rekening bank.</li>
                  </ul>
                </li>
                <li>Khusus untuk pemesanan ArahInn Kereta Api Indonesia, pengembalian dana mengikuti syarat dan ketentuan yang diatur oleh PT. Kereta Api Indonesia (Persero).</li>
                <li>Untuk pembayaran kartu kredit, permintaan pengembalian dana ke ArahInn.com adalah persetujuan tegas untuk menghentikan permintaan ke bank penerbit atas transaksi yang sama.</li>
                <li>Pelanggan menyatakan bahwa proses pengembalian dana tidak berkaitan dengan kegiatan pencucian dana, pendanaan terorisme, atau kegiatan ilegal lainnya.</li>
                <li>ArahInn.com berhak menahan proses pengembalian dana apabila Pelanggan melakukan pelanggaran terhadap Syarat dan Ketentuan ini.</li>
                <li>ArahInn.com berhak melakukan tindakan untuk memitigasi risiko pelanggaran, termasuk pelaporan kepada institusi yang berwenang.</li>
                <li>Proses pengembalian dana merupakan hubungan hukum antara Anda dan Mitra Penyedia. Kami bertindak sebagai agen penjual yang meneruskan permintaan Anda kepada Mitra Penyedia.</li>
              </ol>
            </Section>

            <Section id="keamanan" title="Keamanan" Icon={Lock}>
              <ol>
                <li>Pada saat Anda membuat pemesanan atau mengakses informasi akun Anda, Anda akan menggunakan akses <strong>Secure Server Layer (SSL)</strong> yang akan mengenkripsi informasi yang Anda kirimkan melalui aplikasi atau website Kami.</li>
                <li>Walaupun ArahInn.com akan menggunakan upaya terbaik untuk memastikan keamanannya, ArahInn.com tidak bisa menjamin seberapa kuat atau efektifnya enkripsi ini dan Anda sepenuhnya bertanggung jawab atas masalah yang terjadi akibat penggunaan yang tidak sah atas akun ArahInn.com milik Anda.</li>
                <li>Anda wajib memastikan bahwa perangkat yang digunakan untuk login menggunakan akun ArahInn.com Anda berada di bawah penguasaan Anda.</li>
                <li>Anda menyadari bahwa kerahasiaan akun ArahInn.com merupakan tanggung jawab Anda sepenuhnya. Kami menyarankan Anda untuk mengganti password secara berkala.</li>
              </ol>
            </Section>

            <Section id="akun" title="Akun Anda" Icon={User}>
              <ol>
                <li>Untuk keperluan pendaftaran dan pembukaan akun, Kami akan mengumpulkan dan memproses informasi pribadi Anda (nama, email, nomor ponsel). Anda setuju memberi Kami informasi yang akurat, lengkap, dan terbaru.</li>
                <li>Hanya Anda yang dapat menggunakan akun Anda. Anda menjamin tidak akan mengizinkan pihak lain menggunakan identitas atau akun Anda dengan alasan apa pun.</li>
                <li>Anda tidak dapat mentransfer akun Anda ke pihak lain. Kami dibebaskan dari tanggung jawab atas kerugian yang timbul atas penyalahgunaan akun akibat kelalaian Anda (meminjamkan akses, memberikan OTP/password, mengakses link mencurigakan, dll).</li>
                <li>Anda harus menjaga keamanan dan kerahasiaan kata sandi akun Anda. Pesanan yang diterima dari penggunaan yang tidak sah akibat kelalaian Anda akan tetap dianggap valid dan Kami akan memprosesnya.</li>
                <li>Kami <strong>tidak akan</strong> meminta username, password, kode SMS verifikasi atau kode OTP milik akun Anda untuk alasan apapun. Jangan memberikan data tersebut kepada pihak yang mengatasnamakan Kami.</li>
                <li>Jika Anda tidak lagi memiliki kendali atas akun (diretas, ponsel dicuri), segera memberi tahu Kami sehingga Kami dapat memblokir sementara dan/atau menonaktifkan akun Anda.</li>
                <li>Kami memiliki hak penuh untuk memblokir sementara, menghapus, atau menonaktifkan akun Anda atas dasar kebijakan Kami sendiri tanpa pemberitahuan sebelumnya. Alasan mencakup namun tidak terbatas pada:
                  <ul>
                    <li>Pelanggaran ketentuan ini</li>
                    <li>Larangan dalam peraturan</li>
                    <li>Penipuan atau pencurian (termasuk indikasi atau dugaan)</li>
                    <li>Pemesanan yang mencurigakan</li>
                    <li>Pemberian informasi yang tidak akurat, salah atau menyesatkan</li>
                    <li>Perilaku, ancaman, atau penghinaan yang tidak pantas</li>
                    <li>Penolakan untuk memberikan informasi</li>
                    <li>Sulit dihubungi/dijangkau</li>
                    <li>Anda terdaftar pada "daftar hitam" atau "daftar pantauan" oleh pemerintah atau organisasi internasional</li>
                  </ul>
                </li>
                <li>Anda setuju bahwa segala resiko dan akibat atas pemblokiran, penghapusan, atau inaktivasi akun menjadi resiko Anda.</li>
                <li>Dengan pembukaan dan penggunaan akun, Anda membebaskan Kami atas segala tanggung jawab, kehilangan, dan/atau kerugian yang timbul akibat penggunaan akun Anda.</li>
              </ol>
            </Section>

            <Section id="data" title="Kebijakan Penggunaan Data" Icon={Database}>
              <ol>
                <li>Kami menganggap privasi Anda sebagai hal yang penting.</li>
                <li>Pada saat Anda membuat pemesanan/pembelian di aplikasi atau website ArahInn.com, Kami akan mencatat dan menyimpan informasi dan data pribadi Anda. Data Anda akan Kami gunakan untuk menyediakan produk dan memberi layanan kepada Anda, untuk keperluan akuntansi, tagihan, audit, verifikasi kredit, pembayaran, keamanan, administrasi dan legal, reward points, pengujian, pemeliharaan dan pengembangan sistem, hubungan pelanggan, pemberitahuan program promosi, campaign dan informasi lainnya dengan mengirimkan newsletter atau push notification (email, WhatsApp, media sosial). Kami dapat mengungkapkan data Anda kepada group perusahaan ArahInn.com, Mitra Penyedia Produk, perusahaan rekanan, perusahaan pemroses data, agen perjalanan, badan pemerintah dan badan peradilan yang berwenang.</li>
                <li>Dalam semua transaksi penjualan Produk ArahInn.com, ArahInn.com hanya bertindak sebagai penyalur Produk. Khusus untuk transaksi produk asuransi, hubungan hukum adalah antara pelanggan dengan mitra penyedia asuransi. Mitra penyedia asuransi bertanggung jawab atas penyelenggaraan dan kerahasiaan data pribadi terkait klaim asuransi.</li>
              </ol>
            </Section>

            <Section id="lain" title="Ketentuan Lain" Icon={Scale}>
              <ol>
                <li>Syarat dan Ketentuan Umum ini tunduk pada hukum <strong>Negara Republik Indonesia</strong>.</li>
                <li>Bahasa yang dipakai untuk Syarat dan Ketentuan Umum ini adalah Bahasa Indonesia dan Bahasa Inggris. Dalam hal ada perbedaan pengertian, yang berlaku adalah Bahasa Indonesia atau versi yang ditentukan oleh Kami.</li>
                <li>Dalam hal terdapat perbedaan antara syarat dan ketentuan di laman lain dengan Syarat dan Ketentuan Umum ini, maka Syarat dan Ketentuan Umum ini yang akan berlaku.</li>
                <li>Seluruh perselisihan yang terkait dengan Syarat &amp; Ketentuan akan diselesaikan secara musyawarah dan apabila tidak dapat diselesaikan secara kekeluargaan, maka penyelesaian dilakukan oleh <strong>Badan Penyelesaian Sengketa Konsumen di Jakarta</strong>, tanpa mengurangi hak ArahInn.com untuk mengajukan gugatan di pengadilan manapun di seluruh Indonesia.</li>
              </ol>
            </Section>

            {/* ── Contact Card ────────────────────────────────────── */}
            <div className="mt-10 sm:mt-12 bg-gradient-to-br from-brand/5 via-blue-50 to-orange-50 border border-brand/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">Hubungi Kami</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-5 sm:mb-6">Punya pertanyaan terkait Syarat &amp; Ketentuan? Tim kami siap membantu.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <a href="https://wa.me/6285188136009" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 shrink-0 transition-colors">
                    <MessageCircle className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">WhatsApp</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
                  </div>
                </a>
                <a href="mailto:cs@arahinn.com"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 shrink-0 transition-colors">
                    <Mail className="w-5 h-5 text-blue-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">cs@arahinn.com</p>
                  </div>
                </a>
                <a href="tel:+6285188136009"
                  className="flex items-center gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md active:scale-[0.98] transition-all group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 shrink-0 transition-colors">
                    <Phone className="w-5 h-5 text-orange-600 group-hover:text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Telepon</p>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">+62 851-8813-6009</p>
                  </div>
                </a>
              </div>
            </div>

            <p className="mt-6 sm:mt-8 text-center text-[11px] sm:text-xs text-slate-400 leading-relaxed px-2">
              © 2026 ArahInn.com — PT. Redy Hospitality Management.<br className="sm:hidden" />
              <span className="hidden sm:inline"> </span>Semua hak dilindungi.
            </p>
          </article>
        </div>
      </section>

      {/* ── Mobile Floating TOC Button (hidden on lg+) ───────────────── */}
      <button
        onClick={() => setMobileTocOpen(true)}
        className="lg:hidden fixed bottom-6 left-6 z-40 h-12 px-4 rounded-full bg-white text-brand border border-slate-200 shadow-lg active:scale-95 transition-all flex items-center gap-2"
        aria-label="Buka daftar isi"
      >
        <List className="w-4 h-4" />
        <span className="text-xs font-bold">Daftar Isi</span>
      </button>

      {/* ── Mobile TOC Bottom Sheet ──────────────────────────────────── */}
      {mobileTocOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMobileTocOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col animate-slide-up"
          >
            <div className="shrink-0 px-5 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-slate-300 mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Navigasi</p>
                  <h3 className="font-display text-lg font-bold text-slate-900">Daftar Isi</h3>
                </div>
                <button
                  onClick={() => setMobileTocOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                  aria-label="Tutup"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            <nav className="overflow-y-auto px-3 pb-6 space-y-1">
              {SECTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                    activeId === id
                      ? 'bg-brand/10 text-brand font-bold'
                      : 'text-slate-700 active:bg-slate-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    activeId === id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Scroll-to-top floating button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-brand text-white shadow-lg hover:bg-brand-700 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      <style>{`
        .prose-content section { scroll-margin-top: 80px; }
        .prose-content p, .prose-content li {
          font-size: 0.9rem;
          line-height: 1.7;
          color: #475569;
          text-align: left;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        @media (min-width: 640px) {
          .prose-content section { scroll-margin-top: 100px; }
          .prose-content p, .prose-content li {
            font-size: 0.93rem;
            line-height: 1.75;
            text-align: justify;
            text-justify: inter-word;
            hyphens: auto;
            word-break: normal;
            overflow-wrap: break-word;
          }
        }
        .prose-content p { margin-bottom: 0.875rem; }
        @media (min-width: 640px) { .prose-content p { margin-bottom: 1rem; } }
        .prose-content ol, .prose-content ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .prose-content ol, .prose-content ul { padding-left: 1.5rem; } }
        .prose-content ol li, .prose-content ul li { margin-bottom: 0.5rem; }
        .prose-content ol { list-style-type: decimal; }
        .prose-content ul { list-style-type: disc; }
        .prose-content ul ul { list-style-type: circle; margin-top: 0.5rem; }
        .prose-content strong { color: #0f172a; font-weight: 700; }
        .prose-content code {
          background: #f1f5f9;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          font-size: 0.85em;
          color: #1d4ed8;
          word-break: break-all;
        }
        .prose-content a { color: #f97316; }
        .prose-content a:hover { text-decoration: underline; }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
        .animate-fade-in  { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}

function Section({ id, title, Icon, children }) {
  return (
    <section id={id} className="mb-8 sm:mb-10 last:mb-0">
      <div className="flex items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 mb-4 sm:mb-5 border-b border-slate-200">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
        </div>
        <h2 className="font-display text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
