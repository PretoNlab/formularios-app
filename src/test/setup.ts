import "@testing-library/jest-dom"

// Dummy env vars so modules that eagerly construct DB / Supabase clients can be
// imported in tests. The underlying connections are lazy — no real network
// activity happens as long as tests exercise only pure functions / mocked paths.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test"
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key"
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-key"
process.env.IP_HASH_SALT ??= "test-ip-salt"
process.env.RESEND_API_KEY ??= "re_test_key"
