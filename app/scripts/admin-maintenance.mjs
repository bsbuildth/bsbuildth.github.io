// Uses Application Default Credentials. Never run against production implicitly.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
const [operation, project, confirm] = process.argv.slice(2);
if (!['grant-admin', 'visibility'].includes(operation) || !project) throw new Error('Usage: node scripts/admin-maintenance.mjs grant-admin|visibility PROJECT_ID [--apply]');
initializeApp({ credential: applicationDefault(), projectId: project });
if (operation === 'grant-admin') {
  const user = await getAuth().getUserByEmail('bsbuildth@gmail.com');
  if (!user.emailVerified) throw new Error('Verify the administrator email first');
  if (confirm === '--apply') await getAuth().setCustomUserClaims(user.uid, { ...user.customClaims, admin: true });
  console.log(confirm === '--apply' ? 'Admin claim applied; sign in again.' : 'Verified account found. Dry run; no claims changed.');
} else {
  const db = getFirestore(); let count = 0;
  for (const col of ['projects','reviews','calculator_types','services','content','references','articles']) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const value = doc.data().is_visible;
      if (![true,false,0,1].includes(value)) {
        // Preserve prior public UI defaults for existing content; reviews/references default hidden.
        if (confirm === '--apply') await doc.ref.update({ is_visible: ['reviews','references'].includes(col) ? 0 : 1 });
        count++;
      }
    }
  }
  console.log({ operation, mode: confirm === '--apply' ? 'applied' : 'dry-run', documents: count });
}
