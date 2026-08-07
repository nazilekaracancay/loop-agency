# LOOP Agency

LOOP Agency'nin statik web sitesi ve sunucusuz sohbet API'si.

## Proje yapısı

```text
.
├── index.html                 # Ana sayfa
├── api/
│   └── chat.js               # Sohbet API endpoint'i
├── assets/
│   ├── images/               # Web sitesinde kullanılan görseller
│   │   ├── coandmi-reference.webp
│   │   └── dvs-reference.webp
│   └── js/
│       └── loop-widget.js    # LOOP sohbet widget'ı
└── blog/
    ├── index.html            # Blog listeleme sayfası
    └── *.html                # Blog yazıları
```

## Dosya yerleşimi

- Yeni görselleri `assets/images/` altında tutun.
- Yeni JavaScript dosyalarını `assets/js/` altında tutun.
- Mevcut blog yazılarının yollarını değiştirmeyin; URL'ler doğrudan dosya adlarına bağlıdır.
- Ana sayfa değişiklikleri `index.html` üzerinden yapılır.

## Ortam değişkenleri

Sohbet API'si, sunucu tarafında `ANTHROPIC_KEY` ortam değişkenini kullanır. API anahtarlarını HTML veya istemci tarafındaki JavaScript dosyalarına eklemeyin.
