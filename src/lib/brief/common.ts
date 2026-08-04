import type { Answers } from '@/types/db';
import type { Section } from './types';

/** Talep basligi olarak kullanilan alan */
export const TITLE_KEY = 'proje_adi';
/** requests.use_date kolonuna yansiyan alan: isin canliya alinacagi tarih */
export const USE_DATE_KEY = 'yayin_tarihi';
/** requests.priority kolonuna yansiyan alan */
export const PRIORITY_KEY = 'oncelik';

export const PRIORITY_OPTIONS = ['Düşük', 'Normal', 'Yüksek', 'Acil'] as const;

/** Icerik turu secimlerinin tutuldugu alanlar */
export const CONTENT_DIGITAL_KEY = 'icerik_dijital';
export const CONTENT_PRINT_KEY = 'icerik_basili';
export const CONTENT_OTHER_KEY = 'icerik_diger';

const picked = (answers: Answers, key: string, option: string) => {
  const value = answers[key];
  return Array.isArray(value) && value.includes(option);
};

/** 1-4: temel proje bilgileri */
export const BRIEF_SECTION: Section = {
  id: 'brif',
  title: 'Talep bilgileri',
  description:
    'Ne kadar net yazarsanız, geri dönüp soru sorma ihtiyacımız o kadar azalır. Emin olmadığınız yerleri de yazın; birlikte netleştiririz.',
  fields: [
    {
      key: TITLE_KEY,
      label: 'Proje / etkinlik adı',
      type: 'text',
      required: true,
      help: 'Görselde ve metinde kullanılacak başlığın ne anlatması gerektiğini açıkça belirtiniz.',
      placeholder: 'Örn. Yaza Merhaba Partisi · Anneler Günü Brunch’ı · İstanbul Festivali',
    },
    {
      key: USE_DATE_KEY,
      label: 'Proje / kampanya tarihi',
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
      type: 'text',
      half: true,
      placeholder: 'Örn. 19:00',
    },
    {
      key: 'bitis_saati',
      label: 'Bitiş saati',
      type: 'text',
      half: true,
      placeholder: 'Örn. 23:30',
    },
  ],
};

/** 5: icerik turu. Secime gore alt alanlar acilir. */
export const CONTENT_SECTION: Section = {
  id: 'icerik_turu',
  title: 'İçerik türü',
  description:
    'Hangi mecralar için üretim yapılacağını seçin. Birden fazla seçebilirsiniz; seçiminize göre ek alanlar açılır.',
  fields: [
    {
      key: CONTENT_DIGITAL_KEY,
      label: 'Dijital',
      type: 'multiselect',
      options: ['Post', 'Story', 'Reels', 'Web sitesi', 'Ekranlar'],
    },
    {
      key: 'ekran_olcu',
      label: 'Ekran ölçü bilgisi',
      type: 'text',
      required: true,
      placeholder: 'Örn. 1920x1080 px, dikey 1080x1920 px',
      showIf: (a) => picked(a, CONTENT_DIGITAL_KEY, 'Ekranlar'),
    },

    {
      key: CONTENT_PRINT_KEY,
      label: 'Basılı materyal',
      type: 'multiselect',
      options: ['Menü', 'Poster', 'Lightbox', 'Billboard'],
    },
    {
      key: 'menu_turu',
      label: 'Menü türü',
      type: 'multiselect',
      options: ['Masaüstü menü', 'Kapı önü menü', 'Tüm menü boyutları'],
      required: true,
      showIf: (a) => picked(a, CONTENT_PRINT_KEY, 'Menü'),
    },
    {
      key: 'poster_olcu',
      label: 'Poster ölçü bilgisi',
      type: 'text',
      required: true,
      half: true,
      placeholder: 'Örn. 50x70 cm',
      showIf: (a) => picked(a, CONTENT_PRINT_KEY, 'Poster'),
    },
    {
      key: 'lightbox_olcu',
      label: 'Lightbox ölçü bilgisi',
      type: 'text',
      required: true,
      half: true,
      placeholder: 'Örn. 50x150 cm',
      showIf: (a) => picked(a, CONTENT_PRINT_KEY, 'Lightbox'),
    },
    {
      key: 'billboard_olcu',
      label: 'Billboard ölçü bilgisi',
      type: 'text',
      required: true,
      half: true,
      placeholder: 'Örn. 200x400 cm',
      showIf: (a) => picked(a, CONTENT_PRINT_KEY, 'Billboard'),
    },

    {
      key: CONTENT_OTHER_KEY,
      label: 'Diğer',
      type: 'checkbox',
      help: 'Yukarıdaki listede olmayan bir iş için işaretleyin.',
    },
    {
      key: 'diger_is_turu',
      label: 'İşin türü',
      type: 'text',
      required: true,
      half: true,
      placeholder: 'Örn. araç giydirme, ambalaj tasarımı',
      showIf: (a) => a[CONTENT_OTHER_KEY] === true,
    },
    {
      key: 'diger_alan',
      label: 'Yayımlanacağı alan',
      type: 'text',
      required: true,
      half: true,
      placeholder: 'Nerede kullanılacak?',
      showIf: (a) => a[CONTENT_OTHER_KEY] === true,
    },
    {
      key: 'diger_olcu',
      label: 'Ölçü bilgisi',
      type: 'text',
      required: true,
      showIf: (a) => a[CONTENT_OTHER_KEY] === true,
    },
  ],
};

