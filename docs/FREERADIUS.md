# FreeRADIUS NexaID

NexaID menggunakan service FreeRADIUS Linux dan tabel SQL standar. Server UDP
lama di dalam proses Node.js tidak dipakai ketika `radius_backend` bernilai
`freeradius`.

## Setelah memperbarui aplikasi

```bash
cd /opt/nexaid/app
git pull --ff-only
npm ci --omit=dev
systemctl restart nexaid
systemctl restart freeradius
systemctl is-active nexaid freeradius
freeradius -XC
```

Jangan mengimpor ulang `database/mysql-schema.sql` pada database produksi karena
file tersebut merupakan skema instalasi baru. Instalasi yang sudah berjalan
cukup mempertahankan tabel FreeRADIUS yang telah diimpor dari
`/etc/freeradius/3.0/mods-config/sql/main/mysql/schema.sql`.

## Urutan aktivasi NAS

1. Buka **Jaringan & Router > RADIUS Server**.
2. Simpan konfigurasi dan aktifkan integrasi FreeRADIUS.
3. Tambahkan NAS memakai IP L2TP tetap milik MikroTik.
4. Klik **Sinkron Pelanggan**.
5. Klik **Script** pada NAS, pastikan IP server dapat dijangkau oleh MikroTik,
   lalu jalankan script di terminal MikroTik.
6. Restart FreeRADIUS setelah NAS atau shared secret berubah.
7. Uji satu akun demo sebelum memindahkan pelanggan produksi.

## Pemeriksaan

```bash
ss -lunp | grep -E ':(1812|1813)\b'
systemctl status freeradius --no-pager -l
journalctl -u freeradius -n 100 --no-pager
```

Accounting aktif terlihat di tab **Sesi Active RADIUS**. Tombol **Putuskan**
mengirim RADIUS Disconnect-Request (CoA) ke UDP 3799 pada NAS, sehingga tidak
memerlukan API MikroTik.

## Port

- UDP 1812: authentication dari NAS ke FreeRADIUS
- UDP 1813: accounting dari NAS ke FreeRADIUS
- UDP 3799: Disconnect/CoA dari aplikasi ke NAS

Batasi port tersebut hanya pada jaringan VPN/L2TP dan IP NAS yang diperlukan.
