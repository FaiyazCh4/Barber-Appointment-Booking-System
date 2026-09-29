import { getDb } from '../server/db.js';
import { runAcceptanceTests } from '../server/qaRunner.js';

async function main() {
  console.log('--- Initializing SQLite database and executing 11 QA Acceptance Scenarios ---');
  await getDb();
  const report = await runAcceptanceTests();

  console.log('\n======================================================');
  console.log(`QA ACCEPTANCE REPORT: ${report.allPassed ? 'ALL PASSED (11/11)' : 'FAILURES DETECTED'}`);
  console.log(`TIMESTAMP: ${report.timestamp}`);
  console.log('======================================================');

  for (const r of report.results) {
    const statusMark = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`[${statusMark}] Scenario ${r.id}: ${r.scenario} (${r.durationMs}ms)`);
    console.log(`       Message: ${r.message}`);
    if (r.details) {
      console.log(`       Details:`, JSON.stringify(r.details));
    }
  }
  console.log('======================================================\n');

  if (!report.allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during acceptance testing:', err);
  process.exit(1);
});
