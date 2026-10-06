# Backup & Restore

## Backup

- **Tần suất:** Hàng ngày lúc 2:00 AM (UTC)
- **Vị trí:** `/home/hoangdatlktteleport/backups/`
- **Format:** `crm-db-YYYYMMDD_HHMMSS.sql.gz`
- **Retention:** 30 ngày
- **Upload cloud:** (nếu có) `gs://crm-backups-lktnlac/`
- **Log:** `/home/hoangdatlktteleport/backups/backup.log`

## Manual backup

```bash
~/CRM/scripts/backup.sh