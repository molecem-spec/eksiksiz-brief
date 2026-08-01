import type { Answers } from '@/types/db';
import type { Section } from './types';

/** Talep basligi olarak kullanilan alan */
export const TITLE_KEY = 'proje_adi';
/** requests.use_date kolonuna yansiyan alan */
export const USE_DATE_KEY = 'kullanim_tarihi';
/** requests.deadline kolonuna yansiyan alan */
export const DEADLINE_KEY = 'teslim_tarihi';
/** requests.priority kolonuna yansiyan alan */
export const PRIORITY_KEY = 'oncelik';
/** Etkinlik adimini acan alan */
export const EVENT_FLAG_KEY = 'etkinlik_var';

export const PRIORITY_OPTIONS = ['Düşük', 'Normal', 'Yüksek', 'Acil'] as const;

/** Tum taleplerde sorulan temel bilgiler */
export const BASE_SECTION: Section = {
  id: 'temel',
  title: 'Temel proje bilgileri',
  description: 'Bu bölüm her talepte doldurulur. Ne kadar net olursa o kadar az soru gelir.',
  fields: [
    {
      key: TITLE_KEY,
      label: 'Proje veya iş adı',
      type: 'text',
      required: true,
      placeholder: 'Örn. Sevgililer Günü menü duyurusu',
    },
    {
      key: 'kisa_aciklama',
      label: 'Talebin kısa açıklaması',
      type: 'textarea',
      required: true,
      placeholder: 'Birkaç cümleyle ne istediğinizi anlatın.',
    },
    {
      key: 'amac',
      label: 'Projenin amacı',
      type: 'textarea',
      required: true,
      help: 'Bu çalışmanın sonunda ne olmasını bekliyorsunuz? (satış, rezervasyon, bilinirlik, katılım…)',
    },
    {
      key: 'hedef_kitle',
      label: 'Hedef kitle',
      type: 'textarea',
      required: true,
      placeholder: 'Yaş aralığı, ilgi alanı, lokasyon, mevcut müşteri / yeni müşteri…',
    },
    {
      key: USE_DATE_KEY,
      label: 'Yayın, etkinlik veya kullanım tarihi',
      type: 'date',
      required: true,
      half: true,
    },
    {
      key: DEADLINE_KEY,
      label: 'Tasarım veya metin teslim beklentisi',
      type: 'date',
      required: true,
      half: true,
      help: 'İşin size teslim edilmesini istediğiniz tarih.',
    },
    { key: 'baslangic_saati', label: 'Başlangıç saati', type: 'time', half: true },
    { key: 'bitis_saati', label: 'Bitiş saati', type: 'time', half: true },
    {
      key: 'lokasyon',
      label: 'Mekân, şube veya lokasyon',
      type: 'text',
      placeholder: 'Örn. Kanyon AVM zemin kat / Nişantaşı şubesi',
    },
    {
      key: PRIORITY_KEY,
      label: 'Öncelik seviyesi',
      type: 'select',
      options: [...PRIORITY_OPTIONS],
      required: true,
      half: true,
    },
    {
      key: EVENT_FLAG_KEY,
      label: 'Bu talep bir etkinlik içeriyor',
      type: 'checkbox',
      help: 'İşaretlerseniz etkinlik bilgileri adımı açılır.',
    },
    {
      key: 'zorunlu_metinler',
      label: 'Kullanılması gereken zorunlu metinler',
      type: 'textarea',
      placeholder: 'Slogan, yasal ibare, kampanya koşulu, adres, telefon…',
    },
    {
      key: 'yasakli_ifadeler',
      label: 'Kullanılmaması gereken ifadeler',
      type: 'textarea',
      placeholder: 'Marka olarak kaçındığınız kelimeler, rakip isimleri, iddialı vaatler…',
    },
    {
      key: 'yasal_zorunluluklar',
      label: 'Yasal veya kurumsal zorunluluklar',
      type: 'textarea',
      placeholder: 'AVM yönetimi onayı, mevzuat uyarısı, yaş sınırı ibaresi, alkol/tütün kuralları…',
    },
    { key: 'iletisim_kisi', label: 'İletişim kurulacak kişi', type: 'text', required: true, half: true },
    { key: 'iletisim_telefon', label: 'Telefon', type: 'tel', half: true },
    { key: 'iletisim_eposta', label: 'E-posta', type: 'email', half: true },
    { key: 'ek_aciklama', label: 'Ek açıklamalar', type: 'textarea' },
  ],
};

