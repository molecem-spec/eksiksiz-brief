import type { Section } from './types';

/** Talep basligi olarak kullanilan alan */
export const TITLE_KEY = 'proje_adi';
/** requests.use_date kolonuna yansiyan alan: isin canliya alinacagi tarih */
export const USE_DATE_KEY = 'yayin_tarihi';
/** requests.priority kolonuna yansiyan alan */
export const PRIORITY_KEY = 'oncelik';

export const PRIORITY_OPTIONS = ['Düşük', 'Normal', 'Yüksek', 'Acil'] as const;

/**
 * Talep formunun ana bolumu.
 * Sorular ve yonlendirme metinleri ajansin belirledigi sirayla duruyor.
 */
export const BRIEF_SECTION: Section = {
  id: 'brif',
  title: 'Talep bilgileri',
  description:
    'Ne kadar net yazarsanız, geri dönüp soru sorma ihtiyacımız o kadar azalır. Emin olmadığınız yerleri de yazın; birlikte netleştiririz.',
  fields: [
    {
      key: TITLE_KEY,
      label: 'Proje / Etkinlik adı',
      type: 'text',
      required: true,
      help: 'Görselde ve metinde kullanılacak başlığın ne anlatması gerektiğini açıkça belirtiniz.',
      placeholder: 'Örn. Yaza Merhaba Partisi · Anneler Günü Brunch’ı · İstanbul Festivali',
    },
    {
      key: USE_DATE_KEY,
      label: 'Etkinlik / kampanya tarihi',
      type: 'date',
      required: true,
      half: true,
      help: 'Talep edilen işin canlıya alınacağı tarih.',
    },
    {
      key: 'mekan',
      label: 'Yer / mekân bilgisi',
      type: 'text',
      half: true,
      help: 'Etkinlik özelinde bir işse; şube, salon veya konum bilgisi.',
      placeholder: 'Örn. Nişantaşı şubesi · Kanyon AVM zemin kat',
    },
    {
      key: 'baslangic_saati',
      label: 'Başlangıç saati',
      type: 'time',
      half: true,
      help: 'Etkinlik özelinde bir işse doldurunuz.',
    },
    {
      key: 'bitis_saati',
      label: 'Bitiş saati',
      type: 'time',
      half: true,
    },
    {
      key: 'icerik_akis',
      label: 'Etkinlik içeriği & akış detayları',
      type: 'textarea',
      required: true,
      help: 'Etkinlikte / kampanyada tam olarak ne olacak? Sırasıyla anlatınız. En sık eksik kalan bilgi budur.',
      placeholder:
        '19:00 karşılama ve ikram\n19:30 açılış konuşması\n20:00 canlı müzik\n21:30 çekiliş ve kapanış',
    },
    {
      key: 'gorsel_zorunlu',
      label: 'Görselde mutlaka olması gerekenler',
      type: 'textarea',
      help: 'Tasarımda yer alması zorunlu olan logo, QR kod, fotoğraf veya belirli nesneleri belirtiniz.',
      placeholder: 'Örn. Görselde mutlaka pembe bir hediye paketi olmalı. Sağ altta QR kod yer almalı.',
    },
    {
      key: 'metin_zorunlu',
      label: 'Söylemlerde / metinde belirtilmesi istenen noktalar',
      type: 'textarea',
      help: 'Tasarım üzerinde veya sosyal medya açıklamasında mutlaka geçmesini istediğiniz cümleler, sloganlar veya uyarılar.',
      placeholder:
        'Örn. Girişler ücretsizdir.\n18 yaş altı katılımcılar kabul edilmeyecektir.\nRezervasyon zorunludur.',
    },
    {
      key: 'mecra_olcu',
      label: 'Dijital / basılı kullanım ve ölçüler',
      type: 'textarea',
      required: true,
      help: 'Tasarımın hangi platformlarda veya baskı materyallerinde kullanılacağını ölçüleriyle birlikte belirtiniz.',
      placeholder:
        'Instagram post & story\nWeb sitesi banner’ı – [ölçü bilgisi]\n50x150 lightbox – [konumlanacağı alan]\n50x70 poster – [konumlanacağı alan]',
    },
    {
      key: 'mood',
      label: 'Görsel tarz / mood & referanslar',
      type: 'textarea',
      help: 'Hayal ettiğiniz tasarım tarzını tanımlayınız. Beğendiğiniz referans görsel bağlantılarını da ekleyebilirsiniz.',
      placeholder: 'Örn. Minimal, retro, neon, dopamine, kurumsal, grunge…',
    },
  ],
};

/** Ana sorulardan sonra gelen kisa ek bilgiler bolumu */
export const EXTRA_SECTION: Section = {
  id: 'ek',
  title: 'Ek bilgiler',
  description: 'Kısa bölüm. Doldurulması işi hızlandırır.',
  fields: [
    {
      key: PRIORITY_KEY,
      label: 'Öncelik seviyesi',
      type: 'select',
      options: [...PRIORITY_OPTIONS],
      required: true,
      half: true,
    },
    {
      key: 'iletisim_kisi',
      label: 'İletişim kurulacak kişi',
      type: 'text',
      required: true,
      half: true,
      help: 'Soru çıkarsa kime yazalım?',
    },
    { key: 'iletisim_telefon', label: 'Telefon', type: 'tel', half: true },
    {
      key: 'yasakli_ifadeler',
      label: 'Kullanılmaması gereken ifadeler',
      type: 'textarea',
      help: 'Marka olarak kaçındığınız kelimeler, rakip isimleri, iddialı vaatler…',
    },
    { key: 'ek_aciklama', label: 'Ek açıklamalar', type: 'textarea' },
  ],
};

/** Dosya yukleme kategorileri */
export const FILE_CATEGORIES = [
  'Logo',
  'Kurumsal kimlik dosyası',
  'Referans görsel',
  'Ürün fotoğrafı',
  'Mekân fotoğrafı',
  'Konuşmacı fotoğrafı',
  'Menü',
  'Etkinlik programı',
  'PDF',
  'Word dosyası',
  'Görsel',
  'Sunum',
  'Diğer',
];