/** 6-9: icerik ve yonlendirme detaylari */
export const DETAIL_SECTION: Section = {
  id: 'detay',
  title: 'İçerik ve yönlendirmeler',
  fields: [
    {
      key: 'icerik_akis',
      label: 'Etkinlik içeriği / akış / detayları',
      type: 'textarea',
      required: true,
      help: 'Etkinlikte veya kampanyada tam olarak ne olacak? Sırasıyla anlatınız. En sık eksik kalan bilgi budur.',
      placeholder:
        '19:00 karşılama ve ikram\n19:30 açılış konuşması\n20:00 canlı müzik\n21:30 çekiliş ve kapanış',
    },
    {
      key: 'gorsel_zorunlu',
      label: 'Görselde mutlaka olması gereken detaylar',
      type: 'textarea',
      required: true,
      help: 'Tasarımda yer alması zorunlu olan logo, QR kod, fotoğraf veya belirli nesneleri belirtiniz.',
      placeholder: 'Örn. Görselde mutlaka pembe bir hediye paketi olmalı. Sağ altta QR kod yer almalı.',
    },
    {
      key: 'metin_zorunlu',
      label: 'Söylemlerde / metinlerde mutlaka belirtilmesi gereken noktalar',
      type: 'textarea',
      required: true,
      help: 'Tasarım üzerinde veya sosyal medya açıklamasında mutlaka geçmesini istediğiniz cümleler, sloganlar veya uyarılar.',
      placeholder:
        'Örn. Girişler ücretsizdir.\n18 yaş altı katılımcılar kabul edilmeyecektir.\nRezervasyon zorunludur.',
    },
    {
      key: 'mood',
      label: 'Görsel tarz',
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
    { key: 'ek_aciklama', label: 'Ek açıklamalar', type: 'textarea' },
  ],
};

/**
 * Tek bir alana bagli olmayan zorunluluklar.
 * "Icerik turu" zorunlu ama uc gruptan herhangi birinde secim yapilmasi yeterli;
 * bu yuzden alan bazli required ile ifade edilemiyor.
 */
export interface CrossFieldRule {
  sectionId: string;
  key: string;
  label: string;
  isSatisfied: (answers: Answers) => boolean;
}

export const CROSS_FIELD_RULES: CrossFieldRule[] = [
  {
    sectionId: CONTENT_SECTION.id,
    key: 'icerik_turu',
    label: 'İçerik türü (en az bir seçim)',
    isSatisfied: (a) => {
      const digital = a[CONTENT_DIGITAL_KEY];
      const print = a[CONTENT_PRINT_KEY];
      return (
        (Array.isArray(digital) && digital.length > 0) ||
        (Array.isArray(print) && print.length > 0) ||
        a[CONTENT_OTHER_KEY] === true
      );
    },
  },
];

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
