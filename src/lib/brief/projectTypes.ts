import type { ProjectType } from './types';

/**
 * "Nasıl bir çalışma için iş talebi oluşturuyorsunuz?" sorusunun secenekleri.
 * Her turun kendi soru bolumu var; secime gore dinamik acilir.
 */
export const PROJECT_TYPES: ProjectType[] = [
  {
    key: 'sosyal_medya',
    label: 'Sosyal medya içeriği',
    description: 'Post, story, carousel, reels ve benzeri düzenli içerikler',
    sections: [
      {
        id: 'sosyal_medya_detay',
        title: 'Sosyal medya detayları',
        fields: [
          {
            key: 'icerik_konusu',
            label: 'İçeriğin konusu / iletilecek mesaj',
            type: 'textarea',
            required: true,
          },
          {
            key: 'one_cikan_urun',
            label: 'Öne çıkarılacak ürün veya hizmet',
            type: 'textarea',
          },
          {
            key: 'mecralar',
            label: 'Hangi mecralarda yayınlanacak?',
            type: 'multiselect',
            options: ['Instagram', 'Facebook', 'LinkedIn', 'X', 'TikTok', 'YouTube', 'Pinterest'],
            required: true,
          },
          {
            key: 'paylasim_takvimi',
            label: 'Paylaşım tarihi / sıklığı',
            type: 'text',
            placeholder: 'Örn. 12–19 Şubat arası haftada 3 paylaşım',
          },
          { key: 'cta', label: 'Harekete geçirici mesaj (CTA)', type: 'text', half: true },
          { key: 'yonlendirme_linki', label: 'Yönlendirilecek bağlantı', type: 'text', half: true },
          { key: 'hashtagler', label: 'Kullanılacak hashtagler', type: 'text' },
          { key: 'etiketlenecek', label: 'Etiketlenecek hesaplar', type: 'text' },
          {
            key: 'sponsorlu_mu',
            label: 'Reklam bütçesi verilecek mi?',
            type: 'select',
            options: ['Hayır, organik', 'Evet, sponsorlu', 'Henüz belli değil'],
            half: true,
          },
        ],
      },
    ],
  },

  {
    key: 'kampanya',
    label: 'Kampanya',
    description: 'İndirim, hediye, çekiliş veya dönemsel kampanyalar',
    sections: [
      {
        id: 'kampanya_detay',
        title: 'Kampanya detayları',
        fields: [
          { key: 'kampanya_adi', label: 'Kampanya adı', type: 'text', required: true },
          {
            key: 'kampanya_mekanigi',
            label: 'Kampanya mekaniği',
            type: 'textarea',
            required: true,
            help: 'Müşteri ne yaparsa ne kazanıyor? Adım adım yazın.',
          },
          {
            key: 'kampanya_turu',
            label: 'Kampanya türü',
            type: 'multiselect',
            options: [
              'Yüzde indirim',
              'Tutar indirimi',
              '2 al 1 öde',
              'Hediye ürün',
              'Çekiliş',
              'Sadakat / puan',
              'Erken rezervasyon',
              'Kombo menü',
              'Diğer',
            ],
            required: true,
          },
          { key: 'kampanya_baslangic', label: 'Kampanya başlangıç', type: 'date', half: true, required: true },
          { key: 'kampanya_bitis', label: 'Kampanya bitiş', type: 'date', half: true, required: true },
          {
            key: 'kampanya_kapsam',
            label: 'Kapsam (hangi şubeler / ürünler)',
            type: 'textarea',
            required: true,
          },
          { key: 'kampanya_kosullari', label: 'Katılım koşulları ve istisnalar', type: 'textarea' },
          { key: 'kampanya_kodu', label: 'Kampanya kodu / kupon', type: 'text', half: true },
          {
            key: 'kampanya_hedef',
            label: 'Başarı ölçütü',
            type: 'text',
            half: true,
            placeholder: 'Örn. 500 rezervasyon',
          },
          {
            key: 'kampanya_yasal',
            label: 'Zorunlu yasal metin / kampanya şartları',
            type: 'textarea',
            help: 'Çekiliş varsa izin ve şartname bilgisi gerekir.',
          },
        ],
      },
    ],
  },

  {
    key: 'avm_etkinlik',
    label: 'AVM etkinliği',
    isEvent: true,
    sections: [
      {
        id: 'avm_detay',
        title: 'AVM detayları',
        fields: [
          { key: 'avm_adi', label: 'AVM adı', type: 'text', required: true, half: true },
          {
            key: 'avm_alan',
            label: 'Etkinlik alanı',
            type: 'text',
            half: true,
            placeholder: 'Örn. zemin kat atrium',
          },
          { key: 'avm_alan_olcu', label: 'Alan ölçüleri', type: 'text', half: true },
          { key: 'avm_kurulum', label: 'Kurulum tarihi/saati', type: 'text', half: true },
          { key: 'avm_sokum', label: 'Söküm tarihi/saati', type: 'text', half: true },
          {
            key: 'avm_onay',
            label: 'AVM yönetiminin onayı gereken materyaller',
            type: 'textarea',
            help: 'Onay süreci ve son tarih varsa yazın.',
          },
          {
            key: 'avm_teknik',
            label: 'Teknik ihtiyaçlar',
            type: 'textarea',
            placeholder: 'Elektrik, internet, ses sistemi, aydınlatma, depolama…',
          },
          {
            key: 'avm_ekranlar',
            label: 'AVM dijital ekran envanteri',
            type: 'textarea',
            placeholder: 'Ekran sayısı, ölçüleri, yayın süresi',
          },
          { key: 'avm_kurallar', label: 'AVM kuralları / kısıtlar', type: 'textarea' },
        ],
      },
    ],
  },

  {
    key: 'restoran_etkinlik',
    label: 'Restoran etkinliği',
    isEvent: true,
    sections: [
      {
        id: 'restoran_detay',
        title: 'Restoran etkinliği detayları',
        fields: [
          { key: 'restoran_sube', label: 'Şube', type: 'text', required: true, half: true },
          {
            key: 'restoran_kapasite',
            label: 'Salon kapasitesi',
            type: 'text',
            half: true,
          },
          {
            key: 'restoran_menu',
            label: 'Menü / ikram',
            type: 'textarea',
            required: true,
            placeholder: 'Set menü, açık büfe, kokteyl, içecek dahil mi…',
          },
          {
            key: 'restoran_fiyat',
            label: 'Kişi başı ücret',
            type: 'text',
            half: true,
          },
          {
            key: 'restoran_rezervasyon',
            label: 'Rezervasyon gerekiyor mu?',
            type: 'select',
            options: ['Evet', 'Hayır'],
            half: true,
          },
          {
            key: 'restoran_muzik',
            label: 'Müzik / performans',
            type: 'multiselect',
            options: ['Canlı müzik', 'DJ', 'Akustik', 'Yok'],
          },
          { key: 'restoran_dekor', label: 'Özel dekor / masa düzeni', type: 'textarea' },
        ],
      },
    ],
  },

  {
    key: 'workshop',
    label: 'Workshop / atölye',
    isEvent: true,
    sections: [
      {
        id: 'workshop_detay',
        title: 'Atölye detayları',
        fields: [
          { key: 'workshop_konu', label: 'Atölyenin konusu', type: 'text', required: true },
          {
            key: 'workshop_egitmen',
            label: 'Eğitmen / yürütücü',
            type: 'textarea',
            required: true,
            help: 'İsim, unvan, kısa biyografi. Fotoğrafı dosya adımında yükleyin.',
          },
          { key: 'workshop_sure', label: 'Süre', type: 'text', half: true, placeholder: 'Örn. 2 saat' },
          {
            key: 'workshop_seviye',
            label: 'Katılımcı seviyesi',
            type: 'select',
            options: ['Başlangıç', 'Orta', 'İleri', 'Herkes'],
            half: true,
          },
          {
            key: 'workshop_malzeme',
            label: 'Malzemeler kim tarafından sağlanacak?',
            type: 'textarea',
          },
          {
            key: 'workshop_katilimci_beklenti',
            label: 'Katılımcıdan beklenenler',
            type: 'textarea',
            placeholder: 'Yanında getirmesi gerekenler, ön hazırlık…',
          },
          {
            key: 'workshop_sertifika',
            label: 'Sertifika verilecek mi?',
            type: 'select',
            options: ['Evet', 'Hayır'],
            half: true,
          },
        ],
      },
    ],
  },

  {
    key: 'turnuva',
    label: 'Turnuva',
    isEvent: true,
    sections: [
      {
        id: 'turnuva_detay',
        title: 'Turnuva detayları',
        fields: [
          {
            key: 'turnuva_bran',
            label: 'Oyun / branş',
            type: 'text',
            required: true,
            placeholder: 'Örn. langırt, FIFA, tavla, basketbol',
          },
          {
            key: 'turnuva_format',
            label: 'Turnuva formatı',
            type: 'select',
            options: ['Eleme', 'Grup + eleme', 'Lig', 'Tek maç', 'Diğer'],
            required: true,
            half: true,
          },
          {
            key: 'turnuva_katilim_tipi',
            label: 'Katılım tipi',
            type: 'select',
            options: ['Bireysel', 'Takım'],
            half: true,
          },
          { key: 'turnuva_katilimci', label: 'Beklenen katılımcı / takım sayısı', type: 'text', half: true },
          { key: 'turnuva_etaplar', label: 'Etaplar ve tarihleri', type: 'textarea' },
          { key: 'turnuva_kurallar', label: 'Turnuva kuralları', type: 'textarea', required: true },
          { key: 'turnuva_oduller', label: 'Ödüller', type: 'textarea', required: true },
          { key: 'turnuva_hakem', label: 'Hakem / yürütücü', type: 'text' },
          { key: 'turnuva_kayit', label: 'Kayıt koşulları', type: 'textarea' },
        ],
      },
    ],
  },

  {
    key: 'sergi',
    label: 'Sergi',
    isEvent: true,
    sections: [
      {
        id: 'sergi_detay',
        title: 'Sergi detayları',
        fields: [
          { key: 'sergi_konsept', label: 'Sergi konsepti', type: 'textarea', required: true },
          { key: 'sergi_sanatci', label: 'Sanatçı(lar)', type: 'textarea', required: true },
          { key: 'sergi_kurator', label: 'Küratör', type: 'text', half: true },
          { key: 'sergi_eser_sayisi', label: 'Eser sayısı', type: 'text', half: true },
          { key: 'sergi_baslangic', label: 'Sergi başlangıç', type: 'date', half: true },
          { key: 'sergi_bitis', label: 'Sergi bitiş', type: 'date', half: true },
          { key: 'sergi_ziyaret_saatleri', label: 'Ziyaret saatleri', type: 'text', half: true },
          {
            key: 'sergi_acilis_kokteyli',
            label: 'Açılış kokteyli var mı?',
            type: 'select',
            options: ['Evet', 'Hayır'],
            half: true,
          },
          {
            key: 'sergi_eser_listesi',
            label: 'Eser listesi ve etiket bilgileri',
            type: 'textarea',
            help: 'Eser adı, teknik, ölçü, yıl. Uzunsa dosya olarak yükleyin.',
          },
          {
            key: 'sergi_satis',
            label: 'Eserler satılacak mı?',
            type: 'select',
            options: ['Evet', 'Hayır'],
            half: true,
          },
        ],
      },
    ],
  },

  {
    key: 'acilis',
    label: 'Açılış',
    isEvent: true,
    sections: [
      {
        id: 'acilis_detay',
        title: 'Açılış detayları',
        fields: [
          { key: 'acilis_yer', label: 'Açılan yer / şube', type: 'text', required: true },
          { key: 'acilis_adres', label: 'Açık adres', type: 'textarea', required: true },
          {
            key: 'acilis_davetli',
            label: 'Davetli profili',
            type: 'textarea',
            placeholder: 'Basın, influencer, müşteri, mahalle esnafı, protokol…',
          },
          { key: 'acilis_protokol', label: 'Protokol / konuşma yapacaklar', type: 'textarea' },
          {
            key: 'acilis_tore',
            label: 'Tören unsurları',
            type: 'multiselect',
            options: ['Kurdele kesimi', 'Konuşma', 'Kokteyl', 'Canlı müzik', 'Basın turu', 'Yok'],
          },
          { key: 'acilis_ikram', label: 'İkram', type: 'textarea' },
          { key: 'acilis_hediye', label: 'Hediye / promosyon', type: 'textarea' },
          { key: 'acilis_kampanya', label: 'Açılışa özel kampanya', type: 'textarea' },
          {
            key: 'acilis_basin',
            label: 'Basın daveti yapılacak mı?',
            type: 'select',
            options: ['Evet', 'Hayır', 'Ajans yönlendirsin'],
            half: true,
          },
        ],
      },
    ],
  },

  {
    key: 'ozel_gun',
    label: 'Özel gün iletişimi',
    description: 'Bayram, yılbaşı, anneler günü, kuruluş yıl dönümü…',
    sections: [
      {
        id: 'ozel_gun_detay',
        title: 'Özel gün detayları',
        fields: [
          { key: 'ozel_gun_hangi', label: 'Hangi özel gün?', type: 'text', required: true, half: true },
          {
            key: 'ozel_gun_ton',
            label: 'Mesajın tonu',
            type: 'select',
            options: ['Kutlama', 'Duygusal', 'Eğlenceli', 'Resmî / saygı', 'Satış odaklı'],
            required: true,
            half: true,
          },
          {
            key: 'ozel_gun_satis',
            label: 'İçerik satış içeriyor mu?',
            type: 'select',
            options: ['Hayır, sadece kutlama', 'Evet, kampanya da var'],
            half: true,
          },
          { key: 'ozel_gun_mesaj', label: 'İletilmek istenen mesaj', type: 'textarea', required: true },
          { key: 'ozel_gun_gecmis', label: 'Geçen yılki çalışma / örnek', type: 'textarea' },
        ],
      },
    ],
  },

  {
    key: 'basili_tasarim',
    label: 'Basılı tasarım',
    sections: [
      {
        id: 'basili_detay',
        title: 'Basılı iş detayları',
        fields: [
          {
            key: 'basili_urun',
            label: 'Basılacak ürün',
            type: 'multiselect',
            options: [
              'Afiş',
              'Broşür',
              'Davetiye',
              'Menü',
              'Kartvizit',
              'Roll-up',
              'Branda',
              'Etiket',
              'Ambalaj',
              'Diğer',
            ],
            required: true,
          },
          { key: 'basili_ebat', label: 'Ebat', type: 'text', required: true, half: true },
          { key: 'basili_adet_detay', label: 'Adet', type: 'text', half: true },
          {
            key: 'basili_malzeme',
            label: 'Kağıt / malzeme',
            type: 'text',
            half: true,
            placeholder: 'Örn. 300 gr kuşe, mat selefon',
          },
          {
            key: 'basili_teknik',
            label: 'Baskı tekniği',
            type: 'text',
            half: true,
            placeholder: 'Dijital, ofset, serigrafi…',
          },
          { key: 'basili_matbaa', label: 'Matbaa bilgisi', type: 'text' },
          {
            key: 'basili_kesim',
            label: 'Kesim / bıçak payı özel durumları',
            type: 'textarea',
          },
          { key: 'basili_teslim_yeri', label: 'Teslim edilecek yer', type: 'text' },
          { key: 'basili_icerik', label: 'Basılacak metinlerin tamamı', type: 'textarea', required: true },
        ],
      },
    ],
  },

  {
    key: 'dijital_ekran',
    label: 'Dijital ekran tasarımı',
    sections: [
      {
        id: 'dijital_detay',
        title: 'Dijital ekran detayları',
        fields: [
          { key: 'ekran_lokasyon', label: 'Ekranların lokasyonu', type: 'textarea', required: true },
          { key: 'ekran_sayisi', label: 'Ekran sayısı', type: 'text', half: true },
          { key: 'ekran_piksel', label: 'Piksel ölçüsü', type: 'text', required: true, half: true },
          {
            key: 'ekran_yon',
            label: 'Yönlendirme',
            type: 'select',
            options: ['Yatay', 'Dikey', 'Karma'],
            half: true,
          },
          {
            key: 'ekran_tur',
            label: 'İçerik türü',
            type: 'select',
            options: ['Statik görsel', 'Video', 'Animasyon', 'Karma'],
            required: true,
            half: true,
          },
          { key: 'ekran_sure', label: 'İçerik süresi', type: 'text', half: true, placeholder: 'Örn. 15 sn' },
          { key: 'ekran_dongu', label: 'Döngü / yayın sıklığı', type: 'text', half: true },
          {
            key: 'ekran_ses',
            label: 'Ses kullanılacak mı?',
            type: 'select',
            options: ['Evet', 'Hayır'],
            half: true,
          },
          { key: 'ekran_dosya_format', label: 'İstenen dosya formatı', type: 'text', half: true },
        ],
      },
    ],
  },

  {
    key: 'duyuru',
    label: 'Duyuru',
    sections: [
      {
        id: 'duyuru_detay',
        title: 'Duyuru detayları',
        fields: [
          { key: 'duyuru_konu', label: 'Duyurunun konusu', type: 'textarea', required: true },
          {
            key: 'duyuru_kime',
            label: 'Kime duyurulacak?',
            type: 'text',
            required: true,
            placeholder: 'Müşteriler, çalışanlar, bayiler, basın…',
          },
          {
            key: 'duyuru_kanallar',
            label: 'Hangi kanallardan?',
            type: 'multiselect',
            options: [
              'Sosyal medya',
              'E-posta',
              'SMS',
              'Web sitesi',
              'Mağaza içi',
              'Basın bülteni',
              'İç yazışma',
            ],
            required: true,
          },
          {
            key: 'duyuru_dil',
            label: 'Dil tercihi',
            type: 'select',
            options: ['Resmî', 'Samimi', 'Kısa ve net'],
            half: true,
          },
          {
            key: 'duyuru_aciliyet',
            label: 'Aciliyet',
            type: 'select',
            options: ['Planlı', 'Acil', 'Kriz iletişimi'],
            half: true,
          },
        ],
      },
    ],
  },

  {
    key: 'menu_urun',
    label: 'Menü veya ürün iletişimi',
    sections: [
      {
        id: 'menu_detay',
        title: 'Menü / ürün detayları',
        fields: [
          {
            key: 'menu_tur',
            label: 'Menü türü',
            type: 'multiselect',
            options: ['Basılı menü', 'Dijital menü', 'QR menü', 'Masa üstü kart', 'Sosyal medya duyurusu'],
            required: true,
          },
          {
            key: 'menu_urunler',
            label: 'Ürün adları, açıklamaları ve fiyatları',
            type: 'textarea',
            required: true,
            help: 'Satır satır yazın. Uzunsa Excel/Word olarak yükleyin.',
          },
          { key: 'menu_kategoriler', label: 'Kategori yapısı', type: 'textarea' },
          { key: 'menu_guncellenen', label: 'Değişen / yeni eklenen ürünler', type: 'textarea' },
          {
            key: 'menu_alerjen',
            label: 'Alerjen ve içerik bilgisi gerekli mi?',
            type: 'select',
            options: ['Evet', 'Hayır'],
            half: true,
          },
          {
            key: 'menu_gorsel',
            label: 'Ürün görselleri',
            type: 'select',
            options: ['Var, yükleyeceğim', 'Ajans arşivinde', 'Çekim gerekiyor', 'Görselsiz'],
            half: true,
          },
          {
            key: 'menu_dil',
            label: 'Menü dilleri',
            type: 'multiselect',
            options: ['Türkçe', 'İngilizce', 'Arapça', 'Rusça'],
          },
        ],
      },
    ],
  },

  {
    key: 'produksiyon',
    label: 'Prodüksiyon talebi',
    description: 'Fotoğraf veya video çekimi',
    sections: [
      {
        id: 'produksiyon_detay',
        title: 'Prodüksiyon detayları',
        fields: [
          {
            key: 'cekim_turu',
            label: 'Çekim türü',
            type: 'multiselect',
            options: ['Fotoğraf', 'Video', 'Reels / kısa video', 'Drone', 'Ürün çekimi', 'Mekân çekimi'],
            required: true,
          },
          { key: 'cekim_yeri', label: 'Çekim yeri', type: 'text', required: true, half: true },
          { key: 'cekim_tarihi', label: 'Çekim tarihi', type: 'date', required: true, half: true },
          { key: 'cekim_sure', label: 'Tahmini çekim süresi', type: 'text', half: true },
          {
            key: 'cekim_liste',
            label: 'Çekilecek ürün / mekân / kişi listesi',
            type: 'textarea',
            required: true,
          },
          {
            key: 'cekim_oyuncu',
            label: 'Oyuncu / model / personel',
            type: 'textarea',
            placeholder: 'Kim olacak, kim ayarlayacak?',
          },
          { key: 'cekim_moodboard', label: 'Moodboard / referans tarifi', type: 'textarea' },
          { key: 'cekim_ses', label: 'Ses / müzik beklentisi', type: 'textarea' },
          { key: 'cekim_kurgu', label: 'Kurgu beklentisi', type: 'textarea' },
          {
            key: 'cekim_teslim_format',
            label: 'Teslim formatı',
            type: 'text',
            half: true,
            placeholder: 'Örn. 9:16 MP4 + 10 adet retouch JPG',
          },
          {
            key: 'cekim_kullanim',
            label: 'Kullanım mecrası ve süresi',
            type: 'text',
            half: true,
            help: 'Telif ve oyuncu sözleşmesi için gerekli.',
          },
        ],
      },
    ],
  },

  {
    key: 'diger',
    label: 'Diğer',
    description: 'Yukarıdakilere uymayan talepler',
    sections: [
      {
        id: 'diger_detay',
        title: 'Talep detayları',
        fields: [
          {
            key: 'diger_ne',
            label: 'Nasıl bir çalışma istiyorsunuz?',
            type: 'textarea',
            required: true,
            help: 'Elinizden geldiğince ayrıntılı anlatın.',
          },
          { key: 'diger_ornek', label: 'Benzer bir örnek var mı?', type: 'textarea' },
          { key: 'diger_ciktilar', label: 'Beklenen çıktılar', type: 'textarea', required: true },
        ],
      },
    ],
  },
];

export const PROJECT_TYPE_MAP: Record<string, ProjectType> = Object.fromEntries(
  PROJECT_TYPES.map((t) => [t.key, t])
);

export function projectTypeLabel(key: string): string {
  return PROJECT_TYPE_MAP[key]?.label ?? key ?? '—';
}