/** Tasarim ve metin yonlendirmeleri */
export const DESIGN_SECTION: Section = {
  id: 'tasarim',
  title: 'Tasarım yönlendirmeleri',
  description: 'Metin ve tasarım ekibinin doğru yerden başlaması için.',
  fields: [
    {
      key: 'tasarim_tonu',
      label: 'İstenen ton',
      type: 'multiselect',
      options: [
        'Kurumsal',
        'Samimi',
        'Eğlenceli',
        'Lüks / premium',
        'Minimal',
        'Enerjik',
        'Sıcak / davetkâr',
        'Modern',
        'Nostaljik',
      ],
    },
    {
      key: 'renk_yonlendirmesi',
      label: 'Renk yönlendirmesi',
      type: 'text',
      placeholder: 'Marka renkleri, sezon renkleri veya kaçınılması gereken renkler',
    },
    {
      key: 'referanslar',
      label: 'Referans / beğenilen örnekler',
      type: 'textarea',
      placeholder: 'Bağlantı, hesap adı veya tarif. Görselleri dosya adımında yükleyebilirsiniz.',
    },
    {
      key: 'kacinilacaklar',
      label: 'Kaçınılması gereken görsel yaklaşımlar',
      type: 'textarea',
    },
    {
      key: 'logo_kullanimi',
      label: 'Logo kullanımı',
      type: 'select',
      options: [
        'Yalnızca marka logosu',
        'Marka + sponsor logoları',
        'Marka + iş birliği markası',
        'Logo kullanılmayacak',
      ],
      half: true,
    },
    {
      key: 'kurumsal_kimlik',
      label: 'Kurumsal kimlik dosyası',
      type: 'select',
      options: ['Var, yükleyeceğim', 'Ajansta mevcut', 'Yok', 'Emin değilim'],
      half: true,
    },
    {
      key: 'metin_kim_yazacak',
      label: 'Metinleri kim yazacak?',
      type: 'select',
      options: ['Ajans yazacak', 'Metni ben göndereceğim', 'Birlikte çalışalım'],
      half: true,
    },
    {
      key: 'gorsel_kaynagi',
      label: 'Görsel kaynağı',
      type: 'select',
      options: [
        'Ajans arşivinden',
        'Ben göndereceğim',
        'Stok görsel kullanılabilir',
        'Yeni çekim gerekiyor',
      ],
      half: true,
    },
    {
      key: 'dil',
      label: 'Kullanılacak dil',
      type: 'multiselect',
      options: ['Türkçe', 'İngilizce', 'Arapça', 'Diğer'],
    },
    {
      key: 'onay_sureci',
      label: 'Onay süreci',
      type: 'text',
      placeholder: 'Çalışmayı kim onaylayacak? Birden fazla kişi varsa yazın.',
    },
  ],
};

const SOCIAL_FORMATS = [
  'Instagram post',
  'Instagram story',
  'Carousel',
  'Reels kapağı',
  'LinkedIn gönderisi',
  'X gönderisi',
];

const PRINT_FORMATS = [
  'Afiş',
  'Broşür',
  'Davetiye',
  'Menü',
  'Masa üstü materyal',
  'Baskılı yönlendirme',
];

const DIGITAL_FORMATS = ['Dijital ekran', 'Web banner', 'E-posta görseli'];

const TEXT_FORMATS = ['SMS metni', 'Web sitesi içeriği'];

export const FORMAT_OPTIONS = [
  ...SOCIAL_FORMATS,
  ...DIGITAL_FORMATS,
  ...PRINT_FORMATS,
  ...TEXT_FORMATS,
  'Diğer',
];

const selected = (answers: Answers, key: string, list: string[]) => {
  const value = answers[key];
  return Array.isArray(value) && value.some((v) => list.includes(v));
};

/** Mecra ve olcu bilgileri */
export const FORMAT_SECTION: Section = {
  id: 'formatlar',
  title: 'Mecra ve ölçü bilgileri',
  description: 'Hangi çalışmaların üretileceğini seçin; seçime göre teknik sorular açılır.',
  fields: [
    {
      key: 'formatlar',
      label: 'İstenen çalışma formatları',
      type: 'multiselect',
      options: FORMAT_OPTIONS,
      required: true,
    },
    {
      key: 'sosyal_adet',
      label: 'Sosyal medya içerik adedi',
      type: 'text',
      half: true,
      placeholder: 'Örn. 3 post + 5 story',
      showIf: (a) => selected(a, 'formatlar', SOCIAL_FORMATS),
    },
    {
      key: 'sosyal_notlar',
      label: 'Sosyal medya notları',
      type: 'textarea',
      placeholder: 'Etiketlenecek hesaplar, hashtag, bağlantı, harekete geçirici mesaj…',
      showIf: (a) => selected(a, 'formatlar', SOCIAL_FORMATS),
    },
    {
      key: 'dijital_olcu',
      label: 'Dijital ölçüler (piksel)',
      type: 'text',
      half: true,
      placeholder: 'Örn. 1920x1080, 300x250',
      showIf: (a) => selected(a, 'formatlar', DIGITAL_FORMATS),
    },
    {
      key: 'dijital_format',
      label: 'İstenen dosya formatı',
      type: 'text',
      half: true,
      placeholder: 'JPG / PNG / MP4 / HTML5',
      showIf: (a) => selected(a, 'formatlar', DIGITAL_FORMATS),
    },
    {
      key: 'basili_olcu',
      label: 'Basılı ölçüler',
      type: 'text',
      half: true,
      placeholder: 'Örn. A3, 50x70 cm, 10x21 cm',
      showIf: (a) => selected(a, 'formatlar', PRINT_FORMATS),
    },
    {
      key: 'basili_adet',
      label: 'Baskı adedi',
      type: 'text',
      half: true,
      showIf: (a) => selected(a, 'formatlar', PRINT_FORMATS),
    },
    {
      key: 'baski_kim',
      label: 'Baskıyı kim yaptıracak?',
      type: 'select',
      options: ['Ajans', 'Biz yaptıracağız', 'Henüz belli değil'],
      half: true,
      showIf: (a) => selected(a, 'formatlar', PRINT_FORMATS),
    },
    {
      key: 'baski_son_tarih',
      label: 'Baskıya gitmesi gereken tarih',
      type: 'date',
      half: true,
      showIf: (a) => selected(a, 'formatlar', PRINT_FORMATS),
    },
    {
      key: 'metin_notu',
      label: 'Metin içeriği notları',
      type: 'textarea',
      placeholder: 'Karakter sınırı, gönderilecek bağlantı, çağrı metni…',
      showIf: (a) => selected(a, 'formatlar', TEXT_FORMATS),
    },
    {
      key: 'diger_format',
      label: 'Diğer format açıklaması',
      type: 'text',
      showIf: (a) => selected(a, 'formatlar', ['Diğer']),
    },
    {
      key: 'olcu_notlari',
      label: 'Ek teknik notlar',
      type: 'textarea',
    },
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
