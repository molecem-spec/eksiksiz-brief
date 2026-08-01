import type { Answers } from '@/types/db';
import type { Section } from './types';

const isPaid = (a: Answers) => a['etkinlik_ucret'] === 'Ücretli';
const needsRegistration = (a: Answers) => a['kayit_gerekli'] === 'Evet';

/**
 * Etkinlik bilgileri. Proje turu etkinlik iceriyorsa veya musteri temel
 * bilgilerde "etkinlik iceriyor" kutusunu isaretlediyse acilir.
 */
export const EVENT_SECTION: Section = {
  id: 'etkinlik',
  title: 'Etkinlik bilgileri',
  description: 'Etkinliğin nasıl işleyeceğini anlatın; iletişim planı buradan çıkıyor.',
  fields: [
    { key: 'etkinlik_adi', label: 'Etkinliğin adı', type: 'text', required: true },
    {
      key: 'etkinlik_konsept',
      label: 'Etkinliğin konsepti',
      type: 'textarea',
      required: true,
      placeholder: 'Etkinliğin ana fikri, teması, hissi.',
    },
    {
      key: 'etkinlik_ne_yapilacak',
      label: 'Etkinlikte tam olarak ne yapılacak?',
      type: 'textarea',
      required: true,
      help: 'Adım adım anlatın. En çok eksik kalan bilgi budur.',
    },
    { key: 'etkinlik_tarihi', label: 'Etkinlik tarihi', type: 'date', required: true, half: true },
    { key: 'etkinlik_mekan', label: 'Mekân', type: 'text', required: true, half: true },
    { key: 'etkinlik_bas_saat', label: 'Başlangıç saati', type: 'time', half: true },
    { key: 'etkinlik_bit_saat', label: 'Bitiş saati', type: 'time', half: true },
    {
      key: 'etkinlik_ucret',
      label: 'Katılım',
      type: 'select',
      options: ['Ücretsiz', 'Ücretli'],
      required: true,
      half: true,
    },
    {
      key: 'etkinlik_ucret_tutari',
      label: 'Katılım ücreti',
      type: 'text',
      half: true,
      showIf: isPaid,
    },
    { key: 'kontenjan', label: 'Kontenjan', type: 'text', half: true, placeholder: 'Örn. 60 kişi' },
    {
      key: 'kayit_gerekli',
      label: 'Kayıt gerekiyor mu?',
      type: 'select',
      options: ['Evet', 'Hayır'],
      required: true,
      half: true,
    },
    {
      key: 'kayit_yontemi',
      label: 'Kayıt yöntemi',
      type: 'text',
      placeholder: 'Form linki, telefon, DM, bilet platformu…',
      showIf: needsRegistration,
    },
    {
      key: 'son_basvuru',
      label: 'Son başvuru tarihi',
      type: 'date',
      half: true,
      showIf: needsRegistration,
    },
    { key: 'yas_siniri', label: 'Yaş sınırı', type: 'text', half: true },
    {
      key: 'akis_bolumleri',
      label: 'Etkinlik akışında yer alacak bölümler',
      type: 'multiselect',
      options: [
        'Karşılama alanı',
        'Kayıt masası',
        'Açılış konuşması',
        'Workshop',
        'Yarışma',
        'Turnuva',
        'Ödül töreni',
        'Canlı müzik',
        'DJ performansı',
        'Konuşmacı',
        'Fotoğraf alanı',
        'İkram alanı',
        'Kapanış',
      ],
    },
    {
      key: 'akis_detay',
      label: 'Saat saat etkinlik akışı',
      type: 'textarea',
      placeholder: '19:00 karşılama\n19:30 açılış konuşması\n20:00 workshop…',
    },
    {
      key: 'alan_bolumleri',
      label: 'Etkinlik alanında kurulacak bölümler',
      type: 'textarea',
      placeholder: 'Stand, sahne, atölye masaları, fotoğraf duvarı, ikram alanı…',
    },
    { key: 'dekorlar', label: 'Kullanılacak dekorlar', type: 'textarea' },
    { key: 'sponsorlar', label: 'Sponsorlar', type: 'textarea' },
    { key: 'isbirligi_markalar', label: 'İş birliği yapılan markalar', type: 'textarea' },
    {
      key: 'sponsor_logolari',
      label: 'Kullanılması gereken sponsor logoları',
      type: 'textarea',
      help: 'Logo dosyalarını dosya adımında yükleyin.',
    },
    { key: 'etkinlik_kurallari', label: 'Etkinlikle ilgili özel kurallar', type: 'textarea' },
  ],
};
