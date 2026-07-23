import BackupSettings from '@/modules/backup/presentation/BackupSettings';
import GlobalBackupSettings from '@/modules/backup/presentation/GlobalBackupSettings';

export default function BackupSettingsPage() {
  return (
    <>
      <BackupSettings />
      <GlobalBackupSettings />
    </>
  );
}
