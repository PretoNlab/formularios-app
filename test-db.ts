import postgres from 'postgres';

async function testConnection(url: string, name: string) {
    console.log(`Testing ${name}...`);
    try {
        const sql = postgres(url, { max: 1, idle_timeout: 1 });
        const result = await sql`SELECT 1 as test`;
        console.log(`Success with ${name}!`);
        return true;
    } catch (error: any) {
        console.error(`Failed ${name}:`, error.message);
        return false;
    }
}

async function run() {
    const encPass = '%23Machado19833443';
    const rawPass = '#Machado19833443';
    const ref = 'lqdeyiwacjjzlraeqpgj';
    const pooler = 'aws-0-us-east-1.pooler.supabase.com';

    const urls: Record<string, string> = {
        'Session Pooler (5432) encoded': `postgresql://postgres.${ref}:${encPass}@${pooler}:5432/postgres`,
        'Session Pooler (5432) raw': `postgresql://postgres.${ref}:${rawPass}@${pooler}:5432/postgres`,
        'Transaction Pooler (6543) encoded': `postgresql://postgres.${ref}:${encPass}@${pooler}:6543/postgres`,
        'Transaction Pooler (6543) raw': `postgresql://postgres.${ref}:${rawPass}@${pooler}:6543/postgres`,
    };

    for (const [name, url] of Object.entries(urls)) {
        if (await testConnection(url, name)) {
            console.log(`\nWORKS! Use this URL: ${url}`);
            process.exit(0);
        }
    }
    process.exit(1);
}

run();
