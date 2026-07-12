const fs = require('fs');
const data = JSON.parse(fs.readFileSync('template.json', 'utf8'));

data.businessIncomes = [
  {
    "id": "business-inc-group-1",
    "name": "Produk & Layanan",
    "items": [
      {
        "id": "prod-1",
        "name": "Barang Contoh A",
        "quantity": 100,
        "pricePlan": 150000,
        "priceActual": 0,
        "duration": 1,
        "linkedId": "hpp-1"
      },
      {
        "id": "hpp-1",
        "name": "HPP - Barang Contoh A",
        "quantity": 100,
        "pricePlan": 80000,
        "priceActual": 0,
        "duration": 1,
        "isHPP": true,
        "linkedId": "prod-1"
      }
    ]
  }
];

data.businessExpenses = [
  {
    "id": "business-exp-cat-1",
    "name": "Operasional & Administrasi",
    "targetPercentage": 20,
    "subcategories": [
      {
        "id": "business-exp-sub-1-1",
        "name": "Beban Karyawan",
        "items": [
          {
            "id": "item-1-1-1",
            "name": "Gaji Karyawan",
            "quantity": 1,
            "pricePlan": 5000000,
            "priceActual": 0,
            "duration": 1
          },
          {
            "id": "item-1-1-2",
            "name": "Tunjangan/THR",
            "quantity": 1,
            "pricePlan": 500000,
            "priceActual": 0,
            "duration": 1
          }
        ]
      },
      {
        "id": "business-exp-sub-1-2",
        "name": "Kantor & Utilitas",
        "items": [
          {
            "id": "item-1-2-1",
            "name": "Listrik & Air",
            "quantity": 1,
            "pricePlan": 1500000,
            "priceActual": 0,
            "duration": 1
          },
          {
            "id": "item-1-2-2",
            "name": "Internet & Telepon",
            "quantity": 1,
            "pricePlan": 450000,
            "priceActual": 0,
            "duration": 1
          }
        ]
      }
    ]
  },
  {
    "id": "business-exp-cat-2",
    "name": "Pemasaran & Penjualan",
    "targetPercentage": 10,
    "subcategories": [
      {
        "id": "business-exp-sub-2-1",
        "name": "Promosi",
        "items": [
          {
            "id": "item-2-1-1",
            "name": "Iklan Media Sosial (IG/FB/TikTok)",
            "quantity": 1,
            "pricePlan": 1000000,
            "priceActual": 0,
            "duration": 1
          },
          {
            "id": "item-2-1-2",
            "name": "Brosur & Banner",
            "quantity": 1,
            "pricePlan": 300000,
            "priceActual": 0,
            "duration": 1
          }
        ]
      }
    ]
  },
  {
    "id": "business-exp-cat-3",
    "name": "Peralatan & Perlengkapan",
    "targetPercentage": 10,
    "subcategories": [
      {
        "id": "business-exp-sub-3-1",
        "name": "Aset Bisnis",
        "items": [
          {
            "id": "item-3-1-1",
            "name": "Perawatan Mesin/Peralatan",
            "quantity": 1,
            "pricePlan": 500000,
            "priceActual": 0,
            "duration": 1
          },
          {
            "id": "item-3-1-2",
            "name": "ATK & Packaging",
            "quantity": 1,
            "pricePlan": 800000,
            "priceActual": 0,
            "duration": 1
          }
        ]
      }
    ]
  }
];

fs.writeFileSync('template.json', JSON.stringify(data, null, 2));
